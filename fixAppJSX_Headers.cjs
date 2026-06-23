const fs = require('fs');
const file = 'D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const correctTableHead = `                  <thead style={{ position: "sticky", top: 0, background: RG.surface, zIndex: 10 }}>
                    <tr style={{ borderBottom: \`2px solid \${RG.border}\`, background: RG.text }}>
                      <th style={{ padding: "12px 10px", textAlign: "center", color: "#fff", fontSize: 13, width: 36, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <input type="checkbox" checked={checked.length === filtered.length && filtered.length > 0} onChange={e => setChecked(e.target.checked ? filtered.map(l => l.id) : [])} />
                          {checked.length > 0 && (
                            <button onClick={() => setShowDeleteConfirm(true)} style={{ position: "absolute", left: 36, background: "#fff5f5", border: \`1px solid \${RG.warn}\`, borderRadius: "6px", padding: "4px 8px", color: RG.warn, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 4, zIndex: 20, boxShadow: "0 2px 4px rgba(220, 53, 69, 0.1)" }} title="ลบข้อมูลที่เลือก">
                              🗑 <span style={{ fontSize: 12, fontWeight: 700 }}>({checked.length})</span>
                            </button>
                          )}
                        </div>
                      </th>
                      {/* เพิ่ม Column สำหรับติดดาว */}
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      {[
                        { label: "บริษัท", key: "companyName" },
                        { label: "เลขนิติบุคคล", key: "companyNumber" },
                        { label: "ผู้ติดต่อ", key: "contactName" },
                        { label: "เบอร์", key: "contactPhone" },
                        { label: "อีเมล", key: "contactEmail" },
                        { label: "รายละเอียด", key: "description" },
                        { label: "รายได้รวม", key: "revenue", sortable: true },
                        { label: "ทุนจดทะเบียน", key: "registeredCapital", sortable: true },
                        { label: "กำไร", key: "profit", sortable: true },
                        { label: "สถานะ", key: "latestStatus", sortable: true },
                        { label: "ติดต่อล่าสุด", key: "latestContactDate", sortable: true },
                        { label: "นัดถัดไป", key: "nextFollowupDate", sortable: true }
                      ].map(col => (
                        <th key={col.label} style={{ padding: "12px 10px", textAlign: "left", color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {col.sortable ? (
                            <div onClick={() => handleSort(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                              {col.label}
                              <span style={{ fontSize: 10, color: sortConfig.key === col.key ? RG.primaryPale : "rgba(255, 255, 255, 0.4)" }}>
                                {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? "▲" : "▼") : "▽"}
                              </span>
                            </div>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>`;

const lines = code.split('\n');
const headStart = lines.findIndex(l => l.includes('<thead style={{ position: "sticky", top: 0, background: RG.surface, zIndex: 10 }}>'));
const bodyStart = lines.findIndex(l => l.includes('<tbody>'));

if (headStart !== -1 && bodyStart !== -1) {
  lines.splice(headStart, bodyStart - headStart, correctTableHead);
  fs.writeFileSync(file, lines.join('\n'));
  console.log("Replaced table head!");
} else {
  console.log("Could not find headStart or bodyStart!");
}
