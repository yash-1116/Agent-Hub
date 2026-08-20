function getAgentEndpoint(agent) {
  const name = String(agent.name || "").toLowerCase();

  if (name.includes("ocr") && process.env.OCR_AGENT_URL) return process.env.OCR_AGENT_URL;
  if (name.includes("summary") && process.env.SUMMARY_AGENT_URL) return process.env.SUMMARY_AGENT_URL;
  if (name.includes("fraud") && process.env.FRAUD_AGENT_URL) return process.env.FRAUD_AGENT_URL;

  return agent.endpoint;
}

module.exports = getAgentEndpoint;
