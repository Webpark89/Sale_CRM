// ==========================================
// controllers/leadController.js - พ่อครัวใหญ่ จัดการข้อมูลลีด
// ==========================================
const db = require("../config/db"); 

// โครงสร้างคำสั่ง Query กลางที่ใช้ดึงข้อมูลลูกค้า + พนักงาน + สถานะการติดตามล่าสุด
const baseLeadQuery = `
  SELECT 
    l.*,
    u.username AS owner_username,
    f.status AS latest_status,
    f.contact_date AS latest_contact_date,
    f.next_followup_date AS next_followup_date,
    (SELECT COUNT(*) FROM followups WHERE lead_id = l.id AND status = 'มีตติ้ง') > 0 AS ever_had_meeting
  FROM leads l
  JOIN users u ON l.owner_id = u.id
  LEFT JOIN (
      -- ดึงข้อมูลการติดตามครั้งล่าสุดของลูกค้าแต่ละคน
      SELECT f1.lead_id, f1.status, f1.contact_date, f1.next_followup_date
      FROM followups f1
      INNER JOIN (
          SELECT lead_id, MAX(id) as max_id
          FROM followups
          GROUP BY lead_id
      ) f2 ON f1.id = f2.max_id
  ) f ON f.lead_id = l.id
`;

const getLeads = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let query = baseLeadQuery;
    const params = [];

    query += " WHERE l.owner_id = ?";
    params.push(userId);
    
    query += " ORDER BY l.created_at DESC";

    const [rows] = await db.execute(query, params);
    const leads = rows.map(formatLead);
    res.json(leads);
  } catch (err) {
    console.error("getLeads error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลลีดได้" });
  }
};

const createLead = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const company_name = req.body.company_name || req.body.companyName;
    const company_number = req.body.company_number || req.body.companyNumber;
    const contact_name = req.body.contact_name || req.body.contactName;
    const contact_phone = req.body.contact_phone || req.body.contactPhone;
    const contact_email = req.body.contact_email || req.body.contactEmail;
    const description = req.body.description;
    const revenue = req.body.revenue;
    const registered_capital = req.body.registered_capital || req.body.registeredCapital;
    const profit = req.body.profit;

    if (!company_name) {
      return res.status(400).json({ error: "กรุณากรอกชื่อบริษัท" });
    }

    if (company_number) {
      const [dup] = await db.execute("SELECT id FROM leads WHERE company_number = ? LIMIT 1", [company_number]);
      if (dup.length > 0) return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    }

    const [result] = await db.execute(
      `INSERT INTO leads
        (owner_id, company_name, company_number, contact_name, contact_phone,
         contact_email, description, revenue, registered_capital, profit)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        owner_id, company_name, company_number || null,
        contact_name || null, contact_phone || null,
        contact_email || null, description || null,
        Number(revenue) || 0, Number(registered_capital) || 0, Number(profit) || 0
      ]
    );

    const [latestRow] = await db.execute(
      baseLeadQuery + ` WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json(formatLead(latestRow[0]));
  } catch (err) {
    console.error("createLead error:", err);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    res.status(500).json({ error: "ไม่สามารถเพิ่มลีดได้" });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    if (role !== "admin" && existing[0].owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

    const company_name = req.body.company_name || req.body.companyName;
    const company_number = req.body.company_number || req.body.companyNumber;
    const contact_name = req.body.contact_name || req.body.contactName;
    const contact_phone = req.body.contact_phone || req.body.contactPhone;
    const contact_email = req.body.contact_email || req.body.contactEmail;
    const description = req.body.description;
    const revenue = req.body.revenue;
    const registered_capital = req.body.registered_capital || req.body.registeredCapital;
    const profit = req.body.profit;
    const is_starred = req.body.is_starred !== undefined ? req.body.is_starred : req.body.isStarred;

    if (company_number) {
      const [dup] = await db.execute("SELECT id FROM leads WHERE company_number = ? AND id != ? LIMIT 1", [company_number, id]);
      if (dup.length > 0) return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    }

    await db.execute(
      `UPDATE leads SET
        company_name = ?, company_number = ?, contact_name = ?,
        contact_phone = ?, contact_email = ?, description = ?,
        revenue = ?, registered_capital = ?, profit = ?,
        is_starred = ?
       WHERE id = ?`,
      [
        company_name, company_number || null, contact_name || null,
        contact_phone || null, contact_email || null, description || null,
        Number(revenue) || 0, Number(registered_capital) || 0, Number(profit) || 0,
        is_starred ? 1 : 0, id
      ]
    );

    const [updated] = await db.execute(
      baseLeadQuery + ` WHERE l.id = ?`,
      [id]
    );

    res.json(formatLead(updated[0]));
  } catch (err) {
    console.error("updateLead error:", err);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว" });
    res.status(500).json({ error: "ไม่สามารถแก้ไขข้อมูลลีดได้" });
  }
};

const toggleStar = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    if (role !== "admin" && existing[0].owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขลีดนี้" });

    const newStar = existing[0].is_starred ? 0 : 1;
    await db.execute("UPDATE leads SET is_starred = ? WHERE id = ?", [newStar, id]);

    res.json({ id, is_starred: !!newStar });
  } catch (err) {
    console.error("toggleStar error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const [existing] = await db.execute("SELECT * FROM leads WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });
    if (role !== "admin" && existing[0].owner_id !== userId) return res.status(403).json({ error: "ไม่มีสิทธิ์ลบลีดนี้" });

    await db.execute("DELETE FROM leads WHERE id = ?", [id]);
    res.json({ message: "ลบข้อมูลสำเร็จ", id });
  } catch (err) {
    console.error("deleteLead error:", err);
    res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
  }
};

const deleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    const { id: userId, role } = req.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "กรุณาระบุรายการที่ต้องการลบ" });
    }

    let whereClause = `id IN (${ids.map(() => "?").join(",")})`;
    const params = [...ids];

    if (role !== "admin") {
      whereClause += " AND owner_id = ?";
      params.push(userId);
    }

    await db.execute(`DELETE FROM leads WHERE ${whereClause}`, params);
    res.json({ message: `ลบ ${ids.length} รายการสำเร็จ` });
  } catch (err) {
    console.error("deleteLeads error:", err);
    res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
  }
};

const formatLead = (row) => ({
  ...row,
  id:              row.id,
  owner:           row.owner_username,   
  revenue:         Number(row.revenue) || 0,
  registeredCapital: Number(row.registered_capital) || 0,
  profit:          Number(row.profit) || 0,
  isStarred:       !!row.is_starred,
  everHadMeeting:  !!row.ever_had_meeting, 
  latestStatus:    row.latest_status || "ฝากโปรไฟล์", // ดึงจาก followup (ถ้าไม่มีก็โยนค่าเริ่มต้นให้)
  latestContactDate: row.latest_contact_date 
    ? (row.latest_contact_date.toISOString?.().slice(0, 10) ?? String(row.latest_contact_date).slice(0, 10))
    : new Date().toISOString().slice(0, 10), 
  nextFollowupDate: row.next_followup_date
    ? (row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10))
    : new Date().toISOString().slice(0, 10), 
  companyName:     row.company_name,
  companyNumber:   row.company_number,
  contactName:     row.contact_name,
  contactPhone:    row.contact_phone,
  contactEmail:    row.contact_email,
  createdAt:       row.created_at,
  updatedAt:       row.created_at, 
});


const getAllLeadsMaster = async (req, res) => {
  try {
    const { password } = req.body;
    if (password !== '123456') {
      return res.status(403).json({ error: 'รหัสกลางไม่ถูกต้อง' });
    }

    const query = baseLeadQuery + ' ORDER BY l.created_at DESC';
    const [rows] = await db.execute(query);
    res.json(rows.map(formatLead));
  } catch (err) {
    console.error('getAllLeadsMaster error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรวมลีดได้' });
  }
};

module.exports = {
  getAllLeadsMaster,
  getLeads,
  createLead,
  updateLead,
  toggleStar,
  deleteLead,
  deleteLeads,
  restoreLeads: async (req, res) => res.json({ message: "Not supported" }),
  hardDeleteLead: deleteLead
};
