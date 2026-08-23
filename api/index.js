const app = require("../backend/src/app/app");
const connectDatabase = require("../backend/src/config/database");

let dbPromise;

async function handler(req, res) {
  try {
    if (!dbPromise) {
      dbPromise = connectDatabase();
    }

    await dbPromise;

    return app(req, res);
  } catch (error) {
    console.error("API startup/database error:", error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

module.exports = handler;