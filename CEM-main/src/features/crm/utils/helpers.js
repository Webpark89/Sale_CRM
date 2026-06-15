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
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}