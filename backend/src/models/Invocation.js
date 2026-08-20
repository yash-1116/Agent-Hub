const mongoose = require("mongoose");

const invocationSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true
    },

    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      default: null
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },

    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    cost: {
      type: Number,
      default: 0
    },

    latency: {
      type: Number,
      default: 0
    },

    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Invocation", invocationSchema);