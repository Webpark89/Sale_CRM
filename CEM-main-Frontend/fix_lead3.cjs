const fs = require('fs');

let file2 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/CompanyModal.jsx';
let content2 = fs.readFileSync(file2, 'utf8');

const regex2 = /const handleSaveInfo = async \(\) => \{\r?\n\s*if \(taxIdError\)/;
const newStr2 = `const handleSaveInfo = async () => {
    if (!form.contactPhone || !form.contactPhone.trim()) {
      notify.error("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    if (form.contactName && /[^a-zA-Zก-๙0-9\\s]/.test(form.contactName)) {
      notify.error("ชื่อผู้ติดต่อห้ามมีตัวอักษรพิเศษ");
      return;
    }
    if (taxIdError)`;

if(regex2.test(content2)) {
  content2 = content2.replace(regex2, newStr2);
  fs.writeFileSync(file2, content2);
  console.log('CompanyModal patched');
} else {
  console.log('Regex not matched CompanyModal');
}
