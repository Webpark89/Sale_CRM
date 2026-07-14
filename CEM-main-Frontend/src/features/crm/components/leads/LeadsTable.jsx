import React from "react";
import { RG } from "../../constants/theme";
import { STATUS_ENUM, STATUS_COLORS } from "../../constants/status";
import EditableCell from "../common/EditableCell";
import StatusBadge from "../common/StatusBadge";
import { parseDateTH, today, PROVINCES } from "../../crmHelpers/helpers";
import { API_BASE_URL } from "../../services/api";
import { FileText, Search } from "lucide-react";

const PRIORITY_WEIGHT = {
  [STATUS_ENUM.CLOSED]: 7,
  "ด่วนมาก": 6,
  [STATUS_ENUM.MEETING]: 5,
  [STATUS_ENUM.FOLLOW_UP]: 4,
  [STATUS_ENUM.PROFILE]: 3,
  "ทั่วไป": 2,
  [STATUS_ENUM.UNREACHABLE]: 1,
  [STATUS_ENUM.NOT_INTERESTED]: 0
};

export default function LeadsTable({
  paginatedLeads, sortConfig, handleSort, checked, setChecked,
  toggleStar, setSelectedLead, actualPage, itemsPerPage, inlineEdit,
  dupNumbers, followups, currentUser, setReassignConfirm, fetchAllSellers,
  topScrollRef, handleTopScroll, handleBottomScroll, bottomScrollRef, syncTableWidth
}) {
  const canEdit = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.leads?.edit;

  const getSortIcon = (key) => {
    if (sortConfig.key === key) return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
    return '';
  };

  const thStyle = { 
    padding: "12px 10px", 
    textAlign: "left", 
    fontSize: 12, 
    color: RG.textMuted, 
    cursor: "pointer", 
    whiteSpace: "nowrap", 
    borderBottom: `2px solid ${RG.border}`, 
    userSelect: "none",
    fontWeight: 600,
    letterSpacing: 0.3,
    background: RG.background,
    position: "sticky",
    top: 0,
    zIndex: 5
  };

  return (
    <>
      <div 
        ref={topScrollRef} 
        onScroll={handleTopScroll} 
        style={{ overflowX: "auto", width: "100%", marginBottom: 4 }}
      >
        <div style={{ width: syncTableWidth, height: 1 }}></div>
      </div>

      <div 
        ref={bottomScrollRef} 
        onScroll={handleBottomScroll} 
        style={{ overflowX: "auto", width: "100%", background: RG.surface, maxHeight: "70vh" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1600 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 40, textAlign: "center", cursor: "default" }}>
                <input type="checkbox" style={{ accentColor: RG.primary, transform: "scale(1.25)", cursor: "pointer" }} onChange={e => setChecked(e.target.checked ? paginatedLeads.map(l => l.id) : [])} checked={paginatedLeads.length > 0 && checked.length === paginatedLeads.length} />
              </th>
              <th style={{ ...thStyle, width: 40, textAlign: "center", cursor: "default" }}>⭐</th>
              <th style={{ ...thStyle, width: 40, textAlign: "center", cursor: "default" }}>👁</th>
              <th style={{ ...thStyle, width: 40, textAlign: "center", cursor: "default" }}>#</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("companyName")}>ชื่อบริษัท / ชื่อร้าน{getSortIcon("companyName")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("companyNumber")}>เลขนิติบุคคล{getSortIcon("companyNumber")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("contactName")}>ชื่อผู้ติดต่อ{getSortIcon("contactName")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("contactPhone")}>เบอร์โทรศัพท์{getSortIcon("contactPhone")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("contactEmail")}>อีเมล{getSortIcon("contactEmail")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("province")}>จังหวัด{getSortIcon("province")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("description")}>รายละเอียด{getSortIcon("description")}</th>
              {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                <th style={{ ...thStyle }} onClick={() => handleSort("owner")}>เซลส์ผู้ดูแล{getSortIcon("owner")}</th>
              )}
              <th style={{ ...thStyle }} onClick={() => handleSort("revenue")}>รายได้รวม (บาท){getSortIcon("revenue")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("registeredCapital")}>ทุนจดทะเบียน (บาท){getSortIcon("registeredCapital")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("profit")}>กำไร (บาท){getSortIcon("profit")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("latestStatus")}>สถานะ{getSortIcon("latestStatus")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("latestContactDate")}>ติดต่อล่าสุด{getSortIcon("latestContactDate")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("nextFollowupDate")}>นัดติดตามถัดไป{getSortIcon("nextFollowupDate")}</th>
              <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>ไฟล์</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead, i) => {
              const isDup = dupNumbers.includes(lead.companyNumber);
              const leadFollowups = followups[lead.id] || [];
              const hasMeetingHistory = lead.latestStatus === "มีตติ้ง" || lead.everHadMeeting === true || leadFollowups.some(f => f.status === "มีตติ้ง");
              const rowBackground = lead.latestStatus === "มีตติ้ง" ? "#FEF08A" : RG.surface;
              const hoverBackground = lead.latestStatus === "มีตติ้ง" ? "#FDE047" : RG.border;
              
              return (
                <tr 
                  key={lead.id} 
                  style={{ background: rowBackground, borderBottom: `1px solid #e5e7eb`, transition: "background-color 0.2s ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBackground}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBackground}
                >
                  <td style={{ padding: "16px 10px", textAlign: "center" }}>
                    <input type="checkbox" style={{ accentColor: RG.primary, transform: "scale(1.25)", cursor: "pointer" }} checked={checked.includes(lead.id)} onChange={e => setChecked(c => (e.target.checked ? [...c, lead.id] : c.filter(x => x !== lead.id)))} />
                  </td>
                  <td style={{ padding: "16px 6px", textAlign: "center" }}>
                    <button onClick={() => toggleStar(lead.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>
                      {lead.isStarred ? "⭐" : "☆"}
                    </button>
                  </td>
                  <td style={{ padding: "16px 6px" }}>
                    <button onClick={() => setSelectedLead(lead)} style={{ background: RG.background, border: `1px solid ${RG.border}`, color: RG.textMuted, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => {e.currentTarget.style.background = RG.primary; e.currentTarget.style.color = RG.surface; e.currentTarget.style.borderColor = RG.primary;}} onMouseLeave={e => {e.currentTarget.style.background = RG.background; e.currentTarget.style.color = RG.textMuted; e.currentTarget.style.borderColor = RG.border;}}>👁</button>
                  </td>
                  <td style={{ padding: "16px 10px", textAlign: "center", fontSize: 13, color: RG.textMuted, fontWeight: 600 }}>
                    {(actualPage - 1) * itemsPerPage + i + 1}
                  </td>
                  <td style={{ padding: "16px 10px", fontWeight: lead.isStarred ? 600 : 400 }}>
                    <EditableCell value={lead.companyName} onSave={v => inlineEdit(lead.id, "companyName", v)} disabled={!canEdit} />
                  </td>
                  <td style={{ padding: "16px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <EditableCell value={lead.companyNumber} onSave={v => inlineEdit(lead.id, "companyNumber", v)} disabled={!canEdit} />
                      {isDup && <span style={{ background: "#ffeeee", color: RG.danger, fontSize: 10, padding: "2px 8px", borderRadius: 12, border: "1px solid #ffcccc", whiteSpace: "nowrap", fontWeight: 600 }}>ซ้ำ!</span>}
                    </div>
                  </td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactName} onSave={v => inlineEdit(lead.id, "contactName", v)} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactPhone} onSave={v => inlineEdit(lead.id, "contactPhone", v)} type="phone" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactEmail} onSave={v => inlineEdit(lead.id, "contactEmail", v)} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.province} onSave={v => inlineEdit(lead.id, "province", v)} type="select" options={PROVINCES} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.description} onSave={v => inlineEdit(lead.id, "description", v)} disabled={!canEdit} /></td>
                  {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                    <td style={{ padding: "16px 10px", whiteSpace: "nowrap", color: RG.primaryMid, fontWeight: 600 }}>
                      {currentUser?.role === 'admin' || currentUser?.role === 'header_saler' || currentUser?.permissions?.leads?.reassign ? (
                        <span onClick={() => { setReassignConfirm({ leadId: lead.id, oldOwner: lead.owner, companyName: lead.companyName }); fetchAllSellers(); }} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{lead.owner || "-"}</span>
                      ) : (
                        lead.owner || "-"
                      )}
                    </td>
                  )}
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.revenue} onSave={v => inlineEdit(lead.id, "revenue", Number(v))} type="number" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.registeredCapital} onSave={v => inlineEdit(lead.id, "registeredCapital", Number(v))} type="number" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.profit} onSave={v => inlineEdit(lead.id, "profit", Number(v))} type="number" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><StatusBadge status={lead.latestStatus} /></td>
                  <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}><EditableCell value={lead.latestContactDate} onSave={v => inlineEdit(lead.id, "latestContactDate", v)} type="date" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}>{lead.nextFollowupDate && lead.nextFollowupDate === today() ? (
                      <span style={{ color: "#000000", fontSize: 12, fontWeight: 700 }}>🔔 ถึงกำหนดแล้ว</span>
                    ) : lead.nextFollowupDate && lead.nextFollowupDate < today() ? (
                      <span style={{ color: RG.danger, fontSize: 12, fontWeight: 700 }}>🔔 {parseDateTH(lead.nextFollowupDate)}</span>
                    ) : (
                      <EditableCell value={lead.nextFollowupDate} onSave={v => inlineEdit(lead.id, "nextFollowupDate", v)} type="date" disabled={!canEdit} />
                    )}
                  </td>
                  <td style={{ padding: "16px 10px", textAlign: "center" }}>
                    {(() => {
                      const fups = followups[lead.id] || [];
                      const latestWithPdf = [...fups].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).find(f => f.pdfFile);
                      return latestWithPdf ? (
                        <a href={`${API_BASE_URL}/uploads/pdfs/${latestWithPdf.pdfFile}`} target="_blank" rel="noopener noreferrer" style={{ color: RG.primary, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="ดูไฟล์สรุปการติดตามล่าสุด">
                          <FileText size={18} />
                        </a>
                      ) : <span style={{ color: RG.border }}>-</span>;
                    })()}
                  </td>
                </tr>
              );
            })}
            {paginatedLeads.length === 0 && (
              <tr>
                <td colSpan={19} style={{ padding: "60px 20px", textAlign: "center", color: RG.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 12, display: "flex", justifyContent: "center" }}>
                    <Search size={36} strokeWidth={1.5} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบข้อมูลลีด</div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>ลองปรับการค้นหาหรือตัวกรองดูอีกครั้ง</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
