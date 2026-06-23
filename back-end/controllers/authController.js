// ==========================================
// controllers/authController.js - พ่อครัวจัดการระบบ Login
// ==========================================
const bcrypt = require("bcryptjs"); // เครื่องมือเข้ารหัสและถอดรหัสผ่าน (ป้องกันคนแฮกรหัส)
const jwt    = require("jsonwebtoken"); // เครื่องมือสร้างบัตรผ่าน (Token)
const db     = require("../config/db"); // กุญแจเชื่อมต่อฐานข้อมูล

/**
 * ------------------------------------------
 * 1. ฟังก์ชันล็อกอิน (POST /api/auth/login)
 * ------------------------------------------
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body; // รับค่า username และ password ที่พิมพ์มา

    if (!username || !password) {
      return res.status(400).json({ error: "กรุณากรอก Username และ Password" });
    }

    // 1. ค้นหา User ในฐานข้อมูลว่ามีชื่อนี้ไหม
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Username หรือ Password ไม่ถูกต้อง" });
    }

    const user = rows[0]; // เก็บข้อมูล User ไว้ในตัวแปร

    // 2. เอา Password ที่พิมพ์มา ไปเทียบกับ Password ที่เข้ารหัสไว้ใน Database (bcrypt.compare)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Username หรือ Password ไม่ถูกต้อง" });
    }

    // 3. รหัสผ่านถูกต้อง! ทำการสร้างบัตรผ่าน (JWT Token) ให้ถือไว้ใช้งาน 8 ชั่วโมง
    const token = jwt.sign(
      {
        id:        user.id,
        username:  user.username,
        role:      user.role,
      },
      process.env.JWT_SECRET, // ใช้กุญแจลับจากไฟล์ .env
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    // 4. ส่ง Token กลับไปให้ Frontend เก็บไว้ (มักจะเก็บใน LocalStorage หรือ Cookie)
    res.json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};

/**
 * ------------------------------------------
 * 2. ฟังก์ชันตรวจสอบตัวเอง (GET /api/auth/me)
 * ------------------------------------------
 * ใช้เมื่อ Frontend รีเฟรชหน้าเว็บ แล้วอยากรู้ว่า "ฉันเป็นใคร? ยังล็อกอินอยู่ไหม?"
 */
const getMe = async (req, res) => {
  try {
    // req.user.id ได้มาจากไฟล์ middleware (authMiddleware) ที่ตรวจ Token ไว้ให้แล้ว
    const [rows] = await db.execute(
      "SELECT id, username, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    res.json(rows[0]); // ส่งข้อมูลผู้ใช้กลับไป
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};

module.exports = { login, getMe };
