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
// ให้ระบบอ่านข้อมูลแบบ JSON ได้ และให้ Frontend ทักเข้ามาได้
app.use(express.json());
app.use(cors());
app.use("/api/auth", require("./routes/auth"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/leads/:leadId/followups", require("./routes/followups"));
app.use("/api/followups", require("./routes/followups"));
// สร้าง Route พื้นฐาน เอาไว้ทดสอบว่าร้านเปิดหรือยัง
app.get("/", (req, res) => {
  res.json({ message: "Hello CRM! Backend Started" });
});

// สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์เปิดแล้วที่ http://localhost:${PORT}`);
});