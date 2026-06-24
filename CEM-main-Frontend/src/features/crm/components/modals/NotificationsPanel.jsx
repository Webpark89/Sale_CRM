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

export default function NotificationsPanel({ leads, onMarkDone, onClose }) {
  // 1. เพิ่ม State สำหรับเก็บวันที่คัดกรอง (ค่าเริ่มต้นคือวันนี้)
  const [filterDate, setFilterDate] = useState(today());

  // 2. กรองรายการให้ตรงกับวันที่ที่เลือก
  const due = leads
    .filter(l => {
      if (!l.nextFollowupDate) return false;
      // หากผู้ใช้ล้างค่าใน input จนว่างเปล่า ให้บังคับแสดงผลเป็นวันนี้
      const targetDate = filterDate || today(); 
      return l.nextFollowupDate === targetDate;
    })
    .sort((a, b) => {
      const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
      const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
      
      if (weightB !== weightA) {
        return weightB - weightA; 
      }
      
      const dateA = new Date(a.nextFollowupDate).getTime();
      const dateB = new Date(b.nextFollowupDate).getTime();
      return dateA - dateB;
    });

  return (
    <Modal title={`แจ้งเตือนการติดตาม (${due.length} รายการ)`} onClose={onClose}>
      
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
        due.map(l => (
          <div key={l.id} style={{ border: `1px solid ${RG.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: RG.rowOdd }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: RG.text, fontSize: 14 }}>{l.companyName}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: RG.textMuted }}>กำหนดติดตาม: {parseDateTH(l.nextFollowupDate)}</p>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={l.latestStatus} />
              </div>
            </div>
            <Btn small variant="success" onClick={() => onMarkDone(l)}>ติดตามแล้ว ✓</Btn>
          </div>
        ))
      )}
    </Modal>
  );
}