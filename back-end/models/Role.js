// models/Role.js
// ==========================================
// Model สำหรับจัดการข้อมูล Role
// ==========================================
const db = require('../config/db');

// Helper: parse permissions JSON string → object
const parseRole = (row) => {
  if (!row) return null;
  if (typeof row.permissions === 'string') {
    try { row.permissions = JSON.parse(row.permissions); } catch (e) { row.permissions = {}; }
  }
  return row;
};

const Role = {
  findAll: async () => {
    const [rows] = await db.execute(`
      SELECT r.*, COUNT(u.id) AS user_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id AND u.is_deleted = 0
      GROUP BY r.id
      ORDER BY r.created_at ASC
    `);
    return rows.map(parseRole);
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM roles WHERE id = ?', [id]);
    return parseRole(rows[0]);
  },

  findByName: async (name) => {
    const [rows] = await db.execute('SELECT * FROM roles WHERE name = ?', [name]);
    return parseRole(rows[0]);
  },

  findByDisplayName: async (displayName) => {
    const [rows] = await db.execute('SELECT * FROM roles WHERE display_name = ?', [displayName]);
    return parseRole(rows[0]);
  },

  create: async ({ name, display_name, permissions }) => {
    const [result] = await db.execute(
      'INSERT INTO roles (name, display_name, permissions) VALUES (?, ?, ?)',
      [name, display_name, JSON.stringify(permissions || {})]
    );
    return result.insertId;
  },

  update: async (id, { name, display_name, permissions }) => {
    await db.execute(
      'UPDATE roles SET name = ?, display_name = ?, permissions = ? WHERE id = ?',
      [name, display_name, JSON.stringify(permissions || {}), id]
    );
  },

  delete: async (id) => {
    // ตรวจก่อนว่ามี User ใช้ Role นี้อยู่ไหม (เอาเฉพาะที่ Active)
    const [users] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM users WHERE role_id = ? AND is_deleted = 0',
      [id]
    );
    if (users[0].cnt > 0) {
      throw new Error(`ไม่สามารถลบ Role นี้ได้ เนื่องจากมีผู้ใช้งาน ${users[0].cnt} คนที่ใช้ Role นี้อยู่`);
    }
    
    const conn = await db.getConnection();
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      // Set role_id to 0 for any soft-deleted users that might still reference this role
      await conn.query('UPDATE users SET role_id = 0 WHERE role_id = ?', [id]);
      await conn.query('DELETE FROM roles WHERE id = ?', [id]);
    } finally {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      conn.release();
    }
  }
};

module.exports = Role;
