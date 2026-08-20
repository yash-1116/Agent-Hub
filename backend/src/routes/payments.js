const express = require("express");
const Payment = require("../models/Payment");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("agentId", "name category")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Error fetching payments:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payments"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("agentId", "name category");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.json({ success: true, payment });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid payment ID"
    });
  }
});

module.exports = router;