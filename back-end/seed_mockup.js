const db = require('./config/db');

// รายชื่อ Sales
const sales = [
  { id: 4, name: 'crm1' },
  { id: 5, name: 'crm2' },
  { id: 7, name: 'crm3' },
  { id: 3, name: 'header1' }
];

const companyNames = [
  "บจก. สยามอินโนเวชั่น จำกัด", "บริษัท ไทยพัฒนา กรุ๊ป", "หจก. ออโต้พาร์ท เซ็นเตอร์",
  "บริษัท ไอทีโซลูชั่น เอเชีย", "บมจ. อุตสาหกรรมก้าวหน้า", "บจก. คลีนเอเนอร์ยี่",
  "บจก. โกลบอลเทรดดิ้ง", "บริษัท ดิจิตอลเวิลด์ เทคโนโลยี", "หจก. เจริญรุ่งเรืองพานิช",
  "บจก. แอดวานซ์ บิสซิเนส", "บริษัท ไทยแฟคตอรี่ แมนูแฟคเจอริ่ง", "บจก. เฟิร์สชอยส์ ลอจิสติกส์",
  "บริษัท สมาร์ทโฮม ดีไซน์", "บจก. เอกเซลเลนท์ ซัพพลาย", "หจก. พีระมิด เอ็นจิเนียริ่ง",
  "บริษัท แสงทองการพิมพ์", "บจก. เอเชียฟู้ดแอนด์เบฟเวอเรจ", "บริษัท บลูสกาย พร็อพเพอร์ตี้",
  "บจก. สุขุมวิท คอนสตรัคชั่น", "บริษัท เพอร์เฟค ซิสเต็มส์", "หจก. ยูไนเต็ด มาร์เก็ตติ้ง",
  "บจก. อัลฟ่า ซอฟต์แวร์", "บริษัท วิชั่นเนอรี่ แอดเวอร์ไทซิ่ง", "บจก. ท็อปเกรด แมททีเรียล",
  "บริษัท ไทยแลนด์ เอดูเคชั่น", "บจก. ซีเนอร์ยี่ พาร์ทเนอร์ส", "หจก. อัศว เทรดดิ้ง",
  "บริษัท บางกอก ซิสเต็มส์ จำกัด", "บจก. เอเวอร์กรีน พรอพเพอร์ตี้", "บมจ. สยามออโต้คาร์"
];

const customerNames = [
  "คุณสมชาย ใจดี", "คุณวิภาวี รักษ์ไทย", "คุณกฤษฎา สุขประเสริฐ",
  "คุณนฤมล พรหมวิหาร", "คุณชานนท์ ชัยชนะ", "คุณสุพัตรา วงศ์ทองคำ",
  "คุณธนภัทร รุ่งจรัส", "คุณพิมมาดา บุญมี", "คุณเอกรัฐ เกียรติศักดิ์",
  "คุณศิริวรรณ แสงดาว", "คุณอรรถพล แก้วมณี", "คุณรุ่งทิวา นันทกานต์",
  "คุณชัยวัฒน์ ตันติพิวัฒน์", "คุณดาริกา อมรศิริ", "คุณพีรพงษ์ ศักดิ์สิทธิ์",
  "คุณจิราภรณ์ วิเศษจันทร์", "คุณณัฐพล มงคลชัย", "คุณสุจิตรา จันทร์โอชา",
  "คุณทวีศักดิ์ เลิศล้ำ", "คุณอรัญญา สิริพงษ์", "คุณกิตติชัย ศรีวิไล",
  "คุณนันทิยา ทองสุก", "คุณศุภกร พัฒนผล", "คุณมณีรัตน์ วิจิตรศิลป์",
  "คุณเดชา ชำนาญกิจ", "คุณอารยา สุวรรณสิงห์", "คุณไพศาล เกียรติพงษ์",
  "คุณนลินี วงศ์สว่าง", "คุณสุรศักดิ์ ศรีวิชัย", "คุณมยุรี พงษ์พัฒนา"
];

const statuses = ["มีตติ้ง", "ฝากโปรไฟล์", "ต้องตามต่อ", "ติดต่อไม่ได้", "ไม่สนใจ", "ปิดการขาย"];
const descriptions = [
  "ลูกค้าสนใจระบบ CRM อยากให้เข้าไปพรีเซนต์ฟีเจอร์", "โทรไปสอบถามข้อมูลบริการ Cloud Hosting แจ้งว่างบ 100k", "สนใจให้ทำ Marketing ให้บริษัท ขอใบเสนอราคา",
  "ลูกค้าโทรเข้ามาจากหน้าเว็บ สนใจระบบ POS 5 สาขา", "ต้องการพัฒนาระบบคลังสินค้าใหม่แทนที่ตัวเก่า", "สอบถามแพ็กเกจ Software สำหรับโรงงาน",
  "สนใจระบบ E-commerce พร้อมเชื่อมต่อ Payment Gateway", "ขอใบเสนอราคาระบบจองคิวออนไลน์คลินิกความงาม", "ลูกค้าเก่าแนะนำมา อยากได้ระบบบัญชีภายใน",
  "ทักมาจาก Facebook ขอทราบรายละเอียดเพิ่มเติมเบื้องต้น"
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const formatDate = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

async function seedData() {
  try {
    console.log('เริ่มสร้างข้อมูล Mockup แบบสมจริง...');
    
    // เคลียร์ข้อมูลเก่า (ถ้าต้องการ) เพื่อความสะอาด
    await db.execute('DELETE FROM followups');
    await db.execute('DELETE FROM leads');
    console.log('เคลียร์ข้อมูลเก่าเรียบร้อย');

    for (let i = 0; i < companyNames.length; i++) {
      const owner = randomItem(sales);
      const createdDate = randomDate(new Date('2026-01-01'), new Date('2026-06-25'));
      const finalStatus = randomItem(statuses);
      
      const revenue = randomInt(1, 100) * 1000000;
      const profit = Math.floor(revenue * (randomInt(5, 20) / 100));

      // 1. สร้าง Lead
      const [leadResult] = await db.execute(
        `INSERT INTO leads (owner_id, created_by, is_acknowledged, company_name, company_number, contact_name, contact_phone, contact_email, description, revenue, profit, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          owner.id,
          owner.id,
          1,
          companyNames[i],
          `0${randomInt(2000000, 2999999)}`,
          customerNames[i],
          `08${randomInt(10000000, 99999999)}`,
          `contact${i}@example.com`,
          randomItem(descriptions),
          revenue,
          profit,
          formatDate(createdDate)
        ]
      );

      const leadId = leadResult.insertId;

      // 2. สร้าง Followups แบบไทม์ไลน์
      // สมมติว่าลูกค้า 1 รายมี 1-4 Followups ไหลไปเรื่อยๆ จนถึง finalStatus ใน Followup สุดท้าย
      const numFollowups = randomInt(1, 4);
      let lastDate = new Date(createdDate);
      
      for (let seq = 1; seq <= numFollowups; seq++) {
        // ระยะห่างแต่ละ Followup ประมาณ 1-14 วัน
        lastDate = new Date(lastDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
        if (lastDate > new Date()) {
          lastDate = new Date();
        }

        const isLast = (seq === numFollowups);
        const currentStatus = isLast ? finalStatus : randomItem(["ฝากโปรไฟล์", "ต้องตามต่อ", "มีตติ้ง"]);
        
        let note = "โทรสอบถามรายละเอียดเพิ่มเติม";
        if (currentStatus === "ปิดการขาย") note = "ลูกค้าตกลงเซ็นสัญญาและโอนเงินมัดจำเรียบร้อย";
        else if (currentStatus === "ไม่สนใจ") note = "ลูกค้างบไม่พอ ขอพักโปรเจคไปก่อน";
        else if (currentStatus === "ติดต่อไม่ได้") note = "โทรไปไม่รับสาย ทิ้งข้อความไว้ในไลน์";
        else if (currentStatus === "มีตติ้ง") note = "นัดประชุมพรีเซนต์ออนไลน์ผ่าน Zoom แจ้งรายละเอียดฟีเจอร์ครบถ้วน";
        else if (currentStatus === "ต้องตามต่อ") note = "ลูกค้าบอกจะเอาเข้าที่ประชุมสัปดาห์หน้า ให้ทักไปใหม่วันจันทร์";
        else if (currentStatus === "ฝากโปรไฟล์") note = "ส่ง Company Profile และใบเสนอราคาเบื้องต้นให้ทางอีเมลแล้ว";

        // กำหนดวันนัดหมายครั้งถัดไป (ถ้ายังไม่จบเคส)
        let nextFollowupDate = null;
        let isDone = randomItem([1, 1, 1, 0]); 
        
        if (["ปิดการขาย", "ไม่สนใจ"].includes(currentStatus)) {
          isDone = 1; // จบเคสแล้ว ไม่ต้องมีวันติดตามต่อ
        } else if (isLast) {
          // ถ้าเป็นอันสุดท้าย แต่ยังไม่จบเคส ให้มีกำหนดการตามต่ออนาคต (ถ้าเป็นปัจจุบัน หรือเกินปัจจุบันไปไม่กี่วัน)
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + randomInt(1, 10));
          nextFollowupDate = formatDate(futureDate);
          isDone = 0; // หมายความว่าอันนี้รอติดตามต่อ (ยังไม่ complete การติดตามรอบนั้น หรือรอรอบถัดไป)
        }

        await db.execute(
          `INSERT INTO followups (lead_id, sequence, contact_date, detail, status, next_followup_date, completed, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            leadId,
            seq,
            formatDate(lastDate),
            note,
            currentStatus,
            nextFollowupDate,
            isDone,
            formatDate(lastDate)
          ]
        );
      }
    }

    console.log('🎉 สร้างข้อมูลสำเร็จแล้ว! จำนวน Lead ทั้งหมด:', companyNames.length);
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
