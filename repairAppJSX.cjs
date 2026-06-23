const fs = require('fs');
const file = 'D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const repairContent = `                        </div>
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
                  </thead>
                  <tbody>
                    {paginatedLeads.length === 0 && (
                      <tr>
                        <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: RG.textMuted }}>
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    )}
                    {paginatedLeads.map((lead, i) => {
                      const isDup = dupNumbers.includes(lead.companyNumber);
                      
                      // 1. ดึงประวัติการติดตามทั้งหมดของลีดรายการนี้
                      const leadFollowups = followups[lead.id] || [];
`;

const lines = code.split('\n');

const line1 = lines.findIndex(l => l.includes('🗑 <span style={{ fontSize: 12, fontWeight: 700 }}>({checked.length})</span>'));
const line2 = lines.findIndex(l => l.includes('// 2. ตรวจสอบว่า "สถานะปัจจุบัน" หรือ "ประวัติที่ผ่านมา" เคยเป็น "มีตติ้ง" หรือไม่'));

if (line1 !== -1 && line2 !== -1) {
  // Replace everything between line1+2 and line2-1
  lines.splice(line1 + 2, line2 - (line1 + 2), repairContent);
  fs.writeFileSync(file, lines.join('\n'));
  console.log("App.jsx repaired!");
} else {
  console.log("Could not find line1 or line2");
}
