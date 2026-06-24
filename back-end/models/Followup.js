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
      "SELECT f.* FROM followups f JOIN leads l ON f.lead_id = l.id WHERE l.owner_id = ? ORDER BY contact_date DESC",
      [userId]
    );
    return rows;
  },

  create: async (data) => {
    await db.execute(
      `INSERT INTO followups (lead_id, sequence, contact_date, detail, status, next_followup_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.lead_id,
        data.sequence,
        data.contact_date,
        data.detail,
        data.status,
        data.next_followup_date,
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
