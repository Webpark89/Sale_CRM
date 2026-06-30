const db = require("../config/db");

// ─── Helper: parse permissions JSON ───────────────────────────────────────
const parseUser = (user) => {
  if (!user) return null;
  if (typeof user.permissions === 'string') {
    try { user.permissions = JSON.parse(user.permissions); } catch (e) { user.permissions = {}; }
  }
  return user;
};

// ─── Base query: JOIN ไปหา roles เพื่อดึง permissions มาด้วย ──────────────
const baseUserQuery = `
  SELECT 
    u.id, u.username, u.display_name, u.is_active, u.is_deleted,
    u.role_id,
    r.name        AS role_name,
    r.display_name AS role_display_name,
    r.is_system   AS role_is_system,
    r.permissions AS permissions
  FROM users u
  JOIN roles r ON u.role_id = r.id
`;

const User = {
  findByUsername: async (username) => {
    const [rows] = await db.execute(
      baseUserQuery + ' WHERE u.username = ? AND u.is_deleted = 0 LIMIT 1',
      [username]
    );
    // ต้องดึง password แยก (ไม่เอา password ใน base query เพื่อความปลอดภัย)
    const user = parseUser(rows[0]);
    if (!user) return null;
    // ดึง password มาเพิ่ม (สำหรับใช้ใน login เท่านั้น)
    const [pwRows] = await db.execute('SELECT password FROM users WHERE id = ?', [user.id]);
    if (pwRows[0]) user.password = pwRows[0].password;
    return user;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      baseUserQuery + ' WHERE u.id = ? AND u.is_deleted = 0',
      [id]
    );
    return parseUser(rows[0]);
  },

  findAll: async () => {
    const [rows] = await db.execute(
      baseUserQuery + ' WHERE u.is_deleted = 0 ORDER BY u.id DESC'
    );
    return rows.map(parseUser);
  },

  create: async ({ username, password, role_id, display_name }) => {
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role_id, display_name, is_active, is_deleted) VALUES (?, ?, ?, ?, 1, 0)',
      [username, password, role_id, display_name || null]
    );
    return result.insertId;
  },

  updateCredentials: async (id, username, hashedPassword, display_name) => {
    if (hashedPassword) {
      await db.execute(
        'UPDATE users SET username = ?, password = ?, display_name = ? WHERE id = ?',
        [username, hashedPassword, display_name, id]
      );
    } else {
      await db.execute(
        'UPDATE users SET username = ?, display_name = ? WHERE id = ?',
        [username, display_name, id]
      );
    }
  },

  updateRole: async (id, role_id) => {
    await db.execute('UPDATE users SET role_id = ? WHERE id = ?', [role_id, id]);
  },

  setActive: async (id, isActive) => {
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  delete: async (id) => {
    await db.execute('UPDATE users SET is_deleted = 1 WHERE id = ?', [id]);
  },

  restore: async (id) => {
    await db.execute('UPDATE users SET is_deleted = 0 WHERE id = ?', [id]);
  }
};

module.exports = User;
