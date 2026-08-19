// ดึงค่าลับจากไฟล์ .env มาใช้งาน
require("dotenv").config();

// นำเข้า Express และ Cors
const express = require("express");
const cors = require("cors");
const db = require("./config/db"); // เอาไว้รันเทสตอนเปิดเซิร์ฟเวอร์
const leadRoutes = require("./routes/leads");
// สร้างแอปพลิเคชัน
const app = express();
const PORT = process.env.PORT || 3001;
const authRoutes = require("./routes/auth");
// ให้ระบบอ่านข้อมูลแบบ LINE Webhook แบบ raw body ได้โดยตรง ก่อนที่ express.json จะทำงาน
app.use("/api/line", require("./routes/line"));

// ให้ระบบอ่านข้อมูลแบบ JSON ได้ และให้ Frontend ทักเข้ามาได้
app.use(express.json());
app.use(cors());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/leads/:leadId/followups", require("./routes/followups"));
app.use("/api/followups", require("./routes/followups"));

const { initDailyFollowupCron, sendDailyFollowupSummary } = require("./cron/dailyFollowups");

// เสิร์ฟไฟล์ Static เพื่อให้เข้าถึงไฟล์ PDF ได้
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// สร้าง Route พื้นฐาน เอาไว้ทดสอบว่าร้านเปิดหรือยัง
app.get("/", (req, res) => {
  res.json({ message: "Hello CRM! Backend Started" });
});

// Route ทดสอบการส่งแจ้งเตือนสรุปประจำวันเข้า LINE
app.get("/api/test/daily-followups", async (req, res) => {
  try {
    const result = await sendDailyFollowupSummary();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// จัดการ Error ที่หลุดรอดจากระบบ ให้ตอบกลับเป็น JSON เสมอ (ป้องกัน HTML 500)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
});

// สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์เปิดแล้วที่ http://localhost:${PORT}`);
  // เริ่มการทำงานของ Cron Job สรุปข้อมูลประจำวัน
  initDailyFollowupCron();
});