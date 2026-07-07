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

  // ตรวจสอบสถานะบัญชีก่อน compare password (เพื่อไม่บอกว่ารหัสสถูก/ผิด เมื่อบัญชีถูกระงับ)
  if (!user.is_active) return res.status(403).json({ error: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" });

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
  const perms = req.user.permissions || {};
  // อนุญาต: role_is_system, admin role, หรือมีสิทธิ์ view='all' / view_select ของเมนูใดเมนูหนึ่ง
  const canViewAll = req.user.role_is_system
    || req.user.role === 'admin'
    || (perms.leads && (perms.leads.view === 'all' || perms.leads.view_select))
    || (perms.dashboard && (perms.dashboard.view === 'all' || perms.dashboard.view_select))
    || (perms.reports && (perms.reports.view === 'all' || perms.reports.view_select));
  if (!canViewAll) return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
  const rows = await Lead.findAllMaster();
  res.json(rows.map(formatLead));
});

const createLead = asyncHandler(async (req, res) => {
  let finalOwnerId = req.body.owner_id || req.user.id;
  let assigned_by = null;
  if (finalOwnerId !== req.user.id) {
    assigned_by = req.user.id;
  }
  
  const data = { 
    ...req.body,
    owner_id: finalOwnerId,
    created_by: req.user.id,
    assigned_by: assigned_by 
  };
  const company_name = req.body.company_name || req.body.companyName;
  const company_number = req.body.company_number || req.body.companyNumber;
  const contact_email = req.body.contact_email || req.body.contactEmail;
  const contact_phone = req.body.contact_phone || req.body.contactPhone;

  if (contact_phone && !/^[\d\s\-\+\(\)]+$/.test(contact_phone)) {
    return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข (อนุญาตให้ใช้ -, space)" });
  }

  const rev = Number(req.body.revenue);
  const prof = Number(req.body.profit);
  const cap = Number(req.body.registered_capital || req.body.registeredCapital);
  if (rev < 0 || prof < 0) return res.status(400).json({ error: "รายได้และกำไรไม่สามารถติดลบได้" });
  if (cap <= 0 && cap !== undefined && !isNaN(cap)) return res.status(400).json({ error: "ทุนจดทะเบียนต้องมากกว่า 0 บาท" });

  const cDate = req.body.latestContactDate || req.body.latest_contact_date;
  const nDate = req.body.nextFollowupDate || req.body.next_followup_date;
  if (cDate && nDate) {
    if (new Date(cDate) > new Date(nDate)) {
      return res.status(400).json({ error: "วันที่ติดต่อต้องไม่ช้ากว่าวันที่นัดหมายถัดไป" });
    }
  }

  if (contact_email) {
    if (/[ก-๙]/.test(contact_email)) {
      const err = new Error("ห้ามใส่อีเมลเป็นภาษาไทย");
      err.name = "ValidationError";
      throw err;
    }
    if (!/^\S+@\S+\.\S+$/.test(contact_email)) {
      const err = new Error("รูปแบบอีเมลไม่ถูกต้อง");
      err.name = "ValidationError";
      throw err;
    }
  }

  if (!company_name) return res.status(400).json({ error: "กรุณากรอกชื่อบริษัท" });

  if (company_number) {
    const dup = await Lead.findByCompanyNumber(company_number);
    if (dup) return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
  }

  const insertId = await Lead.create(data);
  await AuditLog.create(req.user.id, 'create', 'leads', insertId, cleanAuditData(data));

  // สร้าง Followup แรกทันทีถ้ามีข้อมูลสถานะส่งมา
  const initStatus = req.body.latestStatus || req.body.latest_status || "ฝากโปรไฟล์";
  const initDate = req.body.latestContactDate || req.body.latest_contact_date || new Date().toISOString().slice(0, 10);
  const initNextDate = req.body.nextFollowupDate || req.body.next_followup_date || null;
  await Followup.create({
    lead_id: insertId,
    sequence: 1,
    contact_date: initDate,
    detail: "เพิ่มลีดใหม่เข้าระบบ",
    status: initStatus,
    next_followup_date: initNextDate,
  });

  const latestRow = await Lead.findByIdWithDetails(insertId);
  res.status(201).json(formatLead(latestRow));
});

const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const existing = await Lead.findByIdWithDetails(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  
  const perms = req.user.permissions || {};
  const canUpdate = req.user.role_is_system || (perms.leads && perms.leads.update === true) || existing.owner_id === userId;
  if (!canUpdate) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

  const company_number = req.body.company_number || req.body.companyNumber;
  const contact_email = req.body.contact_email || req.body.contactEmail;
  const contact_phone = req.body.contact_phone || req.body.contactPhone;

  if (contact_phone && !/^[\d\s\-\+\(\)]+$/.test(contact_phone)) {
    return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข (อนุญาตให้ใช้ -, space)" });
  }

  const rev = req.body.revenue !== undefined ? Number(req.body.revenue) : undefined;
  const prof = req.body.profit !== undefined ? Number(req.body.profit) : undefined;
  const cap = req.body.registered_capital !== undefined ? Number(req.body.registered_capital) : (req.body.registeredCapital !== undefined ? Number(req.body.registeredCapital) : undefined);
  if ((rev !== undefined && rev < 0) || (prof !== undefined && prof < 0)) return res.status(400).json({ error: "รายได้และกำไรไม่สามารถติดลบได้" });
  if (cap !== undefined && cap <= 0) return res.status(400).json({ error: "ทุนจดทะเบียนต้องมากกว่า 0 บาท" });

  const cDate = req.body.latestContactDate || req.body.latest_contact_date;
  const nDate = req.body.nextFollowupDate || req.body.next_followup_date;
  if (cDate && nDate) {
    if (new Date(cDate) > new Date(nDate)) {
      return res.status(400).json({ error: "วันที่ติดต่อต้องไม่ช้ากว่าวันที่นัดหมายถัดไป" });
    }
  }

  if (contact_email) {
    if (/[ก-๙]/.test(contact_email)) {
      const err = new Error("ห้ามใส่อีเมลเป็นภาษาไทย");
      err.name = "ValidationError";
      throw err;
    }
    if (!/^\S+@\S+\.\S+$/.test(contact_email)) {
      const err = new Error("รูปแบบอีเมลไม่ถูกต้อง");
      err.name = "ValidationError";
      throw err;
    }
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

  let newFollowup = null;
  if (
    (newStatus && newStatus !== existingStatus) ||
    (newDate && newDate.slice(0, 10) !== existingDate) ||
    (newNextDate && newNextDate.slice(0, 10) !== existingNextDate)
  ) {
    const fups = await Followup.findAllByLeadId(id);
    const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
    // ใช้ข้อความที่ Frontend ส่งมา ถ้าไม่มีก็ใช้ค่าเริ่มต้นตามประเภทการแก้ไข
    const noteText = req.body.editDetail || (req.body.latestStatus ? "อัปเดตสถานะ" : "อัปเดตข้อมูล");
    newFollowup = await Followup.create({
      lead_id: id,
      sequence: nextSeq,
      contact_date: newDate || existingDate || new Date().toISOString().slice(0, 10),
      detail: noteText,
      status: newStatus || existingStatus,
      next_followup_date: newNextDate || existingNextDate || null
    });
  }

  const updated = await Lead.findByIdWithDetails(id);
  // ส่งทั้ง lead และ followup ใหม่ (ถ้ามี) กลับไปให้ Frontend อัปเดต State ได้ทันที
  res.json({ lead: formatLead(updated), followup: newFollowup ? formatFollowup(newFollowup) : null });
});

const toggleStar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const existing = await Lead.findById(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  const perms = req.user.permissions || {};
  const canUpdate = req.user.role_is_system || (perms.leads && perms.leads.update === true) || existing.owner_id === userId;
  if (!canUpdate) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

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
  const perms = req.user.permissions || {};
  const canDelete = req.user.role_is_system || (perms.leads && perms.leads.delete === true) || existing.owner_id === userId;
  if (!canDelete) return res.status(403).json({ error: "ไม่มีสิทธิ์ลบลีดนี้" });

  await Lead.delete(id);
  await AuditLog.create(req.user.id, 'delete', 'leads', id, null);
  
  res.json({ message: "ลบข้อมูลสำเร็จ", id });
});

const deleteLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการลบ" });

  const permsForDelete = req.user.permissions || {};
  const canViewAll = req.user.role_is_system || (permsForDelete.leads && permsForDelete.leads.delete === true);
  const ownerIdParam = canViewAll ? null : req.user.id;
  await Lead.deleteMany(ids, ownerIdParam);
  await AuditLog.createMany(req.user.id, 'delete', 'leads', ids);
  
  res.json({ message: `ลบ ${ids.length} รายการสำเร็จ` });
});

const restoreLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการคืนค่า" });

  await Lead.restoreMany(ids);
  await AuditLog.createMany(req.user.id, 'restore', 'leads', ids);
  res.json({ message: `คืนค่า ${ids.length} รายการสำเร็จ` });
});

const hardDeleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  const perms = req.user.permissions || {};
  const canDeleteAll = req.user.role_is_system || (perms.leads && perms.leads.delete === true);
  if (!canDeleteAll) return res.status(403).json({ error: "เฉพาะผู้ที่มีสิทธิ์ลบข้อมูลเท่านั้นที่สามารถลบข้อมูลถาวรได้" });

  await Lead.hardDelete(id);
  await AuditLog.create(req.user.id, 'delete', 'leads', id, { type: 'hard_delete' });
  
  res.json({ message: "ลบข้อมูลถาวรสำเร็จ", id });
});

// ==========================================
// ส่วนจัดการการติดตาม (Followups)
// ==========================================

const getFollowups = asyncHandler(async (req, res) => {
  const { leadId } = req.params;

  // Guard Clause: ถ้าไม่มี leadId ให้ดึงเฉพาะของตัวเองแล้วจบ
  if (!leadId) {
    const rows = await Followup.findAllByOwnerId(req.user.id);
    return res.json(rows.map(formatFollowup));
  }

  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (req.user.role !== "admin" && lead.owner_id !== req.user.id) {
    return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูลการติดตามนี้" });
  }

  const rows = await Followup.findAllByLeadId(leadId);
  return res.json(rows.map(formatFollowup));
});

const createFollowup = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { sequence, date, detail, status, next_followup_date, nextFollowupDate } = req.body;

  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (!req.user.role_is_system && lead.owner_id !== req.user.id) {
    return res.status(403).json({ error: "ไม่มีสิทธิ์ดูการติดตามลีดนี้" });
  }

  const newFup = await Followup.create({
    lead_id: leadId,
    sequence: Number(sequence) || 1,
    contact_date: parseDateForDb(date),
    detail: detail || null,
    status: status || null,
    next_followup_date: parseDateForDb(next_followup_date || nextFollowupDate),
    pdf_file: req.file ? req.file.filename : null
  });

  res.status(201).json({ followup: formatFollowup(newFup) });
});

const markDone = asyncHandler(async (req, res) => {
  const fup = await Followup.findByIdWithLead(req.params.id);
  if (!fup) return res.status(404).json({ error: "ไม่พบการติดตามนี้" });
  if (!req.user.role_is_system && fup.owner_id !== req.user.id) {
    return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขการติดตามนี้" });
  }

  const isDoneValue = req.body.is_done !== undefined ? req.body.is_done : true;
  await Followup.markDone(req.params.id, isDoneValue);
  
  res.json({ message: "อัปเดตสถานะการติดตามสำเร็จ", completed: isDoneValue });
});

const deleteFollowup = asyncHandler(async (req, res) => {
  const fup = await Followup.findByIdWithLead(req.params.id);
  if (!fup) return res.status(404).json({ error: "ไม่พบการติดตามนี้" });
  if (!req.user.role_is_system && fup.owner_id !== req.user.id) {
    return res.status(403).json({ error: "ไม่มีสิทธิ์ลบการติดตามนี้" });
  }

  await Followup.delete(req.params.id);
  res.json({ message: "ลบการติดตามสำเร็จ" });
});

// ==========================================
// ส่วนจัดการผู้ใช้งานระบบ (User Management - Admin Only)
// ==========================================

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, role_id, display_name } = req.body;
  if (!username || !password || !role_id) {
    return res.status(400).json({ error: "กรุณากรอก Username, Password และเลือก Role" });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: "Username ห้ามมีเว้นวรรคและอักขระพิเศษ (ใช้ได้แค่ a-z, A-Z, 0-9, _)" });
  }
  if (!password.trim()) {
    return res.status(400).json({ error: "Password ห้ามเป็นช่องว่าง" });
  }

  const existing = await User.findByUsername(username);
  if (existing) return res.status(409).json({ error: "Username นี้มีอยู่ในระบบแล้ว" });

  const Role = require('../models/Role');
  const roleData = await Role.findById(role_id);
  if (!roleData) return res.status(400).json({ error: 'Role ที่เลือกไม่พบในระบบ' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const insertId = await User.create({ username, password: hashedPassword, role_id, display_name });
  
  const newUser = await User.findById(insertId);
  res.status(201).json(newUser);
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password, display_name } = req.body;
  
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

  let hashedPassword = null;
  if (password !== undefined) {
    if (!password.trim()) return res.status(400).json({ error: "Password ห้ามเป็นช่องว่าง" });
    hashedPassword = await bcrypt.hash(password, 10);
  }
  
  const finalUsername = username || user.username;
  if (username && username !== user.username) {
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username ห้ามมีเว้นวรรคและอักขระพิเศษ (ใช้ได้แค่ a-z, A-Z, 0-9, _)" });
    }
    const existing = await User.findByUsername(username);
    if (existing && existing.id !== parseInt(id)) {
      return res.status(400).json({ error: "Username นี้มีผู้ใช้งานแล้ว" });
    }
  }

  const finalDisplayName = display_name !== undefined ? display_name : user.display_name;

  await User.updateCredentials(id, finalUsername, hashedPassword, finalDisplayName);
  res.json({ message: "อัปเดตข้อมูลสำเร็จ", username: finalUsername });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;
  if (!role_id) return res.status(400).json({ error: 'กรุณาระบุ Role' });

  const Role = require('../models/Role');
  const roleData = await Role.findById(role_id);
  if (!roleData) return res.status(400).json({ error: 'Role ที่เลือกไม่พบในระบบ' });

  await User.updateRole(id, role_id);
  const AuditLog = require('../models/AuditLog');
  await AuditLog.create(req.user.id, 'update_role', 'users', id, null, { role_id });
  res.json({ message: 'เปลี่ยน Role สำเร็จ', role_id });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active, adminPassword } = req.body;
  
  if (!adminPassword) return res.status(400).json({ error: "ต้องยืนยันรหัสผ่านแอดมิน" });
  const admin = await User.findById(req.user.id);
  const adminWithPassword = await User.findByUsername(admin.username);
  const valid = await bcrypt.compare(adminPassword, adminWithPassword.password);
  if (!valid) return res.status(403).json({ error: "รหัสผ่านแอดมินไม่ถูกต้อง" });

  await User.setActive(id, is_active);
  res.json({ message: is_active ? "เปิดใช้งาน Account สำเร็จ" : "ระงับ Account สำเร็จ", is_active });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminPassword } = req.body; 
  
  if (!adminPassword) return res.status(400).json({ error: "ต้องยืนยันรหัสผ่านแอดมิน" });
  const admin = await User.findById(req.user.id);
  const adminWithPassword = await User.findByUsername(admin.username);
  const valid = await bcrypt.compare(adminPassword, adminWithPassword.password);
  if (!valid) return res.status(403).json({ error: "รหัสผ่านแอดมินไม่ถูกต้อง" });

  await User.delete(id);
  const AuditLog = require("../models/AuditLog");
  await AuditLog.create(req.user.id, "delete", "users", id, { username: adminWithPassword.username }, null);
  res.json({ message: "ลบผู้ใช้สำเร็จ" });
});

const restoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminPassword } = req.body;
  if (!adminPassword) return res.status(400).json({ error: "ต้องยืนยันรหัสผ่านแอดมิน" });
  const admin = await User.findById(req.user.id);
  const adminWithPassword = await User.findByUsername(admin.username);
  const valid = await require('bcryptjs').compare(adminPassword, adminWithPassword.password);
  if (!valid) return res.status(403).json({ error: "รหัสผ่านแอดมินไม่ถูกต้อง" });

  await User.restore(id);
  const AuditLog = require("../models/AuditLog");
  await AuditLog.create(req.user.id, "restore", "users", id, null, { restored: true });
  res.json({ message: "กู้คืนบัญชีผู้ใช้สำเร็จ" });
});

const updateUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  
  if (!permissions) return res.status(400).json({ error: "ไม่มีข้อมูลสิทธิ์" });
  
  await User.updatePermissions(id, permissions);
  const AuditLog = require("../models/AuditLog");
  await AuditLog.create(req.user.id, "update_permissions", "users", id, null, { permissions });
  res.json({ message: "อัปเดตสิทธิ์ผู้ใช้สำเร็จ", permissions });
});

// ==========================================
// ส่วนจัดการทีม (Team Management - Admin & Header Saler)
// ==========================================

const getTeamStats = asyncHandler(async (req, res) => {
  const stats = await Lead.getStatsByOwner();
  res.json(stats);
});

const acknowledgeLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findById(id);
  if (!lead) return res.status(404).json({ error: 'ไม่พบข้อมูลลีด' });
  
  if (lead.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์รับทราบลีดนี้' });
  }

  await Lead.setAcknowledged(id);
  res.json({ success: true, message: 'รับทราบลีดใหม่สำเร็จ' });
});

const reassignLead = asyncHandler(async (req, res) => {
  const perms = req.user.permissions || {};
  const canReassign = req.user.role_is_system || (perms.leads && perms.leads.reassign === true);
  if (!canReassign) return res.status(403).json({ error: 'ไม่มีสิทธิ์โอนย้ายผู้ดูแล' });

  const { id } = req.params;
  const { owner_id } = req.body;
  if (!owner_id) return res.status(400).json({ error: "กรุณาระบุเจ้าของใหม่" });

  const existing = await Lead.findById(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
  if (existing.owner_id == owner_id) return res.status(400).json({ error: "ไม่สามารถโอนย้ายให้เซลส์คนเดิมได้" });

  await Lead.reassign(id, owner_id, req.user.id);
  res.json({ message: "โอนย้ายลีดสำเร็จ" });
});

const bulkReassignLeads = asyncHandler(async (req, res) => {
  const perms = req.user.permissions || {};
  const canReassign = req.user.role_is_system || (perms.leads && perms.leads.reassign === true);
  if (!canReassign) return res.status(403).json({ error: 'ไม่มีสิทธิ์โอนย้ายผู้ดูแล' });

  const { from_owner_id, to_owner_id } = req.body;
  if (!from_owner_id || !to_owner_id) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
  if (from_owner_id == to_owner_id) return res.status(400).json({ error: "ไม่สามารถโอนย้ายให้เซลส์คนเดิมได้" });

  await Lead.bulkReassign(from_owner_id, to_owner_id, req.user.id);
  res.json({ message: "โอนย้ายลีดทั้งหมดสำเร็จ" });
});

module.exports = {
  login, getMe,
  getLeads, getAllLeadsMaster, createLead, updateLead, toggleStar, deleteLead, deleteLeads,
  restoreLeads, hardDeleteLead,
  getFollowups, createFollowup, markDone, deleteFollowup,
  getUsers, createUser, updateUserPassword, updateUserRole, toggleUserActive, deleteUser, restoreUser, updateUserPermissions,
  getTeamStats, reassignLead, bulkReassignLeads, acknowledgeLead
};
