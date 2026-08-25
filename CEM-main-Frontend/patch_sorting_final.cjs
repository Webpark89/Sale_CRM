const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const regex = /if \(sortConfig\.key\) \{\r?\n\s*let aVal = a\[sortConfig\.key\];\r?\n\s*let bVal = b\[sortConfig\.key\];\r?\n\s*if \(sortConfig\.key === "latestStatus"\) \{/;

const replacement = `if (sortConfig.key) {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === "stage") {
          const STAGE_ORDER = { "Contact": 1, "Meeting": 2, "Proposal": 3, "Approval": 4, "Closed": 5 };
          aVal = STAGE_ORDER[aVal] ?? 99;
          bVal = STAGE_ORDER[bVal] ?? 99;
        } else if (sortConfig.key === "latestStatus") {`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  content = content.replace(
    /\} else if \(\["revenue", "registeredCapital", "profit"\]\.includes\(sortConfig\.key\)\) \{/,
    '} else if (["revenue", "registeredCapital", "profit", "dealValue"].includes(sortConfig.key)) {'
  );
  fs.writeFileSync(appPath, content);
  console.log('App.jsx sorting patched successfully');
} else {
  console.log('Could not match regex');
}
