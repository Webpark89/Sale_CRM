const express = require("express");
const router = express.Router();
const lineController = require("../controllers/lineController");

// Use express.raw for this endpoint to preserve the raw body needed for signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  lineController.handleWebhook
);

module.exports = router;
