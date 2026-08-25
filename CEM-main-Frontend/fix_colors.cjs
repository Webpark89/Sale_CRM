const fs = require('fs');

const files = [
  'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/LeadDetailPage.jsx',
  'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx',
  'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Remove statusColor usage from LeadDetailPage & FollowupHistoryPage
  content = content.replace(
    /<div style={{[\s\S]*?background: `\${statusColor}15`[\s\S]*?}}>/g,
    `<div style={{ display: "inline-flex", background: RG.surface, color: RG.text, border: \`1px solid \${RG.border}\`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>`
  );
  
  // FollowupHistoryPage might have the old string
  content = content.replace(
    /background: `\${statusColor}18`/g,
    `background: RG.surface`
  ).replace(
    /color: statusColor,/g,
    `color: RG.text,`
  ).replace(
    /border: `1px solid \${statusColor}44`/g,
    `border: \`1px solid \${RG.border}\``
  );

  // FilterModal
  if (file.includes('FilterModal.jsx')) {
    content = content.replace(
      /border: `1px solid \${isActive \? sColor : RG\.border}`/g,
      `border: \`1px solid \${isActive ? RG.primary : RG.border}\``
    ).replace(
      /background: isActive \? `\${sColor}18` : RG\.surface/g,
      `background: isActive ? \`\${RG.primary}15\` : RG.surface`
    ).replace(
      /color: isActive \? sColor : RG\.textMuted/g,
      `color: isActive ? RG.primary : RG.textMuted`
    );
  }

  fs.writeFileSync(file, content);
}

console.log('Fixed tables and filters');
