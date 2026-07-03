import React, { useState, useRef, useEffect, useMemo } from "react";
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STATUSES, STATUS_COLORS, STATUS_ENUM } from "../constants/status";
import { RG } from "../constants/theme";
import { today } from "../crmHelpers/helpers";
import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { inputStyle } from "../components/common/styles";
import Modal from "../components/common/Modal";

const getPresetRange = (preset) => {
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

const formatThaiShortDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${day} ${month} ${year}`;
};

const getDateRangeLabel = (range) => {
  if (range.type === "last6months") return "6 เดือนล่าสุด";
  if (range.type === "thismonth") return "เดือนนี้";
  if (range.type === "lastmonth") return "เดือนที่แล้ว";
  if (range.type === "thisquarter") return "ไตรมาสนี้";
  if (range.type === "lastquarter") return "ไตรมาสที่แล้ว";
  if (range.type === "thisyear") return "ปีนี้";
  if (range.type === "today") return "วันนี้";
  if (range.type === "all") return "ทั้งหมด (ไม่กรอง)";
  if (range.type === "custom") {
    if (range.min && range.max) return `${formatThaiShortDate(range.min)} - ${formatThaiShortDate(range.max)}`;
    if (range.min) return `ตั้งแต่ ${formatThaiShortDate(range.min)}`;
    if (range.max) return `ถึง ${formatThaiShortDate(range.max)}`;
    return "กำหนดเอง";
  }
  return "เลือกช่วงเวลา";
};

export default function Dashboard({ leads, followups, currentUser }) {
  const [dashboardDateRange, setDashboardDateRange] = useState({ 
    ...getPresetRange("last6months"), 
    type: "last6months" 
  });
  const [showDateModal, setShowDateModal] = useState(false);

  const handleDatePreset = (preset) => {
    const range = getPresetRange(preset);
    setDashboardDateRange({ ...range, type: preset });
  };

  const checkOneYearLimit = (minStr, maxStr) => {
    if (minStr && maxStr) {
      const minD = new Date(minStr);
      const maxD = new Date(maxStr);
      const diffDays = Math.ceil(Math.abs(maxD - minD) / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        toast.error("ระยะเวลาที่เลือกเกิน 1 ปี กรุณาเลือกช่วงเวลาไม่เกิน 365 วันเพื่อป้องกันปัญหาข้อมูลมหาศาล");
        return false;
      }
    }
    return true;
  };

  const handleCustomDateChange = (field, val) => {
    setDashboardDateRange(prev => {
      const next = { ...prev, [field]: val, type: "custom" };
      if (!checkOneYearLimit(next.min, next.max)) {
        return prev;
      }
      return next;
    });
  };

  const [isExporting, setIsExporting] = useState(false); 
  const exportRef = useRef(null); 

  const [filterSellers, setFilterSellers] = useState([]);
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const sellerList = [...new Set(leads.map(l => l.owner).filter(Boolean))];

  const canViewAll = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.dashboard?.view === 'all';
  const canViewSelect = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.dashboard?.view_select;

  // สิทธิ์ Export Dashboard
  const canExportAll = currentUser?.role === 'admin' || currentUser?.role_is_system || currentUser?.permissions?.dashboard?.export === 'all';
  const canExport = canExportAll || currentUser?.permissions?.dashboard?.export === 'own';
  const roleFilteredLeads = (canViewAll || (canViewSelect && filterSellers.length > 0))
    ? leads 
    : leads.filter(l => l.owner === currentUser?.username);
    
  const displayLeads = filterSellers.length === 0
    ? roleFilteredLeads
    : roleFilteredLeads.filter(l => filterSellers.includes(l.owner));

  const chartData = useMemo(() => {
    // 1. กรอง Leads สำหรับแสดงผล KPI และ Pie Chart
    const _filteredLeads = displayLeads.filter(l => {
      if (dashboardDateRange.type === "all" || (!dashboardDateRange.min && !dashboardDateRange.max)) return true;
      if (dashboardDateRange.min && (!l.latestContactDate || l.latestContactDate < dashboardDateRange.min)) return false;
      if (dashboardDateRange.max && (!l.latestContactDate || l.latestContactDate > dashboardDateRange.max)) return false;
      return true;
    });

    const currentDateStr = today();
    const _kpiStats = _filteredLeads.reduce((acc, l) => {
      if (l.latestStatus === STATUS_ENUM.CLOSED) acc.closed++;
      else if (l.latestStatus === STATUS_ENUM.NOT_INTERESTED) acc.notInterested++;
      else if (l.latestStatus === STATUS_ENUM.MEETING) acc.meetings++;

      if (l.nextFollowupDate && l.nextFollowupDate <= currentDateStr) {
        acc.needFollow++;
      }

      if (l.latestStatus) {
        acc.statusCounts[l.latestStatus] = (acc.statusCounts[l.latestStatus] || 0) + 1;
      }
      return acc;
    }, { closed: 0, needFollow: 0, notInterested: 0, meetings: 0, statusCounts: {} });

    const _total = _filteredLeads.length;
    const { closed: _closed, needFollow: _needFollow, notInterested: _notInterested, meetings: _meetings, statusCounts: _statusCounts } = _kpiStats;

    const _pieData = STATUSES.map(s => ({ 
      name: s, 
      value: _statusCounts[s] || 0 
    })).filter(d => d.value > 0);

    let _chartMonths = [];
    if (dashboardDateRange.type === "all" || (!dashboardDateRange.min && !dashboardDateRange.max)) {
      _chartMonths = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - 5 + i);
        return { 
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 
          label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }) 
        };
      });
    } else {
      let startD = dashboardDateRange.min ? new Date(dashboardDateRange.min) : new Date(new Date().setMonth(new Date().getMonth() - 5));
      let endD = dashboardDateRange.max ? new Date(dashboardDateRange.max) : new Date();
      
      if (startD > endD) {
        const temp = startD; startD = endD; endD = temp;
      }
      
      let currentD = new Date(startD.getFullYear(), startD.getMonth(), 1);
      const lastD = new Date(endD.getFullYear(), endD.getMonth(), 1);
      
      while (currentD <= lastD) {
        _chartMonths.push({
          key: `${currentD.getFullYear()}-${String(currentD.getMonth() + 1).padStart(2, "0")}`,
          label: currentD.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
        });
        currentD.setMonth(currentD.getMonth() + 1);
      }
    }

    const _chartKeys = new Set(_chartMonths.map(m => m.key));
    
    const _leadStatsByMonth = displayLeads.reduce((acc, l) => {
      if (!l.latestContactDate) return acc;
      const mKey = l.latestContactDate.slice(0, 7);
      if (!_chartKeys.has(mKey)) return acc;
      
      acc[mKey] = acc[mKey] || { totalContact: 0, closed: 0 };
      acc[mKey].totalContact++;
      if (l.latestStatus === STATUS_ENUM.CLOSED) {
        acc[mKey].closed++;
      }
      return acc;
    }, {});

    const _followupStatsByMonth = Object.values(followups).flat().reduce((acc, f) => {
      if (!f.date) return acc;
      const mKey = f.date.slice(0, 7);
      if (_chartKeys.has(mKey)) {
        acc[mKey] = (acc[mKey] || 0) + 1;
      }
      return acc;
    }, {});

    const _lineData = _chartMonths.map(m => ({
      name: m.label,
      ติดตาม: _followupStatsByMonth[m.key] || 0,
      ปิดการขาย: _leadStatsByMonth[m.key]?.closed || 0,
    }));

    const _barData = _chartMonths.map(m => ({
      name: m.label,
      โทร: _leadStatsByMonth[m.key]?.totalContact || 0,
      ปิด: _leadStatsByMonth[m.key]?.closed || 0,
    }));

    const _hasChartData = _lineData.some(d => d.ติดตาม > 0 || d.ปิดการขาย > 0) || _barData.some(d => d.โทร > 0 || d.ปิด > 0);

    return { 
      filteredLeads: _filteredLeads, 
      total: _total, 
      closed: _closed, 
      needFollow: _needFollow, 
      notInterested: _notInterested, 
      meetings: _meetings, 
      pieData: _pieData, 
      lineData: _lineData, 
      barData: _barData, 
      hasChartData: _hasChartData,
      statusCounts: _statusCounts
    };
  }, [displayLeads, followups, dashboardDateRange]);

  const { filteredLeads, total, closed, needFollow, notInterested, meetings, pieData, lineData, barData, hasChartData, statusCounts } = chartData;

  const statusIcons = {
    [STATUS_ENUM.MEETING]: "📅",
    [STATUS_ENUM.PROFILE]: "📝",
    [STATUS_ENUM.FOLLOW_UP]: "📞",
    [STATUS_ENUM.UNREACHABLE]: "📵",
    [STATUS_ENUM.NOT_INTERESTED]: "❌",
    [STATUS_ENUM.CLOSED]: "✅",
  };

  const kpis = [
    { label: "ลีดทั้งหมด", value: total, icon: "👥", color: "#7B68EE" },
    { label: "ต้องติดตามวันนี้", value: needFollow, icon: "🔔", color: RG.warn },
    ...STATUSES.map(s => ({
      label: s,
      value: statusCounts[s] || 0,
      icon: statusIcons[s] || "📌",
      color: STATUS_COLORS[s] || RG.primary
    }))
  ];

  // ฟังก์ชันจัดการการ Export หน้าแดชบอร์ด
  const handleExport = async (e) => {
    const val = e.target.value;
    e.target.value = ""; // รีเซ็ต Dropdown
    if (!val) return;

    const [mode, format] = val.split("_");

    let prevSeller = filterSellers;
    if (mode === "all" && canExportAll) {
      setFilterSellers([]);
      // รอให้ React render ข้อมูลใหม่ก่อน Export
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (!exportRef.current || isExporting) return;
    setIsExporting(true);
    // รอให้จัดสไตล์หัวและท้ายแบบเป็นทางการ
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const filename = `dashboard-${(dashboardDateRange.min || "all")}-${new Date().toISOString().slice(0, 10)}`;

      if (format === "png") {
        const dataUrl = await toPng(exportRef.current, {
          quality: 1.0,
          backgroundColor: "#FFFFFF",
          pixelRatio: 2,
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${filename}.png`;
        a.click();
      } else if (format === "pdf") {
        const dataUrl = await toJpeg(exportRef.current, {
          quality: 0.8,
          backgroundColor: "#FFFFFF",
          pixelRatio: 1.5,
        });

        // PDF แนวตั้ง (Portrait)
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgRatio = imgProps.width / imgProps.height;
        
        // เราจะใช้พื้นที่กระดาษให้มากที่สุด โดยให้ขอบบางส่วนเป็น padding จาก HTML แทน
        const margin = 0;
        let finalWidth = pdfWidth - margin * 2;
        let finalHeight = finalWidth / imgRatio;

        // ถ้ายาวเกิน A4 ให้ย่อเพื่อให้พอดีหน้า
        if (finalHeight > (pdfHeight - margin * 2)) {
          finalHeight = pdfHeight - margin * 2;
          finalWidth = finalHeight * imgRatio;
        }
        
        // จัดกึ่งกลางแนวนอน
        const xOffset = (pdfWidth - finalWidth) / 2;
        // จัดกึ่งกลางแนวตั้งถ้ามีความสูงเหลือ
        const yOffset = margin + (pdfHeight - margin * 2 - finalHeight) / 2;
        pdf.addImage(dataUrl, "PNG", xOffset, yOffset, finalWidth, finalHeight);
        pdf.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error("Export failed", error);
      toast.error("ไม่สามารถส่งออกภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
      // คืนค่า Dashboard กลับเป็น Current View
      if (mode === "all" && currentUser?.permissions?.dashboard?.export === 'all') {
        setFilterSellers(prevSeller);
      }
    }
  };

  return (
    <div>
      {/* ส่วนหัวและตัวกรองเดือน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          {/* ตัวเลือกช่วงเวลา */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={() => setShowDateModal(true)} 
              style={{ 
                padding: "8px 16px", 
                borderRadius: 8, 
                border: `2px solid ${RG.primary}`, 
                background: "#fff", 
                color: RG.primary, 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: 13, 
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              📅 เลือกช่วงเวลา
            </button>
            <div style={{ fontSize: 14, color: RG.textMuted, background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              แสดงข้อมูล: <span style={{ fontWeight: 600, color: RG.primaryMid }}>{getDateRangeLabel(dashboardDateRange)}</span>
            </div>
          </div>
        </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
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
                    {sellerList.map(seller => (
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

            {/* Dropdown Export (PNG/PDF) */}
            {canExport && (
              <select 
                onChange={handleExport}
                disabled={isExporting}
                value=""
                style={{
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: `1px solid ${RG.primary}`,
                  backgroundColor: "#ffffff",
                  color: RG.primary,
                  cursor: isExporting ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  height: "36px",
                  outline: "none",
                  fontFamily: "'Sarabun', sans-serif",
                  boxSizing: "border-box"
                }}
              >
                <option value="" disabled>{isExporting ? "กำลังเซฟ..." : "⬇ Export Dashboard"}</option>
                <optgroup label="เฉพาะหน้าปัจจุบัน (Current View)">
                  <option value="current_png">PNG Image</option>
                  <option value="current_pdf">PDF (Print)</option>
                </optgroup>
                {canExportAll && (
                  <optgroup label="ทั้งหมด (All Report)">
                    <option value="all_png">PNG Image</option>
                    <option value="all_pdf">PDF (Print All)</option>
                  </optgroup>
                )}
              </select>
            )}
          </div>
        </div>
      {/* พื้นที่ครอบคลุมสำหรับดักจับภาพเพื่อ Export */}
      <div ref={exportRef} style={{ 
        padding: isExporting ? "40px 15px" : "4px", 
        borderRadius: isExporting ? "0px" : "16px", 
        background: isExporting ? "#ffffff" : "transparent",
        color: "#000",
        fontFamily: isExporting ? "'Sarabun', 'Segoe UI', sans-serif" : "inherit",
        width: isExporting ? "1100px" : "100%", // ขยายให้กว้างขึ้นเพื่อดันให้ชิดขอบซ้ายขวาใน PDF
        boxSizing: "border-box",
        margin: "0" // ป้องกันบั๊ก html-to-image ครอปภาพซ้ายขวา
      }}>
        
        {/* Formal Header (Visible only during export) */}
        {isExporting && (
          <div style={{ marginBottom: 40, paddingBottom: 24, borderBottom: `2px solid ${RG.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 10px" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: RG.text, marginBottom: 8, fontFamily: "'Sarabun', sans-serif" }}>รายงานสรุปภาพรวมการขาย (Sales Overview Report)</div>
              <div style={{ fontSize: 16, color: RG.textMuted }}>
                ช่วงเวลา: <span style={{ fontWeight: 600, color: RG.primaryMid }}>
                  {dashboardDateRange.type === "last6months" ? "6 เดือนล่าสุด (ค่าเริ่มต้น)" :
                   dashboardDateRange.type === "all" ? "ทั้งหมด (All Time)" :
                   (dashboardDateRange.min || dashboardDateRange.max) ? `${dashboardDateRange.min || "..."} ถึง ${dashboardDateRange.max || "..."}` : "ทั้งหมด (All Time)"}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: RG.primaryMid, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ width: 24, height: 24, background: RG.primary, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>Q</div>
                Sales_CRM
              </div>
              <div style={{ fontSize: 12, color: RG.textMuted, marginTop: 8 }}>
                ข้อมูล ณ วันที่พิมพ์: {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })} เวลา {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: isExporting ? "#f8fafc" : RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : `1px solid ${RG.border}`, padding: isExporting ? "20px 10px" : "16px 14px", textAlign: "center", boxShadow: isExporting ? "none" : RG.shadowSoft, backdropFilter: isExporting ? "none" : RG.glassFilter }}>
              <div style={{ fontSize: isExporting ? 32 : 28, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: isExporting ? 32 : 28, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: isExporting ? 13 : 12, color: RG.textMuted, marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* กราฟสัดส่วน และ แนวโน้ม */}
        <div style={{ display: "grid", gridTemplateColumns: isExporting ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: isExporting ? "#ffffff" : RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : `1px solid ${RG.border}`, padding: 20, minHeight: isExporting ? 300 : 260, boxShadow: isExporting ? "none" : RG.shadowSoft, backdropFilter: isExporting ? "none" : RG.glassFilter }}>
            <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14, fontWeight: 700 }}>สัดส่วนสถานะลีด</h4>
            {pieData.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180, color: RG.textMuted, fontSize: 13 }}>
                ไม่มีข้อมูลสัดส่วนในช่วงเวลานี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={isExporting ? 250 : 200}>
                <PieChart style={{ overflow: "visible" }}>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={isExporting ? 85 : 70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={13} isAnimationActive={!isExporting}>
                    {pieData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#ccc"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div style={{ background: isExporting ? "#ffffff" : RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : `1px solid ${RG.border}`, padding: 20, minHeight: isExporting ? 300 : 260, boxShadow: isExporting ? "none" : RG.shadowSoft, backdropFilter: isExporting ? "none" : RG.glassFilter }}>
            <h3 style={{ margin: "0 0 16px", color: RG.primary, fontSize: 16 }}>
              แนวโน้มการติดตาม
            </h3>
            {!hasChartData ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180, color: RG.textMuted, fontSize: 13 }}>
                ไม่มีข้อมูลการติดตามในช่วงเวลานี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={isExporting ? 250 : 200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ติดตาม" stroke={RG.primary} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} isAnimationActive={!isExporting} />
                  <Line type="monotone" dataKey="ปิดการขาย" stroke={RG.success} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} isAnimationActive={!isExporting} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* กราฟ Bar Chart */}
        <div style={{ background: RG.surface, borderRadius: 12, border: isExporting ? "1px solid #cbd5e1" : `1px solid ${RG.border}`, padding: 20, minHeight: isExporting ? 320 : 240, boxShadow: isExporting ? "none" : "none" }}>
          <h3 style={{ margin: "0 0 16px", color: RG.primary, fontSize: 16 }}>
            Monthly Conversion
          </h3>
          {!hasChartData ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 150, color: RG.textMuted, fontSize: 13 }}>
              ไม่มีข้อมูลสรุป Conversion ในช่วงเวลานี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isExporting ? 270 : 180}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="โทร" fill={RG.primary} radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={!isExporting} />
                <Bar dataKey="ปิด" fill={RG.success} radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={!isExporting} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    
      {/* Modal Filter Date */}
      {showDateModal && (
        <Modal title="กรองข้อมูลวันที่" onClose={() => setShowDateModal(false)} width={450}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 13, color: RG.textMuted }}>ติดต่อล่าสุด:</div>
              <select 
                value={dashboardDateRange.type || "all"}
                onChange={(e) => handleDatePreset(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="today">วันนี้</option>
                <option value="thismonth">เดือนนี้</option>
                <option value="lastmonth">เดือนที่แล้ว</option>
                <option value="thisquarter">ไตรมาสนี้</option>
                <option value="lastquarter">ไตรมาสที่แล้ว</option>
                <option value="last6months">6 เดือนล่าสุด (ค่าเริ่มต้น)</option>
                <option value="thisyear">ปีนี้</option>
                <option value="all">ทั้งหมด (ไม่กรอง)</option>
                <option value="custom">กำหนดช่วงเวลาแทน (สูงสุด 1 ปี)</option>
              </select>
            </div>

            {(dashboardDateRange.type === "custom") && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 132 }}>
                <input 
                  type="date" 
                  value={dashboardDateRange.min} 
                  onChange={e => handleCustomDateChange("min", e.target.value)} 
                  style={{ ...inputStyle, flex: 1 }} 
                />
                <span style={{ color: RG.textMuted }}>-</span>
                <input 
                  type="date" 
                  value={dashboardDateRange.max} 
                  onChange={e => handleCustomDateChange("max", e.target.value)} 
                  style={{ ...inputStyle, flex: 1 }} 
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button 
                onClick={() => setDashboardDateRange({ ...getPresetRange("last6months"), type: "last6months" })}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${RG.border}`, background: "#f5e6ea", color: RG.primary, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                กลับเป็นค่าเริ่มต้น
              </button>
              <button 
                onClick={() => setShowDateModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: RG.gradient, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                ตกลง
              </button>
            </div>
          </div>
        </Modal>
      )}

        {/* Formal Footer */}
        {isExporting && (
          <div style={{ marginTop: 50, borderTop: "2px solid #e2e8f0", paddingTop: 20, display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 13 }}>
            <div>© 2026 Sales_CRM System. All rights reserved.</div>
            <div>รายงานสำหรับใช้ภายในองค์กรเท่านั้น (Internal Use Only)</div>
          </div>
        )}
</div>
  );
}