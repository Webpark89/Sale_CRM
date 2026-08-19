const db = require("../config/db");

// โครงสร้างคำสั่ง Query กลางที่ใช้ดึงข้อมูลลูกค้า + พนักงาน + สถานะการติดตามล่าสุด
const baseLeadQuery = `
  SELECT 
    l.*,
    l.stage,
    u.username AS owner_username,
    creator.username AS creator_username,
    assigner.username AS assigner_username,
    prev_owner.username AS prev_owner_username,
    f.status AS latest_status,
    f.contact_date AS latest_contact_date,
    IF(f.completed = 1, NULL, f.next_followup_date) AS next_followup_date,
    (SELECT COUNT(*) FROM followups WHERE lead_id = l.id AND status IN ('Meeting','มีตติ้ง')) > 0 AS ever_had_meeting
  FROM leads l
  JOIN users u ON l.owner_id = u.id
  LEFT JOIN users creator ON l.created_by = creator.id
  LEFT JOIN users assigner ON l.assigned_by = assigner.id
  LEFT JOIN users prev_owner ON l.previous_owner_id = prev_owner.id
  LEFT JOIN followups f ON f.id = (
      SELECT id FROM followups 
      WHERE lead_id = l.id 
      ORDER BY contact_date DESC, sequence DESC, id DESC LIMIT 1
  )
`;

const Lead = {
  findAllByOwner: async (ownerId) => {
    let query = baseLeadQuery + " WHERE (l.owner_id = ? OR l.created_by = ?) AND l.is_deleted = 0 ORDER BY l.created_at DESC";
    const [rows] = await db.execute(query, [ownerId, ownerId]);
    return rows;
  },

  findAllMaster: async () => {
    const query = baseLeadQuery + ' WHERE l.is_deleted = 0 ORDER BY l.created_at DESC';
    const [rows] = await db.execute(query);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM leads WHERE id = ? AND is_deleted = 0", [id]);
    return rows[0];
  },

  findByIdWithDetails: async (id) => {
    const [rows] = await db.execute(baseLeadQuery + " WHERE l.id = ? AND l.is_deleted = 0", [id]);
    return rows[0];
  },

  findByCompanyNumber: async (companyNumber, excludeId = null) => {
    let query = "SELECT id FROM leads WHERE company_number = ? AND is_deleted = 0 LIMIT 1";
    let params = [companyNumber];

    if (excludeId) {
      query = "SELECT id FROM leads WHERE company_number = ? AND id != ? AND is_deleted = 0 LIMIT 1";
      params.push(excludeId);
    }

    const [rows] = await db.execute(query, params);
    return rows[0];
  },

  create: async (data) => {
    const isAcknowledged = 0;
    const [result] = await db.execute(
      `INSERT INTO leads
        (owner_id, created_by, assigned_by, previous_owner_id, is_acknowledged, company_name, company_number, stage, contact_name, contact_phone,
         contact_email, province, description, revenue, registered_capital, profit, deal_value)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.owner_id, 
        data.created_by || data.owner_id,
        data.assigned_by || null,
        data.previous_owner_id || null,
        isAcknowledged,
        data.company_name || data.companyName,
        data.company_number || data.companyNumber || null,
        data.stage || 'Contact',
        data.contact_name || data.contactName || null, 
        data.contact_phone || data.contactPhone || null,
        data.contact_email || data.contactEmail || null, 
        data.province || null,
        data.description || null,
        Number(data.revenue) || 0, 
        Number(data.registered_capital || data.registeredCapital) || 0, 
        Number(data.profit) || 0,
        Number(data.deal_value || data.dealValue) || 0
      ]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const parseNum = (val) => Number(String(val || "0").replace(/,/g, '')) || 0;
    
    // We prioritize camelCase because the frontend merges old snake_case keys with new camelCase keys.
    const updates = [
      "company_name = ?", "company_number = ?", "contact_name = ?",
      "contact_phone = ?", "contact_email = ?", "province = ?", "description = ?",
      "revenue = ?", "registered_capital = ?", "profit = ?", "deal_value = ?",
      "is_starred = ?"
    ];
    
    const params = [
      data.companyName !== undefined ? data.companyName : data.company_name, 
      data.companyNumber !== undefined ? data.companyNumber : (data.company_number || null), 
      data.contactName !== undefined ? data.contactName : (data.contact_name || null),
      data.contactPhone !== undefined ? data.contactPhone : (data.contact_phone || null), 
      data.contactEmail !== undefined ? data.contactEmail : (data.contact_email || null), 
      data.province || null,
      data.description || null,
      parseNum(data.revenue), 
      parseNum(data.registeredCapital !== undefined ? data.registeredCapital : data.registered_capital), 
      parseNum(data.profit),
      parseNum(data.dealValue !== undefined ? data.dealValue : data.deal_value),
      (data.isStarred !== undefined ? data.isStarred : data.is_starred) ? 1 : 0
    ];

    // stage update
    const newStage = data.stage;
    if (newStage !== undefined) {
      updates.push("stage = ?");
      params.push(newStage);
    }

    const newOwnerId = data.owner_id !== undefined ? data.owner_id : data.ownerId;
    if (newOwnerId !== undefined) {
      updates.push("owner_id = ?");
      params.push(newOwnerId);
      
      // If we reassign through inline edit, we should also reset acknowledge status
      updates.push("is_acknowledged = 0");
    }
    if (data.assigned_by !== undefined) {
      updates.push("assigned_by = ?");
      params.push(data.assigned_by);
      updates.push("is_acknowledged = 0");
    }
    const newPrevOwner = data.previous_owner_id !== undefined ? data.previous_owner_id : data.previousOwnerId;
    if (newPrevOwner !== undefined) {
      updates.push("previous_owner_id = ?");
      params.push(newPrevOwner);
    }

    params.push(id);

    await db.execute(
      `UPDATE leads SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  },

  setAcknowledged: async (id) => {
    await db.execute("UPDATE leads SET is_acknowledged = 1 WHERE id = ?", [id]);
  },

  toggleStar: async (id, currentStarStatus) => {
    const newStar = currentStarStatus ? 0 : 1;
    await db.execute("UPDATE leads SET is_starred = ? WHERE id = ?", [newStar, id]);
    return !!newStar;
  },

  delete: async (id) => {
    await db.execute("UPDATE leads SET is_deleted = 1 WHERE id = ?", [id]);
  },

  deleteMany: async (ids, ownerId = null) => {
    let whereClause = `id IN (${ids.map(() => "?").join(",")})`;
    const params = [...ids];

    if (ownerId) {
      whereClause += " AND owner_id = ?";
      params.push(ownerId);
    }

    await db.execute(`UPDATE leads SET is_deleted = 1 WHERE ${whereClause}`, params);
  },

  restore: async (id) => {
    await db.execute("UPDATE leads SET is_deleted = 0 WHERE id = ?", [id]);
  },

  restoreMany: async (ids) => {
    let whereClause = `id IN (${ids.map(() => "?").join(",")})`;
    await db.execute(`UPDATE leads SET is_deleted = 0 WHERE ${whereClause}`, ids);
  },

  hardDelete: async (id) => {
    await db.execute("DELETE FROM leads WHERE id = ?", [id]);
  },

  reassign: async (leadId, newOwnerId, assignedBy) => {
    const [rows] = await db.execute("SELECT owner_id FROM leads WHERE id = ?", [leadId]);
    const previousOwnerId = rows.length > 0 ? rows[0].owner_id : null;
    await db.execute(
      "UPDATE leads SET owner_id = ?, assigned_by = ?, previous_owner_id = ?, is_acknowledged = 0 WHERE id = ?", 
      [newOwnerId, assignedBy, previousOwnerId, leadId]
    );
  },

  bulkReassign: async (fromOwnerId, toOwnerId, assignedBy) => {
    await db.execute(
      "UPDATE leads SET owner_id = ?, assigned_by = ?, previous_owner_id = ?, is_acknowledged = 0 WHERE owner_id = ? AND is_deleted = 0", 
      [toOwnerId, assignedBy, fromOwnerId, fromOwnerId]
    );
  },

  getStatsByOwner: async () => {
    const [rows] = await db.execute(`
      SELECT 
        l.owner_id, 
        u.username,
        u.display_name,
        COUNT(l.id) as total_leads,
        SUM(CASE WHEN f.latest_status = 'ปิดการขาย' THEN 1 ELSE 0 END) as closed_leads,
        SUM(CASE WHEN f.next_followup_date < CURDATE() AND l.is_deleted = 0 THEN 1 ELSE 0 END) as overdue_leads
      FROM leads l
      JOIN users u ON l.owner_id = u.id
      LEFT JOIN (
          SELECT f1.lead_id, f1.status as latest_status, f1.next_followup_date
          FROM followups f1
          INNER JOIN (
              SELECT lead_id, MAX(id) as max_id
              FROM followups
              GROUP BY lead_id
          ) f2 ON f1.id = f2.max_id
      ) f ON f.lead_id = l.id
      WHERE l.is_deleted = 0
      GROUP BY l.owner_id
    `);
    return rows;
  }
};

module.exports = Lead;
