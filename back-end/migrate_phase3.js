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
    console.log("Adding permissions column to users table...");
    await pool.execute("ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL");
    console.log("Successfully added permissions column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column permissions already exists. Skipping.");
    } else {
      console.error("Migration failed:", e);
    }
  }

  process.exit(0);
}

runMigration();
