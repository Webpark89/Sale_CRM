// ==========================================
// routes/leads.js - สมุดเมนู / พนักงานรับออเดอร์หมวดลีด
// ==========================================
const express = require("express");
const { getLeads, getAllLeadsMaster, createLead, updateLead, toggleStar, deleteLead, deleteLeads, restoreLeads, hardDeleteLead, reassignLead, bulkReassignLeads, getTeamStats, acknowledgeLead } = require("../controllers/mainController");
const { authenticate, requireManagerAccess, requirePermission } = require("../middleware/authMiddleware");

const router = express.Router();

// 🛡️ ทุก Route ต้องผ่านด่าน authenticate
router.use(authenticate);

// --- Static Routes (ต้องอยู่ก่อน Dynamic /:id ทั้งหมด) ---
router.get("/", getLeads);
router.post("/all", getAllLeadsMaster);
router.post("/", requirePermission('leads', 'create'), createLead);
router.post("/restore", requirePermission('leads', 'delete'), restoreLeads);
router.delete("/bulk", requirePermission('leads', 'delete'), deleteLeads);

// --- Team Routes (ต้องอยู่ก่อน /:id เพื่อป้องกัน Express จับ "team" เป็น :id) ---
router.get("/team/stats", requireManagerAccess, getTeamStats);
router.put("/team/bulk-reassign", bulkReassignLeads);

// --- Dynamic /:id Routes (อยู่ท้ายสุดเสมอ) ---
router.put("/:id/reassign", reassignLead);
router.put("/:id/acknowledge", acknowledgeLead);
router.patch("/:id/star", toggleStar);
router.delete("/:id/hard", requirePermission('leads', 'delete'), hardDeleteLead);
router.delete("/:id", requirePermission('leads', 'delete'), deleteLead);
router.put("/:id", requirePermission('leads', 'edit'), updateLead);

module.exports = router;
