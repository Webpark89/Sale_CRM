const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/AddLeadPage.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Remove buttons from header
const headerButtonsRegex = /\s*<div style=\{\{ display: "flex", gap: 12 \}\}>\s*<Btn variant="Third" onClick=\{.*?\}\s*>ยกเลิก<\/Btn>\s*<Btn onClick=\{handleSave\} disabled=\{!!taxIdError\}>บันทึกข้อมูลลีด<\/Btn>\s*<\/div>/;
content = content.replace(headerButtonsRegex, '');

// 2. Add sticky footer before the last closing divs
const stickyFooter = `
      {/* Sticky Footer for Buttons */}
      <div style={{
        position: "sticky",
        bottom: 20,
        background: RG.surface,
        padding: "20px 32px",
        borderRadius: "16px",
        border: \`1px solid \${RG.border}\`,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        marginTop: 40,
        display: "flex",
        justifyContent: "flex-end",
        gap: 16,
        zIndex: 100
      }}>
        <Btn variant="Third" onClick={() => navigate(-1)} style={{ minWidth: 120 }}>ยกเลิก</Btn>
        <Btn onClick={handleSave} disabled={!!taxIdError} style={{ minWidth: 160 }}>บันทึกข้อมูลลีด</Btn>
      </div>

    </div>
  );
}`;

content = content.replace(/\s*<\/div>\s*<\/div>\s*\);\s*\}/, stickyFooter);

fs.writeFileSync(appPath, content);
console.log('AddLeadPage fixed');
