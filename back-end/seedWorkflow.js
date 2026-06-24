require("dotenv").config();
const db = require("./config/db");
const Lead = require("./models/Lead");
const Followup = require("./models/Followup");

const seedData = async () => {
  try {
    console.log("🌱 Starting realistic seed workflow...");

    console.log("🧹 Clearing old data...");
    await db.execute("SET FOREIGN_KEY_CHECKS = 0;");
    await db.execute("TRUNCATE TABLE followups;");
    await db.execute("TRUNCATE TABLE leads;");
    await db.execute("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("✅ Old data cleared.");

    // 1. Get an owner_id (first user in DB)
    const [users] = await db.execute("SELECT id FROM users LIMIT 1");
    if (users.length === 0) {
      console.error("❌ No users found in DB. Please create a user first.");
      process.exit(1);
    }
    const ownerId = users[0].id;
    console.log(`👤 Using User ID: ${ownerId} as the owner of these leads.`);

    // 2. Generate 15 Realistic Companies
    const companies = [
      { name: "บมจ. แอดวานซ์ อินโฟร์ เซอร์วิส", domain: "ais", status: "ปิดการขาย", revenue: 8000000, profit: 1200000 },
      { name: "บริษัท ปตท. จำกัด (มหาชน)", domain: "ptt", status: "มีตติ้ง", revenue: 12000000, profit: 2500000 },
      { name: "บริษัท ซีพี ออลล์ จำกัด (มหาชน)", domain: "cpall", status: "ปิดการขาย", revenue: 5000000, profit: 500000 },
      { name: "บริษัท เซ็นทรัลพัฒนา จำกัด", domain: "central", status: "ต้องตามต่อ", revenue: 6000000, profit: 1200000 },
      { name: "บริษัท พลังงานบริสุทธิ์ จำกัด", domain: "ea", status: "มีตติ้ง", revenue: 1500000, profit: 200000 },
      { name: "บริษัท โฮม โปรดักส์ เซ็นเตอร์", domain: "homepro", status: "ติดต่อไม่ได้", revenue: 3000000, profit: 600000 },
      { name: "บริษัท บีทีเอส กรุ๊ป", domain: "bts", status: "ต้องตามต่อ", revenue: 4500000, profit: 800000 },
      { name: "บริษัท แสนสิริ จำกัด", domain: "sansiri", status: "ปิดการขาย", revenue: 9000000, profit: 1500000 },
      { name: "บริษัท เมเจอร์ ซีนีเพล็กซ์", domain: "major", status: "ฝากโปรไฟล์", revenue: 500000, profit: 50000 },
      { name: "บริษัท ทรู คอร์ปอเรชั่น", domain: "true", status: "มีตติ้ง", revenue: 11000000, profit: 2000000 },
      { name: "บริษัท ไมเนอร์ อินเตอร์เนชั่นแนล", domain: "minor", status: "ฝากโปรไฟล์", revenue: 800000, profit: 100000 },
      { name: "บริษัท ท่าอากาศยานไทย จำกัด", domain: "aot", status: "ปิดการขาย", revenue: 20000000, profit: 4000000 },
      { name: "บริษัท ดับบลิวเอชเอ คอร์ปอเรชั่น", domain: "wha", status: "ไม่สนใจ", revenue: 2500000, profit: 300000 },
      { name: "บริษัท ปูนซิเมนต์ไทย จำกัด", domain: "scg", status: "ต้องตามต่อ", revenue: 7500000, profit: 900000 },
      { name: "บริษัท กรุงเทพดุสิตเวชการ", domain: "bdms", status: "มีตติ้ง", revenue: 4000000, profit: 600000 }
    ];

    let today = new Date();
    
    // 3. Create Leads and their Follow-ups
    for (let i = 0; i < companies.length; i++) {
      const comp = companies[i];
      
      const leadId = await Lead.create({
        owner_id: ownerId,
        companyName: comp.name,
        companyNumber: `01075${Math.floor(10000000 + Math.random() * 90000000)}`,
        contactName: `ผู้จัดการ ${comp.name.split(" ")[1] || "ทั่วไป"}`,
        contactPhone: `08${Math.floor(Math.random() * 10)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        contactEmail: `info@${comp.domain}.co.th`,
        description: `ลูกค้าสนใจใช้งานระบบ CRM ของบริษัทเรา (Seeded Data)`,
        revenue: comp.revenue,
        registeredCapital: comp.revenue * 2,
        profit: comp.profit
      });

      // Simulate a past follow-up (Contacted)
      let pastDate = new Date(today);
      pastDate.setDate(today.getDate() - (Math.floor(Math.random() * 10) + 5)); // 5-15 days ago

      await Followup.create({
        lead_id: leadId,
        sequence: 1,
        contact_date: pastDate.toISOString().split("T")[0],
        detail: "โทรไปแนะนำตัวบริษัทเบื้องต้น ลูกค้าสนใจ",
        status: "ฝากโปรไฟล์",
        next_followup_date: null
      });

      // Simulate the latest status
      let currentDate = new Date(today);
      let nextDate = null;

      // To test NOTIFICATIONS, we need some next_followup_date to be TODAY or PAST
      if (comp.status === "มีตติ้ง" || comp.status === "ต้องตามต่อ") {
        nextDate = new Date(today);
        if (i % 2 === 0) {
          // 50% chance it's overdue or due today
          nextDate.setDate(today.getDate() - Math.floor(Math.random() * 2));
        } else {
          // 50% chance it's in the future
          nextDate.setDate(today.getDate() + Math.floor(Math.random() * 5) + 1);
        }
      }

      await Followup.create({
        lead_id: leadId,
        sequence: 2,
        contact_date: currentDate.toISOString().split("T")[0],
        detail: `อัปเดตสถานะล่าสุด: ${comp.status}`,
        status: comp.status,
        next_followup_date: nextDate ? nextDate.toISOString().split("T")[0] : null
      });

      // Highlight a few as starred
      if (i % 4 === 0) {
        await Lead.toggleStar(leadId, 0); // set to 1
      }
    }

    console.log("✅ Successfully seeded 15 leads with follow-up history!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
