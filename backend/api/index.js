let dbPromise = null;

async function handler(req, res) {
  try {
    const requestPath = (req.url || "").split("?", 1)[0];
    if (requestPath === "/" || requestPath === "") {
      return res.status(200).json({
        success: true,
        service: "AgentHub Backend",
        status: "running",
        health: "/api/health"
      });
    }
    if (requestPath.endsWith("/health")) {
      return res.status(200).json({
        success: true,
        service: "AgentHub Backend",
        status: "running",
        timestamp: new Date().toISOString()
      });
    }
    if (requestPath.endsWith("/health/agents")) {
      return res.status(200).json({
        success: true,
        agents: [],
        allOnline: false,
        message: "Agent health requires publicly configured agent endpoints."
      });
    }

    const app = require("../src/app/app");
    const connectDatabase = require("../src/config/database");

    if (!dbPromise) {
      dbPromise = connectDatabase();
    }

    await dbPromise;

    return app(req, res);
  } catch (error) {
    console.error("API startup/database error:", error);

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}

module.exports = handler;