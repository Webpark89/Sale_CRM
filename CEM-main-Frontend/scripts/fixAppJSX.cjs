const fs = require('fs');
const file = 'D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const correctTop = `import React, { useCallback, useEffect, useState, useRef } from "react";
import { STATUSES, STATUS_COLORS } from "./constants/status";
import { RG } from "./constants/theme";
import { createNewLead } from "./data/sampleData";
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
  hardDeleteLeadApi
} from "./services/apiService";

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
  
  // State for API data
  const [leads, setLeads] = useState([]);
  const [followups, setFollowups] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState("leads");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
`;

const lines = code.split('\n');
const firstNotifIndex = lines.findIndex(l => l.includes('const [showNotif, setShowNotif] = useState(false);'));

const newCode = correctTop + lines.slice(firstNotifIndex).join('\n');
fs.writeFileSync(file, newCode);
console.log("App.jsx fixed");
