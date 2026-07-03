// controllers/roleController.js
// ==========================================
// Controller สำหรับจัดการ Role (CRUD)
// ==========================================
const Role = require('../models/Role');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/roles — ดึงรายการ Role ทั้งหมด
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll();
  res.json(roles);
});

// GET /api/roles/:id — ดึง Role เดียว
const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: 'ไม่พบ Role นี้' });
  res.json(role);
});

// POST /api/roles — สร้าง Role ใหม่
const createRole = asyncHandler(async (req, res) => {
  const { name, display_name, permissions } = req.body;
  if (!name || !display_name) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ Role และชื่อแสดง' });
  }

  const existing = await Role.findByName(name);
  if (existing) return res.status(409).json({ error: 'ชื่อรหัส Role นี้มีอยู่ในระบบแล้ว' });

  const existingDisplay = await Role.findByDisplayName(display_name);
  if (existingDisplay) return res.status(409).json({ error: 'ชื่อ Role นี้มีอยู่ในระบบแล้ว' });

  const insertId = await Role.create({ name, display_name, permissions: permissions || {} });
  const newRole = await Role.findById(insertId);
  res.status(201).json(newRole);
});

// PUT /api/roles/:id — แก้ไข Role
const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, display_name, permissions } = req.body;

  const role = await Role.findById(id);
  if (!role) return res.status(404).json({ error: 'ไม่พบ Role นี้' });

  // ตรวจชื่อซ้ำกับ Role อื่น
  if (name && name !== role.name) {
    const existing = await Role.findByName(name);
    if (existing && existing.id !== parseInt(id)) {
      return res.status(409).json({ error: 'ชื่อรหัส Role นี้มีอยู่ในระบบแล้ว' });
    }
  }

  if (display_name && display_name !== role.display_name) {
    const existingDisplay = await Role.findByDisplayName(display_name);
    if (existingDisplay && existingDisplay.id !== parseInt(id)) {
      return res.status(409).json({ error: 'ชื่อ Role นี้มีอยู่ในระบบแล้ว' });
    }
  }

  await Role.update(id, {
    name: name || role.name,
    display_name: display_name || role.display_name,
    permissions: permissions !== undefined ? permissions : role.permissions
  });

  const updated = await Role.findById(id);
  res.json(updated);
});

// DELETE /api/roles/:id — ลบ Role
const deleteRole = asyncHandler(async (req, res) => {
  try {
    await Role.delete(req.params.id);
    res.json({ message: 'ลบ Role สำเร็จ' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole };
