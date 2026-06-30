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

export default function NotificationsPanel({ currentUser, leads, onMarkDone, onViewLead, onClose }) {
  const [filterDate, setFilterDate] = useState(today());
  const [expandedSection, setExpandedSection] = useState(null); // 'dueToday' | 'overdue' | 'general'
  const isDefaultDate = filterDate === today();

  const sortLeads = (arr) => arr.sort((a, b) => {
    const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
    const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
    return weightB - weightA;
  });

  const dueToday = sortLeads(leads.filter(l => l.nextFollowupDate === filterDate && l.latestStatus !== "ปิดการขาย"));
  const overdue = isDefaultDate ? sortLeads(leads.filter(l => l.nextFollowupDate && l.nextFollowupDate < filterDate && l.latestStatus !== "ปิดการขาย")) : [];
  
  // General: 1. สร้างเอง (ฝากโปรไฟล์) 2. ได้รับมอบหมายใหม่ (isAcknowledged === 0)
  const general = sortLeads(leads.filter(l => {
    if (l.latestStatus === "ปิดการขาย") return false;
    
    const isNewlyAssigned = l.isAcknowledged === 0;
    if (isNewlyAssigned) return true;

    const isNewlyCreatedByMe = l.latestStatus === "ฝากโปรไฟล์" && (l.createdBy === currentUser?.id || l.createdBy === null);
    
    return isNewlyCreatedByMe;
  }));

  const getNoteText = (l) => {
    if (l.isAcknowledged === 0) {
      return `🔄 โอนย้ายมาจาก: ${l.prevOwnerUsername || 'ไม่มี'} | 🔄 โอนย้ายมาโดย: ${l.assignerUsername || l.creatorUsername || 'ระบบ'}`;
    }
    return "✨ ลีดใหม่ที่สร้างสำเร็จ";
  };

  const renderLeadCard = (l, isOverdue, sectionType) => {
    let noteText = "";
    if (sectionType === 'general') noteText = getNoteText(l);

    return (
      <div key={l.id} style={{ border: `1px solid ${isOverdue ? "#fca5a5" : RG.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, background: isOverdue ? "#fff5f5" : RG.rowOdd }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 600, color: RG.text, fontSize: 14 }}>{l.companyName}</p>
            {isOverdue && <span style={{ fontSize: 11, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ค้าง!</span>}
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: isOverdue ? "#dc2626" : RG.textMuted }}>
            กำหนดติดตาม: {l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "ยังไม่ได้กำหนด"}
          </p>
          {noteText && <p style={{ margin: "4px 0 0", fontSize: 11, color: RG.primary, fontWeight: 600 }}>{noteText}</p>}
          <div style={{ marginTop: 6 }}>
            <StatusBadge status={l.latestStatus} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 105, flexShrink: 0 }}>
          <Btn small variant="Third" onClick={() => onViewLead(l)} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>ข้อมูลเพิ่มเติม</Btn>
          <Btn small variant="success" onClick={() => onMarkDone(l)} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>ติดตามแล้ว ✓</Btn>
        </div>
      </div>
    );
  };



  const totalCount = dueToday.length + overdue.length + general.length;
  const titleText = isDefaultDate ? `แจ้งเตือนการติดตามทั้งหมด (${totalCount} รายการ)` : `แจ้งเตือนการติดตาม (${totalCount} รายการ)`;

  return (
    <Modal title={titleText} onClose={onClose}>
      
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px", background: RG.surface, borderRadius: 8, border: `1px solid ${RG.border}` }}>
        <span style={{ fontSize: 14, color: RG.text, fontWeight: 600 }}>เลือกวันที่:</span>
        <input 
          type="date" 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${RG.border}`, fontFamily: "'Sarabun', sans-serif", color: RG.text, outline: "none" }}
        />
        {filterDate !== today() && (
          <button onClick={() => setFilterDate(today())} style={{ background: "#fff", border: `1px solid ${RG.border}`, color: RG.textMuted, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Sarabun', sans-serif" }}>
            กลับไปวันนี้
          </button>
        )}
      </div>

      <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8, paddingBottom: 10 }}>
        {totalCount === 0 ? (
          <p style={{ color: RG.textMuted, textAlign: "center", padding: "30px 0", fontSize: 16 }}>ไม่มีรายการแจ้งเตือน 🎉</p>
        ) : (
          <div>
            {dueToday.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 10px 0", color: RG.primary }}>
                  📅 การติดตาม ณ ปัจจุบัน (วันนี้) <span style={{ color: RG.textMuted, fontSize: 14, fontWeight: "normal" }}>({dueToday.length} รายการ)</span>
                </h4>
                {dueToday.map(l => renderLeadCard(l, false, 'dueToday'))}
              </div>
            )}
            
            {overdue.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#dc2626" }}>
                  ⚠️ การติดตามที่ค้างอยู่ (ผ่านมาแล้ว) <span style={{ color: RG.textMuted, fontSize: 14, fontWeight: "normal" }}>({overdue.length} รายการ)</span>
                </h4>
                {overdue.map(l => renderLeadCard(l, true, 'overdue'))}
              </div>
            )}
            
            {general.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#8b5cf6" }}>
                  🔔 การแจ้งเตือนทั่วไป (ลีดใหม่/รอติดต่อ) <span style={{ color: RG.textMuted, fontSize: 14, fontWeight: "normal" }}>({general.length} รายการ)</span>
                </h4>
                {general.map(l => renderLeadCard(l, false, 'general'))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}