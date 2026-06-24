// ==========================================
// controllers/followupController.js - พ่อครัวจัดการประวัติการติดตาม
// ==========================================
const db = require("../config/db"); // กุญแจเชื่อม Database

/**
 * ------------------------------------------
 * 1. ดึงประวัติการติดตามทั้งหมด (GET /api/leads/:leadId/followups)
 * ------------------------------------------
 * ถ้ามี leadId จะดึงเฉพาะของลูกค้ารายนั้น
 */
const getFollowups = async (req, res) => {
  try {
    const { leadId } = req.params;

    let query = "SELECT * FROM followups";
    const params = [];

    if (leadId) {
      query += " WHERE lead_id = ? ORDER BY sequence ASC";
      params.push(leadId);
    } else {
      // สำหรับ Dashboard จะใช้ทั้งหมดที่เห็นได้
      const { id: userId, role } = req.user;
      if (role !== "admin") {
        query = `SELECT f.* FROM followups f JOIN leads l ON f.lead_id = l.id WHERE l.owner_id = ? AND l.is_deleted = 0`;
        params.push(userId);
      } else {
        query = `SELECT f.* FROM followups f JOIN leads l ON f.lead_id = l.id WHERE l.is_deleted = 0`;
      }
      query += " ORDER BY date DESC";
    }

    const [rows] = await db.execute(query, params);

    const followups = rows.map(formatFollowup);
    res.json(followups);
  } catch (err) {
    console.error("getFollowups error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลการติดตามได้" });
  }
};

/**
 * ------------------------------------------
 * 2. เพิ่มบันทึกการติดตามใหม่ (POST /api/leads/:leadId/followups)
 * ------------------------------------------
 * ฟังก์ชันนี้เจ๋งตรงที่: บันทึกประวัติเสร็จปุ๊บ จะไปอัปเดตสถานะ "นัดถัดไป" 
 * ให้ตาราง leads แบบอัตโนมัติด้วย! (ไม่ต้องไปนั่งแก้ 2 ที่)
 */
const createFollowup = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { sequence, date, detail, status, next_followup_date } = req.body;

    // ตรวจสอบว่า Lead มีอยู่จริง
    const [lead] = await db.execute("SELECT id FROM leads WHERE id = ?", [leadId]);
    if (lead.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });

    // 1. บันทึก Followup
    await db.execute(
      `INSERT INTO followups (lead_id, sequence, date, detail, status, next_followup_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        leadId,
        Number(sequence) || 1,
        date || null,
        detail || null,
        status || null,
        next_followup_date || null,
      ]
    );

    // 2. อัปเดตสถานะของ Lead ตาม Followup ล่าสุด
    const hadMeeting = status === "มีตติ้ง" ? 1 : undefined;
    const updateFields = [
      "latest_status = ?",
      "latest_contact_date = ?",
      "next_followup_date = ?",
    ];
    const updateParams = [status, date, next_followup_date || null];

    if (hadMeeting !== undefined) {
      updateFields.push("ever_had_meeting = 1");
    }

    await db.execute(
      `UPDATE leads SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateParams, leadId]
    );

    // ดึง Followup ที่เพิ่งสร้าง
    const [newFup] = await db.execute(
      "SELECT * FROM followups WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
      [leadId]
    );

    // ดึง Lead ที่อัปเดตแล้ว
    const [updatedLead] = await db.execute(
      `SELECT l.*, u.username AS owner_username, u.full_name AS owner_full_name
       FROM leads l JOIN users u ON l.owner_id = u.id WHERE l.id = ?`,
      [leadId]
    );

    res.status(201).json({
      followup: formatFollowup(newFup[0]),
      lead: formatLead(updatedLead[0]),
    });
  } catch (err) {
    console.error("createFollowup error:", err);
    res.status(500).json({ error: "ไม่สามารถบันทึกการติดตามได้" });
  }
};

const markDone = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_done } = req.body;

    const [result] = await db.execute(
      "UPDATE followups SET completed = ? WHERE id = ?",
      [is_done !== undefined ? (is_done ? 1 : 0) : 1, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "ไม่พบการติดตามนี้" });

    res.json({ message: "อัปเดตสถานะการติดตามสำเร็จ", completed: is_done !== undefined ? is_done : true });
  } catch (err) {
    console.error("markDone error:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะการติดตามได้" });
  }
};

const deleteFollowup = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute("DELETE FROM followups WHERE id = ?", [id]);
    res.json({ message: "ลบการติดตามสำเร็จ" });
  } catch (err) {
    console.error("deleteFollowup error:", err);
    res.status(500).json({ error: "ไม่สามารถลบการติดตามได้" });
  }
};

// Helper formatters
const formatFollowup = (row) => ({
  id:              row.id,
  leadId:          row.lead_id,
  sequence:        row.sequence,
  date:            row.date
    ? (row.date.toISOString?.().slice(0, 10) ?? String(row.date).slice(0, 10))
    : null,
  detail:          row.detail,
  status:          row.status,
  nextFollowupDate: row.next_followup_date
    ? (row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10))
    : null,
  completed:       !!row.completed,
  createdAt:       row.created_at,
});

const formatLead = (row) => ({
  ...row,
  id:                row.id,
  owner:             row.owner_username,
  revenue:           Number(row.revenue) || 0,
  registeredCapital: Number(row.registered_capital) || 0,
  profit:            Number(row.profit) || 0,
  isStarred:         !!row.is_starred,
  everHadMeeting:    !!row.ever_had_meeting,
  latestStatus:      row.latest_status,
  latestContactDate: row.latest_contact_date
    ? (row.latest_contact_date.toISOString?.().slice(0, 10) ?? String(row.latest_contact_date).slice(0, 10))
    : null,
  nextFollowupDate:  row.next_followup_date
    ? (row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10))
    : null,
  companyName:    row.company_name,
  companyNumber:  row.company_number,
  contactName:    row.contact_name,
  contactPhone:   row.contact_phone,
  contactEmail:   row.contact_email,
  createdAt:      row.created_at,
  updatedAt:      row.updated_at,
});

module.exports = { getFollowups, createFollowup, markDone, deleteFollowup };
