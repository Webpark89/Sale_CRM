// ==========================================
// server.js - ไฟล์หลัก (ผู้จัดการร้าน)
// ==========================================
// โหลดค่าตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env เช่น DB_HOST, PORT
require("dotenv").config();
const express = require("express"); // โครงร่างหลักของ Backend
const cors = require("cors"); // อนุญาตให้ Frontend (คนละ Port) เรียกใช้ API ได้

// นำเข้า Routes (พนักงานรับออเดอร์ของแต่ละหมวดหมู่)
const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const followupRoutes = require("./routes/followups");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware พื้นฐาน (เครื่องมือดักหน้าประตู) ---
app.use(express.json()); // อนุญาตให้ระบบอ่านข้อมูลแบบ JSON (เช่น เวลาส่งข้อมูลฟอร์มมา)
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // อนุญาตเฉพาะ Frontend นี้
  credentials: true, // ยอมให้ส่ง Cookie/Token ข้ามโดเมนได้
}));

// --- API Routes (แบ่งโซนการทำงาน) ---
app.use("/api/auth", authRoutes); // งานล็อกอิน สมัครสมาชิก
app.use("/api/leads", leadRoutes); // งานจัดการข้อมูลลูกค้า
// ใช้ mergeParams ใน followups.js ทำให้สามารถซ้อน Route ได้ (ดูประวัติของลูกค้าคนนั้นๆ)
app.use("/api/leads/:leadId/followups", followupRoutes);
app.use("/api/followups", followupRoutes); // สำหรับดึง followups ทั้งหมดภาพรวม

// --- Health Check (ทดสอบว่าเซิร์ฟเวอร์ยังไม่พัง) ---
app.get("/", (req, res) => {
  res.json({ message: "QoraQot CRM API is running!" });
});

// --- 404 Handler (ดักจับคนพิมพ์ URL ผิด) ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Error Handler (ดักจับโปรแกรมพัง ป้องกันเซิร์ฟเวอร์ดับ) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
