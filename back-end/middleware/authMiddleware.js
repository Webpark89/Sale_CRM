const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "กรุณาล็อกอินก่อน" });

  try {
    // แกะบัตรผ่าน เพื่อดูว่าคนที่ส่งคำขอมาคือ id อะไร และ role อะไร
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); // ตรวจผ่าน ให้เข้าไปสั่งอาหารได้
  } catch {
    return res.status(401).json({ error: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" });
  }
};

module.exports = { authenticate };