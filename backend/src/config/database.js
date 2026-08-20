const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri || /<[^>]+>/.test(mongoUri)) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("MONGODB_URI is not defined");
      }

      console.warn(
        "MONGODB_URI is missing or still contains a placeholder. Continuing without MongoDB in development mode."
      );
      return false;
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "MongoDB connection failed; continuing without MongoDB in development mode:",
        error.message
      );
      return false;
    }

    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectDatabase;