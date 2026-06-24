// ==========================================
// controllers/leadController.js - พ่อครัวใหญ่ จัดการข้อมูลลีด
// ==========================================
const db = require("../config/db"); // ดึงกุญแจเชื่อมต่อ Database

/**
 * ------------------------------------------
 * 1. ดึงลีดทั้งหมด (GET /api/leads)
 * ------------------------------------------
 * แอดมิน (admin): ดึงมาให้หมด
 * เซลล์ (sales): เอา WHERE owner_id ไปกรองให้เห็นเฉพาะลูกค้าของตัวเอง
 */
const getLeads = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let query = `
      SELECT 
        l.*,
        u.username  AS owner_username,
        u.full_name AS owner_full_name
      FROM leads l
      JOIN users u ON l.owner_id = u.id
      WHERE l.is_deleted = 0
    `;
    const params = [];

    if (role !== "admin") {
      query += " AND l.owner_id = ?";
      params.push(userId);
    }

    query += " ORDER BY l.updated_at DESC";

    const [rows] = await db.execute(query, params);

    // แปลง TINYINT → Boolean และ Date ให้อ่านง่าย
    const leads = rows.map(formatLead);
    res.json(leads);
  } catch (err) {
    console.error("getLeads error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลลีดได้" });
  }
};

/**
 * ------------------------------------------
 * 2. เพิ่มลีดใหม่ (POST /api/leads)
 * ------------------------------------------
 * เอาข้อมูลที่กรอกมาจากหน้าเว็บ (req.body) ไป INSERT ลงตาราง
 */
const createLead = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const lead_id = req.body.id || require('crypto').randomUUID();
    const company_name = req.body.company_name || req.body.companyName;
    const company_number = req.body.company_number || req.body.companyNumber;
    const contact_name = req.body.contact_name || req.body.contactName;
    const contact_phone = req.body.contact_phone || req.body.contactPhone;
    const contact_email = req.body.contact_email || req.body.contactEmail;
    const description = req.body.description;
    const revenue = req.body.revenue;
    const registered_capital = req.body.registered_capital || req.body.registeredCapital;
    const profit = req.body.profit;
    const latest_status = req.body.latest_status || req.body.latestStatus;
    const raw_latest_contact_date = req.body.latest_contact_date || req.body.latestContactDate;
    const raw_next_followup_date = req.body.next_followup_date || req.body.nextFollowupDate;

    const latest_contact_date = raw_latest_contact_date ? String(raw_latest_contact_date).slice(0, 10) : null;
    const next_followup_date = raw_next_followup_date ? String(raw_next_followup_date).slice(0, 10) : null;

    if (!company_name) {
      return res.status(400).json({ error: "กรุณากรอกชื่อบริษัท" });
    }

    // ตรวจสอบเลขนิติบุคคลซ้ำ
    if (company_number) {
      const [dup] = await db.execute(
        "SELECT id FROM leads WHERE company_number = ? LIMIT 1",
        [company_number]
      );
      if (dup.length > 0) {
        return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
      }
    }

    const [result] = await db.execute(
      `INSERT INTO leads
        (id, owner_id, company_name, company_number, contact_name, contact_phone,
         contact_email, description, revenue, registered_capital, profit,
         latest_status, latest_contact_date, next_followup_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        lead_id, owner_id, company_name, company_number || null,
        contact_name || null, contact_phone || null,
        contact_email || null, description || null,
        Number(revenue) || 0, Number(registered_capital) || 0, Number(profit) || 0,
        latest_status || "ต้องตามต่อ",
        latest_contact_date || null,
        next_followup_date || null,
      ]
    );



    // fallback: ดึงโดย insertId ไม่ได้กับ CHAR(36) ใช้ query ล่าสุดแทน
    const [latestRow] = await db.execute(
      `SELECT l.*, u.username AS owner_username, u.full_name AS owner_full_name
       FROM leads l JOIN users u ON l.owner_id = u.id
       WHERE l.owner_id = ? ORDER BY l.created_at DESC LIMIT 1`,
      [owner_id]
    );

    res.status(201).json(formatLead(latestRow[0]));
  } catch (err) {
    console.error("createLead error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    }
    res.status(500).json({ error: "ไม่สามารถเพิ่มลีดได้" });
  }
};

/**
 * PUT /api/leads/:id
 * แก้ไขข้อมูลลีด (Sales แก้ได้เฉพาะของตัวเอง, Admin แก้ได้ทั้งหมด)
 */
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // ตรวจว่า Lead นั้นมีอยู่และมีสิทธิ์แก้ไข
    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    }
    if (role !== "admin" && existing[0].owner_id !== userId) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });
    }

    const company_name = req.body.company_name || req.body.companyName;
    const company_number = req.body.company_number || req.body.companyNumber;
    const contact_name = req.body.contact_name || req.body.contactName;
    const contact_phone = req.body.contact_phone || req.body.contactPhone;
    const contact_email = req.body.contact_email || req.body.contactEmail;
    const description = req.body.description;
    const revenue = req.body.revenue;
    const registered_capital = req.body.registered_capital || req.body.registeredCapital;
    const profit = req.body.profit;
    const latest_status = req.body.latest_status || req.body.latestStatus;
    const raw_latest_contact_date = req.body.latest_contact_date || req.body.latestContactDate;
    const raw_next_followup_date = req.body.next_followup_date || req.body.nextFollowupDate;
    
    const latest_contact_date = raw_latest_contact_date ? String(raw_latest_contact_date).slice(0, 10) : null;
    const next_followup_date = raw_next_followup_date ? String(raw_next_followup_date).slice(0, 10) : null;
    const is_starred = req.body.is_starred !== undefined ? req.body.is_starred : req.body.isStarred;
    const ever_had_meeting = req.body.ever_had_meeting !== undefined ? req.body.ever_had_meeting : req.body.everHadMeeting;

    // ตรวจสอบเลขนิติบุคคลซ้ำ (ยกเว้น record ตัวเอง)
    if (company_number) {
      const [dup] = await db.execute(
        "SELECT id FROM leads WHERE company_number = ? AND id != ? LIMIT 1",
        [company_number, id]
      );
      if (dup.length > 0) {
        return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
      }
    }

    // ถ้าสถานะเปลี่ยนเป็น "มีตติ้ง" ให้ตั้ง ever_had_meeting = true
    const hadMeeting = latest_status === "มีตติ้ง" 
      ? 1 
      : (ever_had_meeting ? 1 : existing[0].ever_had_meeting);

    await db.execute(
      `UPDATE leads SET
        company_name = ?, company_number = ?, contact_name = ?,
        contact_phone = ?, contact_email = ?, description = ?,
        revenue = ?, registered_capital = ?, profit = ?,
        latest_status = ?, latest_contact_date = ?, next_followup_date = ?,
        is_starred = ?, ever_had_meeting = ?
       WHERE id = ?`,
      [
        company_name, company_number || null, contact_name || null,
        contact_phone || null, contact_email || null, description || null,
        Number(revenue) || 0, Number(registered_capital) || 0, Number(profit) || 0,
        latest_status, latest_contact_date || null, next_followup_date || null,
        is_starred ? 1 : 0, hadMeeting,
        id,
      ]
    );

    const [updated] = await db.execute(
      `SELECT l.*, u.username AS owner_username, u.full_name AS owner_full_name
       FROM leads l JOIN users u ON l.owner_id = u.id WHERE l.id = ?`,
      [id]
    );

    res.json(formatLead(updated[0]));
  } catch (err) {
    console.error("updateLead error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    }
    res.status(500).json({ error: "ไม่สามารถแก้ไขข้อมูลลีดได้" });
  }
};

/**
 * PATCH /api/leads/:id/star
 * Toggle ดาว
 */
const toggleStar = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    if (role !== "admin" && existing[0].owner_id !== userId) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });
    }

    const newStar = existing[0].is_starred ? 0 : 1;
    await db.execute("UPDATE leads SET is_starred = ? WHERE id = ?", [newStar, id]);

    res.json({ id, is_starred: !!newStar });
  } catch (err) {
    console.error("toggleStar error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/**
 * DELETE /api/leads/:id
 * ลบลีด (Sales ลบได้เฉพาะของตัวเอง, Admin ลบได้ทั้งหมด)
 */
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    if (role !== "admin" && existing[0].owner_id !== userId) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์ลบลีดนี้" });
    }

    // Soft delete
    await db.execute("UPDATE leads SET is_deleted = 1 WHERE id = ?", [id]);
    res.json({ message: "ลบข้อมูลสำเร็จ", id });
  } catch (err) {
    console.error("deleteLead error:", err);
    res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
  }
};

/**
 * DELETE /api/leads (bulk)
 * Body: { ids: ["id1","id2",...] }
 */
const deleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    const { id: userId, role } = req.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการลบ" });
    }

    // Sales ลบได้เฉพาะของตัวเอง
    let whereClause = `id IN (${ids.map(() => "?").join(",")})`;
    const params = [...ids];

    if (role !== "admin") {
      whereClause += " AND owner_id = ?";
      params.push(userId);
    }

    await db.execute(`UPDATE leads SET is_deleted = 1 WHERE ${whereClause}`, params);
    res.json({ message: `ลบ ${ids.length} รายการสำเร็จ` });
  } catch (err) {
    console.error("deleteLeads error:", err);
    res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
  }
};

// Helper: แปลงค่าจาก MySQL ให้ตรงกับ format ที่ Frontend ใช้อยู่
const formatLead = (row) => ({
  ...row,
  id:              row.id,
  owner:           row.owner_username,   // ให้ตรงกับ field เดิมใน frontend
  revenue:         Number(row.revenue) || 0,
  registeredCapital: Number(row.registered_capital) || 0,
  profit:          Number(row.profit) || 0,
  isStarred:       !!row.is_starred,
  everHadMeeting:  !!row.ever_had_meeting,
  latestStatus:    row.latest_status,
  latestContactDate: row.latest_contact_date
    ? row.latest_contact_date.toISOString?.().slice(0, 10) ?? String(row.latest_contact_date).slice(0, 10)
    : null,
  nextFollowupDate: row.next_followup_date
    ? row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10)
    : null,
  companyName:     row.company_name,
  companyNumber:   row.company_number,
  contactName:     row.contact_name,
  contactPhone:    row.contact_phone,
  contactEmail:    row.contact_email,
  createdAt:       row.created_at,
  updatedAt:       row.updated_at,
});

module.exports = {
  getLeads,
  createLead,
  updateLead,
  toggleStar,
  deleteLead,
  deleteLeads,
  
  // Undo support
  restoreLeads: async (req, res) => {
    try {
      const { ids } = req.body;
      const { id: userId, role } = req.user;
      if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No ids" });
      
      let whereClause = `id IN (${ids.map(() => "?").join(",")})`;
      const params = [...ids];
      if (role !== "admin") {
        whereClause += " AND owner_id = ?";
        params.push(userId);
      }
      await db.execute(`UPDATE leads SET is_deleted = 0 WHERE ${whereClause}`, params);
      res.json({ message: "Restored" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Cannot restore" });
    }
  },
  
  hardDeleteLead: async (req, res) => {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      
      const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
      if (existing.length === 0) return res.status(404).json({ error: "Not found" });
      if (role !== "admin" && existing[0].owner_id !== userId) return res.status(403).json({ error: "Forbidden" });
      
      await db.execute("DELETE FROM leads WHERE id = ?", [id]);
      res.json({ message: "Hard deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Cannot hard delete" });
    }
  }
};
