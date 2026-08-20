const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

// GET /api/transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("agentId", "name category")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions"
    });
  }
});

// GET /api/transactions/:id
router.get("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("agentId", "name category");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);

    res.status(400).json({
      success: false,
      message: "Invalid transaction ID"
    });
  }
});

module.exports = router;