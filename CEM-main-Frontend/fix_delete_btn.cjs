const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/LeadsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /handleExport, setShowAddLead, deleteSelected,/,
  'handleExport, setShowAddLead, setShowDeleteConfirm,'
);

content = content.replace(
  /<button onClick=\{\(\) => deleteSelected\(\)\} className="btn-delete"/,
  '<button onClick={() => setShowDeleteConfirm(true)} className="btn-delete"'
);

fs.writeFileSync(file, content);
console.log('LeadsPage patched');
