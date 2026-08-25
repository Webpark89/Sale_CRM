const fs = require('fs');
const headerPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/leads/LeadsHeader.jsx';
let content = fs.readFileSync(headerPath, 'utf8');

content = content.replace(
  /<button onClick=\{\(\) => setShowAddLead\(true\)\} /g,
  '<button onClick={() => navigate("/leads/create")} '
);

fs.writeFileSync(headerPath, content);
console.log('LeadsHeader.jsx updated');
