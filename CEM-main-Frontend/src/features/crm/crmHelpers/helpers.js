import { STATUSES } from "../constants/status";

export function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function fmtNum(n) {
  if (!n && n !== 0) return "";
  return Number(n).toLocaleString("th-TH");
}

export function parseDateTH(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("th-TH", { year: "2-digit", month: "short", day: "numeric" });
}

export function formatNumberWithCommas(value) {
  if (value === undefined || value === null) return "";
  const str = value.toString();
  const isNegative = str.startsWith("-");
  const clean = str.replace(/[^\d]/g, "");
  if (!clean) return isNegative ? "-" : "";
  const formatted = Number(clean).toLocaleString("en-US");
  return isNegative ? `-${formatted}` : formatted;
}

export function parseNumberFromCommas(value) {
  if (value === "" || value === undefined || value === null) return "";
  const clean = value.toString().replace(/[^\d-]/g, "");
  if (clean === "" || clean === "-") return clean;
  return Number(clean);
}

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

export function formatPhoneNumber(value) {
  if (!value) return "";
  const clean = value.replace(/[^\d]/g, ""); // ลบตัวอักษรที่ไม่ใช่ตัวเลขออกให้หมด
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}