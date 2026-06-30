require("dotenv").config();
const mysql = require("mysql2/promise");

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sale_crm",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log("Adding is_deleted column to users table...");
    await pool.execute("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0");
    console.log("Successfully added is_deleted column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column is_deleted already exists. Skipping.");
    } else {
      console.error("Migration failed:", e);
    }
  }

  try {
    console.log("Creating audit_logs table...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("Successfully created audit_logs table.");
  } catch (e) {
    console.error("Migration failed:", e);
  }

  process.exit(0);
}

runMigration();
