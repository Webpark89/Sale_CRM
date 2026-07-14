const axios = require("axios");

/**
 * Sends a notification message to the configured LINE group using the LINE Messaging API.
 * @param {string} message The text content of the message.
 */
async function sendLineGroupNotify(message) {
  const enabled = process.env.LINE_NOTIFY_ENABLED === "true";
  if (!enabled) {
    return;
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    console.warn("LINE Notify: Missing LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID in environment variables.");
    return;
  }

  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: groupId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("LINE Notify: Notification sent successfully.");
  } catch (error) {
    console.error(
      "LINE Notify Error:",
      error.response ? error.response.data : error.message
    );
  }
}

module.exports = {
  sendLineGroupNotify,
};
