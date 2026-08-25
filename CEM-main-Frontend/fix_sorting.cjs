const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update numeric fields in sort function
content = content.replace(
  /else if \(\["revenue", "registeredCapital", "profit"\]\.includes\(sortConfig\.key\)\)/,
  'else if (["revenue", "registeredCapital", "profit", "dealValue"].includes(sortConfig.key))'
);

// Update handleSort to reset page to 1
content = content.replace(
  /setSortConfig\(\{ key, direction \}\);/,
  'setSortConfig({ key, direction });\n      setCurrentPage(1);'
);

fs.writeFileSync(file, content);
console.log('App.jsx sorting patched');
