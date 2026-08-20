const express = require("express");
const axios = require("axios");
const { randomUUID } = require("crypto");

const Agent = require("../models/Agent");
const Invocation = require("../models/Invocation");
const Workflow = require("../models/Workflow");
const getAgentEndpoint = require("../utils/agentEndpoint");

const router = express.Router();

async function runAllAgents({ workflow, workflowId, agents, file, text, imageBase64, res }) {
  const findAgent = (name) => agents.find((candidate) =>
    String(candidate.name).toLowerCase().includes(name)
  );
  const ocrAgent = findAgent("ocr");
  const summaryAgent = findAgent("summary");
  const fraudAgent = findAgent("fraud");

  if (!ocrAgent || !summaryAgent || !fraudAgent) {
    throw new Error("OCR, Summary, and Fraud agents are required for a complete workflow.");
  }

  workflow.agentsUsed = [ocrAgent.name, summaryAgent.name, fraudAgent.name];
  // The current x402 route charges one bundled workflow fee.
  workflow.totalCost = 0.01;
  await workflow.save();

  res.locals.x402PaymentContext = {
    workflowId,
    workflowMongoId: workflow._id,
    agentId: ocrAgent._id,
    invocationId: null
  };

  let extractedText = typeof text === "string" ? text.trim() : "";
  const isFilePlaceholder = /^File selected:/i.test(extractedText) && /Type:\s*/i.test(extractedText) && /Size:\s*/i.test(extractedText);
  const imageProvided = typeof imageBase64 === "string" && imageBase64.trim();

  if (imageProvided && (!extractedText || isFilePlaceholder)) {
    const ocrResponse = await axios.post(getAgentEndpoint(ocrAgent), {
      workflowId,
      file,
      task: "ocr",
      hasText: false,
      text: null,
      hasImageBase64: true,
      imageBase64
    }, { timeout: 60000, maxContentLength: 20 * 1024 * 1024, maxBodyLength: 20 * 1024 * 1024 });

    extractedText = ocrResponse.data?.output?.text || ocrResponse.data?.result?.text || "";
  }

  if (!extractedText) throw new Error("OCR could not extract readable text from the document.");

  const agentInputs = [
    { agent: ocrAgent, input: { workflowId, file, task: "ocr", hasText: true, text: extractedText, hasImageBase64: Boolean(imageProvided), imageBase64: imageBase64 || null } },
    { agent: summaryAgent, input: { text: extractedText } },
    { agent: fraudAgent, input: { workflowId, file, task: "fraud", hasText: true, text: extractedText, hasImageBase64: false, imageBase64: null } }
  ];
  const results = {};

  for (const { agent, input } of agentInputs) {
    const invocation = await Invocation.create({
      agentId: agent._id,
      workflowId: workflow._id,
      status: "processing",
      input: { ...input, imageBase64: input.imageBase64 ? "[redacted]" : null }
    });
    if (!res.locals.x402PaymentContext.invocationId) res.locals.x402PaymentContext.invocationId = invocation._id;
    const startedAt = Date.now();

    try {
      const response = await axios.post(getAgentEndpoint(agent), input, {
        timeout: 60000,
        maxContentLength: 20 * 1024 * 1024,
        maxBodyLength: 20 * 1024 * 1024,
        headers: { "Content-Type": "application/json" }
      });
      invocation.status = "completed";
      invocation.output = response.data;
      invocation.latency = Date.now() - startedAt;
      invocation.cost = agent.pricePerRequest;
      await invocation.save();
      await Agent.findByIdAndUpdate(agent._id, { $inc: { totalInvocations: 1, successfulInvocations: 1 } });
      results[agent.name.toLowerCase().split(" ")[0]] = response.data;
    } catch (agentError) {
      invocation.status = "failed";
      invocation.error = agentError.response?.data?.detail || agentError.response?.data?.message || agentError.message;
      invocation.latency = Date.now() - startedAt;
      await invocation.save();
      await Agent.findByIdAndUpdate(agent._id, { $inc: { totalInvocations: 1 } });
      throw new Error(`${agent.name}: ${invocation.error}`);
    }
  }

  workflow.status = "completed";
  workflow.result = { agents: results, extractedText };
  workflow.error = null;
  await workflow.save();

  return {
    success: true,
    workflowId,
    status: "completed",
    file,
    agents: results,
    extractedText,
    cost: workflow.totalCost
  };
}

// POST /api/orchestrate
router.post("/", async (req, res) => {
  const workflowId = randomUUID();

  try {
    /*
     * Receive the complete request from the frontend.
     *
     * For OCR image uploads we expect:
     *
     * file
     * task
     * hasText
     * hasImageBase64
     * imageBase64
     */
    const {
      file,
      task,
      hasText = false,
      hasImageBase64 = false,
      imageBase64 = null,
      text = null
    } = req.body;

    console.log("ORCHESTRATE REQUEST:", {
      workflowId,
      file,
      task,
      hasText,
      hasImageBase64,
      imageBase64Length:
        typeof imageBase64 === "string"
          ? imageBase64.length
          : 0,
      textLength:
        typeof text === "string"
          ? text.length
          : 0
    });

    // -----------------------------------------
    // Validate file
    // -----------------------------------------
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file is required"
      });
    }

    // -----------------------------------------
    // Validate task
    // -----------------------------------------
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "task is required"
      });
    }

    // -----------------------------------------
    // OCR validation
    // -----------------------------------------
    const normalizedTask = String(task).toLowerCase();

    if (normalizedTask === "ocr") {
      const hasValidImage =
        typeof imageBase64 === "string" &&
        imageBase64.trim().length > 0;

      const hasValidText =
        typeof text === "string" &&
        text.trim().length > 0;

      if (!hasValidImage && !hasValidText) {
        return res.status(400).json({
          success: false,
          message: "OCR requires imageBase64 or text input."
        });
      }
    }

    // -----------------------------------------
    // Create workflow
    // -----------------------------------------
    const workflow = await Workflow.create({
      workflowId,
      file,
      task,
      status: "processing",
      agentsUsed: [],
      totalCost: 0,
      result: {}
    });

    console.log("Workflow created:", workflowId);

    // -----------------------------------------
    // Find active agents
    // -----------------------------------------
    const agents = await Agent.find({
      isActive: true
    }).sort({
      rating: -1,
      totalInvocations: -1
    });

    if (!agents.length) {
      workflow.status = "failed";
      workflow.error = "No active agents available";

      await workflow.save();

      return res.status(503).json({
        success: false,
        workflowId,
        message: "No active agents available"
      });
    }

    if (normalizedTask === "all") {
      try {
        return res.json(await runAllAgents({
          workflow,
          workflowId,
          agents,
          file,
          text,
          imageBase64,
          res
        }));
      } catch (allError) {
        workflow.status = "failed";
        workflow.error = allError.message;
        await workflow.save();
        return res.status(502).json({
          success: false,
          workflowId,
          status: "failed",
          message: "Complete workflow failed",
          error: allError.message
        });
      }
    }

    // -----------------------------------------
    // Select agent
    // -----------------------------------------
    const taskWords = normalizedTask
      .split(/\s+/)
      .filter((word) => word.length > 2);

    let agent = agents.find((candidate) => {
      const searchableText = [
        candidate.name,
        candidate.description,
        candidate.category
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return taskWords.some((word) =>
        searchableText.includes(word)
      );
    });

    if (!agent) {
      agent = agents[0];
    }

    console.log("Selected agent:", {
      id: agent._id.toString(),
      name: agent.name,
      category: agent.category,
      endpoint: getAgentEndpoint(agent)
    });

    // -----------------------------------------
    // Track selected agent
    // -----------------------------------------
    workflow.agentsUsed = [agent.name];

    workflow.totalCost = Number(
      agent.pricePerRequest || 0
    );

    await workflow.save();

    // -----------------------------------------
    // Build complete agent input
    // -----------------------------------------
    let analysisText = text;
    const hasMeaningfulText =
      typeof text === "string" &&
      text.trim().length > 0 &&
      !/^File selected:\s*.+\nType:\s*.+\nSize:/i.test(text.trim());

    if (
      (normalizedTask === "fraud" ||
        normalizedTask === "summary") &&
      typeof imageBase64 === "string" &&
      imageBase64.trim().length > 0 &&
      !hasMeaningfulText
    ) {
      const ocrAgent = agents.find((candidate) =>
        String(candidate.name).toLowerCase().includes("ocr")
      );

      if (!ocrAgent) {
        return res.status(503).json({
          success: false,
          workflowId,
          message: "OCR agent is required to process an invoice image."
        });
      }

      const ocrResponse = await axios.post(
        getAgentEndpoint(ocrAgent),
        {
          workflowId,
          file,
          task: "ocr",
          hasText: false,
          text: null,
          hasImageBase64: true,
          imageBase64
        },
        {
          timeout: 60000,
          maxContentLength: 20 * 1024 * 1024,
          maxBodyLength: 20 * 1024 * 1024
        }
      );

      analysisText =
        ocrResponse.data?.output?.text ||
        ocrResponse.data?.result?.text ||
        "";

      if (!analysisText.trim()) {
        return res.status(422).json({
          success: false,
          workflowId,
          message: "OCR could not extract text from the invoice image."
        });
      }
    }

    const agentInput = {
      workflowId,
      file,
      task,

      // Text input if available
      hasText: Boolean(
        typeof analysisText === "string" &&
        analysisText.trim().length > 0
      ),

      text:
        typeof analysisText === "string" &&
        analysisText.trim().length > 0
          ? analysisText
          : null,

      // Image input if available
      hasImageBase64:
        typeof imageBase64 === "string" &&
        imageBase64.trim().length > 0,

      imageBase64:
        typeof imageBase64 === "string" &&
        imageBase64.trim().length > 0
          ? imageBase64
          : null
    };

    console.log("AGENT INPUT:", {
      workflowId,
      file,
      task,
      hasText: agentInput.hasText,
      hasImageBase64: agentInput.hasImageBase64,
      imageBase64Length:
        typeof agentInput.imageBase64 === "string"
          ? agentInput.imageBase64.length
          : 0
    });

    // -----------------------------------------
    // Create invocation
    // -----------------------------------------
    const invocation = await Invocation.create({
      agentId: agent._id,
      workflowId: workflow._id,
      status: "processing",

      input: {
        workflowId,
        file,
        task,
        hasText: agentInput.hasText,
        hasImageBase64: agentInput.hasImageBase64,
        text: agentInput.text,

        // Store the base64 because this is
        // required for reproducing/debugging OCR.
        imageBase64: agentInput.imageBase64
      }
    });

    // -----------------------------------------
    // x402 payment context
    // -----------------------------------------
    res.locals.x402PaymentContext = {
      workflowId,
      workflowMongoId: workflow._id,
      agentId: agent._id,
      invocationId: invocation._id
    };

    const startTime = Date.now();

    // -----------------------------------------
    // Call OCR/agent
    // -----------------------------------------
    try {
      console.log(
        "Calling agent:",
        getAgentEndpoint(agent)
      );

      const agentResponse = await axios.post(
        agent.endpoint,
        agentInput,
        {
          timeout: 60000,
          maxContentLength: 20 * 1024 * 1024,
          maxBodyLength: 20 * 1024 * 1024,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const latency = Date.now() - startTime;

      console.log(
        "Agent response received:",
        {
          status: agentResponse.status,
          latency,
          success: agentResponse.data?.success,
          message: agentResponse.data?.message
        }
      );

      // -----------------------------------------
      // Update invocation
      // -----------------------------------------
      invocation.status = "completed";
      invocation.output = agentResponse.data;
      invocation.latency = latency;
      invocation.cost = agent.pricePerRequest;

      await invocation.save();

      // -----------------------------------------
      // Update agent statistics
      // -----------------------------------------
      await Agent.findByIdAndUpdate(
        agent._id,
        {
          $inc: {
            totalInvocations: 1,
            successfulInvocations: 1
          },
          averageLatencyMs: latency
        }
      );

      // -----------------------------------------
      // Update workflow
      // -----------------------------------------
      workflow.status = "completed";

      workflow.result = {
        agent: {
          id: agent._id,
          name: agent.name,
          category: agent.category
        },

        invocationId: invocation._id,

        output: agentResponse.data,

        latency
      };

      workflow.error = null;

      await workflow.save();

      // -----------------------------------------
      // Return result to frontend
      // -----------------------------------------
      return res.json({
        success: true,

        workflowId,

        status: "completed",

        agent: {
          id: agent._id,
          name: agent.name,
          category: agent.category
        },

        invocationId: invocation._id,

        result: agentResponse.data,

        cost: agent.pricePerRequest,

        latency
      });
    } catch (agentError) {
      const latency = Date.now() - startTime;

      console.error(
        "AGENT EXECUTION FAILED:",
        {
          agent: agent.name,
          endpoint: getAgentEndpoint(agent),
          message: agentError.message,
          status: agentError.response?.status,
          data: agentError.response?.data
        }
      );

      // -----------------------------------------
      // Update invocation failure
      // -----------------------------------------
      invocation.status = "failed";

      invocation.error =
        agentError.response?.data?.message ||
        agentError.response?.data?.detail ||
        agentError.message;

      invocation.latency = latency;

      await invocation.save();

      // -----------------------------------------
      // Update agent statistics
      // -----------------------------------------
      await Agent.findByIdAndUpdate(
        agent._id,
        {
          $inc: {
            totalInvocations: 1
          }
        }
      );

      // -----------------------------------------
      // Update workflow
      // -----------------------------------------
      workflow.status = "failed";

      workflow.error = invocation.error;

      workflow.result = {
        invocationId: invocation._id,
        latency
      };

      await workflow.save();

      return res.status(502).json({
        success: false,
        workflowId,
        status: "failed",
        message: "Agent execution failed",
        error: invocation.error,
        invocationId: invocation._id
      });
    }
  } catch (error) {
    console.error(
      "ORCHESTRATION ERROR:",
      error
    );

    // -----------------------------------------
    // Try to save workflow failure
    // -----------------------------------------
    try {
      const workflow =
        await Workflow.findOne({
          workflowId
        });

      if (workflow) {
        workflow.status = "failed";
        workflow.error = error.message;

        await workflow.save();
      }
    } catch (saveError) {
      console.error(
        "Failed to update workflow failure:",
        saveError.message
      );
    }

    return res.status(500).json({
      success: false,
      workflowId,
      message: "Failed to create orchestration",
      error: error.message
    });
  }
});

module.exports = router;