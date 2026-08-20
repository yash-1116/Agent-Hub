require("dotenv").config();

const app = require("./app/app");
const connectDatabase = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const dbReady = await connectDatabase();

    if (!dbReady && process.env.NODE_ENV === "production") {
      throw new Error("Database connection required in production mode");
    }

    app.listen(PORT, () => {
      console.log(
        `AgentHub backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
