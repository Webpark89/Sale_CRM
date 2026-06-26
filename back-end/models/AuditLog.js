const db = require('../config/db');

const AuditLog = {
  create: async (userId, action, tableName, recordId, changes = null) => {
    try {
      await db.execute(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, changes)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, action, tableName, recordId, changes ? JSON.stringify(changes) : null]
      );
    } catch (err) {
      console.error('AuditLog Error:', err.message);
      // We don't throw here to avoid failing the main transaction if audit logging fails
    }
  },

  // Batch insert เพื่อลดการยิง SQL ซ้ำซาก N ครั้งใน loop
  createMany: async (userId, action, tableName, ids) => {
    if (!ids || ids.length === 0) return;
    const values = ids.map(() => "(?, ?, ?, ?, NULL)").join(", ");
    const params = ids.flatMap(id => [userId, action, tableName, id]);
    try {
      await db.execute(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, changes) VALUES ${values}`,
        params
      );
    } catch (err) {
      console.error('AuditLog createMany Error:', err.message);
    }
  }
};

module.exports = AuditLog;
