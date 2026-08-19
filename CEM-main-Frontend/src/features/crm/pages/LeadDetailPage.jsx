import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import html2canvas from "html2canvas";
import { RG } from "../constants/theme";
import { STAGES, STAGE_STATUS_MAP, ALL_STATUSES } from "../constants/status";
import { parseDateTH, today, fmtNum, formatNumberWithCommas, parseNumberFromCommas, PROVINCES, formatPhoneNumber } from "../crmHelpers/helpers";
import { API_BASE_URL } from "../services/api";
import Btn from "../components/common/Btn";
import Field from "../components/common/Field";
import StatusBadge from "../components/common/StatusBadge";
import { inputStyle, selectStyle } from "../components/common/styles";

export default function LeadDetailPage({ leads = [], followups, onSave, onSaveFollowup, readOnly = false, allSellers = [], fetchAllSellers, handleReassign, setReassignConfirm, currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = leads.find(l => String(l.id) === String(id));
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(lead ? { ...lead } : {});
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [taxIdError, setTaxIdError] = useState("");
  const exportRef = useRef(null);

  useEffect(() => {
    if (lead) {
      setForm({ ...lead });
    }
  }, [lead]);

  const fups = lead ? (followups[lead.id] || []) : [];
  const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
  const defaultStatus = lead ? (lead.latestStatus || (STAGE_STATUS_MAP[lead.stage] && STAGE_STATUS_MAP[lead.stage][0]) || ALL_STATUSES[0]) : ALL_STATUSES[0];
  const [fForm, setFForm] = useState({ sequence: nextSeq, date: today(), detail: "", status: defaultStatus, nextFollowupDate: "", completed: false });

  if (!lead) return <div style={{ padding: 40, textAlign: "center" }}>กำลังโหลดข้อมูล...</div>;

  // ฟังก์ชันเช็กเลขซ้ำ
  const handleInputChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (key === "companyNumber") {
      const isDuplicate = leads.some(l => l.companyNumber === value && value.trim() !== "" && l.id !== lead.id);
      if (isDuplicate) {
        setTaxIdError("⚠️ เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว!");
      } else {
        setTaxIdError("");
      }
    }
  };

  const handleSaveInfo = async () => {
    if (taxIdError) {
      toast.error("ไม่สามารถบันทึกได้ เนื่องจากเลขนิติบุคคลซ้ำในระบบ");
      return;
    }
    try {
      await onSave(form);
      setEditing(false);
    } catch (e) {
      // Error is already alerted by saveLead toast
    }
  };

  // 2. ฟังก์ชัน Export JPG
  const handleExportJPG = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        scale: 2, // เพิ่มความคมชัด
        backgroundColor: RG.surface
      });
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = image;
      link.download = `รายละเอียด_${lead.companyName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div style={{ padding: "24px 32px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: RG.surface, border: `1px solid ${RG.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: RG.text, boxShadow: RG.shadowSoft }}>
          &larr; ย้อนกลับ
        </button>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: RG.text, fontFamily: RG.fontHeading }}>{lead.companyName}</h2>
      </div>
      {/* Hidden Export Template */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", zIndex: -100 }}>
        <div 
          ref={exportRef} 
          style={{ 
            background: RG.surface, 
            padding: "50px", 
            width: "800px", 
            boxSizing: "border-box", 
            fontFamily: "'Sarabun', sans-serif" 
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: `2px solid ${RG.primary}`, paddingBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: 50, height: 50, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: RG.surface, fontSize: 24 }}>Q</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RG.primary, lineHeight: 1.2 }}>Sales_CRM</div>
                <div style={{ fontSize: 13, color: RG.textMuted }}>Customer Profile Report</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: RG.text, letterSpacing: "0.5px", marginBottom: "4px" }}>เอกสารสรุปข้อมูลลูกค้า</div>
              <div style={{ fontSize: 14, color: RG.textMuted }}>พิมพ์เมื่อ: <span style={{ fontWeight: 600, color: RG.text }}>{new Date().toLocaleString("th-TH")}</span></div>
            </div>
          </div>

          {/* Company Info */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลองค์กร (Company Information)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: `1px solid ${RG.border}` }}>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, width: "25%", borderBottom: `1px solid ${RG.border}` }}>ชื่อบริษัท</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}`, width: "75%" }}>{lead.companyName || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>เลขนิติบุคคล</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>{lead.companyNumber || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>ผู้ติดต่อ</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>{lead.contactName || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>เบอร์โทรศัพท์</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>{formatPhoneNumber(lead.contactPhone) || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>อีเมล</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>{lead.contactEmail || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>จังหวัด</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>{lead.province || "-"}</td>
                </tr>
                {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                  <tr>
                    <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, borderBottom: `1px solid ${RG.border}` }}>เซลผู้ดูแล</td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}`, color: RG.primaryMid, fontWeight: 600 }}>
                      {currentUser?.role === 'admin' || currentUser?.role === 'header_saler' || currentUser?.permissions?.leads?.reassign ? (
                        <span 
                          onClick={() => { 
                            if(fetchAllSellers) fetchAllSellers(); 
                            if(setReassignConfirm) setReassignConfirm({ leadId: lead.id, oldOwner: lead.owner, companyName: lead.companyName }); 
                          }} 
                          style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                        >
                          {lead.owner || "-"}
                        </span>
                      ) : (
                        lead.owner || "-"
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600 }}>รายละเอียด</td>
                  <td style={{ padding: "12px 16px" }}>{lead.description || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Info */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลทางการเงิน (Financial Information)</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: RG.textMuted, marginBottom: "8px" }}>ทุนจดทะเบียน (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RG.text }}>{lead.registeredCapital ? fmtNum(lead.registeredCapital) : "-"}</div>
              </div>
              <div style={{ flex: 1, background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: RG.textMuted, marginBottom: "8px" }}>รายได้รวม (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RG.primaryMid }}>{lead.revenue ? fmtNum(lead.revenue) : "-"}</div>
              </div>
              <div style={{ flex: 1, background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: RG.textMuted, marginBottom: "8px" }}>กำไรสุทธิ (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RG.primaryMid }}>{lead.profit ? fmtNum(lead.profit) : "-"}</div>
              </div>
            </div>
          </div>

          {/* Followups */}
          {fups.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ประวัติการติดตาม (Follow-up History)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: RG.text, borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "10px", textAlign: "center", width: "10%", color: RG.surface }}>ครั้งที่</th>
                    <th style={{ padding: "10px", textAlign: "left", width: "20%", color: RG.surface }}>วันที่</th>
                    <th style={{ padding: "10px", textAlign: "left", width: "40%", color: RG.surface }}>รายละเอียด</th>
                    <th style={{ padding: "10px", textAlign: "center", width: "30%", color: RG.surface }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {[...fups].sort((a, b) => b.sequence - a.sequence).map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${RG.border}` }}>
                      <td style={{ padding: "10px", textAlign: "center", color: RG.textMuted }}>{f.sequence}</td>
                      <td style={{ padding: "10px", color: RG.text }}>{parseDateTH(f.date)}</td>
                      <td style={{ padding: "10px", color: RG.text }}>{f.detail || "-"}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: RG.text }}>
                        <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "12px", fontSize: 11, fontWeight: 600, background: RG.border, color: RG.textMuted }}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "60px", paddingTop: "20px", borderTop: `1px solid ${RG.border}`, fontSize: 11, color: RG.textMuted }}>
            <div>ระบบบริหารจัดการการขาย Sales_CRM</div>
            <div style={{ fontWeight: 600, letterSpacing: "0.5px" }}>CONFIDENTIAL</div>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div style={{ background: RG.surface, padding: "10px", borderRadius: "8px" }}>
        
        {/* ส่วน Header ของ Modal (ปุ่ม Tabs และปุ่ม Export) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["info", "followup"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${tab === t ? RG.primary : RG.border}`, background: tab === t ? RG.primary : RG.surface, color: tab === t ? RG.surface : RG.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Sarabun', sans-serif" }}>
                {t === "info" ? "ข้อมูลบริษัท" : `ประวัติการติดตาม (${fups.length})`}
              </button>
            ))}
          </div>
          
          {/* ปุ่ม Export JPG จะแสดงเฉพาะตอนที่ไม่ได้กดแก้ไขข้อมูลอยู่ */}
          {!editing && (
            <button 
              onClick={handleExportJPG} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: `1px solid ${RG.border}`, backgroundColor: "#f9f9f9", color: RG.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              📸 Export (JPG)
            </button>
          )}
        </div>

        <div style={{ minHeight: 550 }}>
        {tab === "info" && (
          <div>
            {/* Header Report Style */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: `2px solid ${RG.primary}`, paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: 50, height: 50, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: RG.surface, fontSize: 24 }}>Q</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: RG.primary, lineHeight: 1.2 }}>Sales_CRM</div>
                  <div style={{ fontSize: 13, color: RG.textMuted }}>Customer Profile Report</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: RG.text, letterSpacing: "0.5px", marginBottom: "4px" }}>เอกสารสรุปข้อมูลลูกค้า</div>
              </div>
            </div>

            {/* Company Info */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลองค์กร (Company Information)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: `1px solid ${RG.border}` }}>
                <tbody>
                  {[
                    { label: "ชื่อบริษัท", key: "companyName" },
                    { label: "เลขนิติบุคคล", key: "companyNumber" },
                    { label: "ผู้ติดต่อ", key: "contactName" },
                    { label: "เบอร์โทรศัพท์", key: "contactPhone" },
                    { label: "อีเมล", key: "contactEmail" },
                    { label: "จังหวัด", key: "province" },
                    { label: "รายละเอียด", key: "description" },
                  ].map((field) => (
                    <tr key={field.key}>
                      <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, width: "25%", borderBottom: `1px solid ${RG.border}` }}>{field.label}</td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}`, width: "75%" }}>
                        {editing ? (
                          <>
                            {field.key === "province" ? (
                              <select
                                value={form[field.key] || ""}
                                onChange={e => handleInputChange(field.key, e.target.value)}
                                style={{ ...inputStyle, width: "100%" }}
                              >
                                <option value="">-- เลือกจังหวัด --</option>
                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ) : (
                              <>
                                <input 
                                  value={form[field.key] || ""} 
                                  onChange={e => handleInputChange(field.key, e.target.value)} 
                                  style={{ ...inputStyle, width: "100%", borderColor: (field.key === "companyNumber" && taxIdError) ? "#ff4d4f" : inputStyle.border }} 
                                />
                                {field.key === "companyNumber" && taxIdError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{taxIdError}</div>}
                              </>
                            )}
                          </>
                        ) : (
                          <span>{form[field.key] || "-"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stage / Status */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>สถานะ Pipeline</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: `1px solid ${RG.border}` }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, width: "25%", borderBottom: `1px solid ${RG.border}` }}>Stage</td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>
                      {editing ? (
                        <select
                          value={form.stage || 'Contact'}
                          onChange={e => handleInputChange('stage', e.target.value)}
                          style={{ ...inputStyle, width: "100%" }}
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 600, color: RG.primary }}>{form.stage || 'Contact'}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, width: "25%", borderBottom: `1px solid ${RG.border}` }}>Status</td>
                    <td style={{ padding: "12px 16px", borderBottom: `1px solid ${RG.border}` }}>
                      {editing ? (
                        <select
                          value={form.latestStatus || ''}
                          onChange={e => handleInputChange('latestStatus', e.target.value)}
                          style={{ ...inputStyle, width: "100%" }}
                        >
                          <option value="">-- เลือก Status --</option>
                          {(STAGE_STATUS_MAP[form.stage || 'Contact'] || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span>{form.latestStatus || '-'}</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", background: RG.background, fontWeight: 600, width: "25%" }}>มูลค่าโครงการเสนอขาย (บาท)</td>
                    <td style={{ padding: "12px 16px" }}>
                      {editing ? (
                        <input
                          type="text"
                          value={formatNumberWithCommas(form.dealValue)}
                          onChange={e => handleInputChange('dealValue', parseNumberFromCommas(e.target.value))}
                          style={{ ...inputStyle, width: "100%" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: RG.text }}>{form.dealValue ? `${fmtNum(form.dealValue)} บาท` : "-"}</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Info */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลทางการเงิน (Financial Information)</div>
              <div style={{ display: "flex", gap: "16px" }}>
                {[
                  { label: "ทุนจดทะเบียน (บาท)", key: "registeredCapital", bg: RG.background, border: "#e9ecef", textBg: RG.textMuted, textVal: RG.text },
                  { label: "รายได้รวม (บาท)", key: "revenue", bg: "#f0fdf4", border: "#dcfce7", textBg: "#166534", textVal: RG.success },
                  { label: "กำไรสุทธิ (บาท)", key: "profit", bg: "#f0f9ff", border: "#e0f2fe", textBg: "#075985", textVal: RG.primary },
                ].map(item => (
                  <div key={item.key} style={{ flex: 1, background: item.bg, border: `1px solid ${item.border}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: item.textBg, marginBottom: "8px" }}>{item.label}</div>
                    {editing ? (
                      <input 
                        type="text" 
                        value={formatNumberWithCommas(form[item.key])} 
                        onChange={e => handleInputChange(item.key, parseNumberFromCommas(e.target.value))} 
                        style={{ ...inputStyle, width: "100%", textAlign: "center", fontSize: 18, fontWeight: 700 }} 
                      />
                    ) : (
                      <div style={{ fontSize: 22, fontWeight: 700, color: item.textVal }}>{form[item.key] ? fmtNum(form[item.key]) : "-"}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ซ่อนปุ่ม บันทึก/แก้ไข ตอน Export รูป หรือเมื่อเป็น readOnly */}
            <div data-html2canvas-ignore="true" style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {editing ? (
                <>
                  <Btn onClick={handleSaveInfo} disabled={!!taxIdError}>บันทึก</Btn>
                  <Btn variant="Third" onClick={() => { setForm({ ...lead }); setEditing(false); setTaxIdError(""); }}>ยกเลิก</Btn>
                </>
              ) : (
                !readOnly && <Btn variant="Third" onClick={() => setEditing(true)}>แก้ไข</Btn>
              )}
            </div>
          </div>
        )}

        {tab === "followup" && (
          <div>
            {fups.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: RG.text }}>
                    {["ครั้งที่", "วันที่", "รายละเอียด", "Stage", "สถานะ", "ติดตามครั้งถัดไป", "ไฟล์แนบ"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: RG.surface, fontSize: 13, fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...fups].sort((a, b) => b.sequence - a.sequence).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? RG.rowOdd : RG.rowEven }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{f.sequence}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{parseDateTH(f.date)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text, maxWidth: 250 }} title={f.detail}>
                        <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap" }}>
                          {f.detail}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text, fontWeight: 600 }}>{Object.entries(STAGE_STATUS_MAP).find(([_, statuses]) => statuses.includes(f.status))?.[0] || "-"}</td>
                      <td style={{ padding: "10px 12px" }}><StatusBadge status={f.status} /></td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{parseDateTH(f.nextFollowupDate)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>
                        {f.pdfFile && (
                          <a href={`${API_BASE_URL}/uploads/pdfs/${f.pdfFile}`} target="_blank" rel="noopener noreferrer" style={{ color: RG.primary, textDecoration: "underline" }}>ดูไฟล์ PDF</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* ซ่อนปุ่ม/ฟอร์มเพิ่มการติดตามตอน Export หรือเมื่อเป็น readOnly */}
            {!readOnly && (
              <div data-html2canvas-ignore="true">
                {!showFollowForm ? (
                  <Btn onClick={() => setShowFollowForm(true)}>+ เพิ่มการติดตาม</Btn>
                ) : (
                  <div style={{ background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: 12, padding: 20 }}>
                    <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14 }}>บันทึกการติดตามใหม่</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                      <Field label="ครั้งที่"><select value={fForm.sequence} onChange={e => setFForm(f => ({ ...f, sequence: Number(e.target.value) }))} style={selectStyle}>{Array.from({ length: 50 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
                      <Field label="วันที่"><input type="date" value={fForm.date} onChange={e => setFForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
                      <Field label="Status">
                        <select value={fForm.status} onChange={e => setFForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                          {Object.entries(STAGE_STATUS_MAP).map(([stage, statuses]) => (
                            <optgroup key={stage} label={`Stage: ${stage}`}>
                              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </Field>
                      <Field label="วันที่ติดตามครั้งถัดไป"><input type="date" value={fForm.nextFollowupDate} onChange={e => setFForm(f => ({ ...f, nextFollowupDate: e.target.value }))} style={inputStyle} /></Field>
                    </div>
                    <Field label="รายละเอียด"><textarea value={fForm.detail} onChange={e => setFForm(f => ({ ...f, detail: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
                    <Field label="แนบไฟล์สรุป (PDF) (ถ้ามี)">
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={e => setPdfFile(e.target.files[0])} 
                        style={{ ...inputStyle, padding: "4px 8px" }} 
                      />
                    </Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={() => { 
                        if (fForm.nextFollowupDate && fForm.date && fForm.nextFollowupDate < fForm.date) {
                          return toast.error("วันที่ติดตามครั้งถัดไป ห้ามอยู่ก่อน วันที่ติดต่อ");
                        }
                        const optionalStatuses = ['Won', 'Lost', 'ติดต่อไม่ได้'];
                        if (!optionalStatuses.includes(fForm.status) && !fForm.nextFollowupDate) {
                          return toast.error("กรุณาระบุ วันที่ติดตามครั้งถัดไป สำหรับสถานะนี้");
                        }
                        const formData = new FormData();
                        formData.append("sequence", fForm.sequence);
                        formData.append("date", fForm.date);
                        formData.append("status", fForm.status);
                        formData.append("detail", fForm.detail);
                        if (fForm.nextFollowupDate) formData.append("nextFollowupDate", fForm.nextFollowupDate);
                        if (pdfFile) formData.append("pdf_file", pdfFile);
                        
                        onSaveFollowup(lead.id, formData); 
                        setShowFollowForm(false); 
                        setFForm({ sequence: nextSeq + 1, date: today(), detail: "", status: defaultStatus, nextFollowupDate: "", completed: false }); 
                        setPdfFile(null);
                      }}>บันทึก</Btn>
                      <Btn variant="Third" onClick={() => setShowFollowForm(false)}>ยกเลิก</Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>

      </div>
    </div>
  );
}