const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/leads/LeadsHeader.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /<optgroup label="เฉพาะหน้าปัจจุบัน \(Current View\)">[\s\S]*?<\/optgroup>/;
const newStr1 = `<optgroup label="เฉพาะหน้าปัจจุบัน (Current View)"><option value="current_csv">Excel / CSV</option></optgroup>`;

const regex2 = /<optgroup label="ทั้งหมด \(All Report\)">[\s\S]*?<\/optgroup>/;
const newStr2 = `<optgroup label="ทั้งหมด (All Report)"><option value="all_csv">Excel / CSV</option></optgroup>`;

content = content.replace(regex1, newStr1).replace(regex2, newStr2);
fs.writeFileSync(file, content);
console.log('LeadsHeader patched');
