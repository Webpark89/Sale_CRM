// ==========================================
// controllers/mainController.js - ศูนย์กลางแจกจ่ายงาน (Single Controller - Clean Version)
// ==========================================
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

// นำเข้า Models เพื่อดึง/บันทึกข้อมูล
const User     = require("../models/User");
const Lead     = require("../models/Lead");
const Followup = require("../models/Followup");
const AuditLog = require("../models/AuditLog");

// นำเข้าเครื่องมือ (Utils & Middleware) เพื่อช่วยให้โค้ดสะอาด
const { formatLead, formatFollowup, parseDateForDb, cleanAuditData, getChangesDiff } = require("../utils/formatters");
const asyncHandler = require("../middleware/asyncHandler");

// ==========================================
// ส่วนของระบบ Login (Auth)
// ==========================================

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body; 
  if (!username || !password) return res.status(400).json({ error: "กรุณากรอก Username และ Password" });

  const user = await User.findByUsername(username);
  if (!user) return res.status(401).json({ error: "Username หรือ Password ไม่ถูกต้อง" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Username หรือ Password ไม่ถูกต้อง" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
  res.json(user);
});

// ==========================================
// ส่วนจัดการข้อมูลลีด (Leads)
// ==========================================

const getLeads = asyncHandler(async (req, res) => {
  const rows = await Lead.findAllByOwner(req.user.id);
  res.json(rows.map(formatLead));
});

const getAllLeadsMaster = asyncHandler(async (req, res) => {
  if (req.body.password !== '123456') return res.status(403).json({ error: 'รหัสกลางไม่ถูกต้อง' });
  const rows = await Lead.findAllMaster();
  res.json(rows.map(formatLead));
});

const createLead = asyncHandler(async (req, res) => {
  const owner_id = req.user.id;
  const data = { owner_id, ...req.body };
  const company_name = req.body.company_name || req.body.companyName;
  const company_number = req.body.company_number || req.body.companyNumber;
  const contact_email = req.body.contact_email || req.body.contactEmail;
  if (contact_email && /[ก-๙]/.test(contact_email)) {
    const err = new Error("ห้ามใส่อีเมลเป็นภาษาไทย");
    err.name = "ValidationError";
    throw err;
  }


  if (!company_name) return res.status(400).json({ error: "กรุณากรอกชื่อบริษัท" });

  if (company_number) {
    const dup = await Lead.findByCompanyNumber(company_number);
    if (dup) return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
  }

  const insertId = await Lead.create(data);
  await AuditLog.create(req.user.id, 'create', 'leads', insertId, cleanAuditData(data));
  
  const latestRow = await Lead.findByIdWithDetails(insertId);
  res.status(201).json(formatLead(latestRow));
});

const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const existing = await Lead.findByIdWithDetails(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (role !== "admin" && existing.owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

  const company_number = req.body.company_number || req.body.companyNumber;
  const contact_email = req.body.contact_email || req.body.contactEmail;
  if (contact_email && /[ก-๙]/.test(contact_email)) {
    const err = new Error("ห้ามใส่อีเมลเป็นภาษาไทย");
    err.name = "ValidationError";
    throw err;
  }

  if (company_number) {
    const dup = await Lead.findByCompanyNumber(company_number, id);
    if (dup) return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
  }

  // หา diff เฉพาะฟิลด์ที่เปลี่ยนก่อนอัปเดต
  const newDataCleaned = cleanAuditData(req.body);
  const diffChanges = getChangesDiff(existing, newDataCleaned);

  await Lead.update(id, req.body);
  
  if (diffChanges) {
    await AuditLog.create(req.user.id, 'update', 'leads', id, diffChanges);
  }

  // Check if status/dates were changed via inline edit
  const newStatus = req.body.latestStatus || req.body.latest_status;
  const newDate = req.body.latestContactDate || req.body.latest_contact_date;
  const newNextDate = req.body.nextFollowupDate || req.body.next_followup_date;
  
  const existingStatus = existing.latest_status || "ฝากโปรไฟล์";
  const existingDate = existing.latest_contact_date ? new Date(existing.latest_contact_date).toISOString().slice(0,10) : "";
  const existingNextDate = existing.next_followup_date ? new Date(existing.next_followup_date).toISOString().slice(0,10) : "";

  if (
    (newStatus && newStatus !== existingStatus) ||
    (newDate && newDate.slice(0, 10) !== existingDate) ||
    (newNextDate && newNextDate.slice(0, 10) !== existingNextDate)
  ) {
    const Followup = require("../models/Followup");
    const fups = await Followup.findAllByLeadId(id);
    const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
    await Followup.create({
      lead_id: id,
      sequence: nextSeq,
      contact_date: newDate || existingDate || new Date().toISOString().slice(0, 10),
      detail: "อัปเดตข้อมูลจากตาราง (Inline Edit)",
      status: newStatus || existingStatus,
      next_followup_date: newNextDate || existingNextDate || null
    });
  }

  const updated = await Lead.findByIdWithDetails(id);
  res.json(formatLead(updated));
});

const toggleStar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const existing = await Lead.findById(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (role !== "admin" && existing.owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

  const isStarredNow = await Lead.toggleStar(id, existing.is_starred);
  
  const diffChanges = { isStarred: { from: !!existing.is_starred, to: isStarredNow } };
  await AuditLog.create(req.user.id, 'update', 'leads', id, diffChanges);
  
  res.json({ id, is_starred: isStarredNow });
});

const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const existing = await Lead.findById(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (role !== "admin" && existing.owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์ลบลีดนี้" });

  await Lead.delete(id);
  await AuditLog.create(req.user.id, 'delete', 'leads', id, null);
  
  res.json({ message: "ลบข้อมูลสำเร็จ", id });
});

const deleteLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการลบ" });

  const ownerIdParam = req.user.role !== "admin" ? req.user.id : null;
  await Lead.deleteMany(ids, ownerIdParam);
  
  for (const id of ids) {
    await AuditLog.create(req.user.id, 'delete', 'leads', id, null);
  }
  
  res.json({ message: `ลบ ${ids.length} รายการสำเร็จ` });
});

const restoreLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการคืนค่า" });

  await Lead.restoreMany(ids);
  for (const id of ids) {
    await AuditLog.create(req.user.id, 'restore', 'leads', id, null);
  }
  res.json({ message: `คืนค่า ${ids.length} รายการสำเร็จ` });
});

const hardDeleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  if (role !== "admin") return res.status(403).json({ error: "เฉพาะ Admin เท่านั้นที่สามารถลบข้อมูลถาวรได้" });

  await Lead.hardDelete(id);
  await AuditLog.create(req.user.id, 'delete', 'leads', id, { type: 'hard_delete' });
  
  res.json({ message: "ลบข้อมูลถาวรสำเร็จ", id });
});

// ==========================================
// ส่วนจัดการการติดตาม (Followups)
// ==========================================

const getFollowups = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const rows = leadId ? await Followup.findAllByLeadId(leadId) : await Followup.findAllByOwnerId(req.user.id);
  res.json(rows.map(formatFollowup));
});

const createFollowup = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { sequence, date, detail, status, next_followup_date, nextFollowupDate } = req.body;

  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });

  const newFup = await Followup.create({
    lead_id: leadId,
    sequence: Number(sequence) || 1,
    contact_date: parseDateForDb(date),
    detail: detail || null,
    status: status || null,
    next_followup_date: parseDateForDb(next_followup_date || nextFollowupDate)
  });

  res.status(201).json({ followup: formatFollowup(newFup) });
});

const markDone = asyncHandler(async (req, res) => {
  const isDoneValue = req.body.is_done !== undefined ? req.body.is_done : true;
  const success = await Followup.markDone(req.params.id, isDoneValue);
  
  if (!success) return res.status(404).json({ error: "ไม่พบการติดตามนี้" });
  res.json({ message: "อัปเดตสถานะการติดตามสำเร็จ", completed: isDoneValue });
});

const deleteFollowup = asyncHandler(async (req, res) => {
  await Followup.delete(req.params.id);
  res.json({ message: "ลบการติดตามสำเร็จ" });
});

// ส่งออกฟังก์ชันทั้งหมดให้ Routes เอาไปใช้งาน
module.exports = {
  login, getMe,
  getLeads, getAllLeadsMaster, createLead, updateLead, toggleStar, deleteLead, deleteLeads,
  restoreLeads,
  hardDeleteLead,
  getFollowups, createFollowup, markDone, deleteFollowup
};
