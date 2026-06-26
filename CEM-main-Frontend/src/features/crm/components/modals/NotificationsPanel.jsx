import React, { useState } from "react";
import { RG } from "../../constants/theme";
import { parseDateTH, today } from "../../crmHelpers/helpers";
import Btn from "../common/Btn";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";

const PRIORITY_WEIGHT = {
  "ปิดการขาย": 7,
  "ด่วนมาก": 6,
  "มีตติ้ง": 5,
  "ต้องตามต่อ": 4,
  "ฝากโปรไฟล์": 3,
  "ทั่วไป": 2,
  "ติดต่อไม่ได้": 1,
  "ไม่สนใจ": 0
};

export default function NotificationsPanel({ leads, onMarkDone, onViewLead, onClose }) {
  // 1. เพิ่ม State สำหรับเก็บวันที่คัดกรอง (ค่าเริ่มต้นคือวันนี้)
  const [filterDate, setFilterDate] = useState(today());

  // 2. กรองรายการให้ตรงกับวันที่ที่เลือก
  // ถ้าเลือกวันที่ = วันนี้ (ค่าเริ่มต้น) จะแสดงทั้งวันนี้และงานค้างจากวันก่อนหน้า (Overdue)
  // ถ้าเลือกวันที่อื่น จะกรองเฉพาะวันนั้นเท่านั้น
  const isDefaultDate = filterDate === today();
  const due = leads
    .filter(l => {
      if (!l.nextFollowupDate) return false;
      if (isDefaultDate) {
        // แสดงงานค้าง (overdue) + งานวันนี้
        return l.nextFollowupDate <= today();
      }
      // กรณีเลือกวันที่อื่น: เช็กตรงๆ
      const targetDate = filterDate || today();
      return l.nextFollowupDate === targetDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.nextFollowupDate).getTime();
      const dateB = new Date(b.nextFollowupDate).getTime();
      
      // เรียงตามวันที่ก่อน (ค้างนานให้อยู่ล่างสุด = เรียงจากมากไปน้อย)
      if (dateA !== dateB) {
        return dateB - dateA;
      }

      // ถ้าวันที่เท่ากัน ให้เรียงตามความสำคัญของสถานะ
      const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
      const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
      return weightB - weightA; 
    });

  return (
    <Modal title={isDefaultDate ? `แจ้งเตือนการติดตาม — วันนี้ + ค้าง (${due.length} รายการ)` : `แจ้งเตือนการติดตาม (${due.length} รายการ)`} onClose={onClose}>
      
      {/* 3. เพิ่มส่วนคัดกรองวันที่ (Date Picker) */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px", background: RG.surface, borderRadius: 8, border: `1px solid ${RG.border}` }}>
        <span style={{ fontSize: 14, color: RG.text, fontWeight: 600 }}>เลือกวันที่:</span>
        <input 
          type="date" 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${RG.border}`,
            fontFamily: "'Sarabun', sans-serif",
            color: RG.text,
            outline: "none"
          }}
        />
        {/* ปุ่มอำนวยความสะดวกสำหรับกดกลับมาดูของวันนี้ */}
        {filterDate !== today() && (
          <button 
            onClick={() => setFilterDate(today())}
            style={{
              background: "#fff", border: `1px solid ${RG.border}`, color: RG.textMuted,
              borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Sarabun', sans-serif"
            }}
          >
            กลับไปวันนี้
          </button>
        )}
      </div>

      {/* 4. แสดงรายการลีดตามวันที่คัดกรอง */}
      {due.length === 0 ? (
        <p style={{ color: RG.textMuted, textAlign: "center", padding: "20px 0" }}>ไม่มีรายการที่ต้องติดตามในวันที่เลือก 🎉</p>
      ) : (
        due.map(l => {
          const isOverdue = l.nextFollowupDate < today();
          return (
            <div key={l.id} style={{ border: `1px solid ${isOverdue ? "#fca5a5" : RG.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, background: isOverdue ? "#fff5f5" : RG.rowOdd }}>
              
              {/* ข้อความฝั่งซ้าย */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: RG.text, fontSize: 14 }}>{l.companyName}</p>
                  {isOverdue && <span style={{ fontSize: 11, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ค้าง!</span>}
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: isOverdue ? "#dc2626" : RG.textMuted }}>กำหนดติดตาม: {parseDateTH(l.nextFollowupDate)}</p>
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={l.latestStatus} />
                </div>
              </div>

              {/* ปุ่มฝั่งขวา */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 105, flexShrink: 0 }}>
                <Btn small variant="Third" onClick={() => onViewLead(l)} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>ข้อมูลเพิ่มเติม</Btn>
                <Btn small variant="success" onClick={() => onMarkDone(l)} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>ติดตามแล้ว ✓</Btn>
              </div>

            </div>
          );
        })
      )}
    </Modal>
  );
}