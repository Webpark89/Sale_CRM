export function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
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