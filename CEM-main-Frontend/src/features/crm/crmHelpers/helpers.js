import { STAGE_STATUS_MAP } from "../constants/status";

export function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", 
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", 
  "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", 
  "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", 
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", 
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

export function fmtNum(n) {
  if (!n && n !== 0) return "";
  return Number(n).toLocaleString("th-TH");
}

export function parseDateTH(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("th-TH", { year: "2-digit", month: "short", day: "numeric" });
}

export function parseDateTimeTH(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("th-TH", { year: "2-digit", month: "short", day: "numeric" }) + " " + dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function formatNumberWithCommas(value) {
  if (value === undefined || value === null) return "";
  const str = value.toString();
  const clean = str.replace(/[^\d]/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("en-US");
}

export function parseNumberFromCommas(value) {
  if (value === "" || value === undefined || value === null) return "";
  const clean = value.toString().replace(/[^\d]/g, "");
  if (clean === "") return "";
  return Number(clean);
}

export function createNewLead(form) {
  return {
    id: uuid(),
    ...form,
    stage: form.stage || 'Contact',
    revenue: Number(form.revenue) || 0,
    registeredCapital: Number(form.registeredCapital) || 0,
    profit: Number(form.profit) || 0,
    latestStatus: form.latestStatus || STAGE_STATUS_MAP['Contact'][0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function formatPhoneNumber(value) {
  if (!value) return "";
  const clean = value.replace(/[^\d]/g, ""); // ลบตัวอักษรที่ไม่ใช่ตัวเลขออกให้หมด
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}