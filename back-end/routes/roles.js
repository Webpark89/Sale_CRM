// routes/roles.js
const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/authMiddleware');
const { getRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');

router.use(authenticate);

router.get('/',     requirePermission('roles', 'view'),   getRoles);
router.get('/:id',  requirePermission('roles', 'view'),   getRoleById);
router.post('/',    requirePermission('roles', 'create'), createRole);
router.put('/:id',  requirePermission('roles', 'update'), updateRole);
router.delete('/:id', requirePermission('roles', 'delete'), deleteRole);

module.exports = router;
