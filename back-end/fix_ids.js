const mysql = require("mysql2/promise");
require("dotenv").config();

async function fixIds() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "qoraqot_crm",
  });

  try {
    const [users] = await pool.execute("SELECT id, username, role FROM users ORDER BY id ASC");
    
    let salerCount = 101;
    let adminCount = 501;
    let headerCount = 901;
    
    // Disable foreign key checks to allow ID updates
    await pool.execute("SET FOREIGN_KEY_CHECKS=0");

    for (const user of users) {
      let newId;
      if (user.role === 'admin') {
        newId = adminCount++;
      } else if (user.role === 'header_saler') {
        newId = headerCount++;
      } else {
        newId = salerCount++;
      }
      
      console.log(`Updating ${user.username} (${user.role}): ${user.id} -> ${newId}`);
      
      // Update ID in users table
      await pool.execute("UPDATE users SET id = ? WHERE id = ?", [newId, user.id]);
      
      // Update ID in audit_logs
      await pool.execute("UPDATE audit_logs SET user_id = ? WHERE user_id = ?", [newId, user.id]);
      
      // Update owner_id in leads (if leads table has owner_id)
      try {
        await pool.execute("UPDATE leads SET owner_id = ? WHERE owner_id = ?", [newId, user.id]);
      } catch (e) {
        // Ignore if owner_id doesn't exist
      }
    }
    
    await pool.execute("SET FOREIGN_KEY_CHECKS=1");
    console.log("✅ All user IDs updated successfully!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

fixIds();
