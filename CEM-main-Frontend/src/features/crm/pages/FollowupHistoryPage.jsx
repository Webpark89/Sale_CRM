import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RG } from "../constants/theme";
import { STAGES, STAGE_COLORS, ALL_STATUSES, STATUS_COLORS, STAGE_STATUS_MAP } from "../constants/status";
import notify from "../../../utils/toast";
import { History, FileText, Search, UsersRound, ChevronLeft, ChevronRight, X, CheckCircle, Settings, CalendarClock } from "lucide-react";
import Modal from "../components/common/Modal";
import Btn from "../components/common/Btn";
import { inputStyle } from "../components/common/styles";
import api from "../services/api";

export default function FollowupHistoryPage({ currentUser, allSellers: initialAllSellers = [] }) {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellersList, setSellersList] = useState(initialAllSellers);
  const [selectedSellers, setSelectedSellers] = useState([]); // multi-select
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  // Filters state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStages, setFilterStages] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    type: "all",
    min: "",
    max: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const canViewOther = currentUser?.role === "admin" || currentUser?.role_is_system || currentUser?.permissions?.followupHistory?.viewOtherSellers || currentUser?.permissions?.leads?.view === 'all';

  useEffect(() => {
    fetchFollowups();
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await api.get("/users");
      if (Array.isArray(res.data)) {
        setSellersList(res.data.filter(u => u.is_active === 1));
      }
    } catch (e) {
      if (initialAllSellers && initialAllSellers.length > 0) {
        setSellersList(initialAllSellers);
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSellers, filterStages, filterStatuses, dateFilter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cleanFollowupDetail = (detail) => {
    if (!detail) return "-";
    // ตัดข้อความระบบจำพวก "บันทึกสถานะ [xxx]:" หรือ "เพิ่มลีดใหม่เข้าระบบ"
    return detail.replace(/^บันทึกสถานะ\s*\[.*?\]:\s*/i, "").trim() || "-";
  };

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/followups");
      let data = res.data;
      // กรอง "เพิ่มลีดใหม่เข้าระบบ" ออก ให้ขึ้นเฉพาะรายการติดตามลีดจริงๆ
      data = data.filter(f => (f.detail || "").trim() !== "เพิ่มลีดใหม่เข้าระบบ");

      // if not canViewOther, filter to own only
      if (!canViewOther) {
        data = data.filter(f => String(f.ownerId) === String(currentUser?.id));
      }
      setFollowups(data);
    } catch (error) {
      notify.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeller = (id) => {
    setSelectedSellers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) return sortConfig.direction === "asc" ? " 🔼" : " 🔽";
    return "";
  };

  const sortedFollowups = [...followups].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key] ?? "";
    let valB = b[key] ?? "";

    if (key === "createdAt" || key === "date" || key === "nextFollowupDate") {
      const timeA = valA ? new Date(valA).getTime() : 0;
      const timeB = valB ? new Date(valB).getTime() : 0;
      return direction === "asc" ? timeA - timeB : timeB - timeA;
    }

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredFollowups = sortedFollowups.filter(f => {
    // Filter by selected sellers (multi-select)
    if (selectedSellers.length > 0) {
      if (!selectedSellers.includes(String(f.ownerId))) return false;
    }

    // Filter by Stage
    if (filterStages.length > 0) {
      if (!f.stage || !filterStages.includes(f.stage)) return false;
    }

    // Filter by Status
    if (filterStatuses.length > 0) {
      if (!f.status || !filterStatuses.includes(f.status)) return false;
    }

    // Filter by Date (เวลาที่ติดตาม contact_date / date / createdAt)
    if (dateFilter.min || dateFilter.max) {
      const fDate = f.date ? f.date.slice(0, 10) : (f.createdAt ? f.createdAt.slice(0, 10) : "");
      if (dateFilter.min && fDate < dateFilter.min) return false;
      if (dateFilter.max && fDate > dateFilter.max) return false;
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      const cleanedDetail = cleanFollowupDetail(f.detail);
      if (!(f.companyName || "").toLowerCase().includes(q) &&
          !cleanedDetail.toLowerCase().includes(q) &&
          !(f.status || "").toLowerCase().includes(q) &&
          !(f.ownerName || "").toLowerCase().includes(q) &&
          !(f.stage || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredFollowups.length / itemsPerPage);
  const paginatedFollowups = filteredFollowups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const availableSellers = sellersList.length > 0 
    ? sellersList 
    : [...new Map(followups.filter(f => f.ownerId).map(f => [String(f.ownerId), { id: f.ownerId, display_name: f.ownerName, username: f.ownerName }])).values()];

  const sellerLabel = selectedSellers.length === 0
    ? "ทุกเซลส์"
    : selectedSellers.length === 1
      ? (availableSellers.find(s => String(s.id) === selectedSellers[0])?.display_name || availableSellers.find(s => String(s.id) === selectedSellers[0])?.username || "1 คน")
      : `${selectedSellers.length} คน`;

  const isFilterActive = filterStages.length > 0 || filterStatuses.length > 0 || dateFilter.type !== "all" || dateFilter.min || dateFilter.max;

  const thStyle = {
    padding: "14px 18px",
    fontSize: 12,
    fontWeight: 700,
    color: RG.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none"
  };

  const getDateRangeByPreset = (preset) => {
    const d = new Date();
    const format = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    const todayStr = format(d);
    
    if (preset === "today") return { min: todayStr, max: todayStr };
    if (preset === "last6months") {
      const past = new Date(d.getFullYear(), d.getMonth() - 5, 1);
      return { min: format(past), max: todayStr };
    }
    if (preset === "thismonth") {
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      return { min: format(firstDay), max: todayStr };
    }
    if (preset === "lastmonth") {
      const firstDay = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth(), 0);
      return { min: format(firstDay), max: format(lastDay) };
    }
    if (preset === "thisquarter") {
      const currentQuarter = Math.floor(d.getMonth() / 3);
      const firstDay = new Date(d.getFullYear(), currentQuarter * 3, 1);
      return { min: format(firstDay), max: todayStr };
    }
    if (preset === "lastquarter") {
      const currentQuarter = Math.floor(d.getMonth() / 3);
      const firstDay = new Date(d.getFullYear(), currentQuarter * 3 - 3, 1);
      const lastDay = new Date(d.getFullYear(), currentQuarter * 3, 0);
      return { min: format(firstDay), max: format(lastDay) };
    }
    if (preset === "thisyear") {
      const firstDay = new Date(d.getFullYear(), 0, 1);
      return { min: format(firstDay), max: todayStr };
    }
    return { min: "", max: "" };
  };

  const handleDatePreset = (preset) => {
    const range = getDateRangeByPreset(preset);
    setDateFilter({ ...range, type: preset });
  };

  return (
    <div style={{ padding: "0 0 40px 0", fontFamily: "'Sarabun', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Page Header (Title) */}
        <div style={{ marginBottom: 24 }}>
          <div 
            onClick={() => navigate("/leads")}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              fontSize: 13, 
              color: RG.textMuted, 
              cursor: "pointer", 
              marginBottom: 6,
              transition: "color 0.15s ease",
              userSelect: "none"
            }}
            onMouseOver={e => e.currentTarget.style.color = RG.primary}
            onMouseOut={e => e.currentTarget.style.color = RG.textMuted}
          >
            &lt; กลับไปหน้ารวมลีดส์
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <History size={26} color={RG.primary} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: RG.text }}>ประวัติการติดตาม</h1>
          </div>
          <p style={{ margin: 0, color: RG.textMuted, fontSize: 14 }}>ดูประวัติการเข้าพบและพูดคุยกับลูกค้าที่ผ่านมาทั้งหมด</p>
        </div>

        {/* Action Controls & Stats (ชิดขอบบนตาราง) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
          {/* Stats & Clear buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: RG.textMuted }}>
              พบ <strong style={{ color: RG.text }}>{filteredFollowups.length}</strong> รายการ
            </span>
            {(selectedSellers.length > 0 || isFilterActive || search) && (
              <button 
                onClick={() => {
                  setSelectedSellers([]);
                  setFilterStages([]);
                  setFilterStatuses([]);
                  setDateFilter({ type: "all", min: "", max: "" });
                  setSearch("");
                }} 
                style={{ fontSize: 12, color: RG.primary, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {/* Filters & Search (เรียงลำดับ: ติดตามวันนี้ -> ตัวกรอง -> เลือกเซลส์ -> ค้นหาอยู่ขวาสุด) */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Quick Filter: วันนี้ */}
            <button 
              onClick={() => {
                if (dateFilter.type === "today") {
                  setDateFilter({ type: "all", min: "", max: "" });
                } else {
                  handleDatePreset("today");
                }
              }} 
              style={{ 
                padding: "6px 12px", borderRadius: 20, 
                border: `1.5px solid ${dateFilter.type === "today" ? RG.primary : RG.border}`, 
                background: dateFilter.type === "today" ? "#F0FDF4" : RG.surface, 
                color: dateFilter.type === "today" ? RG.primaryMid : RG.textMuted, 
                fontSize: 12, cursor: "pointer", fontWeight: dateFilter.type === "today" ? 700 : 500, 
                fontFamily: "'Sarabun', sans-serif",
                display: "flex", alignItems: "center", gap: 5
              }}
            >
              <CalendarClock size={13} /> ติดตามวันนี้
            </button>

            {/* Advanced Filter Button */}
            <button 
              onClick={() => setShowFilterModal(true)} 
              style={{ 
                padding: "6px 12px", borderRadius: 20, 
                border: `1.5px solid ${isFilterActive ? RG.primary : RG.border}`, 
                background: isFilterActive ? RG.surface : "transparent", 
                color: isFilterActive ? RG.primaryMid : RG.textMuted, 
                cursor: "pointer", fontSize: 12, fontWeight: isFilterActive ? 700 : 500,
                display: "flex", alignItems: "center", gap: 5 
              }}
            >
              <Settings size={13} /> ตัวกรอง {isFilterActive && "(เปิดใช้งาน)"}
            </button>

            {/* Multi-select seller dropdown */}
            {canViewOther && (
              <div ref={dropRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: `1px solid ${RG.border}`,
                    background: selectedSellers.length > 0 ? RG.primaryGhost : "#fff",
                    color: RG.text, cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", gap: 6, minWidth: 150,
                    borderColor: selectedSellers.length > 0 ? RG.primary : RG.border
                  }}
                >
                  <UsersRound size={14} color={selectedSellers.length > 0 ? RG.primary : RG.textMuted} />
                  <span style={{ flex: 1, textAlign: "left" }}>{sellerLabel}</span>
                  {selectedSellers.length > 0 && (
                    <span
                      style={{ background: RG.primary, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={e => { e.stopPropagation(); setSelectedSellers([]); }}
                    >
                      <X size={9} />
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: `1px solid ${RG.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 999, minWidth: 220, maxHeight: 260, overflowY: "auto" }}>
                    <div style={{ padding: "6px 0" }}>
                      {availableSellers.length === 0 ? (
                        <div style={{ padding: "8px 16px", fontSize: 13, color: RG.textMuted }}>ไม่มีรายชื่อเซลส์</div>
                      ) : (
                        availableSellers.map(s => {
                          const active = selectedSellers.includes(String(s.id));
                          return (
                            <div
                              key={s.id}
                              onClick={() => toggleSeller(String(s.id))}
                              style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: active ? RG.primaryGhost : "transparent", transition: "background 0.15s" }}
                              onMouseOver={e => !active && (e.currentTarget.style.background = RG.surface)}
                              onMouseOut={e => !active && (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${active ? RG.primary : RG.border}`, background: active ? RG.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {active && <CheckCircle size={10} color="#fff" />}
                              </div>
                              <span style={{ fontSize: 13, color: RG.text }}>{s.display_name || s.username}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search (อยู่ขวาสุด) */}
            <div style={{ position: "relative" }}>
              <Search size={14} color={RG.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="ค้นหาบริษัท, Stage, สถานะ, รายละเอียด..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: "7px 12px 7px 32px", borderRadius: 8, border: `1px solid ${RG.border}`, fontSize: 13, outline: "none", width: 240, background: "#fff" }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: RG.shadowSoft, border: `1px solid ${RG.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: RG.surface, borderBottom: `2px solid ${RG.border}` }}>
                  <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("createdAt")}>
                    วันที่ / เวลา{getSortIcon("createdAt")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("ownerName")}>
                    เซลส์{getSortIcon("ownerName")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("companyName")}>
                    บริษัท{getSortIcon("companyName")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "center" }} onClick={() => handleSort("stage")}>
                    Stage{getSortIcon("stage")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "center" }} onClick={() => handleSort("status")}>
                    สถานะ{getSortIcon("status")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "left" }} onClick={() => handleSort("detail")}>
                    รายละเอียด{getSortIcon("detail")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "center" }} onClick={() => handleSort("nextFollowupDate")}>
                    นัดครั้งหน้า{getSortIcon("nextFollowupDate")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>
                    เอกสาร
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: "60px 20px", textAlign: "center", color: RG.textMuted }}>กำลังโหลดข้อมูล...</td></tr>
                ) : paginatedFollowups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center" }}>
                      <History size={36} color={RG.border} style={{ display: "block", margin: "0 auto 12px" }} />
                      <div style={{ fontSize: 15, fontWeight: 600, color: RG.text, marginBottom: 6 }}>ไม่พบประวัติการติดตาม</div>
                      <div style={{ fontSize: 13, color: RG.textMuted }}>ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรอง</div>
                    </td>
                  </tr>
                ) : (
                  paginatedFollowups.map(f => {
                    const stageColor = STAGE_COLORS[f.stage] || RG.primary;
                    const statusColor = STATUS_COLORS[f.status] || "#3B82F6";
                    const displayDetail = cleanFollowupDetail(f.detail);

                    return (
                      <tr key={f.id} style={{ borderBottom: `1px solid ${RG.border}` }}
                        onMouseOver={e => e.currentTarget.style.background = RG.surface}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: RG.text }}>{f.date || new Date(f.createdAt).toLocaleDateString("th-TH")}</div>
                          <div style={{ fontSize: 12, color: RG.textMuted }}>{new Date(f.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", background: "#F1F5F9", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                            {f.ownerName || "-"}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 14, color: RG.text, fontWeight: 600 }}>{f.companyName || "-"}</td>
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          {f.stage ? (
                            <div style={{ 
                              display: "inline-flex", justifyContent: "center", alignItems: "center", width: 90, background: `${stageColor}18`, color: stageColor, border: `1px solid ${stageColor}44`, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 
                            }}>
                              {f.stage}
                            </div>
                          ) : <span style={{ color: RG.textMuted }}>-</span>}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                          {f.status ? (
                            <div style={{ 
                              display: "inline-flex", justifyContent: "center", alignItems: "center", width: 110, background: RG.surface, color: RG.text, border: `1px solid ${RG.border}`, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 
                            }}>
                              {f.status}
                            </div>
                          ) : <span style={{ color: RG.textMuted }}>-</span>}
                        </td>
                        <td style={{ padding: "14px 18px", maxWidth: 320 }} title={displayDetail !== "-" ? displayDetail : ""}>
                          <div style={{ 
                            fontSize: 13, 
                            color: RG.text, 
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: (displayDetail && displayDetail.length > 50) ? "help" : "default"
                          }}>
                            {displayDetail}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", textAlign: "center" }}>
                          {f.nextFollowupDate ? (
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#EA580C" }}>
                              {new Date(f.nextFollowupDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                          ) : <span style={{ color: RG.textMuted }}>-</span>}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          {f.pdfFile ? (
                            <a
                              href={`http://localhost:3000/uploads/pdfs/${f.pdfFile}`}
                              target="_blank" rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, color: RG.primary, fontSize: 12, fontWeight: 600, textDecoration: "none", background: "#EFF6FF", padding: "5px 10px", borderRadius: 6 }}
                            >
                              <FileText size={13} /> เปิดดู
                            </a>
                          ) : <span style={{ color: RG.textMuted }}>-</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${RG.border}`, background: RG.surface }}>
                <div style={{ fontSize: 13, color: RG.textMuted }}>
                  แสดง {paginatedFollowups.length} รายการ จากทั้งหมด {filteredFollowups.length} รายการ
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${RG.border}`, background: currentPage === 1 ? RG.background : RG.surface, color: currentPage === 1 ? RG.textMuted : RG.text, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                  >
                    ก่อนหน้า
                  </button>
                  <span style={{ fontSize: 13, color: RG.text, fontWeight: 600 }}>หน้า {currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${RG.border}`, background: currentPage === totalPages ? RG.background : RG.surface, color: currentPage === totalPages ? RG.textMuted : RG.text, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <Modal title="ตัวกรองประวัติการติดตาม (Follow-up Filters)" onClose={() => setShowFilterModal(false)} width={500}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stage Filter */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 10 }}>กรองตาม Stage</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STAGES.map(s => {
                  const isActive = filterStages.includes(s);
                  const color = STAGE_COLORS[s] || RG.primary;
                  return (
                    <button 
                      key={s} 
                      onClick={() => setFilterStages(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} 
                      style={{ 
                        padding: "5px 12px", 
                        borderRadius: 20, 
                        border: `1.5px solid ${isActive ? color : RG.border}`, 
                        background: isActive ? color + "22" : RG.surface, 
                        color: isActive ? color : RG.textMuted, 
                        fontSize: 12, 
                        cursor: "pointer", 
                        fontWeight: isActive ? 700 : 400, 
                        fontFamily: "'Sarabun', sans-serif"
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 10 }}>กรองตามสถานะ (Status)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(filterStages.length > 0 ? [...new Set(filterStages.reduce((acc, stage) => [...acc, ...(STAGE_STATUS_MAP[stage] || [])], []))] : ALL_STATUSES).map(s => {
                  const isActive = filterStatuses.includes(s);
                  const color = STATUS_COLORS[s] || RG.textMuted;
                  return (
                    <button 
                      key={s} 
                      onClick={() => setFilterStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} 
                      style={{ 
                        padding: "4px 10px", 
                        borderRadius: 20, 
                        border: `1.5px solid ${isActive ? color : RG.border}`, 
                        background: isActive ? color + "22" : RG.surface, 
                        color: isActive ? color : RG.textMuted, 
                        fontSize: 11, 
                        cursor: "pointer", 
                        fontWeight: isActive ? 700 : 400, 
                        fontFamily: "'Sarabun', sans-serif"
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Filter (เวลาที่ติดตาม) */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 10 }}>กรองตามเวลาที่ติดตาม</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select 
                  value={dateFilter.type}
                  onChange={(e) => handleDatePreset(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="all">ทั้งหมด (ไม่กรองเวลา)</option>
                  <option value="today">วันนี้</option>
                  <option value="thismonth">เดือนนี้</option>
                  <option value="lastmonth">เดือนที่แล้ว</option>
                  <option value="thisquarter">ไตรมาสนี้</option>
                  <option value="lastquarter">ไตรมาสที่แล้ว</option>
                  <option value="last6months">6 เดือนล่าสุด</option>
                  <option value="thisyear">ปีนี้</option>
                  <option value="custom">กำหนดช่วงวันที่เอง</option>
                </select>

                {dateFilter.type === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input 
                      type="date" 
                      value={dateFilter.min || ""} 
                      onChange={e => setDateFilter(prev => ({ ...prev, min: e.target.value, type: "custom" }))} 
                      style={{ ...inputStyle, flex: 1 }} 
                    />
                    <span style={{ color: RG.textMuted }}>ถึง</span>
                    <input 
                      type="date" 
                      value={dateFilter.max || ""} 
                      onChange={e => setDateFilter(prev => ({ ...prev, max: e.target.value, type: "custom" }))} 
                      style={{ ...inputStyle, flex: 1 }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: `1px solid ${RG.border}`, paddingTop: 16 }}>
              <Btn 
                variant="outline" 
                onClick={() => {
                  setFilterStages([]);
                  setFilterStatuses([]);
                  setDateFilter({ type: "all", min: "", max: "" });
                }}
              >
                ล้างตัวกรอง
              </Btn>
              <Btn 
                variant="primary" 
                onClick={() => setShowFilterModal(false)}
              >
                ดูผลลัพธ์ ({filteredFollowups.length})
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
