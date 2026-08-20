const express = require("express");
const Workflow = require("../models/Workflow");

const router = express.Router();

// GET /api/workflows
router.get("/", async (req, res) => {
  try {
    const workflows = await Workflow.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: workflows.length,
      workflows
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch workflows"
    });
  }
});

// GET /api/workflows/:id
router.get("/:id", async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      workflowId: req.params.id
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error("Error fetching workflow:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch workflow"
    });
  }
});

module.exports = router;