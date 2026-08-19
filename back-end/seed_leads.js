const pool = require('./config/db');

const STAGES = {
  'Contact': ['ติดต่อไม่ได้', 'Follow', 'นัด Meeting', 'Lost'],
  'Meeting': ['เก็บ Requirement', 'รอข้อมูล', 'นัดเพิ่ม', 'ทำ Proposal'],
  'Proposal': ['ส่ง Proposal', 'แก้ไข', 'ต่อรอง', 'รออนุมัติ'],
  'Approval': ['รองบ', 'เปิด PR', 'รอ PO', 'Hold'],
  'Closed': ['Won', 'Lost']
};

const PROVINCES = ["กรุงเทพมหานคร", "เชียงใหม่", "ชลบุรี", "ภูเก็ต", "ขอนแก่น", "นครราชสีมา", "ระยอง"];
const COMPANIES = ["Tech Flow", "Global Supply", "Smart Solution", "Eco Build", "Future Retail", "NextGen Media"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

async function seed() {
  try {
    const stageKeys = Object.keys(STAGES);
    
    // Get users crm1, crm2, crm3
    const [users] = await pool.query("SELECT id FROM users WHERE username IN ('crm1', 'crm2', 'crm3')");
    const userIds = users.map(u => u.id);
    
    for (let i = 1; i <= 30; i++) {
      const stage = rand(stageKeys);
      const status = rand(STAGES[stage]);
      
      const compName = `${rand(COMPANIES)} ${i} Co., Ltd.`;
      const compNum = `010556${randInt(1000000, 9999999)}`;
      const rev = randInt(100000, 5000000);
      const cap = randInt(500000, 10000000);
      const prof = randInt(50000, 1000000);
      const prov = rand(PROVINCES);
      const ownerId = userIds.length > 0 ? rand(userIds) : 1;
      
      const lastContact = randDate(new Date(2026, 0, 1), new Date(2026, 7, 10));
      const nextDate = randDate(new Date(2026, 7, 11), new Date(2026, 8, 30));

      const queryLead = `
        INSERT INTO leads 
        (company_name, company_number, stage, contact_name, contact_phone, province, revenue, registered_capital, profit, owner_id, created_by, is_acknowledged)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;
      
      const [leadResult] = await pool.query(queryLead, [
        compName, compNum, stage, `Customer ${i}`, `08${randInt(10000000, 99999999)}`, prov, rev, cap, prof, ownerId, ownerId
      ]);
      
      const leadId = leadResult.insertId;
      
      const queryFollowup = `
        INSERT INTO followups
        (lead_id, sequence, contact_date, status, detail, next_followup_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await pool.query(queryFollowup, [
        leadId, 1, lastContact, status, `Initial mockup followup for stage ${stage}`, nextDate
      ]);
    }
    
    console.log("✅ Seeded 30 leads with followups successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
