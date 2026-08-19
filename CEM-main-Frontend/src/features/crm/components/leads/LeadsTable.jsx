import React from "react";
import { RG } from "../../constants/theme";
import { STAGES, STAGE_STATUS_MAP, STAGE_COLORS, STATUS_COLORS } from "../../constants/status";
import EditableCell from "../common/EditableCell";
import StatusBadge from "../common/StatusBadge";
import { parseDateTH, today, PROVINCES } from "../../crmHelpers/helpers";
import { API_BASE_URL } from "../../services/api";
import { FileText, Search } from "lucide-react";

const PRIORITY_WEIGHT = {
  Approval: 5,
  Proposal: 4,
  Meeting:  3,
  Contact:  2,
  Closed:   1,
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
    borderBottom: `1px solid ${RG.border}`, 
    userSelect: "none",
    fontWeight: 600,
    letterSpacing: 0.3,
    background: RG.background,
    position: "sticky",
    top: 0,
    zIndex: 5
  };

  return (
    <>      <div 
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
              <th style={{ ...thStyle }} onClick={() => handleSort("contactName")}>ชื่อผู้ติดต่อ{getSortIcon("contactName")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("contactPhone")}>เบอร์โทรศัพท์{getSortIcon("contactPhone")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("contactEmail")}>อีเมล{getSortIcon("contactEmail")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("province")}>จังหวัด{getSortIcon("province")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("description")}>รายละเอียด{getSortIcon("description")}</th>
              {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                <th style={{ ...thStyle }} onClick={() => handleSort("owner")}>เซลส์ผู้ดูแล{getSortIcon("owner")}</th>
              )}
              <th style={{ ...thStyle }} onClick={() => handleSort("dealValue")}>มูลค่าโครงการ (฿){getSortIcon("dealValue")}</th>
              <th style={{ ...thStyle, minWidth: 100 }} onClick={() => handleSort("stage")}>Stage{getSortIcon("stage")}</th>
              <th style={{ ...thStyle, minWidth: 120 }} onClick={() => handleSort("latestStatus")}>Status{getSortIcon("latestStatus")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("latestContactDate")}>ติดต่อล่าสุด{getSortIcon("latestContactDate")}</th>
              <th style={{ ...thStyle }} onClick={() => handleSort("nextFollowupDate")}>นัดติดตามถัดไป{getSortIcon("nextFollowupDate")}</th>
              <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>ไฟล์</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead, i) => {
              const isDup = dupNumbers.includes(lead.companyNumber);
              const leadFollowups = followups[lead.id] || [];
              const hasMeetingHistory = lead.stage === 'Meeting' || lead.everHadMeeting === true;
              const rowBackground = lead.stage === 'Meeting' ? "#FEF9C3" : RG.surface;
              const hoverBackground = lead.stage === 'Meeting' ? "#FEF08A" : RG.background;
              
              return (
                <tr 
                  key={lead.id} 
                  style={{ background: rowBackground, borderBottom: `1px solid ${RG.border}`, transition: "background-color 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBackground}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBackground}
                  onClick={() => setSelectedLead(lead)}
                >
                  <td style={{ padding: "16px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" style={{ accentColor: RG.primary, transform: "scale(1.25)", cursor: "pointer" }} checked={checked.includes(lead.id)} onChange={e => setChecked(c => (e.target.checked ? [...c, lead.id] : c.filter(x => x !== lead.id)))} />
                  </td>
                  <td style={{ padding: "16px 6px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleStar(lead.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>
                      {lead.isStarred ? "⭐" : "☆"}
                    </button>
                  </td>
                  <td style={{ padding: "16px 6px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedLead(lead)} style={{ background: RG.background, border: `1px solid ${RG.border}`, color: RG.textMuted, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => {e.currentTarget.style.background = RG.primary; e.currentTarget.style.color = RG.surface; e.currentTarget.style.borderColor = RG.primary;}} onMouseLeave={e => {e.currentTarget.style.background = RG.background; e.currentTarget.style.color = RG.textMuted; e.currentTarget.style.borderColor = RG.border;}}>👁</button>
                  </td>
                  <td style={{ padding: "16px 10px", textAlign: "center", fontSize: 13, color: RG.textMuted, fontWeight: 600 }}>
                    {(actualPage - 1) * itemsPerPage + i + 1}
                  </td>
                  <td style={{ padding: "16px 10px", fontWeight: lead.isStarred ? 600 : 400 }}>
                    <EditableCell value={lead.companyName} onSave={v => inlineEdit(lead.id, "companyName", v)} disabled={!canEdit} />
                  </td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactName} onSave={v => inlineEdit(lead.id, "contactName", v)} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactPhone} onSave={v => inlineEdit(lead.id, "contactPhone", v)} type="phone" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactEmail} onSave={v => inlineEdit(lead.id, "contactEmail", v)} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.province} onSave={v => inlineEdit(lead.id, "province", v)} type="select" options={PROVINCES} disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.description} onSave={v => inlineEdit(lead.id, "description", v)} disabled={!canEdit} /></td>
                  {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                    <td style={{ padding: "16px 10px", whiteSpace: "nowrap", color: RG.primaryMid, fontWeight: 600 }}>
                      {currentUser?.role === 'admin' || currentUser?.role === 'header_saler' || currentUser?.permissions?.leads?.reassign ? (
                        <span onClick={(e) => { e.stopPropagation(); setReassignConfirm({ leadId: lead.id, oldOwner: lead.owner, companyName: lead.companyName }); fetchAllSellers(); }} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{lead.owner || "-"}</span>
                      ) : (
                        lead.owner || "-"
                      )}
                    </td>
                  )}
                  <td style={{ padding: "16px 10px" }}><EditableCell value={lead.dealValue} onSave={v => inlineEdit(lead.id, "dealValue", Number(v))} type="number" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px", minWidth: 100 }}>
                    {canEdit ? (
                      <select
                        value={lead.stage || 'Contact'}
                        onChange={e => inlineEdit(lead.id, "stage", e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `1px solid ${STAGE_COLORS[lead.stage] || RG.border}`, background: (STAGE_COLORS[lead.stage] || '#3B82F6') + '22', color: STAGE_COLORS[lead.stage] || RG.text, fontWeight: 700, cursor: "pointer", outline: "none" }}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: (STAGE_COLORS[lead.stage] || '#3B82F6') + '22', color: STAGE_COLORS[lead.stage] || RG.text, display: "inline-block" }}>{lead.stage || 'Contact'}</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 10px", minWidth: 120 }}>
                    {canEdit ? (
                      <select
                        value={lead.latestStatus || ''}
                        onChange={e => inlineEdit(lead.id, "latestStatus", e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `1px solid ${!lead.latestStatus ? "#f59e0b" : RG.border}`, background: RG.background, color: RG.text, cursor: "pointer", outline: "none" }}
                      >
                        <option value="">-- Status --</option>
                        {(STAGE_STATUS_MAP[lead.stage || 'Contact'] || []).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, color: RG.text, fontWeight: 500 }}>{lead.latestStatus || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}><EditableCell value={lead.latestContactDate} onSave={v => inlineEdit(lead.id, "latestContactDate", v)} type="date" disabled={!canEdit} /></td>
                  <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}>{lead.nextFollowupDate && lead.nextFollowupDate === today() ? (
                      <span style={{ color: "#000000", fontSize: 12, fontWeight: 700 }}>🔔 ถึงกำหนดแล้ว</span>
                    ) : lead.nextFollowupDate && lead.nextFollowupDate < today() ? (
                      <span style={{ color: RG.danger, fontSize: 12, fontWeight: 700 }}>🔔 {parseDateTH(lead.nextFollowupDate)}</span>
                    ) : (
                      <EditableCell value={lead.nextFollowupDate} onSave={v => inlineEdit(lead.id, "nextFollowupDate", v)} type="date" disabled={!canEdit} />
                    )}
                  </td>
                  <td style={{ padding: "16px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
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
