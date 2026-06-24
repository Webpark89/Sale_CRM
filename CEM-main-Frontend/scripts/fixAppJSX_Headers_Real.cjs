const fs = require('fs');
const file = 'D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `                      {[
                        { label: "บริษัท", key: "companyName" },
                        { label: "เลขนิติบุคคล", key: "companyNumber" },
                        <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: RG.textMuted }}>`;

const replacement = `                      {[
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
                        <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: RG.textMuted }}>`;

code = code.replace(targetStr, replacement);
fs.writeFileSync(file, code);
console.log("App.jsx restored correctly.");
