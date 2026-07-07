// ==========================================
// routes/followups.js - พนักงานรับออเดอร์หมวดการติดตามลูกค้า
// ==========================================
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getFollowups, createFollowup, markDone, deleteFollowup } = require("../controllers/mainController");
const { authenticate } = require("../middleware/authMiddleware");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/pdfs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// mergeParams: true สำคัญมาก! เพื่อให้ดึงค่า leadId จาก URL แม่ (เช่น /api/leads/:leadId/followups) มาใช้ได้
const router = express.Router({ mergeParams: true });

// ทุก Route ด้านล่างต้องผ่านการล็อกอิน (authenticate)
router.use(authenticate);

// --- 📌 เส้นทาง API ---
router.get("/", getFollowups);       // ดึงประวัติการโทร/ติดตามทั้งหมดของลีด
router.post("/", upload.single("pdf_file"), createFollowup);    // บันทึกการโทร/ติดตามครั้งใหม่ พร้อมรับไฟล์ pdf
router.put("/:id/done", markDone);   // อัปเดตสถานะว่า "ทำเสร็จแล้ว" (ติ๊กถูก)
router.delete("/:id", deleteFollowup); // ลบประวัติการติดตาม

module.exports = router;
