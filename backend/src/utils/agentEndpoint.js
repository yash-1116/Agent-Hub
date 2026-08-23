function getDefaultAgents() {
  return [
    {
      _id: "000000000000000000000001",
      name: "OCR Agent",
      description: "Extract text from images and documents.",
      category: "documents",
      endpoint: process.env.OCR_AGENT_URL || "http://localhost:8001/run",
      pricePerRequest: 0.01,
      isActive: true,
      version: "1.0.0"
    },
    {
      _id: "000000000000000000000002",
      name: "Summary Agent",
      description: "Turn extracted document text into a clear brief.",
      category: "language",
      endpoint: process.env.SUMMARY_AGENT_URL || "http://localhost:8002/run",
      pricePerRequest: 0.01,
      isActive: true,
      version: "1.0.0"
    },
    {
      _id: "000000000000000000000003",
      name: "Fraud Agent",
      description: "Detect suspicious invoice patterns and payment risk.",
      category: "security",
      endpoint: process.env.FRAUD_AGENT_URL || "http://localhost:8003/run",
      pricePerRequest: 0.01,
      isActive: true,
      version: "1.0.0"
    },
    {
      _id: "000000000000000000000004",
      name: "PII Detection Agent",
      description: "Detect sensitive information in text and documents.",
      category: "security",
      endpoint: process.env.PII_AGENT_URL || "http://localhost:8004/run",
      pricePerRequest: 0.01,
      isActive: true,
      version: "1.0.0"
    }
  ];
}

function getAvailableAgents(dbAgents) {
  const defaults = getDefaultAgents();
  if (!dbAgents.length) return defaults;

  const defaultKeys = defaults.map((agent) => agent.name.toLowerCase().split(" ")[0]);
  const seenKeys = new Set();
  const uniqueDbAgents = dbAgents.filter((agent) => {
    const agentKey = defaultKeys.find((key) => String(agent.name || "").toLowerCase().includes(key));
    if (!agentKey) return true;
    if (seenKeys.has(agentKey)) return false;
    seenKeys.add(agentKey);
    return true;
  });

  const availableAgents = [...uniqueDbAgents, ...defaults.filter((defaultAgent) => {
    const agentKey = defaultAgent.name.toLowerCase().split(" ")[0];
    return !seenKeys.has(agentKey);
  })];

  return availableAgents.map((agent) => {
    const plainAgent = typeof agent.toObject === "function" ? agent.toObject() : agent;
    const agentKey = defaultKeys.find((key) => String(agent.name || "").toLowerCase().includes(key));
    return {
      ...plainAgent,
      pricePerRequest: agentKey ? 0.01 : Number(agent.pricePerRequest)
    };
  });
}

function getAgentEndpoint(agent) {
  const name = String(agent.name || "").toLowerCase();

  if (name.includes("ocr") && process.env.OCR_AGENT_URL) return process.env.OCR_AGENT_URL;
  if (name.includes("summary") && process.env.SUMMARY_AGENT_URL) return process.env.SUMMARY_AGENT_URL;
  if (name.includes("fraud") && process.env.FRAUD_AGENT_URL) return process.env.FRAUD_AGENT_URL;
  if (name.includes("pii") && process.env.PII_AGENT_URL) return process.env.PII_AGENT_URL;

  if (agent.endpoint) return agent.endpoint;

  if (name.includes("ocr")) return "http://localhost:8001/run";
  if (name.includes("summary")) return "http://localhost:8002/run";
  if (name.includes("fraud")) return "http://localhost:8003/run";

  return "http://localhost:8001/run";
}

module.exports = getAgentEndpoint;
module.exports.getDefaultAgents = getDefaultAgents;
module.exports.getAvailableAgents = getAvailableAgents;
