const fs = require('fs');

let f1 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  /display: "inline-block",\s*background: `\${statusColor}18`,\s*color: statusColor,\s*border: `1px solid \${statusColor}44`,\s*padding: "3px 10px",\s*borderRadius: 12,\s*fontSize: 11,\s*fontWeight: 700,\s*textTransform: "uppercase"/g,
  `display: "inline-flex", background: RG.surface, color: RG.text, border: \`1px solid \${RG.border}\`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600`
);
fs.writeFileSync(f1, c1);
console.log('FollowupHistoryPage fixed');

let f2 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/LeadDetailPage.jsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  /display: "inline-flex", background: RG.surface, color: RG.text, border: `1px solid \${RG.border}`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600/g,
  `display: "inline-flex", background: RG.surface, color: RG.text, border: \`1px solid \${RG.border}\`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600`
);
fs.writeFileSync(f2, c2);
console.log('LeadDetailPage OK');

let f3 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  /border: `1px solid \${isActive \? sColor : RG.border}`/g,
  `border: \`1px solid \${isActive ? RG.border : RG.border}\``
).replace(
  /background: isActive \? `\${sColor}18` : RG.surface/g,
  `background: isActive ? "#F1F5F9" : RG.surface`
).replace(
  /color: isActive \? sColor : RG.textMuted/g,
  `color: isActive ? RG.text : RG.textMuted`
);
fs.writeFileSync(f3, c3);
console.log('FilterModal fixed');

