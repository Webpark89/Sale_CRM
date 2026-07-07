const db = require("./config/db");

const provinces = [
  "กรุงเทพมหานคร", "สมุทรปราการ", "นนทบุรี", "ปทุมธานี", "พระนครศรีอยุธยา",
  "อ่างทอง", "ลพบุรี", "สิงห์บุรี", "ชัยนาท", "สระบุรี",
  "ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา",
  "ปราจีนบุรี", "นครนายก", "สระแก้ว", "นครราชสีมา", "บุรีรัมย์",
  "สุรินทร์", "ศรีสะเกษ", "อุบลราชธานี", "ยโสธร", "ชัยภูมิ",
  "อำนาจเจริญ", "บึงกาฬ", "หนองบัวลำภู", "ขอนแก่น", "อุดรธานี",
  "เลย", "หนองคาย", "มหาสารคาม", "ร้อยเอ็ด", "กาฬสินธุ์",
  "สกลนคร", "นครพนม", "มุกดาหาร", "เชียงใหม่", "ลำพูน",
  "ลำปาง", "อุตรดิตถ์", "แพร่", "น่าน", "พะเยา",
  "เชียงราย", "แม่ฮ่องสอน", "นครสวรรค์", "อุทัยธานี", "กำแพงเพชร",
  "ตาก", "สุโขทัย", "พิษณุโลก", "พิจิตร", "เพชรบูรณ์",
  "ราชบุรี", "กาญจนบุรี", "สุพรรณบุรี", "นครปฐม", "สมุทรสาคร",
  "สมุทรสงคราม", "เพชรบุรี", "ประจวบคีรีขันธ์", "นครศรีธรรมราช", "กระบี่",
  "พังงา", "ภูเก็ต", "สุราษฎร์ธานี", "ระนอง", "ชุมพร",
  "สงขลา", "สตูล", "ตรัง", "พัทลุง", "ปัตตานี",
  "ยะลา", "นราธิวาส"
];

async function run() {
  try {
    // 1. Add column if not exists
    console.log("Adding province column...");
    try {
      await db.query("ALTER TABLE leads ADD COLUMN province VARCHAR(100) DEFAULT NULL");
      console.log("Column 'province' added successfully.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("Column 'province' already exists.");
      } else {
        throw err;
      }
    }

    // 2. Mock data for leads where province is NULL
    const [leads] = await db.query("SELECT id FROM leads WHERE province IS NULL OR province = ''");
    console.log(`Found ${leads.length} leads without province.`);
    
    for (const lead of leads) {
      const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
      await db.query("UPDATE leads SET province = ? WHERE id = ?", [randomProvince, lead.id]);
    }
    console.log("Mock data updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
