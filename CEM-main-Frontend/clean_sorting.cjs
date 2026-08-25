const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /setSortConfig\(\{ key, direction \}\);\r?\n\s*setCurrentPage\(1\);\r?\n\s*setCurrentPage\(1\);/,
  'setSortConfig({ key, direction });\n    setCurrentPage(1);'
);

fs.writeFileSync(file, content);
console.log('App.jsx cleaned up');
