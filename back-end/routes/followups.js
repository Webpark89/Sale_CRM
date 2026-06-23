// ==========================================
// routes/followups.js - พนักงานรับออเดอร์หมวดการติดตามลูกค้า
// ==========================================
const express = require("express");
const { getFollowups, createFollowup, markDone, deleteFollowup } = require("../controllers/followupController");
const { authenticate } = require("../middleware/authMiddleware");

// mergeParams: true สำคัญมาก! เพื่อให้ดึงค่า leadId จาก URL แม่ (เช่น /api/leads/:leadId/followups) มาใช้ได้
const router = express.Router({ mergeParams: true });

// ทุก Route ด้านล่างต้องผ่านการล็อกอิน (authenticate)
router.use(authenticate);

// --- 📌 เส้นทาง API ---
router.get("/", getFollowups);       // ดึงประวัติการโทร/ติดตามทั้งหมดของลีด
router.post("/", createFollowup);    // บันทึกการโทร/ติดตามครั้งใหม่
router.put("/:id/done", markDone);   // อัปเดตสถานะว่า "ทำเสร็จแล้ว" (ติ๊กถูก)
router.delete("/:id", deleteFollowup); // ลบประวัติการติดตาม

module.exports = router;
