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
  }
};

module.exports = AuditLog;
