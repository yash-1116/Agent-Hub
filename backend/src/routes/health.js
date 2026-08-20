const express = require("express");
const axios = require("axios");
const Agent = require("../models/Agent");
const getAgentEndpoint = require("../utils/agentEndpoint");

const router = express.Router();

router.get("/agents", async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true }).select("name category endpoint");
    const checks = await Promise.all(agents.map(async (agent) => {
      const startedAt = Date.now();
      try {
        const response = await axios.get(getAgentEndpoint(agent).replace(/\/run\/?$/, "/health"), { timeout: 3000 });
        return { name: agent.name, category: agent.category, status: response.status === 200 ? "online" : "degraded", latency: Date.now() - startedAt };
      } catch (error) {
        return { name: agent.name, category: agent.category, status: "offline", latency: Date.now() - startedAt, error: "Service unavailable" };
      }
    }));
    res.json({ success: true, agents: checks, allOnline: checks.every((agent) => agent.status === "online") });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to check agent health" });
  }
});

module.exports = router;
