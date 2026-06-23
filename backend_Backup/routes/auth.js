// ==========================================
// routes/auth.js - พนักงานรับออเดอร์หมวดการเข้าสู่ระบบ
// ==========================================
const express = require("express");
// นำเข้าพ่อครัว (ฟังก์ชันล็อกอิน และดึงข้อมูลตัวเอง)
const { login, getMe } = require("../controllers/authController");
// นำเข้ารปภ. (ตรวจสอบการล็อกอิน)
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// --- 📌 เส้นทาง API ---
// เปิดให้ทุกคนเข้าถึงได้ (ไม่ต้องตรวจ Token เพราะเพิ่งจะล็อกอิน)
router.post("/login", login);

// ดึงข้อมูลโปรไฟล์ของคนที่ล็อกอินอยู่ (ต้องผ่านด่าน authenticate ก่อน)
router.get("/me", authenticate, getMe);

module.exports = router;
