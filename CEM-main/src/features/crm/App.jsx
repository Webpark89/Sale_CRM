import React from "react";
import { useCallback, useEffect, useState } from "react";
import { STATUSES, STATUS_COLORS } from "./constants/status";
import { RG } from "./constants/theme";
import { createNewLead } from "./data/sampleData";
import { loadData, saveData } from "./services/storage";
import { parseDateTH, today, uuid } from "./utils/helpers";
import LoginScreen from "./components/auth/LoginScreen";
import Btn from "./components/common/Btn";
import EditableCell from "./components/common/EditableCell";
import Modal from "./components/common/Modal";
import { inputStyle } from "./components/common/styles";
import AddLeadModal from "./components/modals/AddLeadModal";
import CompanyModal from "./components/modals/CompanyModal";
import FollowupQuickForm from "./components/modals/FollowupQuickForm";
import NotificationsPanel from "./components/modals/NotificationsPanel";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";

// กำหนดน้ำหนักความสำคัญสำหรับการจัดเรียงข้อมูล
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

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("crm_session") === "authenticated");
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem("crm_user");
    return user ? JSON.parse(user) : null;
  });
  const { leads: initLeads, followups: initFollowups } = loadData();
  const [leads, setLeads] = useState(initLeads);
  const [followups, setFollowups] = useState(initFollowups);
  const [page, setPage] = useState("leads");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [checked, setChecked] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState([]);
  
  // เพิ่ม State สำหรับกรองเฉพาะรายการโปรด
  const [showFavorites, setShowFavorites] = useState(false);
  
  const [history, setHistory] = useState([{ leads: initLeads, followups: initFollowups }]);
  const [histIdx, setHistIdx] = useState(0);
  const [markDoneLead, setMarkDoneLead] = useState(null);

  const syncStatus = "Local Only";
  const dueTodayCount = leads.filter(l => l.nextFollowupDate && l.nextFollowupDate === today()).length;

  const pushHistory = useCallback(
    (newLeads, newFollowups) => {
      const next = [...history.slice(0, histIdx + 1), { leads: newLeads, followups: newFollowups }].slice(-50);
      setHistory(next);
      setHistIdx(next.length - 1);
    },
    [history, histIdx],
  );

  const updateLeads = useCallback(
    (newLeads, newFollowups = followups) => {
      setLeads(newLeads);
      setFollowups(newFollowups);
      saveData(newLeads, newFollowups);
      pushHistory(newLeads, newFollowups);
    },
    [followups, pushHistory],
  );

  const undo = useCallback(() => {
    if (histIdx > 0) {
      const prev = history[histIdx - 1];
      setLeads(prev.leads);
      setFollowups(prev.followups);
      saveData(prev.leads, prev.followups);
      setHistIdx(histIdx - 1);
    }
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx < history.length - 1) {
      const next = history[histIdx + 1];
      setLeads(next.leads);
      setFollowups(next.followups);
      saveData(next.leads, next.followups);
      setHistIdx(histIdx + 1);
    }
  }, [histIdx, history]);

  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const addLead = form => {
    // ตรวจสอบเลขนิติบุคคลซ้ำในฐานข้อมูลทั้งหมด (Admin + Sales ทุกคน)
    if (form.companyNumber) {
      const isDup = leads.some(l => l.companyNumber === form.companyNumber);
      if (isDup) {
        alert("บันทึกไม่สำเร็จ: เลขนิติบุคคลนี้มีพนักงานท่านอื่นเพิ่มไว้ในระบบแล้ว");
        return; 
      }
    }
    // เพิ่ม owner (เจ้าของลีด) ลงไป
    const newLead = createNewLead({ ...form, owner: currentUser.username });
    updateLeads([newLead, ...leads]);
    setShowAddLead(false);
  };

  const saveLead = updated => {
    // 1. ดักจับการแก้เลขนิติบุคคลซ้ำ
    if (updated.companyNumber) {
      const isDup = leads.some(l => l.id !== updated.id && l.companyNumber === updated.companyNumber);
      if (isDup) {
        alert("บันทึกไม่สำเร็จ: เลขนิติบุคคลนี้ซ้ำกับข้อมูลที่มีอยู่แล้วในระบบ");
        return;
      }
    }

    let finalLeadUpdated = updated;

    // 2. สร้าง Array ใหม่
    const newLeads = leads.map(l => {
      if (l.id === updated.id) {
        // เตรียมข้อมูลที่อัปเดตแล้ว
        const finalLead = { ...updated, updatedAt: new Date().toISOString() };
        
        // เช็คเงื่อนไขพิเศษ
        if (finalLead.latestStatus === "มีตติ้ง") {
          finalLead.everHadMeeting = true;
        }
        
        finalLeadUpdated = finalLead; // เก็บไว้ไปอัปเดต Popup
        return finalLead; // ส่งออกไปใน newLeads
      }
      return l;
    });

    // 3. เรียกใช้ฟังก์ชันอัปเดตหลัก (และต้องส่ง followups ไปด้วยตามนิยามฟังก์ชัน updateLeads ที่คุณมี)
    updateLeads(newLeads, followups); 
    
    // 4. อัปเดต Popup ให้แสดงค่าใหม่
    setSelectedLead(finalLeadUpdated); 
  };
  
  const saveFollowup = (leadId, fForm) => {
    // 1. สร้าง object ของรายการติดตามใหม่
    const newFup = { 
      id: uuid(), 
      leadId, 
      ...fForm, 
      completed: false, 
      createdAt: new Date().toISOString() 
    };
    
    // 2. อัปเดต list ของ followups
    const newFollowups = { 
      ...followups, 
      [leadId]: [...(followups[leadId] || []), newFup] 
    };
    
    // 3. อัปเดตสถานะใน leads
    // ให้มั่นใจว่าใช้ fForm.status (หรือชื่อ field ที่คุณส่งมาจากฟอร์ม) 
    // และอัปเดตให้ครบทุกฟิลด์ที่เกี่ยวข้อง
    const newLeads = leads.map(l => {
      if (l.id === leadId) {
        return { 
          ...l, 
          latestStatus: fForm.status, // ตรวจสอบว่า fForm.status มีค่าจริงไหม
          latestContactDate: fForm.date, 
          nextFollowupDate: fForm.nextFollowupDate, 
          updatedAt: new Date().toISOString() 
        };
      }
      return l;
    });

    // 4. บันทึกและอัปเดต State
    updateLeads(newLeads, newFollowups);
    
    // อัปเดต selectedLead เพื่อให้หน้า Modal เปลี่ยนสถานะทันที
    const updatedLead = newLeads.find(l => l.id === leadId);
    setSelectedLead(updatedLead);
  };

  const markDone = lead => {
    const fups = followups[lead.id] || [];
    const updated = fups.map(f => ({ ...f, completed: true }));
    const newFollowups = { ...followups, [lead.id]: updated };
    updateLeads(leads, newFollowups);
    setMarkDoneLead(lead);
    setShowNotif(false);
  };

  const inlineEdit = (leadId, key, value) => {
    // ดักจับการแก้เลขนิติบุคคลซ้ำในการแก้ไขแบบ Inline
    if (key === "companyNumber" && value) {
      const isDup = leads.some(l => l.id !== leadId && l.companyNumber === value);
      if (isDup) {
        alert("แก้ไขไม่สำเร็จ: เลขนิติบุคคลนี้ซ้ำกับข้อมูลที่มีอยู่แล้วในระบบ");
        return;
      }
    }

    const newLeads = leads.map(l => {
      if (l.id === leadId) {
        const updatedLead = { ...l, [key]: value, updatedAt: new Date().toISOString() };
        if (key === "latestStatus" && value === "มีตติ้ง") {
          updatedLead.everHadMeeting = true;
        }
        return updatedLead;
      }
      return l;
    });
    updateLeads(newLeads);
  };

  // ฟังก์ชันสลับการติดดาว
  const toggleStar = (leadId) => {
    const newLeads = leads.map(l => (l.id === leadId ? { ...l, isStarred: !l.isStarred, updatedAt: new Date().toISOString() } : l));
    updateLeads(newLeads);
  };

  const deleteSelected = () => {
    const remaining = leads.filter(l => !checked.includes(l.id));
    const newFollowups = { ...followups };
    checked.forEach(id => delete newFollowups[id]);
    updateLeads(remaining, newFollowups);
    setChecked([]);
    setShowDeleteConfirm(false);
  };

  const dupNumbers = leads.map(l => l.companyNumber).filter((n, i, arr) => n && arr.indexOf(n) !== i);

  // 1. คัดกรองข้อมูลตามสิทธิ์ (Admin เห็นทั้งหมด, Sales เห็นเฉพาะที่ตัวเองเป็น owner)
  const accessibleLeads = currentUser?.role === "admin" 
    ? leads 
    : leads.filter(l => l.owner === currentUser?.username);

  // ปรับปรุง logic กรองข้อมูล + เพิ่มการจัดเรียง
  const filtered = accessibleLeads
    .filter(l => {
      //ค้นหา
      if (search && !l.companyName?.toLowerCase().includes(search.toLowerCase()) && !l.companyNumber?.includes(search) && !l.contactPhone?.includes(search) && !l.contactEmail?.toLowerCase().includes(search.toLowerCase()) && !l.description?.toLowerCase().includes(search.toLowerCase())) return false;
      //คัดกรอง
      if (filterStatus.length > 0 && !filterStatus.includes(l.latestStatus)) return false;
      //รายกาโปรด
      if (showFavorites && !l.isStarred) return false; 
      
      return true;
    })
    .sort((a, b) => {
      // เรียงจากความสำคัญก่อน (มากไปน้อย)
      const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
      const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      // ถ้าความสำคัญเท่ากัน เรียงตามวันที่ติดต่อล่าสุด (ล่าสุดอยู่บน)
      const dateA = new Date(a.latestContactDate || 0).getTime();
      const dateB = new Date(b.latestContactDate || 0).getTime();
      return dateB - dateA;
    });

  const exportJSON = () => {
    const data = JSON.stringify({ leads, followups }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = "qoraqot_crm_export.json";
    a.click();
  };

  const importFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.leads && data.followups) {
          updateLeads(data.leads, data.followups);
          alert("นำเข้าข้อมูลสำเร็จ");
        }
      } catch {
        alert("ไฟล์ไม่ถูกต้อง");
      }
    };
    reader.readAsText(file);
  };

  if (!authenticated) return <LoginScreen onLogin={(user) => { 
    setCurrentUser(user); 
    setAuthenticated(true); 
  }} />;

  const navItems = [
    { key: "leads", label: "จัดการลีด", icon: "👥" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "reports", label: "รายงาน", icon: "📄" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: RG.background, fontFamily: "'Sarabun', sans-serif", color: RG.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: #E8FFFD; } ::-webkit-scrollbar-thumb { background: #07bebb; border-radius: 3px; }.status-blue { color: #007bff !important; font-weight: 700 !important; }`}</style>

      <nav style={{ background: RG.navbarBg, backdropFilter: RG.glassFilter, padding: "0 24px", display: "flex", alignItems: "center", height: 56, borderBottom: `1px solid rgba(255, 255, 255, 0.5)`, boxShadow: "0 4px 20px rgba(7, 190, 184, 0.05)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
          <div style={{ width: 32, height: 32, background: RG.gradient, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16, boxShadow: "0 2px 8px rgba(7, 190, 184, 0.3)" }}>Q</div>
          <span style={{ color: RG.text, fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px" }}>QoraQot CRM</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: page === n.key ? "rgba(7, 190, 184, 0.1)" : "transparent", color: page === n.key ? RG.primary : RG.textMuted, cursor: "pointer", fontWeight: page === n.key ? 700 : 500, fontSize: 14, fontFamily: "'Sarabun', sans-serif", transition: "all 0.2s" }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowNotif(true)} style={{ background: "rgba(7, 190, 184, 0.08)", border: "none", color: RG.textMuted, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "'Sarabun', sans-serif", fontSize: 13, position: "relative" }}>
            🔔 {dueTodayCount > 0 && <span style={{ background: RG.danger, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, marginLeft: 4 }}>{dueTodayCount}</span>}
          </button>
          <button onClick={undo} disabled={histIdx === 0} title="Ctrl+Z" style={{ background: "rgba(7, 190, 184, 0.08)", border: "none", color: RG.textMuted, borderRadius: 8, padding: "6px 10px", cursor: histIdx === 0 ? "not-allowed" : "pointer", opacity: histIdx === 0 ? 0.5 : 1, fontSize: 14 }}>
            ↶
          </button>
          <button onClick={redo} disabled={histIdx >= history.length - 1} title="Ctrl+Y" style={{ background: "rgba(7, 190, 184, 0.08)", border: "none", color: RG.textMuted, borderRadius: 8, padding: "6px 10px", cursor: histIdx >= history.length - 1 ? "not-allowed" : "pointer", opacity: histIdx >= history.length - 1 ? 0.5 : 1, fontSize: 14 }}>
            ↷
          </button>
          <span style={{ color: RG.textMuted, fontSize: 11, background: "rgba(7, 190, 184, 0.08)", borderRadius: 6, padding: "3px 8px" }}>{syncStatus}</span>
          <span style={{ color: RG.text, fontSize: 13, marginRight: 10, fontWeight: 600 }}>
            👤 {currentUser?.username || "ไม่ระบุชื่อ"}
          </span>
          <button 
            onClick={() => { 
              localStorage.removeItem("crm_session"); 
              setAuthenticated(false); 
            }} 
            style={{ 
              background: "rgba(239, 68, 68, 0.1)", 
              border: "none", 
              color: RG.danger, 
              borderRadius: 8, 
              padding: "6px 12px", 
              cursor: "pointer", 
              fontFamily: "'Sarabun', sans-serif", 
              fontSize: 13,
              fontWeight: 600
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <div style={{ padding: "24px 24px" }}>
        {page === "leads" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Btn onClick={() => setShowAddLead(true)}>+ เพิ่มลีดใหม่</Btn>
              {checked.length > 0 && <Btn variant="danger" onClick={() => setShowDeleteConfirm(true)}>🗑 ลบที่เลือก ({checked.length})</Btn>}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาบริษัท, เลขนิติบุคคล, เบอร์..." style={{ ...inputStyle, width: 280 }} />
              
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", borderLeft: `1px solid ${RG.border}`, paddingLeft: 12 }}>
                {/* ปุ่มแสดงเฉพาะรายการโปรด */}
                <button 
                  onClick={() => setShowFavorites(!showFavorites)} 
                  style={{ 
                    padding: "4px 10px", borderRadius: 20, 
                    border: `1.5px solid ${showFavorites ? "#faad14" : RG.border}`, 
                    background: showFavorites ? "#fffbe6" : "#fff", 
                    color: showFavorites ? "#d48806" : RG.textMuted, 
                    fontSize: 12, cursor: "pointer", fontWeight: showFavorites ? 700 : 400, 
                    fontFamily: "'Sarabun', sans-serif" 
                  }}
                >
                  {showFavorites ? "⭐ กำลังดูรายการโปรด" : "☆ รายการโปรด"}
                </button>

                {STATUSES.map(s => (
                  <button key={s} onClick={() => setFilterStatus(f => (f.includes(s) ? f.filter(x => x !== s) : [...f, s]))} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${filterStatus.includes(s) ? STATUS_COLORS[s] : RG.border}`, background: filterStatus.includes(s) ? STATUS_COLORS[s] + "22" : "#fff", color: filterStatus.includes(s) ? STATUS_COLORS[s] : RG.textMuted, fontSize: 12, cursor: "pointer", fontWeight: filterStatus.includes(s) ? 700 : 400, fontFamily: "'Sarabun', sans-serif" }}>
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Btn small variant="Third" onClick={exportJSON}>⬇ Export JSON</Btn>
                <label style={{ padding: "6px 14px", borderRadius: 8, background: "#ffffff", color: RG.primary, border: `1px solid ${RG.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  ⬆ Import <input type="file" accept=".json" onChange={importFile} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden", boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                  <thead>
                    <tr style={{ background: RG.gradient, position: "sticky", top: 0 }}>
                      <th style={{ padding: "12px 10px", textAlign: "center", color: "#fff", fontSize: 13, width: 36 }}>
                        <input type="checkbox" checked={checked.length === filtered.length && filtered.length > 0} onChange={e => setChecked(e.target.checked ? filtered.map(l => l.id) : [])} />
                      </th>
                      {/* เพิ่ม Column สำหรับติดดาว */}
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      {["เลขนิติบุคคล", "ชื่อบริษัท", "ผู้ติดต่อ", "เบอร์โทร", "อีเมล", "รายละเอียด", "รายได้รวม", "ทุนจดทะเบียน", "กำไร", "สถานะล่าสุด", "ติดต่อล่าสุด", "ติดตามครั้งถัดไป"].map(h => (
                        <th key={h} style={{ padding: "12px 10px", textAlign: "left", color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: RG.textMuted }}>
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    )}
                    {filtered.map((lead, i) => {
                      const isDup = dupNumbers.includes(lead.companyNumber);
                      
                      // 1. ดึงประวัติการติดตามทั้งหมดของลีดรายการนี้
                      const leadFollowups = followups[lead.id] || [];
                      
                      // 2. ตรวจสอบว่า "สถานะปัจจุบัน" หรือ "ประวัติที่ผ่านมา" เคยเป็น "มีตติ้ง" หรือไม่
                      const hasMeetingHistory = 
                        lead.latestStatus === "มีตติ้ง" || 
                        lead.everHadMeeting === true || // ตรวจสอบจากความจำฝังตัวที่เราเพิ่มเข้าไป
                        leadFollowups.some(f => f.status === "มีตติ้ง");
                      
                      // 3. กำหนดสีพื้นหลัง: ถ้าเคยมีตติ้งให้ใช้สีส้มอ่อน (#ffeed9) ถ้าไม่เคย ให้สลับสีตามเดิม
                      const rowBackground = hasMeetingHistory ? "linear-gradient(90deg, #ffff00, #ffff64)" : (i % 2 === 0 ? RG.rowOdd : RG.rowEven);

                      return (
                        <tr key={lead.id} style={{ background: rowBackground, borderBottom: `1px solid ${RG.border}` }}>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <input type="checkbox" checked={checked.includes(lead.id)} onChange={e => setChecked(c => (e.target.checked ? [...c, lead.id] : c.filter(x => x !== lead.id)))} />
                          </td>
                          {/* ปุ่มติดดาว */}
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            <button onClick={() => toggleStar(lead.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>
                              {lead.isStarred ? "⭐" : "☆"}
                            </button>
                          </td>
                          <td style={{ padding: "8px 6px" }}>
                            <button onClick={() => setSelectedLead(lead)} style={{ background: RG.gradient, border: "none", color: "#fff", width: 26, height: 26, borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>👁</button>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <EditableCell value={lead.companyNumber} onSave={v => inlineEdit(lead.id, "companyNumber", v)} />
                              {isDup && <span style={{ background: "#ffeeee", color: RG.danger, fontSize: 10, padding: "1px 6px", borderRadius: 10, border: "1px solid #ffcccc", whiteSpace: "nowrap" }}>ซ้ำ!</span>}
                            </div>
                          </td>
                          <td style={{ padding: "8px 10px", fontWeight: lead.isStarred ? 600 : 400 }}><EditableCell value={lead.companyName} onSave={v => inlineEdit(lead.id, "companyName", v)} /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.contactName} onSave={v => inlineEdit(lead.id, "contactName", v)} /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.contactPhone} onSave={v => inlineEdit(lead.id, "contactPhone", v)} /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.contactEmail} onSave={v => inlineEdit(lead.id, "contactEmail", v)} /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.description} onSave={v => inlineEdit(lead.id, "description", v)} /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.revenue} onSave={v => inlineEdit(lead.id, "revenue", Number(v))} type="number" /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.registeredCapital} onSave={v => inlineEdit(lead.id, "registeredCapital", Number(v))} type="number" /></td>
                          <td style={{ padding: "8px 10px" }}><EditableCell value={lead.profit} onSave={v => inlineEdit(lead.id, "profit", Number(v))} type="number" /></td>
                          <td style={{ padding: "8px 10px" }}><div style={{ color: lead.latestStatus === "ฝากโปรไฟล์" ? "#007bff" : "inherit", fontWeight: lead.latestStatus === "ฝากโปรไฟล์" ? 700 : 400 }}><EditableCell key={lead.latestStatus} value={lead.latestStatus} onSave={v => inlineEdit(lead.id, "latestStatus", v)} type="select" options={STATUSES} /></div></td>
                          <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}><EditableCell value={lead.latestContactDate} onSave={v => inlineEdit(lead.id, "latestContactDate", v)} type="date" /></td>
                          <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{lead.nextFollowupDate && lead.nextFollowupDate === today() ? (
                              /* 1. เคสวันปัจจุบัน: แสดงข้อความ "ถึงกำหนดแล้ว" สีดำตัวหนา */
                              <span style={{ color: "#000000", fontSize: 12, fontWeight: 700 }}>🔔 ถึงกำหนดแล้ว</span>
                            ) : lead.nextFollowupDate && lead.nextFollowupDate < today() ? (
                              /* 2. เคสเลยกำหนด (อดีต): แสดงวันที่เดิม แต่เป็นสีแดงเตือน */
                              <span style={{ color: RG.danger, fontSize: 12, fontWeight: 700 }}>🔔 {parseDateTH(lead.nextFollowupDate)}</span>
                            ) : (
                              /* 3. เคสยังไม่ถึงกำหนด (อนาคต) หรือว่างเปล่า: แสดงช่องเลือกวันที่ตามปกติ */
                              <EditableCell value={lead.nextFollowupDate} onSave={v => inlineEdit(lead.id, "nextFollowupDate", v)} type="date" />
                            )}
                          </td>
                        </tr>
                      );
                    })} 
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "10px 16px", background: "#ffffff", borderTop: `1px solid ${RG.border}`, fontSize: 12, color: RG.textMuted, display: "flex", justifyContent: "space-between" }}>
                <span>แสดง {filtered.length} จาก {leads.length} รายการ</span>
                {filterStatus.length > 0 && <span>กรอง: {filterStatus.join(", ")}</span>}
              </div>
            </div>
          </>
        )}

        {page === "dashboard" && (
          <div>
            <h2 style={{ margin: "0 0 20px", color: RG.text, fontSize: 20, fontWeight: 700 }}>📊 Dashboard</h2>
            <Dashboard leads={leads} followups={followups} />
          </div>
        )}

        {page === "reports" && (
          <div>
            <h2 style={{ margin: "0 0 20px", color: RG.text, fontSize: 20, fontWeight: 700 }}>📄 รายงาน</h2>
            {/* ส่งฟังก์ชัน setSelectedLead เข้าไปเป็น onViewLead */}
            <Reports leads={leads} onViewLead={setSelectedLead} />
          </div>
        )}
      </div>

      {showNotif && <NotificationsPanel leads={leads} onMarkDone={markDone} onClose={() => setShowNotif(false)} />}

      {markDoneLead && (
        <Modal title={`บันทึกการติดตาม — ${markDoneLead.companyName}`} onClose={() => setMarkDoneLead(null)}>
          <p style={{ color: RG.textMuted, fontSize: 14, marginBottom: 16 }}>กรุณาบันทึกการติดตามครั้งใหม่</p>
          {(() => {
            const fups = followups[markDoneLead.id] || [];
            const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
            return <FollowupQuickForm leadId={markDoneLead.id} nextSeq={nextSeq} onSave={(lid, f) => { saveFollowup(lid, f); setMarkDoneLead(null); }} />;
          })()}
        </Modal>
      )}

      {/* ส่ง leads={leads} ไปให้ AddLeadModal เพื่อตรวจสอบเลขนิติบุคคลซ้ำ */}
      {showAddLead && <AddLeadModal leads={leads} onClose={() => setShowAddLead(false)} onSave={addLead} />}

      {/* ส่ง leads={leads} ไปให้ CompanyModal เพื่อตรวจสอบเลขนิติบุคคลซ้ำ */}
      {selectedLead && <CompanyModal lead={selectedLead} leads={leads} followups={followups} onClose={() => setSelectedLead(null)} onSave={saveLead} onSaveFollowup={saveFollowup} />}

      {showDeleteConfirm && (
        <Modal title="ยืนยันการลบ" onClose={() => setShowDeleteConfirm(false)}>
          <p style={{ color: RG.text, marginBottom: 20 }}>คุณต้องการลบ <strong>{checked.length}</strong> รายการหรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="danger" onClick={deleteSelected}>ลบ {checked.length} รายการ</Btn>
            <Btn variant="secondary" onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}