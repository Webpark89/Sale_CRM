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
import FilterModal from "./components/modals/FilterModal";
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
  
  // เพิ่ม State สำหรับตัวกรองและการจัดเรียง
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [finFilters, setFinFilters] = useState({
    revenue: { min: "", max: "" },
    registeredCapital: { min: "", max: "" },
    profit: { min: "", max: "" }
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  
  // เพิ่ม State สำหรับกรองเฉพาะรายการโปรด
  const [showFavorites, setShowFavorites] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
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
      //คัดกรองสถานะ
      if (filterStatus.length > 0 && !filterStatus.includes(l.latestStatus)) return false;
      //รายการโปรด
      if (showFavorites && !l.isStarred) return false; 
      //ตัวกรองการเงิน
      if (finFilters.revenue.min && Number(l.revenue || 0) < Number(finFilters.revenue.min)) return false;
      if (finFilters.revenue.max && Number(l.revenue || 0) > Number(finFilters.revenue.max)) return false;
      if (finFilters.registeredCapital.min && Number(l.registeredCapital || 0) < Number(finFilters.registeredCapital.min)) return false;
      if (finFilters.registeredCapital.max && Number(l.registeredCapital || 0) > Number(finFilters.registeredCapital.max)) return false;
      if (finFilters.profit.min && Number(l.profit || 0) < Number(finFilters.profit.min)) return false;
      if (finFilters.profit.max && Number(l.profit || 0) > Number(finFilters.profit.max)) return false;
      
      return true;
    })
    .sort((a, b) => {
      if (sortConfig.key) {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === "latestStatus") {
          aVal = PRIORITY_WEIGHT[aVal] ?? -1;
          bVal = PRIORITY_WEIGHT[bVal] ?? -1;
        } else if (["revenue", "registeredCapital", "profit"].includes(sortConfig.key)) {
          aVal = Number(aVal || 0);
          bVal = Number(bVal || 0);
        } else if (["latestContactDate", "nextFollowupDate"].includes(sortConfig.key)) {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else {
          aVal = (aVal || "").toString().toLowerCase();
          bVal = (bVal || "").toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      } else {
        // ค่า Default 
        const weightA = PRIORITY_WEIGHT[a.latestStatus] || 0;
        const weightB = PRIORITY_WEIGHT[b.latestStatus] || 0;
        if (weightB !== weightA) return weightB - weightA;
        const dateA = new Date(a.latestContactDate || 0).getTime();
        const dateB = new Date(b.latestContactDate || 0).getTime();
        return dateB - dateA;
      }
    });

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
      key = null; // ปิดการ Sort กลับเป็น Default
    }
    setSortConfig({ key, direction });
  };

  const exportJSON = () => {
    const data = JSON.stringify({ leads, followups }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = "qoraqot_crm_export.json";
    a.click();
  };

  const exportCSV = () => {
    const csvRows = [];
    csvRows.push("บริษัท,เลขนิติบุคคล,ผู้ติดต่อ,เบอร์โทร,อีเมล,รายละเอียด,รายได้รวม,ทุนจดทะเบียน,กำไร,สถานะ,ติดต่อล่าสุด,นัดถัดไป");
    
    // เรียงคอลัมน์ให้ตรงกัน
    filtered.forEach(l => {
      const row = [
        `"${l.companyName || "-"}"`,
        `"${l.companyNumber || "-"}"`,
        `"${l.contactName || "-"}"`,
        `"${l.contactPhone || "-"}"`,
        `"${l.contactEmail || "-"}"`,
        `"${(l.description || "-").replace(/"/g, '""')}"`,
        `"${l.revenue || "-"}"`,
        `"${l.registeredCapital || "-"}"`,
        `"${l.profit || "-"}"`,
        `"${l.latestStatus || "-"}"`,
        `"${l.latestContactDate || "-"}"`,
        `"${l.nextFollowupDate || "-"}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qoraqot_crm_leads.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div style={{ minHeight: "100vh", background: RG.background, fontFamily: "'Sarabun', sans-serif", color: RG.text, display: "flex", flexDirection: "row" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: #E8FFFD; } ::-webkit-scrollbar-thumb { background: #03B5AA; border-radius: 3px; }.status-blue { color: #007bff !important; font-weight: 700 !important; }`}</style>

      {/* Left Sidebar (Hoverable) */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        style={{ 
          width: isSidebarHovered ? 240 : 80, 
          background: RG.navbarBg, 
          padding: isSidebarHovered ? "32px 20px" : "32px 10px", 
          display: "flex", 
          flexDirection: "column", 
          borderRight: `1px solid ${RG.border}`, 
          position: "fixed", 
          top: 0, 
          left: 0,
          height: "100vh", 
          zIndex: 110,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden"
        }}
      >
        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center", gap: isSidebarHovered ? 12 : 0, justifyContent: isSidebarHovered ? "flex-start" : "center", marginBottom: 48, transition: "all 0.3s" }}>
          <div style={{ minWidth: 40, width: 40, height: 40, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 20, boxShadow: RG.shadowSoft }}>Q</div>
          <div style={{ display: "flex", flexDirection: "column", opacity: isSidebarHovered ? 1 : 0, width: isSidebarHovered ? "auto" : 0, overflow: "hidden", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            <span style={{ color: RG.primary, fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>QoraQot CRM</span>
            <span style={{ color: RG.textMuted, fontSize: 11, lineHeight: 1.2 }}>Lead & Sales</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {isSidebarHovered && <div style={{ fontSize: 11, fontWeight: 700, color: RG.textMuted, letterSpacing: 1, marginBottom: 8, paddingLeft: 20, textAlign: "left", opacity: isSidebarHovered ? 1 : 0.5, transition: "all 0.3s" }}>MENU</div>}
          {navItems.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{ padding: isSidebarHovered ? "14px 20px" : "14px 0", borderRadius: 12, border: "none", background: page === n.key ? RG.primary : "transparent", color: page === n.key ? "#fff" : RG.textMuted, cursor: "pointer", fontWeight: page === n.key ? 700 : 500, fontSize: 15, fontFamily: "'Sarabun', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: isSidebarHovered ? "flex-start" : "center", gap: isSidebarHovered ? 12 : 0, boxShadow: page === n.key ? RG.shadowSoft : "none", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 20, width: 24, display: "flex", justifyContent: "center", opacity: page === n.key ? 1 : 0.7 }}>{n.icon}</span> 
              <span style={{ opacity: isSidebarHovered ? 1 : 0, width: isSidebarHovered ? "auto" : 0, overflow: "hidden", transition: "all 0.2s" }}>{n.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: 80, height: "100vh", overflowY: "auto", position: "relative", transition: "margin-left 0.3s" }}>
        
        {/* Floating Top-Right Actions */}
        <div style={{ position: "absolute", top: 24, right: 40, display: "flex", alignItems: "center", gap: 16, zIndex: 100 }}>
          <span style={{ color: RG.warn, fontSize: 12, background: "rgba(245, 158, 11, 0.1)", borderRadius: 12, padding: "6px 16px", fontWeight: 600, border: `1px solid rgba(245, 158, 11, 0.2)` }}>☁ Local Only</span>
          
          <div style={{ display: "flex", gap: 8, background: RG.surface, padding: "6px 12px", borderRadius: 20, boxShadow: RG.shadowSoft, border: `1px solid ${RG.border}` }}>
            <button onClick={undo} disabled={histIdx === 0} title="Undo (Ctrl+Z)" style={{ background: "transparent", border: "none", color: RG.textMuted, cursor: histIdx === 0 ? "not-allowed" : "pointer", opacity: histIdx === 0 ? 0.3 : 1, fontSize: 18, padding: "4px" }}>↶</button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} title="Redo (Ctrl+Y)" style={{ background: "transparent", border: "none", color: RG.textMuted, cursor: histIdx >= history.length - 1 ? "not-allowed" : "pointer", opacity: histIdx >= history.length - 1 ? 0.3 : 1, fontSize: 18, padding: "4px" }}>↷</button>
            <button onClick={() => setShowNotif(true)} style={{ background: "transparent", border: "none", color: RG.textMuted, cursor: "pointer", fontSize: 20, position: "relative", padding: "4px" }}>
              🔔 {dueTodayCount > 0 && <span style={{ position: "absolute", top: -2, right: -4, background: RG.primary, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, border: "2px solid #fff" }}>{dueTodayCount}</span>}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, background: RG.surface, padding: "8px 16px 8px 8px", borderRadius: 24, boxShadow: RG.shadowSoft, border: `1px solid ${RG.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: RG.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
              {currentUser?.username?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: RG.text, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{currentUser?.username || "admin"}</span>
              <span style={{ color: RG.textMuted, fontSize: 10, lineHeight: 1.2 }}>ADMIN</span>
            </div>
            <button onClick={() => { localStorage.removeItem("crm_session"); setAuthenticated(false); }} title="ออกจากระบบ" style={{ background: "transparent", border: "none", color: RG.primary, cursor: "pointer", fontSize: 20, padding: "4px", marginLeft: 8 }}>🚪</button>
          </div>
        </div>

        <div style={{ padding: "32px 40px", paddingTop: 90 }}>
        {page === "leads" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Btn onClick={() => setShowAddLead(true)}>+ เพิ่มลีดใหม่</Btn>
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

                <button 
                  onClick={() => setShowFilterModal(true)} 
                  style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${RG.primary}`, background: (filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) ? RG.primary : "#fff", color: (filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) ? "#fff" : RG.primary, fontSize: 12, cursor: "pointer", fontWeight: 700, fontFamily: "'Sarabun', sans-serif", display: "flex", alignItems: "center", gap: 4 }}
                >
                  ⚙️ ตัวกรอง {(filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) && "(เปิดใช้งาน)"}
                </button>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <select 
                  onChange={e => {
                    if (e.target.value === "json") exportJSON();
                    if (e.target.value === "csv") exportCSV();
                    e.target.value = "";
                  }}
                  style={{ padding: "6px 14px", borderRadius: 8, background: "#ffffff", color: RG.primary, border: `1px solid ${RG.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Sarabun', sans-serif", outline: "none" }}
                >
                  <option value="">⬇ Export</option>
                  <option value="csv">Excel / CSV</option>
                  <option value="json">JSON</option>
                </select>
                <label style={{ padding: "6px 14px", borderRadius: 8, background: "#ffffff", color: RG.primary, border: `1px solid ${RG.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  ⬆ Import <input type="file" accept=".json" onChange={importFile} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden", boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter }}>
              <div style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1600 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, borderBottom: `2px solid ${RG.border}`, background: RG.text, zIndex: 10 }}>
                      <th style={{ padding: "12px 10px", textAlign: "center", color: "#fff", fontSize: 13, width: 36, position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <input type="checkbox" checked={checked.length === filtered.length && filtered.length > 0} onChange={e => setChecked(e.target.checked ? filtered.map(l => l.id) : [])} />
                          {checked.length > 0 && (
                            <button onClick={() => setShowDeleteConfirm(true)} style={{ position: "absolute", left: 36, background: "#fff5f5", border: `1px solid ${RG.warn}`, borderRadius: "6px", padding: "4px 8px", color: RG.warn, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 4, zIndex: 20, boxShadow: "0 2px 4px rgba(220, 53, 69, 0.1)" }} title="ลบข้อมูลที่เลือก">
                              🗑 <span style={{ fontSize: 12, fontWeight: 700 }}>({checked.length})</span>
                            </button>
                          )}
                        </div>
                      </th>
                      {/* เพิ่ม Column สำหรับติดดาว */}
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      <th style={{ padding: "12px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      {[
                        { label: "บริษัท", key: "companyName" },
                        { label: "เลขนิติบุคคล", key: "companyNumber" },
                        { label: "ผู้ติดต่อ", key: "contactName" },
                        { label: "เบอร์", key: "contactPhone" },
                        { label: "อีเมล", key: "contactEmail" },
                        { label: "รายละเอียด", key: "description" },
                        { label: "รายได้รวม", key: "revenue", sortable: true },
                        { label: "ทุนจดทะเบียน", key: "registeredCapital", sortable: true },
                        { label: "กำไร", key: "profit", sortable: true },
                        { label: "สถานะ", key: "latestStatus", sortable: true },
                        { label: "ติดต่อล่าสุด", key: "latestContactDate", sortable: true },
                        { label: "นัดถัดไป", key: "nextFollowupDate", sortable: true }
                      ].map(col => (
                        <th key={col.label} style={{ padding: "12px 10px", textAlign: "left", color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {col.sortable ? (
                            <div onClick={() => handleSort(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                              {col.label}
                              <span style={{ fontSize: 10, color: sortConfig.key === col.key ? RG.primaryPale : "rgba(255, 255, 255, 0.4)" }}>
                                {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? "▲" : "▼") : "▽"}
                              </span>
                            </div>
                          ) : (
                            col.label
                          )}
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
                      
                      // 3. กำหนดสีพื้นหลัง: ถ้าเคยมีตติ้งให้ไฮไลต์สีฟ้าที่เข้มขึ้นให้เห็นชัดเจน ถ้าไม่เคย ให้สลับสีตามเดิม
                      const rowBackground = hasMeetingHistory ? "linear-gradient(90deg, #E0F2FE, #BAE6FD)" : (i % 2 === 0 ? RG.rowOdd : RG.rowEven);

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
                          <td style={{ padding: "8px 10px", fontWeight: lead.isStarred ? 600 : 400 }}><EditableCell value={lead.companyName} onSave={v => inlineEdit(lead.id, "companyName", v)} /></td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <EditableCell value={lead.companyNumber} onSave={v => inlineEdit(lead.id, "companyNumber", v)} />
                              {isDup && <span style={{ background: "#ffeeee", color: RG.danger, fontSize: 10, padding: "1px 6px", borderRadius: 10, border: "1px solid #ffcccc", whiteSpace: "nowrap" }}>ซ้ำ!</span>}
                            </div>
                          </td>
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
      </main>

      {showNotif && <NotificationsPanel leads={leads} onMarkDone={markDone} onClose={() => setShowNotif(false)} />}
      
      {showFilterModal && <FilterModal filterStatus={filterStatus} setFilterStatus={setFilterStatus} finFilters={finFilters} setFinFilters={setFinFilters} onClose={() => setShowFilterModal(false)} />}

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