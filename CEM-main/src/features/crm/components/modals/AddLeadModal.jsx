import React, { useState } from "react";
import { STATUSES } from "../../constants/status";
import { today } from "../../utils/helpers";
import Btn from "../common/Btn";
import Field from "../common/Field";
import Modal from "../common/Modal";
import { inputStyle, selectStyle } from "../common/styles";

// 1. เพิ่ม props `leads` เข้ามาเพื่อใช้ตรวจสอบข้อมูลที่มีอยู่แล้ว
export default function AddLeadModal({ onClose, onSave, leads = [] }) {
  const [form, setForm] = useState({ 
    companyName: "", companyNumber: "", contactName: "", contactPhone: "", 
    contactEmail: "", revenue: "", registeredCapital: "", profit: "", 
    latestStatus: STATUSES[0], latestContactDate: today(), nextFollowupDate: "" 
  });
  
  // 2. เพิ่ม State สำหรับเก็บข้อความแจ้งเตือน Error
  const [taxIdError, setTaxIdError] = useState("");

  const up = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    
    // 3. ตรวจสอบเลขนิติบุคคลซ้ำแบบ Real-time
    if (k === "companyNumber") {
      // ตรวจสอบว่าใน leads มีเลขนิติบุคคลนี้หรือยัง (ละเว้นช่องว่างเปล่า)
      const isDuplicate = leads.some(l => l.companyNumber === v && v.trim() !== "");
      if (isDuplicate) {
        setTaxIdError("⚠️ เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว!");
      } else {
        setTaxIdError("");
      }
    }
  };

  // 4. สร้างฟังก์ชันกดบันทึก เพื่อดักจับ Error ก่อนส่งข้อมูล
  const handleSave = () => {
    if (taxIdError) {
      alert("ไม่สามารถบันทึกได้ เนื่องจากเลขนิติบุคคลซ้ำในระบบ");
      return;
    }
    // ดักข้อมูลบังคับกรอก (มีเครื่องหมาย *)
    if (!form.companyNumber.trim() || !form.companyName.trim()) {
      alert("กรุณากรอกเลขนิติบุคคลและชื่อบริษัทให้ครบถ้วน");
      return;
    }
    
    onSave(form);
  };

  return (
    <Modal title="เพิ่มลีดใหม่" onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        
        {/* 5. ปรับปรุงช่องเลขนิติบุคคลให้แสดง Error */}
        <Field label="เลขนิติบุคคล *">
          <input 
            value={form.companyNumber} 
            onChange={e => up("companyNumber", e.target.value)} 
            style={{ 
              ...inputStyle, 
              borderColor: taxIdError ? "#ff4d4f" : inputStyle.border // เปลี่ยนสีกรอบเป็นสีแดงถ้าซ้ำ
            }} 
          />
          {/* แสดงข้อความแจ้งเตือนใต้ช่องกรอก */}
          {taxIdError && <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>{taxIdError}</div>}
        </Field>

        <Field label="ชื่อบริษัท *"><input value={form.companyName} onChange={e => up("companyName", e.target.value)} style={inputStyle} /></Field>
        <Field label="ชื่อผู้ติดต่อ"><input value={form.contactName} onChange={e => up("contactName", e.target.value)} style={inputStyle} /></Field>
        <Field label="เบอร์โทร"><input value={form.contactPhone} onChange={e => up("contactPhone", e.target.value)} style={inputStyle} /></Field>
        <Field label="อีเมล"><input value={form.contactEmail} onChange={e => up("contactEmail", e.target.value)} style={inputStyle} /></Field>
        <Field label="สถานะ"><select value={form.latestStatus} onChange={e => up("latestStatus", e.target.value)} style={selectStyle}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
        <Field label="รายได้รวม (บาท)"><input type="number" value={form.revenue} onChange={e => up("revenue", e.target.value)} style={inputStyle} /></Field>
        <Field label="ทุนจดทะเบียน (บาท)"><input type="number" value={form.registeredCapital} onChange={e => up("registeredCapital", e.target.value)} style={inputStyle} /></Field>
        <Field label="กำไร (บาท)"><input type="number" value={form.profit} onChange={e => up("profit", e.target.value)} style={inputStyle} /></Field>
        <Field label="วันที่ติดต่อล่าสุด"><input type="date" value={form.latestContactDate} onChange={e => up("latestContactDate", e.target.value)} style={inputStyle} /></Field>
        <Field label="วันที่ติดตามครั้งถัดไป"><input type="date" value={form.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {/* 6. ผูกฟังก์ชัน handleSave และปิดปุ่มกดหากมี Error */}
        <Btn onClick={handleSave} disabled={!!taxIdError}>บันทึก</Btn>
        <Btn variant="secondary" onClick={onClose}>ยกเลิก</Btn>
      </div>
    </Modal>
  );
}