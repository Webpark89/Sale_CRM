import React, { useState, useEffect } from "react";
import { RG } from "../../constants/theme";
import { parseDateTH, parseDateTimeTH, today } from "../../crmHelpers/helpers";
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

export default function NotificationsPanel({ notifTab = 1, currentUser, leads, onMarkDone, onViewLead, onClose }) {
  const [filterDate, setFilterDate] = useState(today());
  const [expandedSection, setExpandedSection] = useState(null); // 'dueToday' | 'overdue' | 'general'
  const [activeTab, setActiveTab] = useState(notifTab); // 1 = Follow-ups, 2 = General
  const isDefaultDate = filterDate === today();

  useEffect(() => {
    setActiveTab(notifTab);
  }, [notifTab]);

  const sortLeads = (arr, isGeneral = false) => arr.sort((a, b) => {
    if (isGeneral) {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA; // Descending (newest first)
    }

    const dateA = a.nextFollowupDate || a.latestContactDate || "";
    const dateB = b.nextFollowupDate || b.latestContactDate || "";
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA); // Descending (nearest to today at the top)
    }
    
    const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
    const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
    return weightB - weightA;
  });

  const dueToday = sortLeads(leads.filter(l => Number(l.ownerId) === Number(currentUser?.id) && l.nextFollowupDate === filterDate && l.latestStatus !== "ปิดการขาย"));
  const overdue = sortLeads(leads.filter(l => Number(l.ownerId) === Number(currentUser?.id) && l.nextFollowupDate && l.nextFollowupDate < filterDate && l.latestStatus !== "ปิดการขาย"));
  
  // General: 1. สร้างเอง (ฝากโปรไฟล์) 2. ได้รับมอบหมายใหม่ (isAcknowledged === 0)
  const general = sortLeads(leads.filter(l => {
    const isNewlyAssigned = Number(l.isAcknowledged) === 0 && Number(l.ownerId) === Number(currentUser?.id);
    if (isNewlyAssigned) return true;

    if (l.latestStatus === "ปิดการขาย") return false;
    
    const isNewlyCreatedByMe = Number(l.isAcknowledged) === 0 && (Number(l.createdBy) === Number(currentUser?.id) || l.createdBy === null);
    
    return isNewlyCreatedByMe;
  }), true);

  const hasFollowups = dueToday.length > 0 || overdue.length > 0;
  const hasGeneral = general.length > 0;

  const getNoteText = (l) => {
    const timeStr = l.createdAt ? ` | 🕒 ${parseDateTimeTH(l.createdAt)}` : "";
    if (l.prevOwnerUsername) {
      return `🔄 โอนย้ายมาจาก: ${l.prevOwnerUsername} | 🔄 โอนย้ายมาโดย: ${l.assignerUsername || l.creatorUsername || 'ระบบ'}${timeStr}`;
    }
    return `✨ ลีดใหม่ที่สร้างสำเร็จ${timeStr}`;
  };

  const renderLeadCard = (l, isOverdue, sectionType) => {
    let noteText = "";
    if (sectionType === 'general') noteText = getNoteText(l);

    return (
      <div key={l.id} style={{ border: `1px solid ${isOverdue ? RG.danger : RG.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, background: isOverdue ? "#fff5f5" : RG.rowOdd }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 600, color: RG.text, fontSize: 14 }}>{l.companyName}</p>
            {isOverdue && <span style={{ fontSize: 11, background: "#fee2e2", color: RG.danger, padding: "2px 8px", borderRadius: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>ค้าง!</span>}
          </div>
          {sectionType === "general" ? (
            <>
              {l.prevOwnerUsername ? (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: RG.primary }}>
                  🔄 โอนย้ายโดย: {l.assignerUsername || "ระบบ"}
                </p>
              ) : (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: RG.primary }}>
                  ✨ สร้างใหม่
                </p>
              )}
              <p style={{ margin: "2px 0 0", fontSize: 11, color: RG.textMuted }}>
                เมื่อ: {l.updatedAt || l.createdAt ? new Date(l.updatedAt || l.createdAt).toLocaleString("th-TH") : "ไม่ทราบเวลา"}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: isOverdue ? RG.danger : RG.textMuted }}>
                กำหนดติดตาม: {l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "ยังไม่ได้กำหนด"}
              </p>
              {noteText && <p style={{ margin: "4px 0 0", fontSize: 11, color: RG.primary, fontWeight: 600 }}>{noteText}</p>}
            </>
          )}
          <div style={{ marginTop: 6 }}>
            <StatusBadge status={l.latestStatus} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 105, flexShrink: 0 }}>
          <Btn small variant="Third" onClick={(e) => { e.stopPropagation(); onViewLead(l); }} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>ข้อมูลเพิ่มเติม</Btn>
          <Btn small variant="success" onClick={(e) => { e.stopPropagation(); onMarkDone(l, sectionType); }} style={{ width: "100%", textAlign: "center", padding: "6px 0", fontSize: 12 }}>{sectionType === "general" ? "รับทราบ ✓" : "ติดตามแล้ว ✓"}</Btn>
        </div>
      </div>
    );
  };

  const renderSection = (title, list, isOverdue, sectionType, color) => {
    if (list.length === 0) return null;
    const count = list.length;

    return (
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 12px 0", color: color }}>
          {title} <span style={{ color: RG.textMuted, fontSize: 14, fontWeight: "normal" }}>({count} รายการ)</span>
        </h4>
        
        {count === 1 ? (
          renderLeadCard(list[0], isOverdue, sectionType)
        ) : (
          <div 
            style={{ position: 'relative', cursor: 'pointer', marginTop: 4, marginBottom: 20 }}
            onClick={() => setExpandedSection(sectionType)}
          >
            {/* Stack background 2 */}
            <div style={{ position: 'absolute', top: 10, left: 8, right: 8, height: "100%", border: `1px solid ${isOverdue ? RG.danger : RG.border}`, borderRadius: 10, background: isOverdue ? "#fff5f5" : RG.rowOdd, opacity: 0.4, zIndex: 1 }} />
            {/* Stack background 1 */}
            <div style={{ position: 'absolute', top: 5, left: 4, right: 4, height: "100%", border: `1px solid ${isOverdue ? RG.danger : RG.border}`, borderRadius: 10, background: isOverdue ? "#fff5f5" : RG.rowOdd, opacity: 0.7, zIndex: 2 }} />
            
            {/* Main Card Wrapper (disabled interactions so clicking anywhere goes to the list) */}
            <div style={{ position: 'relative', zIndex: 3, pointerEvents: 'none' }}>
               {renderLeadCard(list[0], isOverdue, sectionType)}
            </div>
            
            {/* Badge Indicator */}
            <div style={{ position: 'absolute', top: -10, right: -10, zIndex: 4, background: color, color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: 12, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              +{count - 1} ซ่อนอยู่
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExpandedView = () => {
    let list = [];
    let title = "";
    let color = "";
    let isOverdue = false;

    if (expandedSection === 'dueToday') {
      list = dueToday;
      title = "📅 การติดตาม ณ ปัจจุบัน (วันนี้)";
      color = RG.primary;
    } else if (expandedSection === 'overdue') {
      list = overdue;
      title = "⚠️ การติดตามที่ค้างอยู่ (ผ่านมาแล้ว)";
      color = RG.danger;
      isOverdue = true;
    } else if (expandedSection === 'general') {
      list = general;
      title = "🔔 การแจ้งเตือนทั่วไป (ลีดใหม่/รอติดต่อ)";
      color = RG.warn;
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button 
            onClick={() => setExpandedSection(null)} 
            style={{ background: RG.surface, border: `1px solid ${RG.border}`, color: RG.text, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Sarabun', sans-serif", display: "flex", alignItems: "center", gap: 6 }}
          >
            <span>&larr;</span> ย้อนกลับ
          </button>
          <h4 style={{ margin: 0, color: color, fontSize: 16 }}>{title} ({list.length})</h4>
        </div>
        
        {list.map(l => renderLeadCard(l, isOverdue, expandedSection))}
      </div>
    );
  };

  const totalCount = dueToday.length + overdue.length + general.length;
  const titleText = isDefaultDate ? `แจ้งเตือนการติดตามทั้งหมด (${totalCount} รายการ)` : `แจ้งเตือนการติดตาม (${totalCount} รายการ)`;

  return (
    <Modal title={titleText} onClose={onClose}>
      
      <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 8, paddingBottom: 10 }}>
        {expandedSection ? (
          renderExpandedView()
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Tabs Header */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px", padding: "4px", background: RG.surface, borderRadius: "10px", border: `1px solid ${RG.border}` }}>
              <button
                onClick={() => setActiveTab(1)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px", fontFamily: "'Sarabun', sans-serif", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  background: activeTab === 1 ? RG.primary : "transparent",
                  color: activeTab === 1 ? RG.surface : RG.textMuted,
                  transition: "all 0.2s"
                }}
              >
                <span>📅 การติดตาม</span>
                <span style={{ background: activeTab === 1 ? RG.surface : RG.border, color: activeTab === 1 ? RG.primary : RG.text, padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                  {dueToday.length + overdue.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab(2)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px", fontFamily: "'Sarabun', sans-serif", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  background: activeTab === 2 ? RG.warn : "transparent",
                  color: activeTab === 2 ? RG.surface : RG.textMuted,
                  transition: "all 0.2s"
                }}
              >
                <span>🔔 ลีดใหม่ & โอนย้าย</span>
                <span style={{ background: activeTab === 2 ? RG.surface : RG.border, color: activeTab === 2 ? RG.warn : RG.text, padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                  {general.length}
                </span>
              </button>
            </div>
            
            {/* ส่วนที่ 1: การติดตาม (Follow-ups) */}
            {activeTab === 1 && (
              <div style={{ background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 16px 0", color: RG.text, fontSize: 15, borderBottom: `2px solid ${RG.primaryLight}`, paddingBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>📌 ส่วนที่ 1: การติดตาม (Follow-ups)</span>
                <span style={{ fontSize: 12, fontWeight: "normal", color: RG.textMuted }}>รวม {dueToday.length + overdue.length} รายการ</span>
              </h3>
              
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: RG.surface, borderRadius: 8, border: `1px solid ${RG.border}` }}>
                <span style={{ fontSize: 13, color: RG.text, fontWeight: 600 }}>เลือกวันที่ติดตาม:</span>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${RG.border}`, fontFamily: "'Sarabun', sans-serif", color: RG.text, outline: "none", fontSize: 13 }}
                />
                {filterDate !== today() && (
                  <button onClick={() => setFilterDate(today())} style={{ background: RG.surface, border: `1px solid ${RG.border}`, color: RG.textMuted, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontFamily: "'Sarabun', sans-serif" }}>
                    กลับไปวันนี้
                  </button>
                )}
              </div>

              {dueToday.length === 0 && overdue.length === 0 && (
                <p style={{ color: RG.textMuted, textAlign: "center", padding: "10px 0", fontSize: 13 }}>ไม่มีรายการติดตามในวันนี้ 🎉</p>
              )}
              {renderSection("📅 การติดตาม ณ ปัจจุบัน", dueToday, false, 'dueToday', RG.primary)}
              {renderSection("⚠️ การติดตามที่ค้างอยู่ (ผ่านมาแล้ว)", overdue, true, 'overdue', RG.danger)}
              </div>
            )}

            {/* ส่วนที่ 2: การแจ้งเตือนทั่วไป */}
            {activeTab === 2 && (
              <div style={{ background: RG.surface, border: "1px solid #ddd6fe", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(139,92,246,0.08)" }}>
                <div style={{ marginBottom: 16 }}>
                  {general.length === 0 ? (
                    <p style={{ color: RG.textMuted, textAlign: "center", padding: "10px 0", fontSize: 13 }}>ไม่มีรายการแจ้งเตือนใหม่ 🎉</p>
                  ) : (
                    <>
                      <h4 style={{ margin: "0 0 12px 0", color: RG.warn }}>
                        🔔 การแจ้งเตือนลีดใหม่และรับโอนย้าย <span style={{ color: RG.textMuted, fontSize: 14, fontWeight: "normal" }}>({general.length} รายการ)</span>
                      </h4>
                      {general.map(l => renderLeadCard(l, false, 'general'))}
                    </>
                  )}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </Modal>
  );
}