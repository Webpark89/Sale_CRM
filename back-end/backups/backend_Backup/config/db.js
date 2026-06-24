// ==========================================
// config/db.js - กุญแจไขฐานข้อมูล
// ==========================================
// ใช้เวอร์ชัน promise ของ mysql2 เพื่อให้ใช้ async/await (รอคำตอบ) ได้
const mysql = require("mysql2/promise");
require("dotenv").config();

// สร้าง Connection Pool แทน Single Connection
// Pool เปรียบเสมือนอ่างเก็บกุญแจ ช่วยจัดการ Connection หลายๆ อันพร้อมกัน ทำให้ระบบไม่ล่มเวลามีคนใช้เยอะ
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || "localhost", // ที่อยู่เซิร์ฟเวอร์ฐานข้อมูล
  port:            Number(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER     || "root",      // ชื่อผู้ใช้ MySQL
  password:        process.env.DB_PASSWORD || "",          // รหัสผ่าน
  database:        process.env.DB_NAME     || "qoraqot_crm", // ชื่อฐานข้อมูล
  waitForConnections: true,
  connectionLimit: 10,   // จำกัดให้เชื่อมต่อพร้อมกันได้สูงสุด 10 connections (คิวที่ 11 ต้องรอ)
  queueLimit:      0,
  charset:         "utf8mb4", // รองรับภาษาไทยและ Emoji
  timezone:        "+07:00",  // ตั้งเวลาให้ตรงกับประเทศไทย
});

// ทดสอบ Connection เมื่อ Server เริ่มทำงานครั้งแรก
pool.getConnection()
  .then(conn => {
    console.log("✅ MySQL Connected:", process.env.DB_NAME || "qoraqot_crm");
    conn.release(); // พอเทสเสร็จ คืนกุญแจลงอ่างเหมือนเดิม
  })
  .catch(err => {
    console.error("❌ MySQL Connection Error:", err.message);
  });

// ส่งออก (Export) pool ไปให้ไฟล์อื่นหยิบกุญแจไปใช้ดึงข้อมูล
module.exports = pool;
