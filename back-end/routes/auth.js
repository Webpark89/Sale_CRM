const express = require("express");
// ดึงฟังก์ชันมาจาก mainController แทน
const { login, getMe } = require("../controllers/mainController");
// (ตรวจสอบการล็อกอิน)
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// --- 📌 เส้นทาง API ---
router.post("/login", login);
router.get("/me", authenticate, getMe);

module.exports = router;
