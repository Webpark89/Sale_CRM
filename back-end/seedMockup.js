require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "qoraqot_crm",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const STAGE_STATUS_MAP = {
  'Contact': ['ติดต่อไม่ได้', 'Follow', 'นัด Meeting', 'Lost'],
  'Meeting': ['เก็บ Requirement', 'รอข้อมูล', 'นัดเพิ่ม', 'ทำ Proposal'],
  'Proposal': ['ส่ง Proposal', 'แก้ไข', 'ต่อรอง', 'รออนุมัติ'],
  'Approval': ['รองบ', 'เปิด PR', 'รอ PO', 'Hold'],
  'Closed': ['Won', 'Lost'],
};

const PROVINCES = [
  "กรุงเทพมหานคร", "สมุทรปราการ", "นนทบุรี", "ปทุมธานี", "พระนครศรีอยุธยา",
  "เชียงใหม่", "ภูเก็ต", "ชลบุรี", "ระยอง", "นครราชสีมา", "ขอนแก่น", "อุดรธานี", "สงขลา", "สุราษฎร์ธานี"
];

const companyPrefixes = ["บจก. ", "บริษัท ", "หจก. "];
const companyNames = [
  "สยามอินโนเวชั่น", "ไทยเทคโซลูชั่น", "โกลบอลเน็ตเวิร์ก", "ดิจิทัลทรานส์ฟอร์ม", 
  "ฟิวเจอร์วิชั่น", "แอ๊ดวานซ์แมเนจเมนท์", "ซอฟต์แวร์เฮ้าส์ กรุ๊ป", "เทคโนโลยีสแควร์",
  "นวัตกรรมก้าวหน้า", "บิสซิเนส โซลูชั่นส์", "สมาร์ท เอ็นเตอร์ไพรส์", "สตาร์ทอัพ ฮับ",
  "อินฟินิตี้ เทค", "ครีเอทีฟ ดิจิทัล", "อีคอมเมิร์ซ เวิลด์", "เอเชียแปซิฟิก คอร์ป",
  "โปรเฟสชันนัล คอนซัลติ้ง", "กรีนเอนเนอร์ยี่", "ออโตเมชัน พลัส", "อัจฉริยะ โซลูชัน"
];
const companySuffixes = ["", " (ประเทศไทย)", " จำกัด", " อินเตอร์เนชั่นแนล"];

const contactFirstNames = ["สมชาย", "สมศรี", "วิภา", "มานะ", "ปิติ", "ชูใจ", "อนันต์", "สุชาติ", "นารี", "ประเสริฐ", "วิชัย", "กฤษณะ", "ธิดา", "รัตนา", "สมศักดิ์", "ณัฐพล", "สุวิทย์", "พิมพา", "เอกภพ", "อารีย์"];
const contactLastNames = ["สุขขี", "ใจดี", "เจริญรุ่งเรือง", "พัฒนาสุข", "ศรีสวัสดิ์", "จันทร์โอชา", "บุญมี", "ทองคำ", "วิเศษกุล", "ทรัพย์สมบูรณ์", "ประเสริฐสกุล", "วงศ์เทวัญ"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomNumberString(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

async function seed() {
  try {
    console.log("Starting DB Mockup...");
    
    // Fetch user IDs for crm1, crm2, crm3
    const [users] = await pool.execute("SELECT id, username FROM users WHERE username IN ('crm1', 'crm2', 'crm3')");
    if (users.length === 0) {
      console.error("❌ Error: No crm1, crm2, crm3 users found in the database. Please run seed.js first.");
      process.exit(1);
    }
    
    const userIds = users.map(u => u.id);
    console.log(`Found sales users: ${users.map(u => `${u.username} (ID: ${u.id})`).join(", ")}`);

    await pool.execute('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.execute('TRUNCATE TABLE followups;');
    await pool.execute('TRUNCATE TABLE leads;');
    await pool.execute('TRUNCATE TABLE audit_logs;');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log("Cleared old data.");

    const leadCount = 80;
    console.log(`Generating ${leadCount} leads...`);

    const stages = Object.keys(STAGE_STATUS_MAP);

    for (let i = 0; i < leadCount; i++) {
      const ownerId = getRandom(userIds);
      
      const isCompany = Math.random() > 0.15;
      const companyName = isCompany 
        ? `${getRandom(companyPrefixes)}${getRandom(companyNames)}${getRandom(companySuffixes)} ${i + 1}`
        : `${getRandom(contactFirstNames)} ${getRandom(contactLastNames)}`;
      
      const companyNumber = isCompany ? `0${generateRandomNumberString(12)}` : null;
      const contactName = `${getRandom(contactFirstNames)} ${getRandom(contactLastNames)}`;
      
      const prefixPhone = Math.random() > 0.5 ? "08" : "09";
      const contactPhone = `${prefixPhone}${generateRandomNumberString(8)}`;
      
      const emailPrefix = `contact_${i + 1}_${generateRandomNumberString(3)}`;
      const contactEmail = `${emailPrefix}@gmail.com`;

      const revenue = Math.floor(Math.random() * 50) * 200000 + 50000;
      const profit = Math.floor(revenue * (0.05 + Math.random() * 0.25));
      const registeredCapital = Math.floor(Math.random() * 8) * 1000000 + 1000000;

      // Randomly pick a stage and a status from that stage
      const stage = getRandom(stages);
      const latestStatus = getRandom(STAGE_STATUS_MAP[stage]);

      const now = new Date();
      const createdDaysAgo = Math.floor(Math.random() * 90) + 10; // 10 to 100 days ago
      const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);

       const isStarred = Math.random() > 0.85 ? 1 : 0;
      const dealValue = Math.floor(Math.random() * 50) * 100000 + 50000;
      
      const [result] = await pool.execute(
        `INSERT INTO leads 
        (owner_id, created_by, is_acknowledged, company_name, company_number, stage, contact_name, contact_phone, contact_email, province, description, revenue, profit, registered_capital, deal_value, is_starred, created_at, updated_at) 
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ownerId, ownerId, companyName, companyNumber, stage, contactName, contactPhone, contactEmail, getRandom(PROVINCES), 
          `ลูกค้าสนใจระบบการจัดการข้อมูลและการขาย ติดตามจาก Event ประจำปี`, revenue, profit, registeredCapital, dealValue, isStarred, createdAt, updatedAt
        ]
      );
      
      const leadId = result.insertId;

      // Generate sequence of followups up to current stage
      const followupsToCreate = [];
      let currentSeq = 1;
      let lastDate = new Date(createdAt);

      const realPdfs = [
        "1783390575672-671809647.pdf",
        "1783390698540-505335970.pdf",
        "1786938351126-454202924.pdf"
      ];

      const addFollowup = (fStatus, isLast = false) => {
        const fDate = new Date(lastDate.getTime() + (Math.random() * 3 + 1) * 24 * 60 * 60 * 1000);
        lastDate = fDate;
        
        // Unconditionally set next followup date for all rows
        const nextDate = new Date(fDate.getTime() + (Math.random() * 10 + 3) * 24 * 60 * 60 * 1000);
        
        let isCompleted = 1; // Prior ones are completed
        if (isLast) {
          isCompleted = (fStatus === 'Won' || fStatus === 'Lost' || fStatus === 'ติดต่อไม่ได้') ? 1 : 0;
        }

        // Randomly attach a PDF file (e.g. 35% chance)
        const pdfFile = Math.random() > 0.65 ? getRandom(realPdfs) : null;

        followupsToCreate.push({
          lead_id: leadId,
          sequence: currentSeq++,
          contact_date: fDate,
          status: fStatus,
          detail: `บันทึกสถานะ [${fStatus}]: ติดตามความคืบหน้าของดีล พูดคุยรายละเอียดข้อตกลงและเงื่อนไขต่างๆ`,
          next_followup_date: nextDate,
          completed: isCompleted,
          pdf_file: pdfFile,
          created_at: fDate
        });
      };

      // Create sequence of followups based on stage
      if (stage === 'Contact') {
        addFollowup(latestStatus, true);
      } else if (stage === 'Meeting') {
        addFollowup('นัด Meeting');
        addFollowup(latestStatus, true);
      } else if (stage === 'Proposal') {
        addFollowup('นัด Meeting');
        addFollowup('เก็บ Requirement');
        addFollowup(latestStatus, true);
      } else if (stage === 'Approval') {
        addFollowup('นัด Meeting');
        addFollowup('เก็บ Requirement');
        addFollowup('ส่ง Proposal');
        addFollowup(latestStatus, true);
      } else if (stage === 'Closed') {
        addFollowup('นัด Meeting');
        addFollowup('เก็บ Requirement');
        addFollowup('ส่ง Proposal');
        addFollowup('รอ PO');
        addFollowup(latestStatus, true);
      }

      for (const f of followupsToCreate) {
        await pool.execute(
          `INSERT INTO followups (lead_id, sequence, contact_date, status, detail, next_followup_date, completed, pdf_file, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
           [f.lead_id, f.sequence, f.contact_date, f.status, f.detail, f.next_followup_date, f.completed, f.pdf_file, f.created_at]
        );
      }
    }

    console.log("Mockup generation completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

seed();
