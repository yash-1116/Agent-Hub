const mongoose = require("mongoose");

const workflowSchema = new mongoose.Schema(
  {
    workflowId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    file: {
      type: String,
      required: true
    },

    task: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },

    agentsUsed: {
      type: [String],
      default: []
    },

    totalCost: {
      type: Number,
      default: 0,
      min: 0
    },

    /*
     * x402 payment references
     */
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

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

module.exports = mongoose.model("Workflow", workflowSchema);