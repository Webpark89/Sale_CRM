const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update handleClear in FilterModal
content = content.replace(
  /setLocalFin\(\{\r?\n\s*revenue: \{ min: "", max: "" \},\r?\n\s*registeredCapital: \{ min: "", max: "" \},\r?\n\s*profit: \{ min: "", max: "" \}\r?\n\s*\}\);/,
  `setLocalFin({
      revenue: { min: "", max: "" },
      registeredCapital: { min: "", max: "" },
      profit: { min: "", max: "" },
      dealValue: { min: "", max: "" }
    });`
);

// 2. Add dealValue to the UI section
const searchMarker = `<div style={{ display: "flex", alignItems: "center", gap: 8 }}>\r?\n\\s*<div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>รายได้รวม:</div>`;
// Note: because of Windows line endings we search carefully
const uiMatch = content.match(/<div style=\{\{\s*display:\s*"flex",\s*alignItems:\s*"center",\s*gap:\s*8\s*\}\}>\s*<div style=\{\{\s*width:\s*95,\s*fontSize:\s*12,\s*color:\s*RG\.textMuted,\s*flexShrink:\s*0\s*\}\}>รายได้รวม:<\/div>/);

if (uiMatch) {
  const newUiStr = `<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>มูลค่าโครงการ:</div>
                  <input 
                    type="text" 
                    placeholder="ขั้นต่ำ" 
                    value={formatNumberWithCommas(localFin.dealValue?.min || "")} 
                    onChange={e => handleFinChange("dealValue", "min", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                  <span style={{ color: RG.textMuted }}>-</span>
                  <input 
                    type="text" 
                    placeholder="สูงสุด" 
                    value={formatNumberWithCommas(localFin.dealValue?.max || "")} 
                    onChange={e => handleFinChange("dealValue", "max", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                </div>

                ` + uiMatch[0];
  content = content.replace(uiMatch[0], newUiStr);
  console.log('UI matched and replaced');
} else {
  console.log('UI not matched');
}

fs.writeFileSync(file, content);
console.log('FilterModal.jsx patched');
