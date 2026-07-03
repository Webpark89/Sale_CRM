import React, { useState, useRef } from "react";
import toast from 'react-hot-toast';
import html2canvas from "html2canvas"; // ⚠️ อย่าลืม import html2canvas
import { RG } from "../../constants/theme";
import { STATUSES } from "../../constants/status";
import { parseDateTH, today, fmtNum, formatNumberWithCommas, parseNumberFromCommas } from "../../crmHelpers/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { inputStyle, selectStyle } from "../common/styles";

export default function CompanyModal({ lead, leads = [], followups, onClose, onSave, onSaveFollowup, readOnly = false, allSellers = [], fetchAllSellers, handleReassign, setReassignConfirm, currentUser }) {
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [showFollowForm, setShowFollowForm] = useState(false);
  
  const [taxIdError, setTaxIdError] = useState("");
  
  // 1. สร้าง Ref สำหรับกำหนดกรอบพื้นที่ที่จะ Export เป็นภาพ
  const exportRef = useRef(null);

  const fups = followups[lead.id] || [];
  const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
  const [fForm, setFForm] = useState({ sequence: nextSeq, date: today(), detail: "", status: STATUSES[0], nextFollowupDate: "", completed: false });

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

  const handleSaveInfo = () => {
    if (taxIdError) {
      toast.error("ไม่สามารถบันทึกได้ เนื่องจากเลขนิติบุคคลซ้ำในระบบ");
      return;
    }
    onSave(form);
    setEditing(false);
  };

  // 2. ฟังก์ชัน Export JPG
  const handleExportJPG = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        scale: 2, // เพิ่มความคมชัด
        backgroundColor: "#ffffff"
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
    <Modal title={lead.companyName} onClose={onClose} wide>
      
      {/* Hidden Export Template */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", zIndex: -100 }}>
        <div 
          ref={exportRef} 
          style={{ 
            background: "#fff", 
            padding: "50px", 
            width: "800px", 
            boxSizing: "border-box", 
            fontFamily: "'Sarabun', sans-serif" 
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: `2px solid ${RG.primary}`, paddingBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: 50, height: 50, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 24 }}>Q</div>
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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #e2e8f0" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, width: "25%", borderBottom: "1px solid #e2e8f0" }}>ชื่อบริษัท</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", width: "75%" }}>{lead.companyName || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>เลขนิติบุคคล</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>{lead.companyNumber || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>ผู้ติดต่อ</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>{lead.contactName || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>เบอร์โทรศัพท์</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>{lead.contactPhone || "-"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>อีเมล</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>{lead.contactEmail || "-"}</td>
                </tr>
                {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                  <tr>
                    <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>เซลผู้ดูแล</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: RG.primaryMid, fontWeight: 600 }}>
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
                  <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600 }}>รายละเอียด</td>
                  <td style={{ padding: "12px 16px" }}>{lead.description || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Info */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลทางการเงิน (Financial Information)</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: RG.textMuted, marginBottom: "8px" }}>ทุนจดทะเบียน (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RG.text }}>{lead.registeredCapital ? fmtNum(lead.registeredCapital) : "-"}</div>
              </div>
              <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#166534", marginBottom: "8px" }}>รายได้รวม (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#15803d" }}>{lead.revenue ? fmtNum(lead.revenue) : "-"}</div>
              </div>
              <div style={{ flex: 1, background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#075985", marginBottom: "8px" }}>กำไรสุทธิ (บาท)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0369a1" }}>{lead.profit ? fmtNum(lead.profit) : "-"}</div>
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
                    <th style={{ padding: "10px", textAlign: "center", width: "10%", color: "#fff" }}>ครั้งที่</th>
                    <th style={{ padding: "10px", textAlign: "left", width: "20%", color: "#fff" }}>วันที่</th>
                    <th style={{ padding: "10px", textAlign: "left", width: "40%", color: "#fff" }}>รายละเอียด</th>
                    <th style={{ padding: "10px", textAlign: "center", width: "30%", color: "#fff" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {[...fups].sort((a, b) => b.sequence - a.sequence).map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", textAlign: "center", color: RG.textMuted }}>{f.sequence}</td>
                      <td style={{ padding: "10px", color: RG.text }}>{parseDateTH(f.date)}</td>
                      <td style={{ padding: "10px", color: RG.text }}>{f.detail || "-"}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: RG.text }}>
                        <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "12px", fontSize: 11, fontWeight: 600, background: "#eee", color: "#666" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", fontSize: 11, color: RG.textMuted }}>
            <div>ระบบบริหารจัดการการขาย Sales_CRM</div>
            <div style={{ fontWeight: 600, letterSpacing: "0.5px" }}>CONFIDENTIAL</div>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div style={{ background: "#fff", padding: "10px", borderRadius: "8px" }}>
        
        {/* ส่วน Header ของ Modal (ปุ่ม Tabs และปุ่ม Export) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["info", "followup"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: `2px solid ${tab === t ? RG.primary : RG.border}`, background: tab === t ? RG.gradient : "#fff", color: tab === t ? "#fff" : RG.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Sarabun', sans-serif" }}>
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

        {tab === "info" && (
          <div>
            {/* Header Report Style */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", borderBottom: `2px solid ${RG.primary}`, paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: 50, height: 50, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 24 }}>Q</div>
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #e2e8f0" }}>
                <tbody>
                  {[
                    { label: "ชื่อบริษัท", key: "companyName" },
                    { label: "เลขนิติบุคคล", key: "companyNumber" },
                    { label: "ผู้ติดต่อ", key: "contactName" },
                    { label: "เบอร์โทรศัพท์", key: "contactPhone" },
                    { label: "อีเมล", key: "contactEmail" },
                    { label: "รายละเอียด", key: "description" },
                  ].map((field) => (
                    <tr key={field.key}>
                      <td style={{ padding: "12px 16px", background: "#f8f9fa", fontWeight: 600, width: "25%", borderBottom: "1px solid #e2e8f0" }}>{field.label}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", width: "75%" }}>
                        {editing ? (
                          <>
                            <input 
                              value={form[field.key] || ""} 
                              onChange={e => handleInputChange(field.key, e.target.value)} 
                              style={{ ...inputStyle, width: "100%", borderColor: (field.key === "companyNumber" && taxIdError) ? "#ff4d4f" : inputStyle.border }} 
                            />
                            {field.key === "companyNumber" && taxIdError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{taxIdError}</div>}
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

            {/* Financial Info */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>ข้อมูลทางการเงิน (Financial Information)</div>
              <div style={{ display: "flex", gap: "16px" }}>
                {[
                  { label: "ทุนจดทะเบียน (บาท)", key: "registeredCapital", bg: "#f8f9fa", border: "#e9ecef", textBg: RG.textMuted, textVal: RG.text },
                  { label: "รายได้รวม (บาท)", key: "revenue", bg: "#f0fdf4", border: "#dcfce7", textBg: "#166534", textVal: "#15803d" },
                  { label: "กำไรสุทธิ (บาท)", key: "profit", bg: "#f0f9ff", border: "#e0f2fe", textBg: "#075985", textVal: "#0369a1" },
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
                    {["ครั้งที่", "วันที่", "รายละเอียด", "สถานะ", "ติดตามครั้งถัดไป"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontSize: 13, fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...fups].sort((a, b) => b.sequence - a.sequence).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? RG.rowOdd : RG.rowEven }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{f.sequence}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{parseDateTH(f.date)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text, maxWidth: 200 }}>{f.detail}</td>
                      <td style={{ padding: "10px 12px" }}><StatusBadge status={f.status} /></td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: RG.text }}>{parseDateTH(f.nextFollowupDate)}</td>
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
                  <div style={{ background: "#ffffff", border: `1px solid ${RG.border}`, borderRadius: 12, padding: 20 }}>
                    <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14 }}>บันทึกการติดตามใหม่</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                      <Field label="ครั้งที่"><select value={fForm.sequence} onChange={e => setFForm(f => ({ ...f, sequence: Number(e.target.value) }))} style={selectStyle}>{Array.from({ length: 50 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
                      <Field label="วันที่"><input type="date" value={fForm.date} onChange={e => setFForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
                      <Field label="สถานะ"><select value={fForm.status} onChange={e => setFForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
                      <Field label="วันที่ติดตามครั้งถัดไป"><input type="date" value={fForm.nextFollowupDate} onChange={e => setFForm(f => ({ ...f, nextFollowupDate: e.target.value }))} style={inputStyle} /></Field>
                    </div>
                    <Field label="รายละเอียด"><textarea value={fForm.detail} onChange={e => setFForm(f => ({ ...f, detail: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={() => { onSaveFollowup(lead.id, fForm); setShowFollowForm(false); setFForm({ sequence: nextSeq + 1, date: today(), detail: "", status: STATUSES[0], nextFollowupDate: "", completed: false }); }}>บันทึก</Btn>
                      <Btn variant="Third" onClick={() => setShowFollowForm(false)}>ยกเลิก</Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}