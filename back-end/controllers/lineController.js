const crypto = require("crypto");

const handleWebhook = async (req, res) => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const signature = req.headers["x-line-signature"];

  if (!channelSecret) {
    console.error("LINE Webhook: Missing LINE_CHANNEL_SECRET in environment variables.");
    return res.status(500).json({ error: "Missing Channel Secret configuration" });
  }

  if (!signature) {
    console.warn("LINE Webhook: Missing x-line-signature header.");
    return res.status(401).send("Unauthorized");
  }

  // Calculate signature using raw body (req.body is Buffer since we use express.raw)
  const rawBody = req.body;
  const hash = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");

  if (hash !== signature) {
    console.warn("LINE Webhook: Signature verification failed.");
    return res.status(401).send("Unauthorized");
  }

  let bodyString;
  let data;
  try {
    bodyString = rawBody.toString("utf8");
    data = JSON.parse(bodyString);
  } catch (err) {
    console.error("LINE Webhook: Failed to parse raw body as JSON:", err.message);
    return res.status(400).send("Invalid JSON");
  }

  const events = data.events || [];
  if (events.length === 0) {
    // Handle empty events (LINE verification test)
    console.log("LINE Webhook: Received verification ping.");
    return res.sendStatus(200);
  }

  for (const event of events) {
    const source = event.source || {};
    const type = event.type;

    // Check for groupId
    if (source.type === "group" && source.groupId) {
      console.log(`LINE Webhook: Detected Group ID: ${source.groupId} (Event type: ${type})`);
    } else if (source.type === "room" && source.roomId) {
      console.log(`LINE Webhook: Detected Room ID: ${source.roomId} (Event type: ${type})`);
    }
  }

  res.sendStatus(200);
};

module.exports = {
  handleWebhook,
};
