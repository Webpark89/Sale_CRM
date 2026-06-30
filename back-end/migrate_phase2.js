require("dotenv").config();
const mysql = require("mysql2/promise");

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "qoraqot_crm",
  });

  try {
    console.log("🚀 กำลังเริ่มปรับปรุงฐานข้อมูลสำหรับ Phase 2...");

    // 1. เพิ่ม role 'header_saler'
    console.log("⏳ 1/3 กำลังอัปเดตฟิลด์ Role...");
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'header_saler', 'saler') NOT NULL DEFAULT 'saler'");
    console.log("✅ 1/3 อัปเดตฟิลด์ Role สำเร็จ!");

    // 2. เพิ่ม column is_active
    console.log("⏳ 2/3 กำลังเพิ่มฟิลด์ is_active...");
    try {
      await pool.query("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role");
      console.log("✅ 2/3 เพิ่มฟิลด์ is_active สำเร็จ!");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("⚠️ 2/3 ฟิลด์ is_active มีอยู่แล้ว ข้ามไป");
      else throw err;
    }

    // 3. เพิ่ม column display_name
    console.log("⏳ 3/3 กำลังเพิ่มฟิลด์ display_name...");
    try {
      await pool.query("ALTER TABLE users ADD COLUMN display_name VARCHAR(100) NULL AFTER username");
      console.log("✅ 3/3 เพิ่มฟิลด์ display_name สำเร็จ!");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("⚠️ 3/3 ฟิลด์ display_name มีอยู่แล้ว ข้ามไป");
      else throw err;
    }

    console.log("🎉 ปรับปรุงฐานข้อมูลเสร็จสมบูรณ์แล้ว!");

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการปรับปรุงฐานข้อมูล:", error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
