const fs = require('fs');
const toastPath = 'd:/Sale_CRM/CEM-main-Frontend/src/utils/toast.jsx';
let content = fs.readFileSync(toastPath, 'utf8');

// Replace the title div styling
content = content.replace(
  /fontWeight: 700, fontSize: 14\.5, color: "(#[a-fA-F0-9]+)", marginBottom: description \? 2 : 0/g,
  'fontWeight: 700, fontSize: 14.5, color: "$1", marginBottom: description ? 2 : 0, whiteSpace: "nowrap"'
);

fs.writeFileSync(toastPath, content);
console.log('toast.jsx fixed');
