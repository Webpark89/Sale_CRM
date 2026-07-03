const express = require("express");
const router = express.Router();
const { authenticate, requirePermission, requireManagerAccess } = require("../middleware/authMiddleware");

const {
  getUsers,
  createUser,
  updateUserPassword,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  restoreUser,
  updateUserPermissions
} = require("../controllers/mainController");

// ใช้ authenticate เป็นพื้นฐานสำหรับทุกเส้นทาง
router.use(authenticate);

// สำหรับ GET / อนุญาตให้เข้าถึงได้ถ้ามีสิทธิ์ users.view หรือ leads.assign
router.get("/", (req, res, next) => {
  const user = req.user;
  if (user.role_is_system) return next();
  const perms = user.permissions || {};
  if (perms.users?.view || perms.leads?.assign) {
    return next();
  }
  return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงรายชื่อผู้ใช้' });
}, getUsers);

// Route อื่นๆ สำหรับจัดการ User ใช้ requirePermission แบบละเอียด
router.post("/", requirePermission('users', 'create'), createUser);
router.put("/:id/password", requirePermission('users', 'update'), updateUserPassword);
router.put("/:id/role", requirePermission('users', 'update'), updateUserRole);
router.patch("/:id/active", requirePermission('users', 'update'), toggleUserActive);
router.delete("/:id", requirePermission('users', 'delete'), deleteUser);
router.post("/:id/restore", requirePermission('users', 'delete'), restoreUser);
router.put("/:id/permissions", requirePermission('users', 'update'), updateUserPermissions);

module.exports = router;
