const express = require("express");
const axios = require("axios");

const Agent = require("../models/Agent");
const Invocation = require("../models/Invocation");
const getAgentEndpoint = require("../utils/agentEndpoint");

const router = express.Router();

// Get recent invocation history
router.get("/", async (req, res) => {
  try {
    const invocations = await Invocation.find()
      .populate("agentId", "name category")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: invocations.length,
      invocations
    });
  } catch (error) {
    console.error("Error fetching invocations:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invocation history"
    });
  }
});

// Run an agent
router.post("/", async (req, res) => {
  const startTime = Date.now();

  try {
    const { agentId, input = {} } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "agentId is required"
      });
    }

    const agent = await Agent.findOne({
      _id: agentId,
      isActive: true
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found or inactive"
      });
    }

    console.log("Calling agent:", {
      name: agent.name,
      endpoint: getAgentEndpoint(agent),
      price: agent.pricePerRequest
    });

    const invocation = await Invocation.create({
      agentId: agent._id,
      status: "processing",
      input
    });

    try {
      const response = await axios.post(getAgentEndpoint(agent), input, {
        timeout: 30000
      });

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
        invocation
      });

    } catch (agentError) {
      const latency = Date.now() - startTime;

      console.error("AGENT ERROR:", {
        message: agentError.message,
        code: agentError.code,
        url: getAgentEndpoint(agent),
        status: agentError.response?.status,
        data: agentError.response?.data
      });

      invocation.status = "failed";

      invocation.error =
        agentError.response?.data?.detail ||
        agentError.response?.data?.message ||
        agentError.message;

      invocation.latency = latency;

      await invocation.save();

      await Agent.findByIdAndUpdate(agent._id, {
        $inc: {
          totalInvocations: 1
        }
      });

      return res.status(502).json({
        success: false,
        message: "Agent execution failed",
        error: invocation.error,
        invocation
      });
    }

  } catch (error) {
    console.error("Invocation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create invocation"
    });
  }
});

module.exports = router;