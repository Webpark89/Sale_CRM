const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// The main KPIs (slice 0 to 4)
content = content.replace(
  /React\.createElement\('div', \{ style: \{ fontSize: 24, fontWeight: 800, fontFamily: RG\.fontHeading, color: k\.c, lineHeight: 1 \} \}, k\.value\)/,
  "React.createElement('div', { style: { fontSize: String(k.value).length > 12 ? 16 : String(k.value).length > 9 ? 18 : String(k.value).length > 7 ? 20 : 24, fontWeight: 800, fontFamily: RG.fontHeading, color: k.c, lineHeight: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' } }, k.value)"
);

// The stage KPIs (slice 4)
content = content.replace(
  /React\.createElement\('div', \{ style: \{ fontSize: 22, fontWeight: 800, fontFamily: RG\.fontHeading, color: k\.c, lineHeight: 1 \} \}, k\.value\)/,
  "React.createElement('div', { style: { fontSize: String(k.value).length > 12 ? 14 : String(k.value).length > 9 ? 16 : String(k.value).length > 7 ? 18 : 22, fontWeight: 800, fontFamily: RG.fontHeading, color: k.c, lineHeight: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' } }, k.value)"
);

// We should also make sure the container allows textOverflow.
// Let's replace `React.createElement('div', null,` for the wrappers inside both slice blocks to give them minWidth: 0 so text doesn't push the flex container
// Actually it's just a flex child, so adding `overflow: hidden, minWidth: 0` to the wrapper might be needed.
content = content.replace(
  /React\.createElement\('div', null,\s*React\.createElement\('div', \{ style: \{ fontSize: 11, fontFamily: RG\.fontHeading, fontWeight: 600, color: RG\.textMuted, marginBottom: 4 \} \}, k\.label\)/g,
  "React.createElement('div', { style: { overflow: 'hidden', minWidth: 0, paddingRight: 8 } }, React.createElement('div', { style: { fontSize: 11, fontFamily: RG.fontHeading, fontWeight: 600, color: RG.textMuted, marginBottom: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' } }, k.label)"
);

content = content.replace(
  /React\.createElement\('div', null,\s*React\.createElement\('div', \{ style: \{ fontSize: 11, fontFamily: RG\.fontHeading, fontWeight: 600, color: RG\.textMuted, marginBottom: 2 \} \}, k\.label\)/g,
  "React.createElement('div', { style: { overflow: 'hidden', minWidth: 0, paddingRight: 8 } }, React.createElement('div', { style: { fontSize: 11, fontFamily: RG.fontHeading, fontWeight: 600, color: RG.textMuted, marginBottom: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' } }, k.label)"
);


fs.writeFileSync(file, content);
console.log('Dashboard.jsx text size and overflow patched');
