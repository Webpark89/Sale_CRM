require("dotenv").config();
const db = require("./config/db");
const Lead = require("./models/Lead");
const Followup = require("./models/Followup");

const STATUSES = ["มีตติ้ง", "ฝากโปรไฟล์", "ต้องตามต่อ", "ติดต่อไม่ได้", "ไม่สนใจ", "ปิดการขาย"];

const firstNames = ["สมชาย", "วิชัย", "สมหญิง", "อานนท์", "ณัฐวุฒิ", "ปราณี", "สุชาติ", "นฤมล", "ธนพล", "พงศกร", "กิตติ", "ชัยวัฒน์", "สิริกัญญา", "จิราพร", "อภิชาติ"];
const lastNames = ["ใจดี", "รักเกียรติ", "รุ่งเรือง", "แสงทอง", "สมบูรณ์", "สุขใจ", "พูนสวัสดิ์", "วิริยะ", "เจริญพร", "มั่นคง"];
const domains = ["tech", "corp", "group", "solution", "industry", "global", "trading", "service", "partner"];

const generateRealisticCompany = (index) => {
  const compNames = [
    "บริษัท แอดวานซ์ อินโฟร์ โซลูชั่น จำกัด",
    "บริษัท สยาม โกลบอล เทรดดิ้ง จำกัด",
    "บริษัท ไทย อินดัสทรี แอนด์ พาร์ทเนอร์ส จำกัด",
    "บริษัท เจริญ พร็อพเพอร์ตี้ แมเนจเม้นท์ จำกัด",
    "บริษัท ทรัพย์มั่งคั่ง เอ็นเตอร์ไพรส์ จำกัด",
    "บริษัท เอเชีย เทคโนโลยี เซอร์วิส จำกัด",
    "บริษัท บางกอก โลจิสติกส์ กรุ๊ป จำกัด",
    "บริษัท สุวรรณภูมิ คอนสตรัคชั่น จำกัด",
    "บริษัท บลูสกาย ดิจิทัล มีเดีย จำกัด",
    "บริษัท กรีน เอ็นเนอร์จี เวนเจอร์ส จำกัด",
    "บริษัท สมาร์ท วิชั่น โฮลดิ้งส์ จำกัด",
    "บริษัท นวัตกรรม ล้ำหน้า จำกัด",
    "บริษัท ครีเอทีฟ ดีไซน์ สตูดิโอ จำกัด",
    "บริษัท ธุรกิจ ก้าวไกล จำกัด",
    "บริษัท ดิจิทัล ทรานส์ฟอร์เมชั่น จำกัด"
  ];
  
  const baseName = compNames[index % compNames.length];
  // Add branch to make it look unique if we repeat base names
  const uniqueName = baseName.replace("จำกัด", `(สาขา ${Math.floor(index / compNames.length) + 1}) จำกัด`);

  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  // Guarantee even distribution of statuses
  const status = STATUSES[index % STATUSES.length];
  
  const revenue = Math.floor(Math.random() * 20000000) + 1000000; // 1M - 21M
  const profit = Math.floor(revenue * (0.05 + (Math.random() * 0.2))); // 5% - 25% margin
  
  return {
    name: index < compNames.length ? baseName : uniqueName,
    domain: `${domain}-${index+1}`,
    status: status,
    revenue: revenue,
    profit: profit,
    contactName: `${fName} ${lName}`,
    desc: `สนใจระบบ CRM นำไปใช้กับทีมเซลส์ ${Math.floor(Math.random() * 50) + 5} คน เน้นใช้งาน Dashboard และ Export Report ส่งผู้บริหารทุกสัปดาห์`
  };
};

const seedData = async () => {
  try {
    console.log("🌱 Starting MASSIVE realistic seed workflow...");

    console.log("🧹 Clearing old data...");
    await db.execute("SET FOREIGN_KEY_CHECKS = 0;");
    await db.execute("TRUNCATE TABLE followups;");
    await db.execute("TRUNCATE TABLE leads;");
    await db.execute("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("✅ Old data cleared.");

    // 1. Get all users
    const [users] = await db.execute("SELECT id, username FROM users");
    if (users.length === 0) {
      console.error("❌ No users found in DB. Please create a user first.");
      process.exit(1);
    }

    console.log(`👤 Found ${users.length} user(s). Will seed 20 leads PER USER.`);

    let today = new Date();
    let companyIndex = 0;
    
    // 2. Loop through users and assign 20 leads each
    for (let u of users) {
      console.log(`>> Seeding for user: ${u.username} (ID: ${u.id})...`);
      for (let i = 0; i < 20; i++) {
        const comp = generateRealisticCompany(companyIndex++);
        
        const leadId = await Lead.create({
          owner_id: u.id,
          companyName: comp.name,
          companyNumber: `01055${Math.floor(10000000 + Math.random() * 90000000)}`,
          contactName: comp.contactName,
          contactPhone: `08${Math.floor(Math.random() * 10)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
          contactEmail: `contact@${comp.domain}.co.th`,
          description: comp.desc,
          revenue: comp.revenue,
          registeredCapital: comp.revenue * 2,
          profit: comp.profit
        });

        // Simulate a past follow-up
        let pastDate = new Date(today);
        pastDate.setDate(today.getDate() - (Math.floor(Math.random() * 30) + 5)); // 5-35 days ago

        await Followup.create({
          lead_id: leadId,
          sequence: 1,
          contact_date: pastDate.toISOString().split("T")[0],
          detail: "โทรไปแนะนำตัวบริษัทเบื้องต้น ลูกค้ามีความสนใจ",
          status: "ฝากโปรไฟล์",
          next_followup_date: null
        });

        // Simulate the latest status
        let currentDate = new Date(today);
        currentDate.setDate(today.getDate() - Math.floor(Math.random() * 5)); // 0-4 days ago
        
        let nextDate = null;

        // Spread notifications across overdue, today, and future
        if (["มีตติ้ง", "ต้องตามต่อ"].includes(comp.status)) {
          nextDate = new Date(today);
          const offset = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
          nextDate.setDate(today.getDate() + offset);
        }

        await Followup.create({
          lead_id: leadId,
          sequence: 2,
          contact_date: currentDate.toISOString().split("T")[0],
          detail: `อัปเดตสถานะล่าสุด: ลูกค้าแจ้งว่า ${comp.status}`,
          status: comp.status,
          next_followup_date: nextDate ? nextDate.toISOString().split("T")[0] : null
        });

        // Randomly highlight some leads as starred (about 25%)
        if (Math.random() < 0.25) {
          await Lead.toggleStar(leadId, 0); // Toggle from 0 to 1
        }
      }
    }

    console.log(`✅ Successfully seeded ${companyIndex} leads total!`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
