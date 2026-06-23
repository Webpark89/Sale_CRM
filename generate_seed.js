const fs = require('fs');

const thFirstNames = ['สมชาย', 'วิภาวรรณ', 'เอกราช', 'ณัฐวุฒิ', 'สุชาดา', 'พรทิพย์', 'ธนพล', 'กิตติศักดิ์', 'นภัสสร', 'วรวิทย์', 'สุรศักดิ์', 'อารยา', 'ศิริพร', 'ชัยวัฒน์', 'พิมพ์ชนก', 'กฤษดา', 'ชลธิชา', 'ธีรยุทธ', 'รัตนา', 'วิศรุต'];
const thLastNames = ['ใจดี', 'ประเสริฐกุล', 'พิทักษ์ธรรม', 'วิวัฒน์วงษ์', 'ศรีสุข', 'เจริญทรัพย์', 'มั่นคง', 'ทรัพย์ทวี', 'แสงทอง', 'วรปัญญา', 'ชัยชนะ', 'งามเลิศ', 'สุวรรณโชติ', 'มงคลทรัพย์', 'ทองแท้', 'พงศ์พันธ์', 'จันทร์กระจ่าง', 'รักชาติ', 'สมบูรณ์', 'เลิศวิลัย'];
const compPrefix = ['บริษัท', 'ห้างหุ้นส่วนจำกัด'];
const compWords = ['โซลูชั่น', 'โกลบอล', 'เทคโนโลยี', 'เอ็นจิเนียริ่ง', 'การค้า', 'พัฒนา', 'อุตสาหกรรม', 'เอ็นเตอร์ไพรส์', 'คอนซัลติ้ง', 'ซอฟต์แวร์', 'โลจิสติกส์', 'ดีไซน์', 'อินเตอร์เนชั่นแนล', 'อิมปอร์ต', 'เอ็กซ์ปอร์ต'];
const statusList = ['ฝากโปรไฟล์', 'ต้องตามต่อ', 'มีตติ้ง', 'ปิดการขาย', 'ติดต่อไม่ได้', 'ไม่สนใจ'];

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let sql = '-- 1. ลบข้อมูลเก่าทั้งหมด และรีเซ็ต AUTO_INCREMENT\n';
sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
sql += 'TRUNCATE TABLE followups;\n';
sql += 'TRUNCATE TABLE leads;\n';
sql += 'TRUNCATE TABLE users;\n';
sql += 'SET FOREIGN_KEY_CHECKS = 1;\n\n';

sql += '-- 2. เพิ่ม User (รหัสผ่านคือ 123456)\n';
sql += 'INSERT INTO users (id, username, password, role) VALUES\n';
sql += "(1, 'admin', '$2b$10$tP7MlxPyBNV/I7Qgu7cb.eNVIs6LsUZHp5WzKa7rnqQUvVLJ0bQcK', 'admin'),\n";
sql += "(2, 'crm1', '$2b$10$tP7MlxPyBNV/I7Qgu7cb.eNVIs6LsUZHp5WzKa7rnqQUvVLJ0bQcK', 'sales'),\n";
sql += "(3, 'crm2', '$2b$10$tP7MlxPyBNV/I7Qgu7cb.eNVIs6LsUZHp5WzKa7rnqQUvVLJ0bQcK', 'sales');\n\n";

sql += '-- 3. เพิ่ม Leads (15 Rows per User)\n';
sql += 'INSERT INTO leads (owner_id, company_name, company_number, contact_name, contact_phone, contact_email, description, revenue, registered_capital, profit, is_starred, created_at) VALUES\n';

let leadsData = [];
let followupsData = [];
let leadId = 1;

for (let userId = 1; userId <= 3; userId++) {
  for (let i = 0; i < 15; i++) {
    const fn = r(thFirstNames);
    const ln = r(thLastNames);
    const cn = `${r(compPrefix)} ${r(thFirstNames)} ${r(compWords)} จำกัด`;
    const cNum = '01055' + rNum(10000000, 99999999);
    const phone = '08' + rNum(10000000, 99999999);
    const email = `${fn.substring(0,4)}_${rNum(1,99)}@example.com`;
    const desc = 'ลูกค้าติดต่อมาจากเว็บไซต์ สนใจบริการ';
    const rev = rNum(1, 50) * 1000000;
    const cap = rNum(1, 10) * 1000000;
    const prof = rev * 0.2;
    const star = Math.random() > 0.8 ? 1 : 0;
    const createdAt = `2026-06-${rNum(1, 20).toString().padStart(2, '0')} 10:00:00`;
    
    leadsData.push(`(${userId}, '${cn}', '${cNum}', '${fn} ${ln}', '${phone}', '${email}', '${desc}', ${rev}, ${cap}, ${prof}, ${star}, '${createdAt}')`);

    // Add 1 or 2 followups
    const fupCount = rNum(1, 2);
    for(let f=1; f<=fupCount; f++) {
       const stat = r(statusList);
       const date = `2026-06-${rNum(10, 23).toString().padStart(2, '0')}`;
       const nextDate = stat === 'ต้องตามต่อ' || stat === 'มีตติ้ง' ? `2026-06-${rNum(24, 30).toString().padStart(2, '0')}` : 'NULL';
       followupsData.push(`(${leadId}, ${f}, '${date}', 'ติดตามครั้งที่ ${f} โทรไปสอบถาม', '${stat}', ${nextDate === 'NULL' ? 'NULL' : "'"+nextDate+"'"}, ${stat === 'ปิดการขาย' ? 1 : 0}, '${createdAt}')`);
    }
    leadId++;
  }
}

sql += leadsData.join(',\n') + ';\n\n';

sql += '-- 4. เพิ่ม Followups\n';
sql += 'INSERT INTO followups (lead_id, sequence, contact_date, detail, status, next_followup_date, completed, created_at) VALUES\n';
sql += followupsData.join(',\n') + ';\n';

fs.writeFileSync('D:/WebPark/Sale_CRM/seed_realistic.sql', sql);
console.log('SQL Generated: D:/WebPark/Sale_CRM/seed_realistic.sql');
