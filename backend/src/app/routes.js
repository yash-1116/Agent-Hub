const express = require("express");

const agentsRouter = require("../routes/agents");
const invocationsRouter = require("../routes/invocations");
const transactionsRouter = require("../routes/transactions");
const paymentsRouter = require("../routes/payments");
const workflowsRouter = require("../routes/workflows");
const orchestrateRouter = require("../routes/orchestrate");
const healthRouter = require("../routes/health");
const authRouter = require("../routes/auth");

const router = express.Router();

router.use("/agents", agentsRouter);
router.use("/invocations", invocationsRouter);
router.use("/transactions", transactionsRouter);
router.use("/payments", paymentsRouter);
router.use("/workflows", workflowsRouter);
router.use("/orchestrate", orchestrateRouter);
router.use("/health", healthRouter);
router.use("/auth", authRouter);

module.exports = router;
