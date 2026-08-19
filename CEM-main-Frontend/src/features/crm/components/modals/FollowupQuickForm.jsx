import React from "react";
import { useState } from "react";
import { STAGES, STAGE_STATUS_MAP } from "../../constants/status";
import { today } from "../../crmHelpers/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import { inputStyle, selectStyle } from "../common/styles";

export default function FollowupQuickForm({ lead, leadId, nextSeq, onSave }) {
  const defaultStage = lead?.stage || "Contact";
  const defaultStatusOptions = STAGE_STATUS_MAP[defaultStage] || [];
  const defaultStatus = defaultStatusOptions.length > 0 ? defaultStatusOptions[0] : "";

  const [f, setF] = useState({ sequence: nextSeq, date: today(), detail: "", stage: defaultStage, status: defaultStatus, nextFollowupDate: "" });
  const [pdfFile, setPdfFile] = useState(null);
  
  const up = (k, v) => setF(x => {
    const next = { ...x, [k]: v };
    if (k === "stage") {
      next.status = "";
    }
    return next;
  });

  const handleSave = () => {
    const formData = new FormData();
    formData.append("sequence", f.sequence);
    formData.append("date", f.date);
    formData.append("stage", f.stage);
    formData.append("status", f.status);
    formData.append("detail", f.detail);
    if (f.nextFollowupDate) formData.append("nextFollowupDate", f.nextFollowupDate);
    if (pdfFile) formData.append("pdf_file", pdfFile);
    onSave(leadId, formData);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="ครั้งที่"><select value={f.sequence} onChange={e => up("sequence", Number(e.target.value))} style={selectStyle}>{Array.from({ length: 50 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="วันที่"><input type="date" value={f.date} onChange={e => up("date", e.target.value)} style={inputStyle} /></Field>
      </div>

      <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 12 }}>
        <Field label="อัปเดต Stage">
          <select value={f.stage} onChange={e => up("stage", e.target.value)} style={{...selectStyle, fontWeight: "bold", background: "#fff"}}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="อัปเดต Status (อิงตาม Stage)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20, color: "#94a3b8" }}>↳</span>
            <div style={{ flex: 1 }}>
              <select value={f.status} onChange={e => up("status", e.target.value)} style={{ ...selectStyle, background: "#fff", borderColor: !f.status ? "#f59e0b" : undefined }}>
                <option value="">-- เลือก Status --</option>
                {(STAGE_STATUS_MAP[f.stage] || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {!f.status && <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 2 }}>⚠️ กรุณาเลือก Status ที่สอดคล้องกับ Stage</div>}
            </div>
          </div>
        </Field>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="วันที่ติดตามครั้งถัดไป"><input type="date" value={f.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="รายละเอียด"><textarea value={f.detail} onChange={e => up("detail", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="แนบไฟล์สรุป (PDF) (ถ้ามี)">
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={e => setPdfFile(e.target.files[0])} 
          style={{ ...inputStyle, padding: "4px 8px" }} 
        />
      </Field>
      <Btn onClick={handleSave} disabled={!f.status}>บันทึก</Btn>
    </div>
  );
}