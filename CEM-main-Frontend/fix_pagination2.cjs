const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const bad = `<div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: \`1px solid \${RG.border}\`, background: RG.surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>`;
const good = `<div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: \`1px solid \${RG.border}\`, background: RG.surface }}>
                <div style={{ fontSize: 13, color: RG.textMuted }}>
                  แสดง {paginatedFollowups.length} รายการ จากทั้งหมด {filteredFollowups.length} รายการ
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>`;

fs.writeFileSync(file, content.replace(bad, good));
console.log("Added back the summary on the left");
