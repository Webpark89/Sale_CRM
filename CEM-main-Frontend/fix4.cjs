const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/UserManagement.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const handleEditUser = async () => {\n    try {\n      if (editRoleId && editRoleId !== showEditUser.role_id) {',
  'const handleEditUser = async () => {\n    if (!editRoleId) return notify.error("กรุณาเลือก Role (บทบาท) ให้กับผู้ใช้งาน");\n    try {\n      if (editRoleId && editRoleId !== showEditUser.role_id) {'
);
fs.writeFileSync(file, content);
console.log('Fixed UserManagement');
