// ดึงเครื่องมือ mysql2 มาใช้งาน
const mysql = require("mysql2/promise");
require("dotenv").config();

// สร้าง Connection Pool (อ่างเก็บกุญแจเข้าโกดัง)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "qoraqot_crm", // ชื่อ Database ของเรา
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ทดสอบการเชื่อมต่อ
pool.getConnection()
  .then((conn) => {
    console.log("✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ!");
    conn.release(); // คืนกุญแจ
  })
  .catch((err) => {
    console.error("❌ เชื่อมต่อ MySQL ไม่สำเร็จ:", err.message);
  });

// ส่งออกกุญแจนี้ไปให้ไฟล์อื่นใช้งาน
module.exports = pool;