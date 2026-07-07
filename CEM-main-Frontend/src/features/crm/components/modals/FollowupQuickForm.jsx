import React from "react";
import { useState } from "react";
import { STATUSES } from "../../constants/status";
import { today } from "../../crmHelpers/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import { inputStyle, selectStyle } from "../common/styles";

export default function FollowupQuickForm({ leadId, nextSeq, onSave }) {
  const [f, setF] = useState({ sequence: nextSeq, date: today(), detail: "", status: STATUSES[0], nextFollowupDate: "" });
  const [pdfFile, setPdfFile] = useState(null);
  const up = (k, v) => setF(x => ({ ...x, [k]: v }));

  const handleSave = () => {
    const formData = new FormData();
    formData.append("sequence", f.sequence);
    formData.append("date", f.date);
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
        <Field label="สถานะ"><select value={f.status} onChange={e => up("status", e.target.value)} style={selectStyle}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
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
      <Btn onClick={handleSave}>บันทึก</Btn>
    </div>
  );
}