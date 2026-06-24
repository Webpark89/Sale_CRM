// ==========================================
// middleware/authMiddleware.js - รปภ. / บอดี้การ์ด
// ==========================================
// นำเข้าตัวแกะรหัสผ่าน Token
const jwt = require("jsonwebtoken");

/**
 * Middleware: ตรวจสอบ JWT Token ทุก Request ที่ต้องการ Authentication
 * ใช้งาน: router.get("/path", authenticate, controller)
 */
const authenticate = (req, res, next) => {
  // ดึงบัตรผ่าน (Token) มาจาก Header ช่อง authorization
  const authHeader = req.headers["authorization"];
  // แยกเอาแค่ตัว Token ออกมาจากคำว่า "Bearer "
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    // ถ้าไม่มีบัตรผ่าน เตะกลับพร้อมโค้ด 401 (Unauthorized)
    return res.status(401).json({ error: "ไม่ได้รับอนุญาต: ไม่มี Token" });
  }

  try {
    // ลองแกะดูว่าบัตรผ่านนี้เป็นของจริงที่เซิร์ฟเวอร์เราออกให้หรือไม่
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ถ้าของจริง เก็บข้อมูลคนล็อกอินไว้ที่ req.user 
    // เพื่อให้พ่อครัว (Controller) เอาไปใช้งานต่อได้ว่า "ใครเป็นคนขอข้อมูล"
    req.user = decoded; // { id, username, role, full_name }
    
    // สำคัญ! อนุญาตให้ผ่านประตูไปด่านถัดไป (Controller) ได้
    next();
  } catch {
    // ถ้าบัตรผ่านปลอม หรือหมดเวลา จะหลุดมาที่ Catch
    return res.status(401).json({ error: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" });
  }
};

/**
 * Middleware: ตรวจสอบว่าเป็น Admin เท่านั้น
 * เอาไว้กั้นเส้นทางพิเศษที่เซลล์ห้ามเข้า (เช่น หน้าตั้งค่าผู้ใช้)
 * ใช้งาน: router.get("/path", authenticate, requireAdmin, controller)
 */
const requireAdmin = (req, res, next) => {
  // เช็คข้อมูล req.user ที่ได้มาจากด่าน authenticate ด้านบน
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "สิทธิ์ไม่เพียงพอ: ต้องเป็น Admin" });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
