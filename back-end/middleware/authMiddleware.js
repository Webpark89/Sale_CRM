// middleware/authMiddleware.js
// ==========================================
// Middleware ตรวจสอบ Token และ Permission แบบ Dynamic
// ==========================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── 1. authenticate ──────────────────────────────────────────────────────
// ตรวจสอบว่ามี Token และถูกต้องไหม ถ้าผ่านก็เก็บข้อมูล user ไว้ใน req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'กรุณาล็อกอินก่อน' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ดึงข้อมูล User + permissions จากฐานข้อมูลใหม่ทุกครั้ง
    // เพื่อให้ถ้าแก้ Permission ที่ Role มันมีผลทันที
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'บัญชีนี้ถูกระงับหรือไม่พบในระบบ' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
  }
};

// ─── 2. requirePermission (Dynamic Middleware Factory) ────────────────────
// วิธีใช้: requirePermission('users', 'create')
// ทำงาน: ดึง permissions จาก req.user.permissions แล้วเช็ค permissions[page][action]
const requirePermission = (page, action) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'กรุณาล็อกอินก่อน' });

    // Super Admin (is_system) ผ่านได้ทุกอย่าง
    if (user.role_is_system) return next();

    const perms = user.permissions || {};
    const pagePerms = perms[page];

    if (!pagePerms) {
      return res.status(403).json({ error: `ไม่มีสิทธิ์เข้าถึงหน้า ${page}` });
    }

    const allowed = pagePerms[action];
    if (!allowed || allowed === 'none' || allowed === false) {
      return res.status(403).json({ error: `ไม่มีสิทธิ์ ${action} ในหน้า ${page}` });
    }

    next();
  };
};

// ─── 3. Legacy aliases (ใช้ในโค้ดเดิมที่ยังไม่ได้แก้) ─────────────────────
// Backward compatible: ใครเรียก requireAdmin จะตรวจ users.delete permission แทน
const requireAdmin = requirePermission('users', 'delete');

// Backward compatible: ใครเรียก requireManagerAccess จะตรวจ users.view permission แทน
const requireManagerAccess = requirePermission('users', 'view');

module.exports = { authenticate, requirePermission, requireAdmin, requireManagerAccess };