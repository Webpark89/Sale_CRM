const fs = require('fs');

// Patch AddLeadModal.jsx
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/AddLeadModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleSave = \(\) => \{\r?\n\s*if \(!form\.contactPhone \|\| !form\.contactPhone\.trim\(\)\) \{/;
const newStr = `const handleSave = () => {
    if (!form.province || !form.province.trim()) {
      notify.error("กรุณาเลือกจังหวัด");
      return;
    }
    if (!form.contactPhone || !form.contactPhone.trim()) {`;

if (regex.test(content)) {
  content = content.replace(regex, newStr);
  fs.writeFileSync(file, content);
  console.log('AddLeadModal.jsx patched');
} else {
  console.log('Regex not matched in AddLeadModal');
}

// Patch CompanyModal.jsx
let file2 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/CompanyModal.jsx';
let content2 = fs.readFileSync(file2, 'utf8');

const regex2 = /const handleSaveInfo = async \(\) => \{\r?\n\s*if \(!form\.contactPhone \|\| !form\.contactPhone\.trim\(\)\) \{/;
const newStr2 = `const handleSaveInfo = async () => {
    if (!form.province || !form.province.trim()) {
      notify.error("กรุณาเลือกจังหวัด");
      return;
    }
    if (!form.contactPhone || !form.contactPhone.trim()) {`;

if (regex2.test(content2)) {
  content2 = content2.replace(regex2, newStr2);
  fs.writeFileSync(file2, content2);
  console.log('CompanyModal.jsx patched');
} else {
  console.log('Regex not matched in CompanyModal');
}
