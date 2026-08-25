const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div style=\{\{ fontSize: 11, fontWeight: 700, color: STAGE_COLORS\[stage\] \|\| RG\.textMuted, marginBottom: 6, textTransform: "uppercase" \}\}>\s*\{stage\}\s*<\/div>\s*/g;

if (regex.test(content)) {
  content = content.replace(regex, "");
  fs.writeFileSync(file, content);
  console.log("Removed stage labels from status filter");
} else {
  console.log("Could not find stage labels");
}
