const db = require("../config/db");

const Followup = {
  findAllByLeadId: async (leadId) => {
    const [rows] = await db.execute(
      "SELECT * FROM followups WHERE lead_id = ? ORDER BY sequence ASC", 
      [leadId]
    );
    return rows;
  },

  findAllByOwnerId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT f.*, l.company_name, l.stage, l.owner_id,
              u.username AS owner_username, u.display_name AS owner_name
       FROM followups f
       JOIN leads l ON f.lead_id = l.id
       LEFT JOIN users u ON l.owner_id = u.id
       WHERE l.owner_id = ?
       ORDER BY f.contact_date DESC, f.id DESC`,
      [userId]
    );
    return rows;
  },

  findAllMaster: async () => {
    const [rows] = await db.execute(
      `SELECT f.*, l.company_name, l.stage, l.owner_id,
              u.username AS owner_username, u.display_name AS owner_name
       FROM followups f
       JOIN leads l ON f.lead_id = l.id
       LEFT JOIN users u ON l.owner_id = u.id
       ORDER BY f.contact_date DESC, f.id DESC`
    );
    return rows;
  },

  findByIdWithLead: async (id) => {
    const [rows] = await db.execute(
      "SELECT f.*, l.owner_id FROM followups f JOIN leads l ON f.lead_id = l.id WHERE f.id = ?",
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    await db.execute(
      `INSERT INTO followups (lead_id, sequence, contact_date, detail, status, next_followup_date, pdf_file)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.lead_id,
        data.sequence,
        data.contact_date,
        data.detail,
        data.status,
        data.next_followup_date || null,
        data.pdf_file || null,
      ]
    );

    const [newFup] = await db.execute(
      "SELECT * FROM followups WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1",
      [data.lead_id]
    );
    return newFup[0];
  },

  markDone: async (id, isDone) => {
    const [result] = await db.execute(
      "UPDATE followups SET completed = ? WHERE id = ?",
      [isDone ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    await db.execute("DELETE FROM followups WHERE id = ?", [id]);
  }
};

module.exports = Followup;
