import React, { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Btn from "../components/common/Btn";
import Field from "../components/common/Field";
import { RG } from "../constants/theme";
import { inputStyle, selectStyle } from "../components/common/styles";
import { formatPhoneNumber, formatNumberWithCommas, parseNumberFromCommas, today, PROVINCES } from "../crmHelpers/helpers";
import { STAGES, STAGE_STATUS_MAP } from "../constants/status";

import notify from "../../../utils/toast";

export default function AddLeadPage({ leads, addLead, allSellers, fetchAllSellers, currentUser }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    description: "",
    contactPhone: "",
    contactEmail: "",
    province: "",
    companyNumber: "",
    revenue: "",
    registeredCapital: "",
    profit: "",
    dealValue: "",
    stage: "Contact",
    latestStatus: "",
    latestContactDate: today(),
    nextFollowupDate: "",
    owner_id: ""
  });

  const canAssign = currentUser?.permissions?.leads?.assign;

  useEffect(() => {
    if (canAssign && fetchAllSellers) {
      fetchAllSellers();
    }
  }, [currentUser, fetchAllSellers, canAssign]);
  
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
      const isDuplicate = leads?.some(l => l.companyNumber === v && v.trim() !== "");
      setTaxIdError(isDuplicate ? "⚠️ เลขนิติบุคคลนี้มีอยู่ในระบบแล้ว!" : "");
    }
  };

  const handleSave = async () => {
    if (!form.province || !form.province.trim()) {
      notify.error("กรุณาเลือกจังหวัด");
      return;
    }
    if (!form.contactPhone || !form.contactPhone.trim()) {
      notify.error("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    if (form.contactName && /[^a-zA-Zก-๙0-9\s]/.test(form.contactName)) {
      notify.error("ชื่อผู้ติดต่อห้ามมีตัวอักษรพิเศษ");
      return;
    }
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
    
    try {
      if (addLead) {
        const success = await addLead(payload);
        if (success) {
          navigate("/leads");
        }
      }
    } catch (err) {
      console.error(err);
      notify.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const statusOptions = STAGE_STATUS_MAP[form.stage] || [];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 32, borderBottom: `1px solid ${RG.border}`, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: "none", border: "none", color: RG.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 12, padding: 0, transition: "color 0.15s ease" }}
            onMouseOver={e => e.currentTarget.style.color = RG.primary}
            onMouseOut={e => e.currentTarget.style.color = RG.textMuted}
          >
            ← ย้อนกลับ
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: RG.surface, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flexShrink: 0 }}>
              <UserPlus size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, color: RG.text, fontFamily: "'Sarabun', sans-serif" }}>เพิ่มลีดใหม่</h1>
              <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontSize: 15 }}>กรอกข้อมูลลีดใหม่เพื่อติดตามและสร้างยอดขาย</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr", 
        gap: 32 
      }}>
        
        {/* Section 1: ข้อมูลบริษัท */}
        <section style={{ background: RG.surface, padding: 32, borderRadius: 16, border: `1px solid ${RG.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 18, color: RG.text, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${RG.border}`, fontWeight: 600 }}>1. ข้อมูลนิติบุคคลและบริษัท</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <Field label="เลขนิติบุคคล (13 หลัก)">
              <input maxLength={13} 
                value={form.companyNumber} 
                onChange={e => up("companyNumber", e.target.value)} 
                placeholder="0123456789012"
                style={{ 
                  ...inputStyle, 
                  borderColor: taxIdError ? "#ef4444" : inputStyle.border,
                  backgroundColor: taxIdError ? "#fef2f2" : undefined
                }} 
              />
              {taxIdError && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>{taxIdError}</div>}
            </Field>
            <Field label="ชื่อบริษัท *">
              <input value={form.companyName} onChange={e => up("companyName", e.target.value)} style={inputStyle} placeholder="ระบุชื่อบริษัท" />
            </Field>
            <Field label="จังหวัด *">
              <select value={form.province} onChange={e => up("province", e.target.value)} style={selectStyle}>
                <option value="" disabled>-- เลือกจังหวัด --</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Section 2: ข้อมูลผู้ติดต่อ */}
        <section style={{ background: RG.surface, padding: 32, borderRadius: 16, border: `1px solid ${RG.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 18, color: RG.text, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${RG.border}`, fontWeight: 600 }}>2. ข้อมูลผู้ติดต่อ</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <Field label="ชื่อผู้ติดต่อ">
              <input value={form.contactName} onChange={e => up("contactName", e.target.value)} style={inputStyle} placeholder="ไม่ต้องมีคำนำหน้า" />
            </Field>
            <Field label="เบอร์โทรศัพท์ *">
              <input value={formatPhoneNumber(form.contactPhone)} onChange={e => up("contactPhone", formatPhoneNumber(e.target.value))} style={inputStyle} placeholder="08X-XXX-XXXX" />
            </Field>
            <Field label="อีเมล">
              <input type="email" value={form.contactEmail} onChange={e => up("contactEmail", e.target.value)} style={inputStyle} placeholder="contact@company.com" />
            </Field>
            <Field label="รายละเอียด / หมายเหตุ" style={{ gridColumn: "1 / -1" }}>
              <input value={form.description} onChange={e => up("description", e.target.value)} style={inputStyle} placeholder="ข้อมูลเพิ่มเติม..." />
            </Field>
          </div>
        </section>

        {/* Section 3: สถานะและการติดตาม */}
        <section style={{ background: RG.surface, padding: 32, borderRadius: 16, border: `1px solid ${RG.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h2 style={{ fontSize: 18, color: RG.text, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${RG.border}`, fontWeight: 600 }}>3. สถานะและการติดตาม</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 }}>
            <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <Field label="Stage (ขั้นตอนการขาย) *">
                <select value={form.stage} onChange={e => up("stage", e.target.value)} style={{...selectStyle, fontWeight: 600, background: "#fff", borderColor: RG.primary, color: RG.primary}}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Status (สถานะปัจจุบัน) *">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ fontSize: 18, color: "#94a3b8", display: "flex", alignItems: "center", paddingBottom: 8 }}>↳</div>
                  <div style={{ flex: 1 }}>
                    <select 
                      value={form.latestStatus} 
                      onChange={e => up("latestStatus", e.target.value)} 
                      style={{ ...selectStyle, background: "#fff", borderColor: !form.latestStatus ? "#f59e0b" : RG.border }}
                    >
                      <option value="" disabled>-- เลือก Status --</option>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {!form.latestStatus && <div style={{ color: "#d97706", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>⚠️ กรุณาเลือก Status ที่สอดคล้องกับ Stage</div>}
                  </div>
                </div>
              </Field>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              <Field label="วันที่ติดต่อล่าสุด">
                <input type="date" value={form.latestContactDate} onChange={e => up("latestContactDate", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="วันที่ติดตามครั้งถัดไป">
                <input type="date" value={form.nextFollowupDate} onChange={e => up("nextFollowupDate", e.target.value)} style={{ ...inputStyle, borderColor: RG.primaryLight }} />
              </Field>
            </div>
          </div>

          {canAssign && (
            <div style={{ borderTop: `1px dashed ${RG.border}`, paddingTop: 24 }}>
              <Field label="ผู้รับผิดชอบ (เซลส์)">
                <select value={form.owner_id} onChange={e => up("owner_id", e.target.value)} style={{...selectStyle, maxWidth: 400}}>
                  <option value="">-- เลือกเซลส์ (ค่าเริ่มต้นคือตัวคุณเอง) --</option>
                  {allSellers?.map(s => (
                    <option key={s.id} value={s.id}>{s.username}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </section>

        {/* Section 4: ข้อมูลทางการเงิน */}
        <section style={{ background: RG.surface, padding: 32, borderRadius: 16, border: `1px solid ${RG.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, color: RG.text, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${RG.border}`, fontWeight: 600 }}>4. ข้อมูลทางการเงิน</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            <Field label="มูลค่าโครงการ (บาท)">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: RG.textMuted }}>฿</span>
                <input type="text" value={formatNumberWithCommas(form.dealValue)} onChange={e => up("dealValue", parseNumberFromCommas(e.target.value))} style={{...inputStyle, paddingLeft: 32, fontWeight: 500, color: RG.primary}} placeholder="0" />
              </div>
            </Field>
            <Field label="รายได้รวมบริษัท (บาท)">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: RG.textMuted }}>฿</span>
                <input type="text" value={formatNumberWithCommas(form.revenue)} onChange={e => up("revenue", parseNumberFromCommas(e.target.value))} style={{...inputStyle, paddingLeft: 32}} placeholder="0" />
              </div>
            </Field>
            <Field label="ทุนจดทะเบียน (บาท)">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: RG.textMuted }}>฿</span>
                <input type="text" value={formatNumberWithCommas(form.registeredCapital)} onChange={e => up("registeredCapital", parseNumberFromCommas(e.target.value))} style={{...inputStyle, paddingLeft: 32}} placeholder="0" />
              </div>
            </Field>
            <Field label="กำไรสุทธิ (บาท)">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: RG.textMuted }}>฿</span>
                <input type="text" value={formatNumberWithCommas(form.profit)} onChange={e => up("profit", parseNumberFromCommas(e.target.value))} style={{...inputStyle, paddingLeft: 32}} placeholder="0" />
              </div>
            </Field>
          </div>
        </section>
      </div>

      {/* Sticky Footer for Buttons */}
      <div style={{
        position: "sticky",
        bottom: 20,
        background: RG.surface,
        padding: "20px 32px",
        borderRadius: "16px",
        border: `1px solid ${RG.border}`,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        marginTop: 24,
        display: "flex",
        justifyContent: "flex-end",
        gap: 16,
        zIndex: 100
      }}>
        <Btn variant="Third" onClick={() => navigate(-1)} style={{ minWidth: 120 }}>ยกเลิก</Btn>
        <Btn onClick={handleSave} disabled={!!taxIdError} style={{ minWidth: 160 }}>บันทึกข้อมูลลีด</Btn>
      </div>

    </div>
  );
}
