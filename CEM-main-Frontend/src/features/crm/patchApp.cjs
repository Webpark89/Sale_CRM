const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', 'utf8');

const oldStr = `  // 1. คัดกรองข้อมูลตามสิทธิ์ (Admin เห็นทั้งหมด, Sales เห็นเฉพาะที่ตัวเองเป็น owner)
  const accessibleLeads = currentUser?.role === "admin" 
    ? leads 
    : leads.filter(l => l.owner === currentUser?.username);

  const filtered = accessibleLeads`;

const newStr = `  // 1. คัดกรองข้อมูล (Backend ดึงมาเฉพาะของ user อยู่แล้ว)
  const filtered = leads`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', code);
console.log('App.jsx updated');
