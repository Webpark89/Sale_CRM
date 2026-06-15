import React from "react";
import { RG } from "../../constants/theme";
import { parseDateTH, today } from "../../utils/helpers";
import Btn from "../common/Btn";
import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";

// 1. กำหนดน้ำหนักความสำคัญ (ยิ่งตัวเลขเยอะ ยิ่งอยู่บนสุด)
const PRIORITY_WEIGHT = {
  "ปิดการขาย": 5,
  "ด่วนมาก": 4,
  "มีตติ้ง": 3,
  "ต้องตามต่อ": 2,
  "ทั่วไป": 1,
  "ไม่สนใจ": 0
};

export default function NotificationsPanel({ leads, onMarkDone, onClose }) {
  // 2. กรองรายการที่ถึงกำหนด และทำการเรียงลำดับความสำคัญ
  const due = leads
    .filter(l => {
      if (!l.nextFollowupDate) return false;
      return l.nextFollowupDate <= today();
    })
    .sort((a, b) => {
      // เทียบน้ำหนักความสำคัญของสถานะ
      const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
      const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
      
      if (weightB !== weightA) {
        return weightB - weightA; // เรียงจากสำคัญมากไปน้อย
      }
      
      // ถ้าความสำคัญเท่ากัน ให้เรียงตามวันที่ (ค้างนานสุดขึ้นก่อน จะได้รีบตาม)
      const dateA = new Date(a.nextFollowupDate).getTime();
      const dateB = new Date(b.nextFollowupDate).getTime();
      return dateA - dateB;
    });

  return (
    <Modal title={`แจ้งเตือนการติดตาม (${due.length} รายการ)`} onClose={onClose}>
      {due.length === 0 ? (
        <p style={{ color: RG.textMuted, textAlign: "center", padding: "20px 0" }}>ไม่มีรายการที่ต้องติดตามวันนี้ 🎉</p>
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