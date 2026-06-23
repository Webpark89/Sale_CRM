// ==========================================
// controllers/followupController.js - พ่อครัวจัดการประวัติการติดตาม
// ==========================================
const db = require("../config/db"); 

const getFollowups = async (req, res) => {
  try {
    const { leadId } = req.params;

    let query = "SELECT * FROM followups";
    const params = [];

    if (leadId) {
      query += " WHERE lead_id = ? ORDER BY sequence ASC";
      params.push(leadId);
    } else {
      const { id: userId } = req.user;
      query = `SELECT f.* FROM followups f JOIN leads l ON f.lead_id = l.id WHERE l.owner_id = ?`;
      params.push(userId);
      query += " ORDER BY contact_date DESC";
    }

    const [rows] = await db.execute(query, params);

    const followups = rows.map(formatFollowup);
    res.json(followups);
  } catch (err) {
    console.error("getFollowups error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลการติดตามได้" });
  }
};

const createFollowup = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { sequence, date, detail, status, next_followup_date, nextFollowupDate } = req.body;

    const parseDateForDb = (d) => {
      if (!d) return null;
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          // MM/DD/YYYY -> YYYY-MM-DD
          return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      return d;
    };

    const formattedDate = parseDateForDb(date);
    const formattedNext = parseDateForDb(next_followup_date || nextFollowupDate);

    // ตรวจสอบว่า Lead มีอยู่จริง
    const [lead] = await db.execute("SELECT id FROM leads WHERE id = ?", [leadId]);
    if (lead.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลลีด" });

    // 1. บันทึก Followup
    await db.execute(
      `INSERT INTO followups (lead_id, sequence, contact_date, detail, status, next_followup_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        leadId,
        Number(sequence) || 1,
        formattedDate,
        detail || null,
        status || null,
        formattedNext,
      ]
    );

    // ดึง Followup ที่เพิ่งสร้าง
    const [newFup] = await db.execute(
      "SELECT * FROM followups WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
      [leadId]
    );

    res.status(201).json({
      followup: formatFollowup(newFup[0])
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
  date:            row.contact_date
    ? (row.contact_date.toISOString?.().slice(0, 10) ?? String(row.contact_date).slice(0, 10))
    : null,
  detail:          row.detail,
  status:          row.status,
  nextFollowupDate: row.next_followup_date
    ? (row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10))
    : null,
  completed:       !!row.completed,
  createdAt:       row.created_at,
});

module.exports = { getFollowups, createFollowup, markDone, deleteFollowup };
