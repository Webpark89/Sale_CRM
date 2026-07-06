import React, { useCallback, useEffect, useState, useRef } from "react";
import { Toaster, toast } from 'react-hot-toast';
import { STATUSES, STATUS_COLORS, STATUS_ENUM } from "./constants/status";
import { RG } from "./constants/theme";
import { createNewLead, parseDateTH, today, uuid } from "./crmHelpers/helpers";
import LoginScreen from "./components/auth/LoginScreen";
import Btn from "./components/common/Btn";
import EditableCell from "./components/common/EditableCell";
import StatusBadge from "./components/common/StatusBadge";
import Modal from "./components/common/Modal";
import { inputStyle } from "./components/common/styles";
import AddLeadModal from "./components/modals/AddLeadModal";
import CompanyModal from "./components/modals/CompanyModal";
import FollowupQuickForm from "./components/modals/FollowupQuickForm";
import NotificationsPanel from "./components/modals/NotificationsPanel";
import FilterModal from "./components/modals/FilterModal";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import RoleManagementPage from "./pages/RoleManagementPage";
import {
  fetchLeads,
  fetchAllFollowups,
  addLeadToApi,
  updateLeadToApi,
  toggleLeadStarApi,
  deleteMultipleLeadsFromApi,
  addFollowupToApi,
  markFollowupDoneApi,
  restoreLeadsApi,
  hardDeleteLeadApi,
  fetchAllLeadsMaster
} from "./services/apiService";
import { printHTMLTable } from "../../utils/exportHelpers";

// กำหนดน้ำหนักความสำคัญสำหรับการจัดเรียงข้อมูล
const PRIORITY_WEIGHT = {
  [STATUS_ENUM.CLOSED]: 7,
  "ด่วนมาก": 6,
  [STATUS_ENUM.MEETING]: 5,
  [STATUS_ENUM.FOLLOW_UP]: 4,
  [STATUS_ENUM.PROFILE]: 3,
  "ทั่วไป": 2,
  [STATUS_ENUM.UNREACHABLE]: 1,
  [STATUS_ENUM.NOT_INTERESTED]: 0
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("crm_session") === "authenticated");
  const [currentUser, setCurrentUser] = useState(() => {
    const userString = localStorage.getItem("crm_user");
    if (!userString) return null;
    try {
      const u = JSON.parse(userString);
      if (typeof u.permissions === 'string') {
        try { u.permissions = JSON.parse(u.permissions); } catch(e){}
      }
      return u;
    } catch { return null; }
  });
  
  // State for API data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Default page: หน้าแรกของ navItems ที่ user มีสิทธิ์
  // ต้องคำนวณหลังจาก currentUser พร้อมแล้ว จึงใช้ฟังก์ชันช่วย
  const getDefaultPage = (user) => {
    if (!user) return "leads";
    if (user.role_is_system || user.permissions?.leads?.menu) return "leads";
    if (user.permissions?.dashboard?.menu) return "dashboard";
    if (user.permissions?.reports?.menu) return "reports";
    if (user.permissions?.roles?.menu) return "role_management";
    if (user.permissions?.users?.menu) return "user_management";
    return "leads"; // fallback
  };
  const [page, setPage] = useState(() => getDefaultPage(currentUser));
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  // Reassignment states
  const [reassignConfirm, setReassignConfirm] = useState(null); // { leadId, oldOwner, companyName }
  const [confirmFinalReassign, setConfirmFinalReassign] = useState(false);
  const [allSellers, setAllSellers] = useState([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [alertModal, setAlertModal] = useState(null); // { type, message }
  const [checked, setChecked] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState([]);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);
  
  // เพิ่ม State สำหรับตัวกรองและการจัดเรียง
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [finFilters, setFinFilters] = useState({
    revenue: { min: "", max: "" },
    registeredCapital: { min: "", max: "" },
    profit: { min: "", max: "" }
  });
  const [dateFilters, setDateFilters] = useState({
    latestContactDate: { min: "", max: "" },
    nextFollowupDate: { min: "", max: "" }
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const [syncTableWidth, setSyncTableWidth] = useState(1600);
  
  useEffect(() => {
    if (bottomScrollRef.current) {
      const observer = new ResizeObserver(() => {
        if (bottomScrollRef.current) {
          setSyncTableWidth(bottomScrollRef.current.scrollWidth);
        }
      });
      observer.observe(bottomScrollRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const handleTopScroll = (e) => { if (bottomScrollRef.current) bottomScrollRef.current.scrollLeft = e.target.scrollLeft; };
  const handleBottomScroll = (e) => { if (topScrollRef.current) topScrollRef.current.scrollLeft = e.target.scrollLeft; };

  const [showFavorites, setShowFavorites] = useState(false);
  // Fetch fresh user data on load
  useEffect(() => {
    const fetchMe = async () => {
      if (authenticated && currentUser?.id) {
        try {
          const { default: api } = await import('./services/api.js');
          const res = await api.get('/auth/me');
          if (res.data) {
            let u = res.data;
            if (typeof u.permissions === 'string') {
              try { u.permissions = JSON.parse(u.permissions); } catch(e){}
            }
            setCurrentUser(u);
            localStorage.setItem("crm_user", JSON.stringify(u));
          }
        } catch (e) {
          console.error("Failed to fetch fresh user data", e);
        }
      }
    };
    fetchMe();
  }, [authenticated]);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [filterSellers, setFilterSellers] = useState([]); // [] means all sellers
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  
  const [markDoneLead, setMarkDoneLead] = useState(null);

  const syncStatus = "Cloud Synced";
  const currentDateStr = today();
  const myLeads = leads.filter(l => l.ownerId === currentUser?.id || l.createdBy === currentUser?.id);
  const generalCount = myLeads.filter(l => {
    if (l.latestStatus === "ปิดการขาย") return false;
    
    const isNewlyAssigned = l.isAcknowledged === 0 && l.ownerId === currentUser?.id;
    if (isNewlyAssigned) return true;

    const isNewlyCreatedByMe = l.latestStatus === "ฝากโปรไฟล์" && (l.createdBy === currentUser?.id || l.createdBy === null);
    
    return isNewlyCreatedByMe;
  }).length;
  
  const dueTodayCount = myLeads.filter(l => (l.ownerId === currentUser?.id && l.nextFollowupDate && l.nextFollowupDate <= currentDateStr && l.latestStatus !== "ปิดการขาย")).length + generalCount;

  // Undo/Redo Stack
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);

  const pushAction = useCallback((action) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, histIdx + 1);
      newHistory.push(action);
      if (newHistory.length > 50) newHistory.shift();
      else setHistIdx(histIdx + 1);
      return newHistory;
    });
  }, [histIdx]);


  const loadData = useCallback(async () => {
    if (!authenticated) return;
    setIsLoading(true);
    try {
      const canViewAllLeads = currentUser?.role === 'admin' || currentUser?.role_is_system 
        || currentUser?.permissions?.leads?.view === 'all'
        || currentUser?.permissions?.leads?.view_select
        || currentUser?.permissions?.dashboard?.view === 'all'
        || currentUser?.permissions?.dashboard?.view_select
        || currentUser?.permissions?.reports?.view === 'all'
        || currentUser?.permissions?.reports?.view_select;
        
      const fetchedLeads = canViewAllLeads
        ? await fetchAllLeadsMaster() 
        : await fetchLeads();
      const fetchedFollowups = await fetchAllFollowups();
      setLeads(fetchedLeads);
      
      const fMap = {};
      fetchedFollowups.forEach(f => {
        if (!fMap[f.leadId]) fMap[f.leadId] = [];
        fMap[f.leadId].push(f);
      });
      setFollowups(fMap);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const undo = async () => {
    if (histIdx < 0) return;
    const action = history[histIdx];
    
    try {
      if (action.type === 'ADD_LEAD') {
        await hardDeleteLeadApi(action.payload.id);
      } else if (action.type === 'EDIT_LEAD') {
        await updateLeadToApi(action.payload.id, action.payload.oldData);
      } else if (action.type === 'DELETE_LEADS') {
        await restoreLeadsApi(action.payload.ids);
      } else if (action.type === 'TOGGLE_STAR') {
        await toggleLeadStarApi(action.payload.id);
      }
      setHistIdx(histIdx - 1);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error("Undo failed");
    }
  };

  const redo = async () => {
    if (histIdx >= history.length - 1) return;
    const action = history[histIdx + 1];
    
    try {
      if (action.type === 'ADD_LEAD') {
        await addLeadToApi(action.payload.data);
      } else if (action.type === 'EDIT_LEAD') {
        await updateLeadToApi(action.payload.id, action.payload.newData);
      } else if (action.type === 'DELETE_LEADS') {
        await deleteMultipleLeadsFromApi(action.payload.ids);
      } else if (action.type === 'TOGGLE_STAR') {
        await toggleLeadStarApi(action.payload.id);
      }
      setHistIdx(histIdx + 1);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error("Redo failed");
    }
  };

  const addLead = async form => {
    try {
      const newLead = await addLeadToApi(form);
      setLeads([newLead, ...leads]);
      setShowAddLead(false);
      pushAction({ type: "ADD_LEAD", payload: { id: newLead.id, data: newLead } });
    } catch (e) {
      toast.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  const saveLead = async updated => {
    const oldLead = leads.find(l => l.id === updated.id);
    try {
      const response = await updateLeadToApi(updated.id, updated);
      // Backend ส่งกลับมาในรูปแบบ { lead, followup } ถ้ามีการเปลี่ยนสถานะ
      // หรืออาจส่งกลับมาแค่ lead object ตรงๆ (กรณี Undo/Redo)
      const savedLead = response.lead || response;
      const newFollowup = response.followup || null;

      const newLeads = leads.map(l => l.id === updated.id ? savedLead : l);
      setLeads(newLeads);
      setSelectedLead(savedLead);

      // ถ้า Backend งอก Followup ใหม่มาให้ อัปเดต State ทันทีโดยไม่ต้อง Refresh
      if (newFollowup) {
        setFollowups(prev => ({
          ...prev,
          [updated.id]: [...(prev[updated.id] || []), newFollowup]
        }));
      }

      pushAction({ type: "EDIT_LEAD", payload: { id: updated.id, oldData: oldLead, newData: savedLead } });
    } catch (e) {
      toast.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };
  
  const saveFollowup = async (leadId, fForm) => {
    try {
      const { followup: savedFup, lead: updatedLead } = await addFollowupToApi(leadId, fForm);
      const newFollowups = { 
        ...followups, 
        [leadId]: [...(followups[leadId] || []), savedFup] 
      };
      
      let finalLead = updatedLead;
      if (!finalLead) {
        const oldLead = leads.find(l => l.id === leadId);
        const allFups = newFollowups[leadId];
        const latestFup = allFups.reduce((a, b) => new Date(a.date || 0) > new Date(b.date || 0) ? a : b, savedFup);
        finalLead = {
          ...oldLead,
          latestStatus: latestFup.status,
          latestContactDate: latestFup.date,
          nextFollowupDate: latestFup.nextFollowupDate
        };
      }

      const newLeads = leads.map(l => l.id === leadId ? finalLead : l);
      setLeads(newLeads);
      setFollowups(newFollowups);
      setSelectedLead(finalLead);
    } catch(e) {
      toast.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  const markDone = async lead => {
    try {
      const fups = followups[lead.id] || [];
      const fup = fups.find(f => !f.completed && f.nextFollowupDate && f.nextFollowupDate <= today());
      if (fup) {
        await markFollowupDoneApi(fup.id);
        // แก้เฟพาะรายการที่เราเพิ่งกดเท่านั้น ไม่ใช่ทุกรายการ
        const updated = fups.map(f => f.id === fup.id ? { ...f, completed: true } : f);
        const newFollowups = { ...followups, [lead.id]: updated };
        setFollowups(newFollowups);
        
        // เคลียร์ nextFollowupDate ออกจาก lead ด้วยเพื่อให้หายจากแจ้งเตือน
        const newLeads = leads.map(l => l.id === lead.id ? { ...l, nextFollowupDate: null } : l);
        setLeads(newLeads);
      }
      setMarkDoneLead(lead);
      setShowNotif(false);
    } catch(e) {
      console.error(e);
    }
  };

  const inlineEdit = async (leadId, key, value) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const updated = { ...lead, [key]: value };
    try {
      const response = await updateLeadToApi(leadId, updated);
      // Backend ส่งกลับมาในรูปแบบ { lead, followup } ถ้ามีการเปลี่ยนสถานะ/วันที่
      const savedLead = response.lead || response;
      const newFollowup = response.followup || null;

      const newLeads = leads.map(l => l.id === leadId ? savedLead : l);
      setLeads(newLeads);

      // ถ้า Backend งอก Followup ใหม่มาให้ อัปเดต State ทันทีโดยไม่ต้อง Refresh
      if (newFollowup) {
        setFollowups(prev => ({
          ...prev,
          [leadId]: [...(prev[leadId] || []), newFollowup]
        }));
      }

      pushAction({ type: "EDIT_LEAD", payload: { id: leadId, oldData: lead, newData: savedLead } });
    } catch (e) {
      toast.error(e.response?.data?.error || "แก้ไขไม่สำเร็จ");
    }
  };

  const toggleStar = async (leadId) => {
    try {
      const data = await toggleLeadStarApi(leadId);
      const newLeads = leads.map(l => (l.id === leadId ? { ...l, isStarred: data.is_starred } : l));
      setLeads(newLeads);
      pushAction({ type: "TOGGLE_STAR", payload: { id: leadId } });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSelected = async () => {
    const idsToDel = [...checked];
    try {
      await deleteMultipleLeadsFromApi(idsToDel);
      const remaining = leads.filter(l => !idsToDel.includes(l.id));
      const newFollowups = { ...followups };
      idsToDel.forEach(id => delete newFollowups[id]);
      setLeads(remaining);
      setFollowups(newFollowups);
      setChecked([]);
      setShowDeleteConfirm(false);
      pushAction({ type: "DELETE_LEADS", payload: { ids: idsToDel } });
    } catch(e) {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm("ยืนยันการลบลีดนี้ (ลบชั่วคราว)?")) return;
    try {
      await deleteLeadApi(id);
      loadData();
    } catch (e) {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };

  const fetchAllSellers = async () => {
    if (allSellers.length > 0) return; // already fetched
    try {
      const { fetchAllUsers } = await import('./services/apiService.js');
      const users = await fetchAllUsers();
      // Filter out only active users who can own leads
      const sellers = users.filter(u => u.is_active === 1 && u.role_name !== 'admin' && u.role_is_system !== 1);
      setAllSellers(sellers);
    } catch (e) {
      console.error("Failed to fetch sellers", e);
    }
  };

  const handleReassignClick = () => {
    if (!selectedNewOwner) return setAlertModal({ type: 'error', message: "กรุณาเลือกเซลส์คนใหม่" });
    setConfirmFinalReassign(true);
  };

  const handleReassign = async () => {
    const { reassignLeadApi } = await import('./services/apiService.js');
    setIsReassigning(true);
    try {
      await reassignLeadApi(reassignConfirm.leadId, selectedNewOwner);
      setReassignConfirm(null);
      setSelectedNewOwner("");
      setConfirmFinalReassign(false);
      loadData();
      setAlertModal({ type: 'success', message: "โอนย้ายลีดสำเร็จ" });
      // if selectedLead is open, update its owner too
      if (selectedLead && selectedLead.id === reassignConfirm.leadId) {
        const newSeller = allSellers.find(s => s.id.toString() === selectedNewOwner);
        setSelectedLead({...selectedLead, owner: newSeller ? newSeller.username : selectedLead.owner});
      }
    } catch (e) {
      setAlertModal({ type: 'error', message: e.response?.data?.error || "เกิดข้อผิดพลาดในการโอนย้าย" });
    } finally {
      setIsReassigning(false);
    }
  };

  const seenNumbers = new Set();
  const dupNumbersSet = new Set();
  
  for (const l of leads) {
    const n = String(l.companyNumber || "").trim();
    if (!n) continue;
    
    if (seenNumbers.has(n)) {
      dupNumbersSet.add(n);
    } else {
      seenNumbers.add(n);
    }
  }
  const dupNumbers = [...dupNumbersSet];

  // 1. คัดกรองข้อมูลตามสิทธิ์และ filterSellers
  // สิทธิ์ดูลีด — admin และ role_is_system เห็นทุกอย่างเสมอ
  const canViewAll = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.leads?.view === 'all';
  const canViewSelect = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.leads?.view_select;

  // สิทธิ์ Export
  const canExportAll = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.leads?.export === 'all';
  const canExport = canExportAll || currentUser?.permissions?.leads?.export === 'own';
  
  const roleFilteredLeads = (canViewAll || (canViewSelect && filterSellers.length > 0))
    ? leads 
    : leads.filter(l => l.owner === currentUser?.username);
  
  const accessibleLeads = filterSellers.length === 0
    ? roleFilteredLeads
    : roleFilteredLeads.filter(l => filterSellers.includes(l.owner));

  // ปรับปรุง logic กรองข้อมูล + เพิ่มการจัดเรียง
  const filtered = accessibleLeads
    .filter(l => {
      //ค้นหา
      if (search && !(l.companyName || "").toLowerCase().includes(search.toLowerCase()) && !(l.companyNumber || "").includes(search) && !(l.contactPhone || "").includes(search) && !(l.contactEmail || "").toLowerCase().includes(search.toLowerCase()) && !(l.description || "").toLowerCase().includes(search.toLowerCase())) return false;
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
      
      //ตัวกรองวันที่
      if (dateFilters.latestContactDate.min && (!l.latestContactDate || l.latestContactDate < dateFilters.latestContactDate.min)) return false;
      if (dateFilters.latestContactDate.max && (!l.latestContactDate || l.latestContactDate > dateFilters.latestContactDate.max)) return false;
      if (dateFilters.nextFollowupDate.min && (!l.nextFollowupDate || l.nextFollowupDate < dateFilters.nextFollowupDate.min)) return false;
      if (dateFilters.nextFollowupDate.max && (!l.nextFollowupDate || l.nextFollowupDate > dateFilters.nextFollowupDate.max)) return false;

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

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const actualPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedLeads = filtered.slice((actualPage - 1) * itemsPerPage, actualPage * itemsPerPage);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
      key = null; // ปิดการ Sort กลับเป็น Default
    }
    setSortConfig({ key, direction });
  };

  const exportJSON = (dataToExport, filename) => {
    const data = JSON.stringify(dataToExport || { leads, followups }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = filename || "sales_crm_export.json";
    a.click();
  };

  const exportCSV = (dataToExport, filename) => {
    const csvRows = [];
    csvRows.push("บริษัท,เลขนิติบุคคล,ผู้ติดต่อ,เบอร์โทร,อีเมล,รายละเอียด,รายได้รวม,ทุนจดทะเบียน,กำไร,สถานะ,ติดต่อล่าสุด,นัดถัดไป");
    
    // เรียงคอลัมน์ให้ตรงกัน
    const list = dataToExport || filtered;
    list.forEach(l => {
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
    link.download = filename || `sales_crm_leads.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleExport = async (e) => {
    const value = e.target.value;
    e.target.value = ""; // รีเซ็ต Dropdown กลับเป็นค่าตั้งต้นเสมอ
    if (!value) return;

    const [mode, format] = value.split("_"); 
    
    let printWindow = null;
    if (format === "pdf") {
      printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<div style="font-family: sans-serif; padding: 20px;"><h2>กำลังดึงข้อมูลและเตรียมพิมพ์รายงาน... กรุณารอสักครู่ ⏳</h2></div>');
        printWindow.document.close();
      }
    }
    
    let targetLeads = filtered;
    
    if (mode === "all") {
      if (!canExportAll) {
        if (printWindow) printWindow.close();
        return toast.error("ไม่มีสิทธิ์ Export ข้อมูลทั้งหมด");
      }
      try {
        targetLeads = await fetchAllLeadsMaster();
        if (!targetLeads || targetLeads.length === 0) {
          if (printWindow) printWindow.close();
          toast.error("ไม่พบข้อมูล");
          return;
        }
      } catch (err) {
        if (printWindow) printWindow.close();
        toast.error("API Error: " + (err.response?.data?.error || err.message));
        return;
      }
    }

    if (format === "json") {
      exportJSON({ leads: targetLeads, followups: mode === "current" ? followups : {} }, `crm_report_${mode}.json`);
    } else if (format === "csv") {
      exportCSV(targetLeads, `crm_report_${mode}.csv`);
    } else if (format === "pdf") {
      if (printWindow) {
        printWindow.document.open();
      }
      printHTMLTable(targetLeads, mode === "all" ? "รายงานสรุปข้อมูลลีดทั้งหมดในระบบ (All CRM Leads)" : "รายงานสรุปข้อมูลลีด (Current View)", printWindow);
    }
  };

  if (!authenticated) return <LoginScreen onLogin={(user) => { 
    setCurrentUser(user); 
    setAuthenticated(true); 
  }} />;

  const navItems = [
    ...(currentUser?.role_is_system || currentUser?.permissions?.leads?.menu ? [{ key: "leads", label: "จัดการลีด", icon: "👥" }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.dashboard?.menu ? [{ key: "dashboard", label: "Dashboard", icon: "📊" }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.reports?.menu ? [{ key: "reports", label: "รายงาน", icon: "📄" }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.roles?.menu ? [{ key: "role_management", label: "จัดการ Role", icon: "🔐" }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.users?.menu ? [{ key: "user_management", label: "จัดการผู้ใช้งาน", icon: "⚙️" }] : [])
  ];

  return (
    <div style={{ minHeight: "100vh", background: RG.background, fontFamily: RG.fontBody, color: RG.text, display: "flex", flexDirection: "row" }}>
      <Toaster position="top-right" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: #E8FFFD; } ::-webkit-scrollbar-thumb { background: #03B5AA; border-radius: 3px; }.status-blue { color: #007bff !important; font-weight: 700 !important; }`}</style>

      {/* Left Sidebar (Hoverable) */}
      <aside 
        style={{ 
          width: isSidebarExpanded ? 240 : 80, 
          background: "linear-gradient(180deg, #023436 0%, #0f766e 100%)", // Material Dashboard Dark Sidebar
          padding: isSidebarExpanded ? "32px 20px" : "32px 10px", 
          display: "flex", 
          flexDirection: "column", 
          borderRight: `1px solid ${RG.border}`, 
          position: "fixed", 
          top: 0, 
          left: 0,
          height: "100vh", 
          zIndex: 110,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          style={{
            position: "absolute",
            top: "50%",
            marginTop: -16,
            right: -16,
            width: 32,
            height: 32,
            background: "#fff",
            border: `2px solid ${RG.primary}`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: RG.primary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 120,
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {isSidebarExpanded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2 }}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: -2 }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          )}
        </button>

        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center", gap: isSidebarExpanded ? 12 : 0, justifyContent: isSidebarExpanded ? "flex-start" : "center", marginBottom: 48, transition: "all 0.3s" }}>
          <div style={{ minWidth: 40, width: 40, height: 40, background: "rgba(255,255,255,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 20, boxShadow: RG.shadowSoft }}>S</div>
          <div style={{ display: "flex", flexDirection: "column", opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? "auto" : 0, overflow: "hidden", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            <span style={{ color: "#fff", fontFamily: RG.fontHeading, fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Sales CRM System</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: RG.fontBody, fontSize: 11, lineHeight: 1.2 }}>Lead & Sales Management</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {isSidebarExpanded && <div style={{ fontSize: 11, fontWeight: 700, fontFamily: RG.fontHeading, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 8, paddingLeft: 20, textAlign: "left", opacity: isSidebarExpanded ? 1 : 0.5, transition: "all 0.3s" }}>MENU</div>}
          {navItems.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{ position: "relative", padding: isSidebarExpanded ? "14px 20px" : "14px 0", borderRadius: 12, border: "none", background: page === n.key ? "linear-gradient(195deg, #07BEB8, #037971)" : "transparent", color: page === n.key ? "#fff" : "rgba(255,255,255,0.8)", cursor: "pointer", fontWeight: page === n.key ? 600 : 400, fontSize: 15, fontFamily: RG.fontHeading, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: isSidebarExpanded ? "flex-start" : "center", gap: isSidebarExpanded ? 12 : 0, boxShadow: page === n.key ? "0 4px 20px 0 rgba(0, 0, 0, 0.14), 0 7px 10px -5px rgba(3, 181, 170, 0.4)" : "none", whiteSpace: "nowrap", marginBottom: 4 }}>
              {page === n.key && <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 4, height: 20, background: "#fff", borderRadius: "0 4px 4px 0" }} />}
              <span style={{ fontSize: 20, width: 24, display: "flex", justifyContent: "center", opacity: page === n.key ? 1 : 0.8 }}>{n.icon}</span> 
              <span style={{ opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? "auto" : 0, overflow: "hidden", transition: "all 0.2s" }}>{n.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: isSidebarExpanded ? 240 : 80, height: "100vh", overflowY: "auto", position: "relative", transition: "margin-left 0.3s" }}>
        
        {/* Floating Top-Right Actions */}
        <div style={{ position: "absolute", top: 24, right: 40, display: "flex", alignItems: "center", gap: 16, zIndex: 100, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", padding: "10px 20px", borderRadius: "16px", boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={undo} disabled={histIdx < 0} style={{ padding: "8px 12px", borderRadius: "20px", border: "1px solid " + RG.border, background: histIdx < 0 ? "#f8f9fa" : "#fff", color: histIdx < 0 ? "#ccc" : RG.text, cursor: histIdx < 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", boxShadow: RG.shadowSoft }} title="Undo (ย้อนกลับ)">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} style={{ padding: "8px 12px", borderRadius: "20px", border: "1px solid " + RG.border, background: histIdx >= history.length - 1 ? "#f8f9fa" : "#fff", color: histIdx >= history.length - 1 ? "#ccc" : RG.text, cursor: histIdx >= history.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", boxShadow: RG.shadowSoft }} title="Redo (ทำซ้ำ)">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
            </button>
          </div>
          <span style={{ color: RG.warn, fontSize: 12, background: "rgba(245, 158, 11, 0.1)", borderRadius: 12, padding: "6px 16px", fontWeight: 600, border: `1px solid rgba(245, 158, 11, 0.2)` }}>☁ Cloud Synced</span>
          
          <div style={{ display: "flex", gap: 8, background: RG.surface, padding: "6px 12px", borderRadius: 20, boxShadow: RG.shadowSoft, border: `1px solid ${RG.border}` }}>
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
              <span style={{ color: RG.textMuted, fontSize: 10, lineHeight: 1.2 }}>
                {{ admin: "ผู้ดูแลระบบ", header_saler: "หัวหน้าเซลส์", saler: "เซลส์" }[currentUser?.role] || "USER"}
              </span>
            </div>
            <button onClick={() => { localStorage.removeItem("crm_session"); setAuthenticated(false); }} title="ออกจากระบบ" style={{ background: "transparent", border: "none", color: RG.primary, cursor: "pointer", fontSize: 20, padding: "4px", marginLeft: 8 }}>🚪</button>
          </div>
        </div>

        <div style={{ padding: "32px 40px", paddingTop: 90 }}>
        {page === "leads" && (
          <>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 6px rgba(15, 118, 110, 0.2)" }}>
                👥
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการข้อมูลลูกค้า (Leads)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>ระบบจัดการฐานข้อมูลลูกค้าและการติดตามการขาย</p>
              </div>
            </div>
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

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                {(canViewAll || canViewSelect) && (
                  <div style={{ position: "relative" }}>
                    <div 
                      onClick={() => setIsSellerDropdownOpen(!isSellerDropdownOpen)}
                      style={{ ...inputStyle, width: "180px", cursor: "pointer", backgroundColor: filterSellers.length > 0 ? "#fffbeb" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", border: filterSellers.length > 0 ? "1px solid #fcd34d" : `1px solid ${RG.border}` }}
                    >
                      <span style={{ color: filterSellers.length > 0 ? "#b45309" : RG.text }}>
                        {filterSellers.length === 0 ? "👥 แสดงทุกเซลส์" : `👥 เลือกแล้ว ${filterSellers.length} เซลส์`}
                      </span>
                      <span style={{ fontSize: 10 }}>▼</span>
                    </div>
                    {isSellerDropdownOpen && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${RG.border}`, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 50, padding: "8px 0", marginTop: "4px", maxHeight: "250px", overflowY: "auto" }}>
                        <label style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #eee" }}>
                          <input type="checkbox" checked={filterSellers.length === 0} onChange={() => setFilterSellers([])} style={{ marginRight: 8 }} />
                          แสดงทุกเซลส์
                        </label>
                        {[...new Set(leads.map(l => l.owner).filter(Boolean))].map(seller => (
                          <label key={seller} style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
                            <input 
                              type="checkbox" 
                              checked={filterSellers.includes(seller)} 
                              onChange={() => {
                                setFilterSellers(prev => 
                                  prev.includes(seller) ? prev.filter(s => s !== seller) : [...prev, seller]
                                );
                              }} 
                              style={{ marginRight: 8 }} 
                            />
                            {seller}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {canExport && (
                  <select 
                    onChange={handleExport}
                    style={{ 
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: `1px solid ${RG.primary}`,
                      backgroundColor: "#ffffff",
                      color: RG.primary,
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      height: "36px",
                      outline: "none",
                      fontFamily: "'Sarabun', sans-serif",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="">⬇ Export</option>
                    <optgroup label="เฉพาะหน้าปัจจุบัน (Current View)">
                      <option value="current_csv">Excel / CSV</option>
                      <option value="current_json">JSON</option>
                      <option value="current_pdf">PDF (Print)</option>
                    </optgroup>
                    {canExportAll && (
                      <optgroup label="ทั้งหมด (All Report)">
                        <option value="all_csv">Excel / CSV</option>
                        <option value="all_json">JSON</option>
                        <option value="all_pdf">PDF (Print All)</option>
                      </optgroup>
                    )}
                  </select>
                )}
              </div>
            </div>

            <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden", boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter }}>
              
              {/* แถบเลื่อนด้านบน */}
              <div 
                ref={topScrollRef} 
                onScroll={handleTopScroll} 
                style={{ overflowX: "auto", maxWidth: "100%" }}
              >
                <div style={{ width: syncTableWidth, height: 1 }}></div>
              </div>

              {/* ตารางหลัก */}
              <div 
                ref={bottomScrollRef} 
                onScroll={handleBottomScroll}
                style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: 10 }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1600 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: RG.text, zIndex: 10, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                      <th style={{ padding: "16px 10px", textAlign: "center", color: "#fff", fontSize: 13, width: 36, position: "relative" }}>
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
                      <th style={{ padding: "16px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      <th style={{ padding: "16px 8px", color: "#fff", fontSize: 13, width: 36 }} />
                      <th style={{ padding: "16px 10px", color: "#fff", fontSize: 13, fontWeight: 700, width: 40, textAlign: "center" }}>#</th>
                      {[
                        { label: "บริษัท", key: "companyName" },
                        { label: "เลขนิติบุคคล", key: "companyNumber" },
                        { label: "ผู้ติดต่อ", key: "contactName" },
                        { label: "เบอร์", key: "contactPhone" },
                        { label: "อีเมล", key: "contactEmail" },
                        { label: "รายละเอียด", key: "description" },
                        ...(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler'
                          ? [{ label: "เซลผู้ดูแล", key: "owner", sortable: true }]
                          : []),
                        { label: "รายได้รวม", key: "revenue", sortable: true },
                        { label: "ทุนจดทะเบียน", key: "registeredCapital", sortable: true },
                        { label: "กำไร", key: "profit", sortable: true },
                        { label: "สถานะ", key: "latestStatus", sortable: true },
                        { label: "ติดต่อล่าสุด", key: "latestContactDate", sortable: true },
                        { label: "นัดถัดไป", key: "nextFollowupDate", sortable: true }
                      ].map(col => (
                        <th key={col.label} style={{ padding: "16px 10px", textAlign: "left", color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {col.sortable ? (
                            <div onClick={() => handleSort(col.key)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", userSelect: "none" }}>
                              {col.label}
                              <span style={{ fontSize: 10, color: sortConfig.key === col.key ? RG.primaryLight : "rgba(255, 255, 255, 0.4)" }}>
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
                    {paginatedLeads.length === 0 && (
                      <tr>
                        <td colSpan={15} style={{ textAlign: "center", padding: "40px", color: RG.textMuted }}>
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    )}
                    {paginatedLeads.map((lead, i) => {
                      const isDup = dupNumbers.includes(lead.companyNumber);
                      
                      // 1. ดึงประวัติการติดตามทั้งหมดของลีดรายการนี้
                      const leadFollowups = followups[lead.id] || [];

                      // 2. ตรวจสอบว่า "สถานะปัจจุบัน" หรือ "ประวัติที่ผ่านมา" เคยเป็น "มีตติ้ง" หรือไม่
                      const hasMeetingHistory = 
                        lead.latestStatus === "มีตติ้ง" || 
                        lead.everHadMeeting === true || // ตรวจสอบจากความจำฝังตัวที่เราเพิ่มเข้าไป
                        leadFollowups.some(f => f.status === "มีตติ้ง");
                      
                      // 3. กำหนดสีพื้นหลัง: ถ้าเคยมีตติ้งให้ไฮไลต์สีส้มให้เห็นชัดเจน ถ้าไม่เคย ให้สลับสีตามเดิม
                      const rowBackground = lead.latestStatus === "มีตติ้ง" ? "#FEF08A" : "#fff";
                      const hoverBackground = lead.latestStatus === "มีตติ้ง" ? "#FDE047" : "#f9fafb";
                      return (
                        <tr 
                          key={lead.id} 
                          style={{ background: rowBackground, borderBottom: `1px solid #e5e7eb`, transition: "background-color 0.2s ease" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBackground}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBackground}
                        >
                          <td style={{ padding: "16px 10px", textAlign: "center" }}>
                            <input type="checkbox" checked={checked.includes(lead.id)} onChange={e => setChecked(c => (e.target.checked ? [...c, lead.id] : c.filter(x => x !== lead.id)))} />
                          </td>
                          {/* ปุ่มติดดาว */}
                          <td style={{ padding: "16px 6px", textAlign: "center" }}>
                            <button onClick={() => toggleStar(lead.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>
                              {lead.isStarred ? "⭐" : "☆"}
                            </button>
                          </td>
                          <td style={{ padding: "16px 6px" }}>
                            <button onClick={() => setSelectedLead(lead)} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#4b5563", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => {e.currentTarget.style.background = RG.primary; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = RG.primary;}} onMouseLeave={e => {e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.borderColor = "#e5e7eb";}}>👁</button>
                          </td>
                          <td style={{ padding: "16px 10px", textAlign: "center", fontSize: 13, color: RG.textMuted, fontWeight: 600 }}>
                            {(actualPage - 1) * itemsPerPage + i + 1}
                          </td>
                          <td style={{ padding: "16px 10px", fontWeight: lead.isStarred ? 600 : 400 }}>
                            <EditableCell value={lead.companyName} onSave={v => inlineEdit(lead.id, "companyName", v)} />
                          </td>
                          <td style={{ padding: "16px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <EditableCell value={lead.companyNumber} onSave={v => inlineEdit(lead.id, "companyNumber", v)} />
                              {isDup && <span style={{ background: "#ffeeee", color: RG.danger, fontSize: 10, padding: "2px 8px", borderRadius: 12, border: "1px solid #ffcccc", whiteSpace: "nowrap", fontWeight: 600 }}>ซ้ำ!</span>}
                            </div>
                          </td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactName} onSave={v => inlineEdit(lead.id, "contactName", v)} /></td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactPhone} onSave={v => inlineEdit(lead.id, "contactPhone", v)} type="phone" /></td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.contactEmail} onSave={v => inlineEdit(lead.id, "contactEmail", v)} /></td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.description} onSave={v => inlineEdit(lead.id, "description", v)} /></td>
                          {(currentUser?.permissions?.leads?.view_owner || currentUser?.role === 'admin' || currentUser?.role === 'header_saler') && (
                            <td style={{ padding: "16px 10px", whiteSpace: "nowrap", color: RG.primaryMid, fontWeight: 600 }}>
                              {currentUser?.role === 'admin' || currentUser?.role === 'header_saler' || currentUser?.permissions?.leads?.reassign ? (
                                <span onClick={() => { setReassignConfirm({ leadId: lead.id, oldOwner: lead.owner, companyName: lead.companyName }); fetchAllSellers(); }} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{lead.owner || "-"}</span>
                              ) : (
                                lead.owner || "-"
                              )}
                            </td>
                          )}
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.revenue} onSave={v => inlineEdit(lead.id, "revenue", Number(v))} type="number" /></td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.registeredCapital} onSave={v => inlineEdit(lead.id, "registeredCapital", Number(v))} type="number" /></td>
                          <td style={{ padding: "16px 10px" }}><EditableCell value={lead.profit} onSave={v => inlineEdit(lead.id, "profit", Number(v))} type="number" /></td>
                          <td style={{ padding: "16px 10px" }}><StatusBadge status={lead.latestStatus} /></td>
                          <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}><EditableCell value={lead.latestContactDate} onSave={v => inlineEdit(lead.id, "latestContactDate", v)} type="date" /></td>
                          <td style={{ padding: "16px 10px", whiteSpace: "nowrap" }}>{lead.nextFollowupDate && lead.nextFollowupDate === today() ? (
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
              <div style={{ padding: "10px 16px", background: "#ffffff", borderTop: `1px solid ${RG.border}`, fontSize: 12, color: RG.textMuted, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span>แสดง {paginatedLeads.length} จาก {filtered.length} รายการ (ทั้งหมด {leads.length} รายการ)</span>
                  {filterStatus.length > 0 && <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 10 }}>กรอง: {filterStatus.join(", ")}</span>}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button 
                      disabled={actualPage === 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${actualPage === 1 ? "#e2e8f0" : RG.border}`, background: actualPage === 1 ? "#f8f9fa" : "#fff", color: actualPage === 1 ? "#cbd5e1" : RG.text, cursor: actualPage === 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      ก่อนหน้า
                    </button>
                    <span style={{ fontWeight: 600 }}>หน้า {actualPage} / {totalPages}</span>
                    <button 
                      disabled={actualPage === totalPages} 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${actualPage === totalPages ? "#e2e8f0" : RG.border}`, background: actualPage === totalPages ? "#f8f9fa" : "#fff", color: actualPage === totalPages ? "#cbd5e1" : RG.text, cursor: actualPage === totalPages ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      ถัดไป
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 6px rgba(15, 118, 110, 0.2)" }}>
                📊
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>ภาพรวมและสถิติ (Dashboard)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สรุปผลการดำเนินงานและสถิติการขาย</p>
              </div>
            </div>
            <Dashboard leads={leads} followups={followups} currentUser={currentUser} />
          </div>
        )}

        {page === "reports" && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 6px rgba(15, 118, 110, 0.2)" }}>
                📄
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>รายงานการติดตาม (Reports)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างรายงานและสรุปผลข้อมูลลูกค้าสำหรับการส่งมอบ</p>
              </div>
            </div>
            {/* ส่งฟังก์ชัน setSelectedLead เข้าไปเป็น onViewLead */}
            <Reports leads={leads} onViewLead={setSelectedLead} isMaster={false} onExitMaster={() => {}} currentUser={currentUser} />
          </div>
        )}

        {page === "role_management" && (currentUser?.role_is_system || currentUser?.permissions?.roles?.menu) && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 6px rgba(15, 118, 110, 0.2)" }}>
                🔐
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการ Role & สิทธิ์การใช้งาน (Role Management)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างและกำหนด Permission ของแต่ละ Role ภายในระบบ</p>
              </div>
            </div>
            <RoleManagementPage currentUser={currentUser} />
          </div>
        )}

        {page === "user_management" && (currentUser?.role_is_system || currentUser?.permissions?.users?.menu) && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #0f766e, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", boxShadow: "0 4px 6px rgba(15, 118, 110, 0.2)" }}>
                ⚙️
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการผู้ใช้งาน (User Management)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างและจัดการสิทธิ์ผู้ใช้งานระบบ</p>
              </div>
            </div>
            <UserManagement currentUser={currentUser} />
          </div>
        )}
        </div>
      </main>

      {showNotif && <NotificationsPanel currentUser={currentUser} leads={myLeads} onMarkDone={markDone} onViewLead={(lead) => { setSelectedLead(lead); setIsModalReadOnly(true); }} onClose={() => setShowNotif(false)} />}
      
      {showFilterModal && <FilterModal filterStatus={filterStatus} setFilterStatus={setFilterStatus} finFilters={finFilters} setFinFilters={setFinFilters} dateFilters={dateFilters} setDateFilters={setDateFilters} onClose={() => setShowFilterModal(false)} />}

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
      {showAddLead && <AddLeadModal leads={leads} onClose={() => setShowAddLead(false)} onSave={addLead} currentUser={currentUser} allSellers={allSellers} fetchAllSellers={fetchAllSellers} />}

      {/* ส่ง leads={leads} ไปให้ CompanyModal เพื่อตรวจสอบเลขนิติบุคคลซ้ำ */}
      {selectedLead && <CompanyModal readOnly={isModalReadOnly} lead={selectedLead} leads={leads} followups={followups} onClose={() => { setSelectedLead(null); setIsModalReadOnly(false); }} onSave={saveLead} onSaveFollowup={saveFollowup} allSellers={allSellers} fetchAllSellers={fetchAllSellers} handleReassign={handleReassign} setReassignConfirm={setReassignConfirm} currentUser={currentUser} />}

      {reassignConfirm && (
        <Modal title={`โอนย้ายผู้ดูแล: ${reassignConfirm.companyName}`} onClose={() => { setReassignConfirm(null); setSelectedNewOwner(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span style={{ color: RG.textMuted, fontSize: 14 }}>ผู้ดูแลปัจจุบัน:</span>
              <div style={{ fontWeight: 600, fontSize: 16, color: RG.text }}>{reassignConfirm.oldOwner || "-"}</div>
            </div>
            <div>
              <span style={{ color: RG.textMuted, fontSize: 14 }}>เลือกผู้ดูแลใหม่:</span>
              <select 
                value={selectedNewOwner} 
                onChange={e => setSelectedNewOwner(e.target.value)} 
                style={{ ...inputStyle, width: "100%", marginTop: 8 }}
              >
                <option value="" disabled>-- เลือกเซลส์ --</option>
                {allSellers.map(s => (
                  <option key={s.id} value={s.id}>{s.username} {s.display_name ? `(${s.display_name})` : ""}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => { setReassignConfirm(null); setSelectedNewOwner(""); }} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleReassignClick} disabled={isReassigning} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: RG.primary, color: "#fff", cursor: isReassigning ? "not-allowed" : "pointer" }}>
                ยืนยันการโอนย้าย
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmFinalReassign && (
        <Modal title="ยืนยันการโอนย้าย" onClose={() => setConfirmFinalReassign(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0 }}>แน่ใจว่าจะเปลี่ยนใช่มั้ย?</p>
            <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmFinalReassign(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleReassign} disabled={isReassigning} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: RG.danger, color: "#fff", cursor: isReassigning ? "not-allowed" : "pointer" }}>
                {isReassigning ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {alertModal && (
        <Modal title={alertModal.type === 'success' ? "สำเร็จ" : "ข้อผิดพลาด"} onClose={() => setAlertModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "16px 0" }}>
            <div style={{ fontSize: 48 }}>
              {alertModal.type === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ color: RG.text, fontSize: 16, textAlign: "center", margin: 0 }}>
              {alertModal.message}
            </p>
            <button onClick={() => setAlertModal(null)} style={{ padding: "8px 24px", borderRadius: 6, border: "none", background: RG.primary, color: "#fff", cursor: "pointer", marginTop: 16, fontSize: 14, fontWeight: 600 }}>
              ตกลง
            </button>
          </div>
        </Modal>
      )}

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
