require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const {
  paymentMiddlewareFromConfig
} = require("@x402/express");

const {
  HTTPFacilitatorClient
} = require("@x402/core/server");

const {
  ExactAvmScheme
} = require("@x402/avm/exact/server");

const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Workflow = require("../models/Workflow");
const Invocation = require("../models/Invocation");

const routes = require("./routes");

const app = express();

/* =========================================================
   CORS
========================================================= */

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",

    "PAYMENT-REQUIRED",
    "PAYMENT-RESPONSE",
    "PAYMENT-SIGNATURE",

    "X-PAYMENT",
    "X-PAYMENT-REQUIRED",
    "X-PAYMENT-RESPONSE"
  ],

  exposedHeaders: [
    "PAYMENT-REQUIRED",
    "PAYMENT-RESPONSE",
    "PAYMENT-SIGNATURE",

    "X-PAYMENT",
    "X-PAYMENT-REQUIRED",
    "X-PAYMENT-RESPONSE"
  ]
};

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

app.use(helmet());

app.use(cors(corsOptions));

/*
 * IMPORTANT:
 * JSON parser must be registered BEFORE /api routes.
 *
 * This allows requests containing:
 * {
 *   workflowId,
 *   file,
 *   task,
 *   hasText,
 *   hasImageBase64,
 *   imageBase64
 * }
 */
app.use(
  express.json({
    limit: "25mb"
  })
);

/*
 * URL encoded requests.
 */
app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb"
  })
);

app.use(morgan("dev"));

/* =========================================================
   REQUEST DEBUGGING
========================================================= */

app.use((req, res, next) => {
  console.log(
    `[REQUEST] ${req.method} ${req.originalUrl}`
  );

  if (req.method === "POST") {
    console.log(
      "[REQUEST CONTENT-TYPE]:",
      req.headers["content-type"]
    );

    /*
     * Do NOT print the actual base64 image.
     * Only print whether it exists and its approximate size.
     */
    if (req.body) {
      console.log(
        "[REQUEST BODY KEYS]:",
        Object.keys(req.body)
      );

      if (req.body.imageBase64) {
        console.log(
          "[IMAGE BASE64]: received, length =",
          req.body.imageBase64.length
        );
      }

      if (req.body.text) {
        console.log(
          "[TEXT]:",
          req.body.text
        );
      }

      if (req.body.file) {
        console.log(
          "[FILE]:",
          req.body.file
        );
      }

      if (req.body.task) {
        console.log(
          "[TASK]:",
          req.body.task
        );
      }
    }
  }

  next();
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "AgentHub Backend",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   X402 CONFIGURATION
========================================================= */

const facilitator = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL
});

const avmScheme = new ExactAvmScheme();

const x402Middleware = paymentMiddlewareFromConfig(
  {
    "POST /api/orchestrate": {
      accepts: {
        scheme: "exact",

        price: {
          amount: "10000",
          asset:
            process.env.USDC_ASA_ID ||
            "10458941"
        },

        network: process.env.AVM_NETWORK,

        payTo: process.env.AVM_ADDRESS
      },

      description:
        "AgentHub orchestration request",

      mimeType:
        "application/json"
    }
  },

  facilitator,

  [
    {
      network: process.env.AVM_NETWORK,
      server: avmScheme
    }
  ]
);

/* =========================================================
   X402 PAYMENT + SETTLEMENT TRACKING
========================================================= */

app.use(async (req, res, next) => {

  const originalSetHeader =
    res.setHeader.bind(res);

  let paymentResponseHeader = null;

  res.setHeader = function (name, value) {

    if (
      String(name).toLowerCase() ===
        "payment-response" ||

      String(name).toLowerCase() ===
        "x-payment-response"
    ) {
      paymentResponseHeader =
        String(value);
    }

    return originalSetHeader(
      name,
      value
    );
  };

  try {

    /*
     * Development payment bypass.
     */
    const hasSigHeader =
      req.headers["payment-signature"] ||
      req.headers["x-payment"];

    if (
      process.env.NODE_ENV !==
        "production" &&
      hasSigHeader
    ) {

      try {

        const fake = {
          success: true,

          transaction:
            `dev-tx-${Date.now()}`,

          network:
            (
              process.env.AVM_NETWORK ||
              "algorand"
            )
              .split(":")[0]
        };

        const encoded =
          Buffer
            .from(
              JSON.stringify(fake)
            )
            .toString("base64");

        paymentResponseHeader =
          encoded;

        res.setHeader(
          "PAYMENT-RESPONSE",
          encoded
        );

        console.log(
          "Dev: bypassing x402 and injecting fake PAYMENT-RESPONSE."
        );

      } catch (err) {

        console.error(
          "Dev payment bypass error:",
          err.message
        );
      }

      /*
       * Continue to the actual route.
       */
      next();

      /*
       * Wait until route response finishes.
       */
      await new Promise(
        (resolve) => {
          res.once(
            "finish",
            resolve
          );
        }
      );

    } else {

      /*
       * Production / normal x402 flow.
       */
      await x402Middleware(
        req,
        res,
        next
      );
    }

    /*
     * Nothing to record if payment
     * was not settled.
     */
    if (!paymentResponseHeader) {
      return;
    }

    let settlement;

    try {

      const decoded =
        Buffer
          .from(
            paymentResponseHeader,
            "base64"
          )
          .toString("utf8");

      settlement =
        JSON.parse(decoded);

    } catch (decodeError) {

      console.error(
        "Failed to decode x402 PAYMENT-RESPONSE:",
        decodeError.message
      );

      return;
    }

    console.log(
      "x402 settlement received:",
      settlement
    );

    if (
      !settlement ||
      settlement.success !== true
    ) {
      return;
    }

    const transactionId =
      settlement.transaction ||
      settlement.txHash ||
      settlement.transactionId;

    if (!transactionId) {

      console.warn(
        "x402 settlement succeeded but no transaction ID was returned."
      );

      return;
    }

    /*
     * Information supplied by
     * orchestrate.js.
     */
    const paymentContext =
      res.locals.x402PaymentContext ||
      {};

    const agentId =
      paymentContext.agentId ||
      null;

    const workflowId =
      paymentContext.workflowId ||
      null;

    const invocationId =
      paymentContext.invocationId ||
      null;

    /*
     * 10000 base units = 0.01 USDC
     */
    const amountBaseUnits = 10000;

    const amount =
      amountBaseUnits / 1000000;

    /*
     * Check for duplicate transaction.
     */
    let transaction =
      await Transaction.findOne({
        transactionId
      });

    let payment = null;

    if (!transaction) {

      payment =
        await Payment.create({

          agentId,

          amount,

          currency: "USDC",

          status: "completed",

          transactionId,

          network:
            settlement.network ||
            "algorand"
        });

      transaction =
        await Transaction.create({

          paymentId:
            payment._id,

          agentId,

          transactionId,

          network:
            settlement.network ||
            "algorand",

          amount,

          status: "confirmed"
        });

      console.log(
        "Payment recorded:",
        payment._id.toString()
      );

      console.log(
        "Transaction recorded:",
        transaction._id.toString()
      );

    } else {

      payment =
        await Payment.findById(
          transaction.paymentId
        );
    }

    /*
     * Link payment to workflow.
     */
    if (workflowId) {

      const workflow =
        await Workflow.findOne({
          workflowId
        });

      if (workflow) {

        workflow.paymentId =
          payment?._id ||
          transaction.paymentId;

        workflow.transactionId =
          transaction._id;

        await workflow.save();

        console.log(
          "Workflow payment linked:",
          workflowId
        );
      }
    }

    /*
     * Link payment to invocation.
     */
    if (invocationId) {

      const invocation =
        await Invocation.findById(
          invocationId
        );

      if (invocation) {

        invocation.paymentId =
          payment?._id ||
          transaction.paymentId;

        invocation.transactionId =
          transaction._id;

        await invocation.save();

        console.log(
          "Invocation payment linked:",
          invocationId
        );
      }
    }

  } catch (error) {

    /*
     * Do not convert a successful
     * x402 response into a failed
     * API response because MongoDB
     * recording failed.
     */
    console.error(
      "x402 payment recording error:",
      error
    );
  }
});

/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api",
  routes
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        `Cannot ${req.method} ${req.originalUrl}`
    });
  }
);

/* =========================================================
   JSON / GENERAL ERROR HANDLER
========================================================= */

app.use(
  (err, req, res, next) => {

    console.error(
      "BACKEND ERROR:",
      err
    );

    /*
     * Invalid JSON.
     */
    if (
      err instanceof SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid JSON request body.",

        error:
          err.message
      });
    }

    /*
     * Payload too large.
     */
    if (
      err.type ===
      "entity.too.large"
    ) {

      return res.status(413).json({

        success: false,

        message:
          "Request body is too large."
      });
    }

    return res.status(500).json({

      success: false,

      message:
        "Internal server error",

      error:
        process.env.NODE_ENV !==
        "production"
          ? err.message
          : undefined
    });
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;