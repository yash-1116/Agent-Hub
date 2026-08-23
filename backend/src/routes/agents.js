const express = require("express");
const axios = require("axios");
const { randomUUID } = require("crypto");

const Agent = require("../models/Agent");
const Invocation = require("../models/Invocation");
const getAgentEndpoint = require("../utils/agentEndpoint");
const { getDefaultAgents } = require("../utils/agentEndpoint");

const router = express.Router();

// GET /api/agents
// Get all active agents
router.get("/", async (req, res) => {
  try {
    const dbAgents = await Agent.find({ isActive: true }).sort({ createdAt: -1 });
    const agents = dbAgents.length ? dbAgents : getDefaultAgents();

    res.json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (error) {
    console.error("Error fetching agents:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch agents"
    });
  }
});

// GET /api/agents/:id
// Get one agent
router.get("/:id", async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found or inactive"
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error("Error fetching agent:", error);

    res.status(400).json({
      success: false,
      message: "Invalid agent ID"
    });
  }
});

// POST /api/agents/:id/invoke
// Invoke one agent
router.post("/:id/invoke", async (req, res) => {
  const startTime = Date.now();

  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found or inactive"
      });
    }

    const {
      requestId = randomUUID(),
      input = {},
      context = {}
    } = req.body;

    const invocation = await Invocation.create({
      agentId: agent._id,
      status: "processing",
      input: {
        requestId,
        input,
        context
      }
    });

    try {
      const response = await axios.post(
        getAgentEndpoint(agent),
        {
          requestId,
          input,
          context
        },
        {
          timeout: 30000
        }
      );

      const latency = Date.now() - startTime;

      invocation.status = "completed";
      invocation.output = response.data;
      invocation.latency = latency;
      invocation.cost = agent.pricePerRequest;

      await invocation.save();

      await Agent.findByIdAndUpdate(agent._id, {
        $inc: {
          totalInvocations: 1,
          successfulInvocations: 1
        },
        averageLatencyMs: latency
      });

      return res.json({
        success: true,
        requestId,
        result: response.data.result,
        metadata: response.data.metadata || {
          processingTime: latency,
          agentVersion: agent.version
        },
        invocationId: invocation._id
      });
    } catch (agentError) {
      const latency = Date.now() - startTime;

      invocation.status = "failed";
      invocation.error = agentError.message;
      invocation.latency = latency;

      await invocation.save();

      await Agent.findByIdAndUpdate(agent._id, {
        $inc: {
          totalInvocations: 1
        }
      });

      return res.status(502).json({
        success: false,
        requestId,
        message: "Agent execution failed",
        error: agentError.message,
        invocationId: invocation._id
      });
    }
  } catch (error) {
    console.error("Agent invocation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to invoke agent"
    });
  }
});

// POST /api/agents
// Register a new agent
router.post("/", async (req, res) => {
  try {
    const agent = await Agent.create(req.body);

    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    console.error("Error creating agent:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;