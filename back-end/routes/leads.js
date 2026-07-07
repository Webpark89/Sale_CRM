// ==========================================
// routes/leads.js - สมุดเมนู / พนักงานรับออเดอร์หมวดลีด
// ==========================================
const express = require("express");
// ดึงตัวพ่อครัว (ฟังก์ชันทำงานจริง) มาจาก mainController แทน
const { getLeads, getAllLeadsMaster, createLead, updateLead, toggleStar, deleteLead, deleteLeads, restoreLeads, hardDeleteLead, reassignLead, bulkReassignLeads, getTeamStats, acknowledgeLead } = require("../controllers/mainController");
const { authenticate, requireManagerAccess, requirePermission } = require("../middleware/authMiddleware");

const router = express.Router();

// --- 🛡️ การรักษาความปลอดภัย ---
// คำสั่ง .use หมายความว่า "ทุกๆ Route ด้านล่างนี้ ต้องผ่านด่าน authenticate (ตรวจ Token) เสมอ"
router.use(authenticate);

// --- 📌 เส้นทาง API ต่างๆ ---
router.get("/", getLeads);           // ขอดูข้อมูลลีดทั้งหมด
router.post("/all", getAllLeadsMaster); // ขอดูข้อมูลลีดทั้งหมดด้วยรหัสผ่าน
router.post("/", requirePermission('leads', 'create'), createLead);        // ขอสร้างลีดใหม่ (ส่งเป็น JSON แนบมา)
router.post("/restore", restoreLeads); // ขอคืนค่าข้อมูลที่โดนลบ (Undo)
router.delete("/bulk", deleteLeads); // ขอส่ง array id มาลบพร้อมกันหลายๆ ตัว
router.put("/:id", updateLead);      // ขอแก้ไขข้อมูลลีดทั้งหมดของ ID นีั
router.patch("/:id/star", toggleStar); // ขอเปิด/ปิดดาวรายการโปรด (Patch คือการอัปเดตแค่จุดเล็กๆ)
router.delete("/:id/hard", hardDeleteLead); // ลบออกจากฐานข้อมูลถาวร (Hard Delete)
router.delete("/:id", deleteLead);   // ย้ายลงถังขยะ (Soft Delete - แค่ซ่อนไว้)

// --- 📌 เส้นทางสำหรับจัดการทีม (Admin & Header Saler) ---
router.get("/team/stats", requireManagerAccess, getTeamStats);
router.put("/team/bulk-reassign", bulkReassignLeads);
router.put("/:id/reassign", reassignLead);
router.put("/:id/acknowledge", acknowledgeLead);

module.exports = router;
