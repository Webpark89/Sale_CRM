import React, { useState, useRef } from "react";
import html2canvas from "html2canvas"; // ⚠️ อย่าลืม import html2canvas
import { RG } from "../../constants/theme";
import { STATUSES } from "../../constants/status";
import { parseDateTH, today, fmtNum } from "../../utils/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";
import { inputStyle, selectStyle } from "../common/styles";

export default function CompanyModal({ lead, leads = [], followups, onClose, onSave, onSaveFollowup }) {
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
      alert("ไม่สามารถบันทึกได้ เนื่องจากเลขนิติบุคคลซ้ำในระบบ");
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
      alert("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <Modal title={lead.companyName} onClose={onClose} wide>
      
      {/* 3. คลุมพื้นที่ทั้งหมดด้วย exportRef เพื่อให้ html2canvas ถ่ายรูปตรงนี้ */}
      <div ref={exportRef} style={{ background: "#fff", padding: "10px", borderRadius: "8px" }}>
        
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              {["companyNumber", "companyName", "contactName", "contactPhone", "contactEmail"].map((key, index) => {
                const labels = ["เลขนิติบุคคล", "ชื่อบริษัท", "ชื่อผู้ติดต่อ", "เบอร์โทร", "อีเมล"];
                const lbl = labels[index];
                
                if (key === "companyNumber") {
                  return (
                    <Field key={key} label={lbl}>
                      {editing ? (
                        <>
                          <input 
                            value={form[key] || ""} 
                            onChange={e => handleInputChange(key, e.target.value)} 
                            style={{ ...inputStyle, borderColor: taxIdError ? "#ff4d4f" : inputStyle.border }} 
                          />
                          {taxIdError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{taxIdError}</div>}
                        </>
                      ) : (
                        <p style={{ margin: 0, padding: "6px 0", color: RG.text, fontSize: 14 }}>{form[key] || "—"}</p>
                      )}
                    </Field>
                  );
                }

                return (
                  <Field key={key} label={lbl}>
                    {editing ? <input value={form[key] || ""} onChange={e => handleInputChange(key, e.target.value)} style={inputStyle} /> : <p style={{ margin: 0, padding: "6px 0", color: RG.text, fontSize: 14 }}>{form[key] || "—"}</p>}
                  </Field>
                );
              })}
              
              {["revenue", "registeredCapital", "profit"].map((key, index) => {
                const labels = ["รายได้รวม (บาท)", "ทุนจดทะเบียน (บาท)", "กำไร (บาท)"];
                const lbl = labels[index];
                return (
                  <Field key={key} label={lbl}>
                    {editing ? <input type="number" value={form[key] || ""} onChange={e => handleInputChange(key, Number(e.target.value))} style={inputStyle} /> : <p style={{ margin: 0, padding: "6px 0", color: RG.text, fontSize: 14 }}>{fmtNum(form[key])}</p>}
                  </Field>
                );
              })}
            </div>
            
            {/* ซ่อนปุ่ม บันทึก/แก้ไข ตอน Export รูป (html2canvas จะมี data-html2canvas-ignore ได้ แต่วิธีนี้ชัวร์กว่า) */}
            <div data-html2canvas-ignore="true" style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {editing ? (
                <>
                  <Btn onClick={handleSaveInfo} disabled={!!taxIdError}>บันทึก</Btn>
                  <Btn variant="secondary" onClick={() => { setForm({ ...lead }); setEditing(false); setTaxIdError(""); }}>ยกเลิก</Btn>
                </>
              ) : (
                <Btn variant="secondary" onClick={() => setEditing(true)}>แก้ไข</Btn>
              )}
            </div>
          </div>
        )}

        {tab === "followup" && (
          <div>
            {fups.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: RG.gradient }}>
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
            
            {/* ซ่อนปุ่ม/ฟอร์มเพิ่มการติดตามตอน Export */}
            <div data-html2canvas-ignore="true">
              {!showFollowForm ? (
                <Btn onClick={() => setShowFollowForm(true)}>+ เพิ่มการติดตาม</Btn>
              ) : (
                <div style={{ background: "#FFF9FA", border: `1px solid ${RG.border}`, borderRadius: 12, padding: 20 }}>
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
                    <Btn variant="secondary" onClick={() => setShowFollowForm(false)}>ยกเลิก</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}