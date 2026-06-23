const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Dashboard.jsx', 'utf8');

// Change export wrapper styles
const oldWrapper = `<div ref={exportRef} style={{ padding: isExporting ? "40px" : "4px", borderRadius: "16px", background: isExporting ? "#ffffff" : "transparent" }}>`;
const newWrapper = `<div ref={exportRef} style={{ 
        padding: isExporting ? "60px 50px" : "4px", 
        borderRadius: isExporting ? "0px" : "16px", 
        background: isExporting ? "#ffffff" : "transparent",
        color: "#000",
        fontFamily: isExporting ? "'Sarabun', 'Segoe UI', sans-serif" : "inherit"
      }}>`;

// Replace header
const oldHeader = `{/* Formal Header (Visible only during export) */}
        {isExporting && (
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: \`2px solid \${RG.border}\`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: RG.text, marginBottom: 8, fontFamily: "'Sarabun', sans-serif" }}>รายงานสรุปภาพรวมการขาย (Sales Overview Report)</div>
              <div style={{ fontSize: 16, color: RG.textMuted }}>
                ประจำเดือน: <span style={{ fontWeight: 600, color: RG.primaryMid }}>{filterMonth ? new Date(filterMonth + "-01").toLocaleDateString("th-TH", { month: "long", year: "numeric" }) : "ทั้งหมด (All Time)"}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: RG.primaryMid, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ width: 24, height: 24, background: RG.primary, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>Q</div>
                QoraQot CRM
              </div>
              <div style={{ fontSize: 12, color: RG.textMuted, marginTop: 8 }}>
                ข้อมูล ณ วันที่พิมพ์: {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} เวลา {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        )}`;

const newHeader = `{/* Formal Header (Visible only during export) */}
        {isExporting && (
          <div style={{ marginBottom: 40, borderBottom: "3px solid #1e293b", paddingBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ margin: "0 0 8px 0", fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>รายงานสรุปภาพรวมการขาย</h1>
              <div style={{ fontSize: 18, color: "#475569", fontWeight: 500 }}>
                ประจำเดือน: <span style={{ color: "#2563eb", fontWeight: 700 }}>{filterMonth ? new Date(filterMonth + "-01").toLocaleDateString("th-TH", { month: "long", year: "numeric" }) : "ทั้งหมด (All Time)"}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ width: 28, height: 28, background: "#2563eb", borderRadius: "4px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>Q</div>
                QoraQot CRM
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 12, borderTop: "1px dotted #cbd5e1", paddingTop: 8 }}>
                พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} เวลา {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        )}`;

// Clean up KPI cards styling during export
const oldKpi = `style={{ background: RG.surface, borderRadius: 12, border: \`1px solid \${RG.border}\`, padding: "16px 14px", textAlign: "center", boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter }}`;
const newKpi = `style={{ background: isExporting ? "#f8fafc" : RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : \`1px solid \${RG.border}\`, padding: "16px 14px", textAlign: "center", boxShadow: isExporting ? "none" : RG.shadowSoft, backdropFilter: isExporting ? "none" : RG.glassFilter }}`;

// Clean up Chart cards styling
const oldChart = `style={{ background: RG.surface, borderRadius: 12, border: \`1px solid \${RG.border}\`, padding: 20, minHeight: 260, boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter }}`;
const newChart = `style={{ background: isExporting ? "#ffffff" : RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : \`1px solid \${RG.border}\`, padding: 20, minHeight: 260, boxShadow: isExporting ? "none" : RG.shadowSoft, backdropFilter: isExporting ? "none" : RG.glassFilter }}`;

let updated = code.replace(oldWrapper, newWrapper).replace(oldHeader, newHeader);
updated = updated.split(oldKpi).join(newKpi);
updated = updated.split(oldChart).join(newChart);

// Add footer if exporting
const endDivIndex = updated.lastIndexOf("</div>");
const beforeEnd = updated.substring(0, endDivIndex);
const afterEnd = updated.substring(endDivIndex);

const footerHTML = `
        {/* Formal Footer */}
        {isExporting && (
          <div style={{ marginTop: 50, borderTop: "2px solid #e2e8f0", paddingTop: 20, display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 13 }}>
            <div>© ${new Date().getFullYear()} QoraQot CRM System. All rights reserved.</div>
            <div>รายงานสำหรับใช้ภายในองค์กรเท่านั้น (Internal Use Only)</div>
          </div>
        )}
`;

fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Dashboard.jsx', beforeEnd + footerHTML + afterEnd);
console.log('Dashboard Export Styled');
