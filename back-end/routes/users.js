const express = require("express");
const router = express.Router();
const { authenticate, requireManagerAccess } = require("../middleware/authMiddleware");

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

// ทุก Route ในนี้ต้องล็อกอิน และเป็น Manager ขึ้นไป
router.use(authenticate, requireManagerAccess);

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id/password", updateUserPassword);
router.put("/:id/role", updateUserRole);
router.patch("/:id/active", toggleUserActive);
router.delete("/:id", deleteUser);
router.post("/:id/restore", restoreUser);
router.put("/:id/permissions", updateUserPermissions);

module.exports = router;
