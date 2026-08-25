const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Modal title="ตัวกรองขั้นสูง \(Advanced Filters\)" onClose=\{onClose\} width=\{840\}>/,
  '<Modal title="ตัวกรองขั้นสูง (Advanced Filters)" onClose={onClose} width={920}>'
);

fs.writeFileSync(file, content);
console.log('FilterModal.jsx width updated');
