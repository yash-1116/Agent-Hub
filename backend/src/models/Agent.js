const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "documents",
        "language",
        "images",
        "audio",
        "code",
        "security",
        "data",
      ],
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    endpoint: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerRequest: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    network: {
  type: String,
  default: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
},

    walletAddress: {
      type: String,
      default: null,
    },

    version: {
      type: String,
      default: "1.0.0",
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalInvocations: {
      type: Number,
      default: 0,
    },

    successfulInvocations: {
      type: Number,
      default: 0,
    },

    averageLatencyMs: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Agent", agentSchema);