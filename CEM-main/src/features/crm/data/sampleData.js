import { STATUSES } from "../constants/status";
import { today, uuid } from "../utils/helpers";

export const SAMPLE_LEADS = [
  { id: uuid(), companyName: "บริษัท อมตะ จำกัด", companyNumber: "0105562001234", contactName: "คุณสมชาย ใจดี", contactPhone: "081-234-5678", contactEmail: "somchai@amata.co.th", revenue: 12500000, registeredCapital: 5000000, profit: 1800000, latestStatus: "มีตติ้ง", latestContactDate: "2026-05-28", nextFollowupDate: "2026-06-03", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: uuid(), companyName: "หจก. ไทยพัฒนา", companyNumber: "0315561009876", contactName: "คุณมาลี สวัสดี", contactPhone: "089-876-5432", contactEmail: "malee@thaipat.com", revenue: 3200000, registeredCapital: 1000000, profit: 450000, latestStatus: "ฝากโปรไฟล์", latestContactDate: "2026-05-30", nextFollowupDate: "2026-06-10", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: uuid(), companyName: "บริษัท เทคโนวิชั่น จำกัด", companyNumber: "0105563007777", contactName: "คุณวิชัย นวัตกรรม", contactPhone: "062-555-0101", contactEmail: "wichai@techvision.th", revenue: 28000000, registeredCapital: 10000000, profit: 4200000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-05-25", nextFollowupDate: today(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: uuid(), companyName: "บริษัท กรีนเอเชีย จำกัด", companyNumber: "0205564005555", contactName: "คุณปรียา ธรรมดา", contactPhone: "095-111-2233", contactEmail: "preya@greenasia.co", revenue: 7800000, registeredCapital: 2000000, profit: 890000, latestStatus: "ปิดการขาย", latestContactDate: "2026-05-20", nextFollowupDate: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: uuid(), companyName: "ร้าน นายดี มาร์เก็ต", companyNumber: "0405562088888", contactName: "คุณนายดี ร้านค้า", contactPhone: "087-999-0000", contactEmail: "naidee@market.th", revenue: 950000, registeredCapital: 500000, profit: 120000, latestStatus: "ไม่สนใจ", latestContactDate: "2026-05-15", nextFollowupDate: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: uuid(), companyName: "บริษัท เอเชีย ดิจิทัล จำกัด", companyNumber: "0105565001001", contactName: "คุณศิริชัย พัฒนา", contactPhone: "081-111-1001", contactEmail: "sirichai@asiadigital.co.th", revenue: 18500000, registeredCapital: 5000000, profit: 2500000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-01", nextFollowupDate: "2026-06-10", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
{ id: uuid(), companyName: "บริษัท ไทยแมชชีน จำกัด", companyNumber: "0105565001002", contactName: "คุณอานนท์ วิศวะ", contactPhone: "081-111-1002", contactEmail: "anon@thaimachine.co.th", revenue: 32000000, registeredCapital: 10000000, profit: 4200000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-02", nextFollowupDate: "2026-06-12", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท สมาร์ทไอที จำกัด", companyNumber: "0105565001003", contactName: "คุณภัทร เทคโน", contactPhone: "081-111-1003", contactEmail: "pat@smartit.co.th", revenue: 9500000, registeredCapital: 2000000, profit: 1800000, latestStatus: "ฝากโปรไฟล์", latestContactDate: "2026-06-03", nextFollowupDate: "2026-06-15", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท โคราช เอ็นจิเนียริ่ง จำกัด", companyNumber: "0105565001004", contactName: "คุณธนากร ช่างกล", contactPhone: "081-111-1004", contactEmail: "thanakorn@korateng.co.th", revenue: 28000000, registeredCapital: 8000000, profit: 3600000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-04", nextFollowupDate: "2026-06-11", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท พรีเมียม ฟู้ดส์ จำกัด", companyNumber: "0105565001005", contactName: "คุณกนกวรรณ อาหารดี", contactPhone: "081-111-1005", contactEmail: "kanokwan@premiumfoods.co.th", revenue: 14500000, registeredCapital: 4000000, profit: 2100000, latestStatus: "ปิดการขาย", latestContactDate: "2026-05-25", nextFollowupDate: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท ไทยออโต้พาร์ท จำกัด", companyNumber: "0105565001006", contactName: "คุณวิทยา อุตสาหกรรม", contactPhone: "081-111-1006", contactEmail: "witthaya@autopart.co.th", revenue: 56000000, registeredCapital: 15000000, profit: 6500000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-05", nextFollowupDate: "2026-06-18", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "หจก. รุ่งเรืองการค้า", companyNumber: "0105565001007", contactName: "คุณสุเมธ ค้าขาย", contactPhone: "081-111-1007", contactEmail: "sumet@rungruang.co.th", revenue: 4200000, registeredCapital: 1000000, profit: 620000, latestStatus: "ฝากโปรไฟล์", latestContactDate: "2026-05-30", nextFollowupDate: "2026-06-14", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท บลูโอเชี่ยน โลจิสติกส์ จำกัด", companyNumber: "0105565001008", contactName: "คุณธวัชชัย ขนส่ง", contactPhone: "081-111-1008", contactEmail: "thawatchai@blueoceanlogistics.co.th", revenue: 38500000, registeredCapital: 12000000, profit: 4900000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-06", nextFollowupDate: "2026-06-13", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท กรีนฟาร์ม ออร์แกนิค จำกัด", companyNumber: "0105565001009", contactName: "คุณประยูร เกษตร", contactPhone: "081-111-1009", contactEmail: "prayoon@greenfarm.co.th", revenue: 8900000, registeredCapital: 3000000, profit: 1200000, latestStatus: "ไม่สนใจ", latestContactDate: "2026-05-20", nextFollowupDate: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท เวิลด์คลาวด์ จำกัด", companyNumber: "0105565001010", contactName: "คุณณัฐพงศ์ ไอที", contactPhone: "081-111-1010", contactEmail: "nattapong@worldcloud.co.th", revenue: 22000000, registeredCapital: 5000000, profit: 5300000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-07", nextFollowupDate: "2026-06-16", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท เมกะโปรเจค จำกัด", companyNumber: "0105565001011", contactName: "คุณปกรณ์ โครงการ", contactPhone: "081-111-1011", contactEmail: "pakorn@megaproject.co.th", revenue: 78000000, registeredCapital: 30000000, profit: 8500000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-03", nextFollowupDate: "2026-06-17", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท อินโนเทค จำกัด", companyNumber: "0105565001012", contactName: "คุณกิตติศักดิ์ ซอฟต์แวร์", contactPhone: "081-111-1012", contactEmail: "kittisak@innotech.co.th", revenue: 13500000, registeredCapital: 3000000, profit: 2400000, latestStatus: "ฝากโปรไฟล์", latestContactDate: "2026-06-01", nextFollowupDate: "2026-06-12", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท ไทยเมดิคอล จำกัด", companyNumber: "0105565001013", contactName: "คุณแพรว สุขภาพ", contactPhone: "081-111-1013", contactEmail: "praew@thaimedical.co.th", revenue: 27500000, registeredCapital: 7000000, profit: 4500000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-04", nextFollowupDate: "2026-06-09", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท ดิจิทัลมาร์เก็ตติ้ง โปร จำกัด", companyNumber: "0105565001014", contactName: "คุณสุธิดา ออนไลน์", contactPhone: "081-111-1014", contactEmail: "suthida@digitalpro.co.th", revenue: 6200000, registeredCapital: 1000000, profit: 1100000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-05", nextFollowupDate: "2026-06-10", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท พีคเพาเวอร์ จำกัด", companyNumber: "0105565001015", contactName: "คุณเดชา พลังงาน", contactPhone: "081-111-1015", contactEmail: "decha@peakpower.co.th", revenue: 92000000, registeredCapital: 25000000, profit: 12500000, latestStatus: "ปิดการขาย", latestContactDate: "2026-05-28", nextFollowupDate: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท สยามพลาสติก จำกัด", companyNumber: "0105565001016", contactName: "คุณเอกชัย โรงงาน", contactPhone: "081-111-1016", contactEmail: "ekkachai@siamplastic.co.th", revenue: 34000000, registeredCapital: 12000000, profit: 3900000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-06", nextFollowupDate: "2026-06-20", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท เน็กซ์เจน โซลูชั่น จำกัด", companyNumber: "0105565001017", contactName: "คุณจิรายุ เทค", contactPhone: "081-111-1017", contactEmail: "jirayu@nextgen.co.th", revenue: 16800000, registeredCapital: 4000000, profit: 2900000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-07", nextFollowupDate: "2026-06-14", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท อัลฟ่าเทค จำกัด", companyNumber: "0105565001018", contactName: "คุณรัชพล โปรแกรมเมอร์", contactPhone: "081-111-1018", contactEmail: "ratchapol@alphatech.co.th", revenue: 11200000, registeredCapital: 2500000, profit: 2200000, latestStatus: "ฝากโปรไฟล์", latestContactDate: "2026-06-02", nextFollowupDate: "2026-06-11", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท ยูไนเต็ดเทรด จำกัด", companyNumber: "0105565001019", contactName: "คุณอรทัย การค้า", contactPhone: "081-111-1019", contactEmail: "orathai@unitedtrade.co.th", revenue: 21000000, registeredCapital: 5000000, profit: 3300000, latestStatus: "ต้องตามต่อ", latestContactDate: "2026-06-03", nextFollowupDate: "2026-06-15", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

{ id: uuid(), companyName: "บริษัท โกลบอลเซอร์วิส จำกัด", companyNumber: "0105565001020", contactName: "คุณวสันต์ บริการ", contactPhone: "081-111-1020", contactEmail: "wasan@globalservice.co.th", revenue: 17500000, registeredCapital: 4500000, profit: 2600000, latestStatus: "มีตติ้ง", latestContactDate: "2026-06-08", nextFollowupDate: "2026-06-17", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
export const SAMPLE_FOLLOWUPS = {
  [SAMPLE_LEADS[0].id]: [
    { id: uuid(), leadId: SAMPLE_LEADS[0].id, sequence: 1, date: "2026-05-28", detail: "โทรหาครั้งแรก นัดประชุมวันที่ 5 มิถุนายน", status: "มีตติ้ง", nextFollowupDate: "2026-06-03", completed: false, createdAt: new Date().toISOString() },
  ],
  [SAMPLE_LEADS[1].id]: [
    { id: uuid(), leadId: SAMPLE_LEADS[1].id, sequence: 1, date: "2026-05-30", detail: "ส่งโปรไฟล์บริษัททางอีเมล รอการตอบกลับ", status: "ฝากโปรไฟล์", nextFollowupDate: "2026-06-10", completed: false, createdAt: new Date().toISOString() },
  ],
  [SAMPLE_LEADS[2].id]: [
    { id: uuid(), leadId: SAMPLE_LEADS[2].id, sequence: 1, date: "2026-05-25", detail: "คุยเบื้องต้น ต้องโทรตามผลการพิจารณา", status: "ต้องตามต่อ", nextFollowupDate: today(), completed: false, createdAt: new Date().toISOString() },
  ],
};

export function createNewLead(form) {
  return {
    id: uuid(),
    ...form,
    revenue: Number(form.revenue) || 0,
    registeredCapital: Number(form.registeredCapital) || 0,
    profit: Number(form.profit) || 0,
    latestStatus: form.latestStatus || STATUSES[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}