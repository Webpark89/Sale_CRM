import notify from "../../utils/toast";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { STAGES, STAGE_STATUS_MAP, ALL_STATUSES, STAGE_PRIORITY, isValidStageStatus } from "./constants/status";
import { RG } from "./constants/theme";
import { createNewLead, parseDateTH, today, uuid, PROVINCES } from "./crmHelpers/helpers";
import LoginScreen from "./components/auth/LoginScreen";
import Btn from "./components/common/Btn";
import EditableCell from "./components/common/EditableCell";
import StatusBadge from "./components/common/StatusBadge";
import Modal from "./components/common/Modal";
import { inputStyle } from "./components/common/styles";
import Sidebar from "./components/layout/Sidebar";
import TopHeader from "./components/layout/TopHeader";
import AppModals from "./components/layout/AppModals";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import FollowupHistoryPage from "./pages/FollowupHistoryPage";
import RoleManagementPage from "./pages/RoleManagementPage";
import RoleFormPage from "./pages/RoleFormPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import { fetchLeads, fetchAllFollowups, addLeadToApi, updateLeadToApi, deleteLeadFromApi, restoreLeadsApi, hardDeleteLeadApi, fetchAllLeadsMaster, toggleLeadStarApi, deleteMultipleLeadsFromApi, addFollowupToApi, markFollowupDoneApi, acknowledgeLeadApi, fetchAllUsers, reassignLeadApi } from "./services/apiService";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import api, { API_BASE_URL } from "./services/api";
import { printHTMLTable } from "../../utils/exportHelpers";
import { UsersRound, LayoutDashboard, FileText, Shield, UserRound } from "lucide-react";

// น้ำหนักความสำคัญตาม Stage
const PRIORITY_WEIGHT = {
  Approval: 5,
  Proposal: 4,
  Meeting:  3,
  Contact:  2,
  Closed:   1,
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
    if (user.role_is_system || user.permissions?.leads?.menu !== false) return "leads";
    if (user.permissions?.dashboard?.menu !== false) return "dashboard";
    if (user.permissions?.reports?.menu !== false) return "reports";
    if (user.permissions?.roles?.menu) return "role_management";
    if (user.permissions?.users?.menu) return "user_management";
    return "leads"; // fallback
  };
  const location = useLocation();
  const navigate = useNavigate();
  const page = location.pathname.substring(1) || getDefaultPage(currentUser);
  const [selectedLead, setSelectedLead] = useState(null);

  const handleViewLead = useCallback((leadOrId) => {
    if (!leadOrId) return;
    const id = typeof leadOrId === 'object' ? leadOrId.id : leadOrId;
    navigate('/lead/' + id);
  }, [navigate]);
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
  const [filterLatestStatus, setFilterLatestStatus] = useState([]);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);
  const [filterProvince, setFilterProvince] = useState([]);
  
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

  const handleTopScroll = (e) => {
    if (bottomScrollRef.current && bottomScrollRef.current.scrollLeft !== e.target.scrollLeft) {
      bottomScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };
  const handleBottomScroll = (e) => {
    if (topScrollRef.current && topScrollRef.current.scrollLeft !== e.target.scrollLeft) {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const [showFavorites, setShowFavorites] = useState(false);
  // Fetch fresh user data on load
  useEffect(() => {
    const fetchMe = async () => {
      if (authenticated && currentUser?.id) {
        try {
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
  useEffect(() => {
    if (page === "role_management") {
      setIsSidebarExpanded(false);
    }
  }, [page]);
  const [notifTab, setNotifTab] = useState(1);
  const [filterSellers, setFilterSellers] = useState([]); // [] means all sellers
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  
  const [markDoneLead, setMarkDoneLead] = useState(null);

  const syncStatus = "Cloud Synced";
  const currentDateStr = today();
  const myLeads = leads.filter(l => Number(l.ownerId) === Number(currentUser?.id) || Number(l.createdBy) === Number(currentUser?.id));
  const generalCount = myLeads.filter(l => {
    const isNewlyAssigned = Number(l.isAcknowledged) === 0 && Number(l.ownerId) === Number(currentUser?.id);
    if (isNewlyAssigned) return true;

    if (l.stage === 'Closed') return false;
    const isNewlyCreatedByMe = Number(l.isAcknowledged) === 0 && (Number(l.createdBy) === Number(currentUser?.id) || l.createdBy === null);
    
    return isNewlyCreatedByMe;
  }).length;
  const dueTodayCount = myLeads.filter(l => (Number(l.ownerId) === Number(currentUser?.id) && l.nextFollowupDate && l.nextFollowupDate <= currentDateStr && l.stage !== 'Closed')).length;

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
    const intervalId = setInterval(() => {
      if (authenticated) {
        loadData();
      }
    }, 15000);
    return () => clearInterval(intervalId);
  }, [loadData, authenticated]);

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
      notify.error("Undo failed");
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
      notify.error("Redo failed");
    }
  };

  const validateLeadData = (lead) => {
    if (!lead.companyName || !lead.companyName.trim()) {
      return "กรุณากรอกชื่อบริษัท";
    }
    if (lead.companyNumber && !/^\d{13}$/.test(lead.companyNumber)) {
      return "เลขนิติบุคคลต้องเป็นตัวเลข 13 หลักเท่านั้น";
    }
    // validate stage
    if (lead.stage && !STAGES.includes(lead.stage)) {
      return `Stage "${lead.stage}" ไม่ถูกต้อง`;
    }
    // validate status vs stage
    if (lead.stage && lead.latestStatus && !isValidStageStatus(lead.stage, lead.latestStatus)) {
      return `Status "${lead.latestStatus}" ไม่สอดคล้องกับ Stage "${lead.stage}"`;
    }
    const phone = lead.contactPhone;
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return "เบอร์โทรศัพท์ต้องเป็นตัวเลข (อนุญาตให้ใช้ -, space, +, ( ))";
    }
    const email = lead.contactEmail;
    if (email) {
      if (/[ก-๙]/.test(email)) {
        return "ห้ามใส่อีเมลเป็นภาษาไทย";
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }
    const regCap = Number(lead.registeredCapital);
    const rev = Number(lead.revenue);
    const prof = Number(lead.profit);
    const dealVal = Number(lead.dealValue);
    if (!isNaN(regCap) && regCap < 0) {
      return "ทุนจดทะเบียนไม่สามารถติดลบได้";
    }
    if (!isNaN(regCap) && regCap === 0 && lead.registeredCapital !== "" && lead.registeredCapital !== undefined && lead.registeredCapital !== null) {
      return "ทุนจดทะเบียนต้องมากกว่า 0 บาท";
    }
    if ((!isNaN(rev) && rev < 0) || (!isNaN(prof) && prof < 0) || (!isNaN(dealVal) && dealVal < 0)) {
      return "รายได้, กำไร และมูลค่าโครงการไม่สามารถติดลบได้";
    }
    if (lead.latestContactDate && lead.nextFollowupDate) {
      if (new Date(lead.latestContactDate) > new Date(lead.nextFollowupDate)) {
        return "วันที่ติดต่อต้องไม่ช้ากว่าวันที่นัดหมายถัดไป";
      }
    }
    return null;
  };

  const addLead = async form => {
    const err = validateLeadData(form);
    if (err) {
      notify.error(err);
      return;
    }
    try {
      const newLead = await addLeadToApi(form);
      setLeads([newLead, ...leads]);
      setShowAddLead(false);
      pushAction({ type: "ADD_LEAD", payload: { id: newLead.id, data: newLead } });
        notify.success("สร้างลีดใหม่สำเร็จ");
      } catch (e) {
      notify.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  const saveLead = async updated => {
    const err = validateLeadData(updated);
    if (err) {
      notify.error(err);
      throw new Error(err);
    }
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
      notify.success("บันทึกข้อมูลสำเร็จ");
    } catch (e) {
      notify.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
      throw e;
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
      notify.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");
    }
  };

  const markDone = async (lead, sectionType) => {
    try {
      let currentLeads = leads;
      
      if (sectionType === "general") {
        await acknowledgeLeadApi(lead.id);
        currentLeads = currentLeads.map(l => l.id === lead.id ? { ...l, isAcknowledged: 1 } : l);
        setLeads(currentLeads);
        loadData();
        return;
      }

      const fups = followups[lead.id] || [];
      const fup = fups.find(f => !f.completed && f.nextFollowupDate && f.nextFollowupDate <= today());
      if (fup) {
        await markFollowupDoneApi(fup.id);
        const updated = fups.map(f => f.id === fup.id ? { ...f, completed: true } : f);
        const newFollowups = { ...followups, [lead.id]: updated };
        setFollowups(newFollowups);
        
        // อัปเดต Lead ให้ nextFollowupDate กลายเป็น null 
        currentLeads = currentLeads.map(l => l.id === lead.id ? { ...l, nextFollowupDate: null } : l);
        setLeads(currentLeads);
      }
      setMarkDoneLead(currentLeads.find(l => l.id === lead.id) || lead);
    } catch (e) {
      console.error(e);
      if (e.response?.data?.error) {
        setAlertModal({ show: true, type: "error", title: "ข้อผิดพลาด", message: e.response.data.error });
      } else {
        setAlertModal({ show: true, type: "error", title: "ข้อผิดพลาด", message: "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง" });
      }
    }
  };

  const inlineEdit = async (leadId, key, value) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const updated = { ...lead, [key]: value };
    // ถ้าเปลี่ยนแค่ stage ให้ skip stage-status cross-validation (status จะเปลี่ยนแยกอีกครั้ง)
    const validationTarget = key === "stage" ? { ...updated, latestStatus: null } : updated;
    const err = validateLeadData(validationTarget);
    if (err) {
      notify.error(err);
      return;
    }
    // ถ้าเปลี่ยน stage ให้ clear latestStatus ใน local state แต่ไม่ส่ง null ไป backend
    const payload = key === "stage" ? { ...updated, latestStatus: undefined } : updated;
    try {
      const response = await updateLeadToApi(leadId, payload);
      // Backend ส่งกลับมาในรูปแบบ { lead, followup } ถ้ามีการเปลี่ยนสถานะ/วันที่
      const savedLead = response.lead || response;
      const newFollowup = response.followup || null;

      // ถ้าเปลี่ยน stage ให้ reset latestStatus ใน local state รอให้ sales เลือก status ใหม่
      const displayLead = key === "stage" ? { ...savedLead, latestStatus: null } : savedLead;

      const newLeads = leads.map(l => l.id === leadId ? displayLead : l);
      setLeads(newLeads);

      // ถ้า Backend งอก Followup ใหม่มาให้ อัปเดต State ทันทีโดยไม่ต้อง Refresh
      if (newFollowup) {
        setFollowups(prev => ({
          ...prev,
          [leadId]: [...(prev[leadId] || []), newFollowup]
        }));
      }

      pushAction({ type: "EDIT_LEAD", payload: { id: leadId, oldData: lead, newData: displayLead } });
      notify.success("แก้ไขข้อมูลสำเร็จ");
    } catch (e) {
      notify.error(e.response?.data?.error || "แก้ไขไม่สำเร็จ");
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
      notify.error(e.response?.data?.error || "ไม่สามารถเปลี่ยนสถานะดาวได้");
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
      notify.error("ลบไม่สำเร็จ");
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm("ยืนยันการลบลีดนี้ (ลบชั่วคราว)?")) return;
    try {
      await deleteLeadFromApi(id);
      loadData();
    } catch (e) {
      notify.error("ลบข้อมูลไม่สำเร็จ");
    }
  };

  const fetchAllSellers = async () => {
    if (allSellers.length > 0) return; // already fetched
    try {
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
      if (filterStatus.length > 0 && !filterStatus.includes(l.stage || 'Contact')) return false;
      if (filterLatestStatus.length > 0 && !filterLatestStatus.includes(l.latestStatus || "")) return false;
      //คัดกรองจังหวัด
      if (filterProvince.length > 0 && (!l.province || !filterProvince.includes(l.province))) return false;
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
        const weightA = PRIORITY_WEIGHT[a.stage] || 0;
        const weightB = PRIORITY_WEIGHT[b.stage] || 0;
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
        return notify.error("ไม่มีสิทธิ์ Export ข้อมูลทั้งหมด");
      }
      try {
        targetLeads = await fetchAllLeadsMaster();
        if (!targetLeads || targetLeads.length === 0) {
          if (printWindow) printWindow.close();
          notify.error("ไม่พบข้อมูล");
          return;
        }
      } catch (err) {
        if (printWindow) printWindow.close();
        notify.error("API Error: " + (err.response?.data?.error || err.message));
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
    ...(currentUser?.role_is_system || currentUser?.permissions?.leads?.menu !== false ? [{ key: "leads", label: "จัดการลีด", icon: <UsersRound size={20} /> }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.dashboard?.menu !== false ? [{ key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.reports?.menu !== false ? [{ key: "reports", label: "รายงาน", icon: <FileText size={20} /> }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.roles?.menu ? [{ key: "role_management", label: "จัดการ Role", icon: <Shield size={20} /> }] : []),
    ...(currentUser?.role_is_system || currentUser?.permissions?.users?.menu ? [{ key: "user_management", label: "จัดการผู้ใช้งาน", icon: <UserRound size={20} /> }] : [])
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100%", margin: 0, padding: 0, fontFamily: RG.fontBody, color: RG.text, display: "flex", flexDirection: "row", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, background: RG.background, filter: "blur(12px)", zIndex: 0 }} />
      <div style={{ display: "flex", flexDirection: "row", width: "100%", zIndex: 1 }}>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; padding: 0; height: 100vh; overflow-x: hidden; } ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: var(--color-primary-ghost); } ::-webkit-scrollbar-thumb { background: var(--color-primary-light); border-radius: 3px; }.status-blue { color: #007bff !important; font-weight: 700 !important; } table, table * { font-family: 'Sarabun', sans-serif !important; }`}</style>

      {/* Left Sidebar (Hoverable) */}
      <Sidebar 
        isSidebarExpanded={isSidebarExpanded} 
        setIsSidebarExpanded={setIsSidebarExpanded} 
        navItems={navItems} 
        page={page} 
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: isSidebarExpanded ? 240 : 80, height: "100vh", overflowY: "auto", position: "relative", transition: "margin-left 0.3s" }}>
        
        {/* Top Header Actions */}
        <TopHeader 
          undo={undo} 
          redo={redo} 
          histIdx={histIdx} 
          history={history} 
          dueTodayCount={dueTodayCount} 
          generalCount={generalCount}
          openNotifTab={(tabNum) => { setNotifTab(tabNum); setShowNotif(true); }} 
          currentUser={currentUser} 
          setAuthenticated={setAuthenticated} 
        />

        <div style={{ padding: "0 18px 18px 18px", marginTop: "-32px", width: "100%", maxWidth: "100%", position: "relative", zIndex: 10 }}>
        <Routes>
        <Route path="/" element={<Navigate to={`/${getDefaultPage(currentUser)}`} replace />} />
        
        <Route path="/lead/:id" element={
          <LeadDetailPage 
            leads={leads} followups={followups} 
            onSave={saveLead} onSaveFollowup={saveFollowup} 
            allSellers={allSellers} fetchAllSellers={fetchAllSellers} 
            handleReassign={handleReassign} setReassignConfirm={setReassignConfirm} 
            currentUser={currentUser} 
          />
        } />

        <Route path="/leads" element={
          <LeadsPage 
            leads={leads} currentUser={currentUser} allSellers={allSellers} checked={checked} setChecked={setChecked}
            search={search} setSearch={setSearch} filterStatus={filterStatus} filterLatestStatus={filterLatestStatus} finFilters={finFilters} dateFilters={dateFilters} setDateFilters={setDateFilters}
            showFavorites={showFavorites} setShowFavorites={setShowFavorites} setShowFilterModal={setShowFilterModal}
            isSellerDropdownOpen={isSellerDropdownOpen} setIsSellerDropdownOpen={setIsSellerDropdownOpen}
            filterSellers={filterSellers} setFilterSellers={setFilterSellers}
            filterProvince={filterProvince}
            paginatedLeads={paginatedLeads} sortConfig={sortConfig} handleSort={handleSort}
            toggleStar={toggleStar} setSelectedLead={handleViewLead} actualPage={actualPage} itemsPerPage={itemsPerPage} inlineEdit={inlineEdit}
            dupNumbers={dupNumbers} followups={followups} setReassignConfirm={setReassignConfirm} fetchAllSellers={fetchAllSellers}
            filteredLength={filtered.length} totalPages={totalPages} setCurrentPage={setCurrentPage}
            canViewAll={canViewAll} canViewSelect={canViewSelect} canExport={canExport} canExportAll={canExportAll}
            handleExport={handleExport} setShowAddLead={setShowAddLead} setShowDeleteConfirm={setShowDeleteConfirm}
            topScrollRef={topScrollRef} handleTopScroll={handleTopScroll} handleBottomScroll={handleBottomScroll} bottomScrollRef={bottomScrollRef} syncTableWidth={syncTableWidth}
            filtered={filtered}
          />
        } />
        
        <Route path="/dashboard" element={
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <LayoutDashboard size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>ภาพรวมและสถิติ (Dashboard)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สรุปผลการดำเนินงานและสถิติการขาย</p>
              </div>
            </div>
            <Dashboard leads={leads} followups={followups} currentUser={currentUser} onSelectLead={handleViewLead} />
          </div>
        } />

        <Route path="/reports" element={
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <FileText size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>รายงานการติดตาม (Reports)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างรายงานและสรุปผลข้อมูลลูกค้าสำหรับการส่งมอบ</p>
              </div>
            </div>
            {/* ส่งฟังก์ชัน handleViewLead เข้าไปเป็น onViewLead */}
            <Reports leads={leads} followups={followups} onViewLead={handleViewLead} isMaster={false} onExitMaster={() => {}} currentUser={currentUser} />
          </div>
        } />

        { (currentUser?.role === "admin" || currentUser?.role_is_system || currentUser?.permissions?.followupHistory?.view) ? (
        <Route path="/followup_history" element={<FollowupHistoryPage currentUser={currentUser} allSellers={allSellers} />} />
      ) : null }
      <Route path="/role_management" element={(currentUser?.role_is_system || currentUser?.permissions?.roles?.menu) ? (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการ Role & สิทธิ์การใช้งาน (Role Management)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างและกำหนด Permission ของแต่ละ Role ภายในระบบ</p>
              </div>
            </div>
            <RoleManagementPage currentUser={currentUser} />
          </div>
        ) : <Navigate to="/" replace />} />

        <Route path="/role_management/create" element={(currentUser?.role_is_system || currentUser?.permissions?.roles?.create) ? (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>สร้าง Role ใหม่ (Create Role)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างและกำหนด Permission ของ Role ภายในระบบ</p>
              </div>
            </div>
            <RoleFormPage currentUser={currentUser} />
          </div>
        ) : <Navigate to="/role_management" replace />} />

        <Route path="/role_management/edit/:id" element={(currentUser?.role_is_system || currentUser?.permissions?.roles?.update) ? (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>แก้ไข Role (Edit Role)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>แก้ไข Permission ของ Role ภายในระบบ</p>
              </div>
            </div>
            <RoleFormPage currentUser={currentUser} />
          </div>
        ) : <Navigate to="/role_management" replace />} />

        <Route path="/user_management" element={(currentUser?.role_is_system || currentUser?.permissions?.users?.menu) ? (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: RG.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: RG.shadowSoft }}>
                <UserRound size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการผู้ใช้งาน (User Management)</h2>
                <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>สร้างและจัดการสิทธิ์ผู้ใช้งานระบบ</p>
              </div>
            </div>
            <UserManagement currentUser={currentUser} />
          </div>
        ) : <Navigate to="/" replace />} />
        </Routes>
        </div>
      </main>

      <AppModals
        showNotif={showNotif} setShowNotif={setShowNotif} notifTab={notifTab} currentUser={currentUser} myLeads={myLeads} markDone={markDone} setSelectedLead={setSelectedLead} setIsModalReadOnly={setIsModalReadOnly}
        showFilterModal={showFilterModal} setShowFilterModal={setShowFilterModal} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterLatestStatus={filterLatestStatus} setFilterLatestStatus={setFilterLatestStatus} finFilters={finFilters} setFinFilters={setFinFilters}
        dateFilters={dateFilters} setDateFilters={setDateFilters} filterProvince={filterProvince} setFilterProvince={setFilterProvince}
        markDoneLead={markDoneLead} setMarkDoneLead={setMarkDoneLead} followups={followups} saveFollowup={saveFollowup}
        showAddLead={showAddLead} setShowAddLead={setShowAddLead} leads={leads} addLead={addLead} allSellers={allSellers} fetchAllSellers={fetchAllSellers}
        selectedLead={selectedLead} isModalReadOnly={isModalReadOnly} saveLead={saveLead} handleReassign={handleReassign} setReassignConfirm={setReassignConfirm}
        reassignConfirm={reassignConfirm} selectedNewOwner={selectedNewOwner} setSelectedNewOwner={setSelectedNewOwner} isReassigning={isReassigning} handleReassignClick={handleReassignClick}
        confirmFinalReassign={confirmFinalReassign} setConfirmFinalReassign={setConfirmFinalReassign} handleFinalReassign={handleReassign}
        alertModal={alertModal} setAlertModal={setAlertModal}
        showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm} checked={checked} deleteSelected={deleteSelected}
        onViewLead={(lead) => {
          handleViewLead(lead);
          setShowNotif(false);
        }}
      />
      </div>
    </div>
  );
}
