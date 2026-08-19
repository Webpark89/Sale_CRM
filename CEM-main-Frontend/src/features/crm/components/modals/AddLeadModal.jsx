import React, { useState } from "react";
import notify from "../../../../utils/toast";

import { STAGES, STAGE_STATUS_MAP } from "../../constants/status";
import { today, formatNumberWithCommas, parseNumberFromCommas, formatPhoneNumber, PROVINCES } from "../../crmHelpers/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import Modal from "../common/Modal";
import { inputStyle, selectStyle } from "../common/styles";

export default function AddLeadModal({ onClose, onSave, leads = [], currentUser, allSellers, fetchAllSellers }) {
  const [form, setForm] = useState({ 
    companyName: "", companyNumber: "", contactName: "", description: "", contactPhone: "", 
    contactEmail: "", province: "", revenue: "", registeredCapital: "", profit: "", 
    dealValue: "",
    stage: "Contact",
    latestStatus: "",
    latestContactDate: today(), nextFollowupDate: "",
    owner_id: ""
  });

  const canAssign = currentUser?.permissions?.leads?.assign;

  React.useEffect(() => {
    if (canAssign) {
      if (fetchAllSellers) fetchAllSellers();
    }
  }, [currentUser, fetchAllSellers]);
  
  const [taxIdError, setTaxIdError] = useState("");

  const up = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      // ถ้าเปลี่ยน stage ให้ reset latestStatus รอให้ sales เลือกเอง
      if (k === "stage") {
        next.latestStatus = "";
      }
      return next;
    });
    
    if (k === "companyNumber") {
      const isDuplicate = leads.some(l => l.companyNumber === v && v.trim() !== "");
      setTaxIdError(isDuplicate ? "⚠️ เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว!" : "");
    }
  };

  const handleSave = () => {
    if (taxIdError) {
      notify.error("ไม่สามารถบันทึกได้ เนื่องจากเลขนิติบุคคลซ้ำในระบบ");
      return;
    }
    if (!form.companyName.trim()) {
      notify.error("กรุณากรอกชื่อบริษัทให้ครบถ้วน");
      return;
    }
    if (!form.stage) {
      notify.error("กรุณาเลือก Stage");
      return;
    }
    if (!form.latestStatus) {
      notify.error("กรุณาเลือก Status");
      return;
    }
    const payload = { ...form };
    if (!canAssign || !payload.owner_id) {
      delete payload.owner_id;
    }
    onSave(payload);
  };

  const statusOptions = STAGE_STATUS_MAP[form.stage] || [];

  return (
    <Modal title="เพิ่มลีดใหม่" onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        
        <Field label="เลขนิติบุคคล">
          <input maxLength={13} 
            value={form.companyNumber} 
            onChange={e => up("companyNumber", e.target.value)} 
            style={{ 
              ...inputStyle, 
              borderColor: taxIdError ? "#ff4d4f" : inputStyle.border
            }} 
          />
          {taxIdError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{taxIdError}</div>}
        </Field>

        <Field label="ชื่อบริษัท *"><input value={form.companyName} onChange={e => up("companyName", e.target.value)} style={inputStyle} /></Field>
        <Field label="ชื่อผู้ติดต่อ"><input value={form.contactName} onChange={e => up("contactName", e.target.value)} style={inputStyle} /></Field>
        <Field label="รายละเอียด"><input value={form.description} onChange={e => up("description", e.target.value)} style={inputStyle} /></Field>
        <Field label="เบอร์โทร"><input value={formatPhoneNumber(form.contactPhone)} onChange={e => up("contactPhone", formatPhoneNumber(e.target.value))} style={inputStyle} /></Field>
        <Field label="อีเมล"><input value={form.contactEmail} onChange={e => up("contactEmail", e.target.value)} style={inputStyle} /></Field>
        <Field label="จังหวัด">
          <select value={form.province} onChange={e => up("province", e.target.value)} style={selectStyle}>
            <option value="">-- เลือกจังหวัด --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>

        {canAssign && (
          <Field label="ผู้รับผิดชอบ (เซลส์)">
            <select value={form.owner_id} onChange={e => up("owner_id", e.target.value)} style={selectStyle}>
              <option value="">-- เลือกผู้รับผิดชอบ (ค่าเริ่มต้นคือตัวคุณเอง) --</option>
              {allSellers?.map(s => (
                <option key={s.id} value={s.id}>{s.username}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Stage & Status grouped together */}
        <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
          <Field label="Stage *">
            <select value={form.stage} onChange={e => up("stage", e.target.value)} style={{...selectStyle, fontWeight: "bold", background: "#fff"}}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Status (อิงตาม Stage) *">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, color: "#94a3b8" }}>↳</span>
              <div style={{ flex: 1 }}>
                <select 
                  value={form.latestStatus} 
                  onChange={e => up("latestStatus", e.target.value)} 
                  style={{ ...selectStyle, background: "#fff", borderColor: !form.latestStatus ? "#f59e0b" : undefined }}
                >
                  <option value="">-- เลือก Status --</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {!form.latestStatus && <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 2 }}>⚠️ กรุณาเลือก Status ที่สอดคล้องกับ Stage</div>}
              </div>
            </div>
          </Field>
        </div>

        <Field label="มูลค่าโครงการ (บาท)">
          <input type="text" value={formatNumberWithCommas(form.dealValue)} onChange={e => up("dealValue", parseNumberFromCommas(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="รายได้รวม (บาท)">
          <input type="text" value={formatNumberWithCommas(form.revenue)} onChange={e => up("revenue", parseNumberFromCommas(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="ทุนจดทะเบียน (บาท)">
          <input type="text" value={formatNumberWithCommas(form.registeredCapital)} onChange={e => up("registeredCapital", parseNumberFromCommas(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="กำไร (บาท)">
          <input type="text" value={formatNumberWithCommas(form.profit)} onChange={e => up("profit", parseNumberFromCommas(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="วันที่ติดต่อล่าสุด"><input type="date" value={form.latestContactDate} onChange={e => up("latestContactDate", e.target.value)} style={inputStyle} /></Field>
        <Field label="วันที่ติดตามครั้งถัดไป"><input type="date" value={form.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn onClick={handleSave} disabled={!!taxIdError}>บันทึก</Btn>
        <Btn variant="Third" onClick={onClose}>ยกเลิก</Btn>
      </div>
    </Modal>
  );
}