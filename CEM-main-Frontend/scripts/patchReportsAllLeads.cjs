const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Reports.jsx', 'utf8');

const exportStr = `          <button onClick={() => setShowPreview(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: \`1px solid \${RG.border}\`, backgroundColor: "#fff", color: RG.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ตัวอย่างและ Export (JPG)
          </button>
        </div>`;

const newExportStr = `          <button onClick={() => setShowPreview(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: \`1px solid \${RG.border}\`, backgroundColor: "#fff", color: RG.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ตัวอย่างและ Export (JPG)
          </button>
        </div>
      </div>
      
      {/* Banner สำหรับ Master View */}
      {isMaster && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#b45309", fontWeight: 600, fontSize: 14 }}>
            ⚠️ โหมดรายงานรวม (All Leads Report) - แสดงข้อมูลลูกค้าของพนักงานทุกคนในระบบ
          </div>
          <button onClick={onExitMaster} style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            ปิดโหมดรายงานรวม
          </button>
        </div>
      )}`;

// We must also change the component signature to accept isMaster and onExitMaster
const compStr = `export default function Reports({ leads, onViewLead }) {`;
const newCompStr = `export default function Reports({ leads, onViewLead, isMaster, onExitMaster }) {`;

code = code.replace(compStr, newCompStr);

if (code.includes(exportStr)) {
  code = code.replace(exportStr, newExportStr);
  // fix the extra closing div because I replaced the `</div>` that was there
  // Actually, I replaced `</div></div>` effectively. Let's make it simpler.
}

fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Reports.jsx', code);
console.log('Reports.jsx patched');
