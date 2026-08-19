import React from "react";
import { RG } from "../../constants/theme";
import { Calendar, Bell, LogOut, UserRound } from "lucide-react";

export default function TopHeader({ 
  undo, 
  redo, 
  histIdx, 
  history, 
  dueTodayCount,
  generalCount,
  openNotifTab, 
  currentUser, 
  setAuthenticated 
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: RG.surface, padding: "8px 16px", borderRadius: "12px", border: `1px solid ${RG.border}`, boxShadow: RG.shadowSoft }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={undo} disabled={histIdx < 0} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid " + RG.border, background: histIdx < 0 ? "#f8f9fa" : "#fff", color: histIdx < 0 ? "#ccc" : RG.text, cursor: histIdx < 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", boxShadow: "none" }} title="Undo (ย้อนกลับ)">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          </button>
          <button onClick={redo} disabled={histIdx >= history.length - 1} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid " + RG.border, background: histIdx >= history.length - 1 ? "#f8f9fa" : "#fff", color: histIdx >= history.length - 1 ? "#ccc" : RG.text, cursor: histIdx >= history.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", boxShadow: "none" }} title="Redo (ทำซ้ำ)">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
          </button>
        </div>
        <span style={{ color: RG.primaryMid, fontSize: 12, background: RG.primaryGhost, borderRadius: 8, padding: "4px 12px", fontWeight: 700, border: `1px solid ${RG.border}` }}>☁ Cloud Synced</span>
        
        <div style={{ display: "flex", gap: 12, background: RG.surface, padding: "4px 12px", borderRadius: 8, border: `1px solid ${RG.border}` }}>
          <button onClick={() => openNotifTab(1)} style={{ background: "transparent", border: "none", color: RG.textMuted, cursor: "pointer", fontSize: 20, position: "relative", padding: "4px" }} title="การติดตาม">
            <Calendar size={20} strokeWidth={2.5} /> {dueTodayCount > 0 && <span style={{ position: "absolute", top: -2, right: -4, background: RG.primary, color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, border: "2px solid #fff" }}>{dueTodayCount}</span>}
          </button>
          <div style={{ width: 1, background: RG.border, height: 20, alignSelf: "center" }}></div>
          <button onClick={() => openNotifTab(2)} style={{ background: "transparent", border: "none", color: RG.textMuted, cursor: "pointer", fontSize: 20, position: "relative", padding: "4px" }} title="ลีดใหม่ & โอนย้าย">
            <Bell size={20} strokeWidth={2.5} /> {generalCount > 0 && <span style={{ position: "absolute", top: -2, right: -4, background: "#8b5cf6", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, border: "2px solid #fff" }}>{generalCount}</span>}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: RG.surface, padding: "6px 12px 6px 6px", borderRadius: 8, border: `1px solid ${RG.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: "6px", background: RG.primaryGhost, color: RG.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserRound size={18} strokeWidth={2.5} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: RG.text, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{currentUser?.username || "admin"}</span>
            <span style={{ color: RG.textMuted, fontSize: 10, lineHeight: 1.2 }}>
              {{ admin: "ผู้ดูแลระบบ", header_saler: "หัวหน้าเซลส์", saler: "เซลส์" }[currentUser?.role] || "USER"}
            </span>
          </div>
          <button onClick={() => { localStorage.removeItem("crm_session"); setAuthenticated(false); }} title="ออกจากระบบ" style={{ background: "transparent", border: "none", color: RG.danger, cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", marginLeft: 8 }}>
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
