const fs = require('fs');

// 1. UserManagement.jsx - add role validation
let file1 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/UserManagement.jsx';
let c1 = fs.readFileSync(file1, 'utf8');

if (!c1.includes('กรุณาเลือก Role (บทบาท) ให้กับผู้ใช้งาน')) {
  c1 = c1.replace(
    /const handleEditUser = async \(\) => {[\s\S]*?try {/,
    `const handleEditUser = async () => {\n    if (!editRoleId) return notify.error("กรุณาเลือก Role (บทบาท) ให้กับผู้ใช้งาน");\n    try {`
  );
  fs.writeFileSync(file1, c1);
  console.log('Patched UserManagement.jsx');
}

// 2. FollowupHistoryPage.jsx - static width badges
let file2 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx';
let c2 = fs.readFileSync(file2, 'utf8');

c2 = c2.replace(
  /display: "inline-block",[\s\n]*background: `\$\{stageColor\}18`,[\s\n]*color: stageColor,[\s\n]*border: `1px solid \$\{stageColor\}44`,[\s\n]*padding: "2px 10px",[\s\n]*borderRadius: 12,[\s\n]*fontSize: 12,[\s\n]*fontWeight: 700/g,
  `display: "inline-flex", justifyContent: "center", alignItems: "center", width: 90, background: \`\${stageColor}18\`, color: stageColor, border: \`1px solid \${stageColor}44\`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700`
).replace(
  /display: "inline-flex", background: RG.surface, color: RG.text, border: `1px solid \$\{RG.border\}`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600/g,
  `display: "inline-flex", justifyContent: "center", alignItems: "center", width: 110, background: RG.surface, color: RG.text, border: \`1px solid \${RG.border}\`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600`
);
fs.writeFileSync(file2, c2);
console.log('Patched FollowupHistoryPage.jsx');

// 3. LeadDetailPage.jsx - static width badges
let file3 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/LeadDetailPage.jsx';
let c3 = fs.readFileSync(file3, 'utf8');

c3 = c3.replace(
  /display: "inline-flex", alignItems: "center", gap: 6, color: stageColor, fontSize: 13, fontWeight: 600/g,
  `display: "inline-flex", justifyContent: "center", alignItems: "center", width: 90, background: \`\${stageColor}15\`, color: stageColor, border: \`1px solid \${stageColor}44\`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700`
).replace(
  /<span style={{ width: 6, height: 6, borderRadius: "50%", background: stageColor }}><\/span>/g,
  `` // Remove the bullet point so it looks like the FollowupHistoryPage pill badge
).replace(
  /display: "inline-flex", background: RG.surface, color: RG.text, border: `1px solid \$\{RG.border\}`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600/g,
  `display: "inline-flex", justifyContent: "center", alignItems: "center", width: 110, background: RG.surface, color: RG.text, border: \`1px solid \${RG.border}\`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600`
);
fs.writeFileSync(file3, c3);
console.log('Patched LeadDetailPage.jsx');
