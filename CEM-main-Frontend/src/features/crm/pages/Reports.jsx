import React, { useState, useMemo } from "react";
import { STAGES, STAGE_COLORS, STAGE_STATUS_MAP } from "../constants/status";
import { RG } from "../constants/theme";
import { fmtNum, PROVINCES, today, parseDateTH, formatPhoneNumber } from "../crmHelpers/helpers";
import { Filter, UsersRound, MapPin, TrendingUp, SearchX, PhoneCall, CalendarCheck, Sparkles, Download } from "lucide-react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

const getPresetRange = (preset) => {
  const d = new Date();
  const fmt = (date) => { const off = date.getTimezoneOffset()*60000; return new Date(date.getTime()-off).toISOString().split('T')[0]; };
  const t = fmt(d);
  if (preset==='today') return {min:t,max:t};
  if (preset==='last6months') { const p=new Date(d.getFullYear(),d.getMonth()-5,1); return {min:fmt(p),max:t}; }
  if (preset==='thismonth') { return {min:fmt(new Date(d.getFullYear(),d.getMonth(),1)),max:t}; }
  if (preset==='lastmonth') { return {min:fmt(new Date(d.getFullYear(),d.getMonth()-1,1)),max:fmt(new Date(d.getFullYear(),d.getMonth(),0))}; }
  if (preset==='thisquarter') { const q=Math.floor(d.getMonth()/3); return {min:fmt(new Date(d.getFullYear(),q*3,1)),max:t}; }
  if (preset==='lastquarter') { const q=Math.floor(d.getMonth()/3); return {min:fmt(new Date(d.getFullYear(),q*3-3,1)),max:fmt(new Date(d.getFullYear(),q*3,0))}; }
  if (preset==='thisyear') { return {min:fmt(new Date(d.getFullYear(),0,1)),max:t}; }
  return {min:'',max:''};
};

export default function Reports({ leads = [], followups = {}, currentUser }) {
  const todayStr = today();

  const [useMockData, setUseMockData] = useState(false);

  // Pagination States
  const [todayPage, setTodayPage] = useState(1);
  const [filterPage, setFilterPage] = useState(1);
  const [perfPage, setPerfPage] = useState(1);
  const itemsPerPage = 10;
  const perfItemsPerPage = 6;

  // Permissions checks
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role_is_system;
  const canViewAll = isAdmin || currentUser?.permissions?.reports?.view === 'all';
  const canExportAll = isAdmin || currentUser?.permissions?.reports?.export === 'all';
  const canExportOwn = currentUser?.permissions?.reports?.export === 'own';
  const canExport = canExportAll || (canExportOwn && (!filters.owner || filters.owner === currentUser?.username));

  const showTodayTable = currentUser?.permissions?.reports?.table_today !== false;
  const showPerformanceTable = currentUser?.permissions?.reports?.table_performance !== false;
  const showStageTable = currentUser?.permissions?.reports?.table_stage !== false;
  const showFilteredTable = currentUser?.permissions?.reports?.table_filtered !== false;

  // Advanced Filters State
  const [filters, setFilters] = useState({
    dateType: "all",
    dateStart: "",
    dateEnd: "",
    owner: "",
    stage: "",
    status: "",
    province: "",
    minRevenue: ""
  });

  // Mock Data Definition
  const MOCK_LEADS = useMemo(() => [
    {
      id: "mock-1",
      companyName: "บริษัท สยามเทคโนโลยี จำกัด",
      contactName: "คุณสมชาย วงศ์สว่าง",
      contactPhone: "0812345678",
      owner: "สมพงษ์",
      province: "กรุงเทพมหานคร",
      revenue: 450000,
      stage: "Proposal",
      latestStatus: "เสนอราคาแล้ว",
      latestContactDate: todayStr,
      nextFollowupDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
    },
    {
      id: "mock-2",
      companyName: "บริษัท โกลบอล อินโนเวชั่น จำกัด",
      contactName: "คุณวิภา รัตนเมธา",
      contactPhone: "0898765432",
      owner: "อัญชลี",
      province: "ชลบุรี",
      revenue: 1200000,
      stage: "Meeting",
      latestStatus: "นัดหมายเรียบร้อย",
      latestContactDate: todayStr,
      nextFollowupDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
    },
    {
      id: "mock-3",
      companyName: "ร้านรุ่งเรืองพาณิชย์",
      contactName: "คุณกิตติศักดิ์ เจริญสุข",
      contactPhone: "0865554321",
      owner: "ธนากร",
      province: "เชียงใหม่",
      revenue: 280000,
      stage: "Approval",
      latestStatus: "รออนุมัติงบ",
      latestContactDate: todayStr,
      nextFollowupDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0]
    },
    {
      id: "mock-4",
      companyName: "บริษัท อัลฟ่า โลจิสติกส์ จำกัด",
      contactName: "คุณประเสริฐ ชัยชนะ",
      contactPhone: "0821119988",
      owner: "สมพงษ์",
      province: "ระยอง",
      revenue: 850000,
      stage: "Closed",
      latestStatus: "Win",
      latestContactDate: todayStr,
      nextFollowupDate: ""
    },
    {
      id: "mock-5",
      companyName: "บริษัท บีเคเค เทรดดิ้ง จำกัด",
      contactName: "คุณนภา ศิริกุล",
      contactPhone: "0843332211",
      owner: "ณัฐวุฒิ",
      province: "นนทบุรี",
      revenue: 150000,
      stage: "Contact",
      latestStatus: "โทรติดต่อแล้ว",
      latestContactDate: todayStr,
      nextFollowupDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0]
    }
  ], [todayStr]);

  const MOCK_FOLLOWUPS = useMemo(() => ({
    "mock-1": [{ sequence: 1, date: todayStr, detail: "โทรติดตามใบเสนอราคา ลูกค้าสนใจแพ็กเกจ Pro และขอส่วนลด 5%", status: "เสนอราคาแล้ว" }],
    "mock-2": [{ sequence: 1, date: todayStr, detail: "เข้าพบลูกค้าเพื่อ Demo ระบบ Sales_CRM ผู้บริหารพอใจมาก นัดส่ง Quotation", status: "นัดหมายเรียบร้อย" }],
    "mock-3": [{ sequence: 2, date: todayStr, detail: "ส่งเอกสารสัญญาและใบอนุมัติให้ฝ่ายจัดซื้อเรียบร้อยแล้ว รอผู้จัดการเซ็นอนุมัติ", status: "รออนุมัติงบ" }],
    "mock-4": [{ sequence: 3, date: todayStr, detail: "ลูกค้าเซ็นสัญญาเปิดใช้งานระบบและโอนเงินงวดแรกเรียบร้อยแล้ว (Closed Win)", status: "Win" }],
    "mock-5": [{ sequence: 1, date: todayStr, detail: "โทรแนะนำบริการเบื้องต้น ส่ง Brochure และ Profile บริษัทให้ทางอีเมล", status: "โทรติดต่อแล้ว" }]
  }), [todayStr]);

  // Combine real and mock data
  const effectiveLeads = useMemo(() => {
    let combined = useMockData ? [...leads, ...MOCK_LEADS] : leads;
    if (!canViewAll) {
      combined = combined.filter(l => l.owner === currentUser?.username);
    }
    return combined;
  }, [leads, useMockData, MOCK_LEADS, canViewAll, currentUser]);

  const effectiveFollowups = useMemo(() => {
    return useMockData ? { ...followups, ...MOCK_FOLLOWUPS } : followups;
  }, [followups, useMockData, MOCK_FOLLOWUPS]);

  // Extract unique owners from effectiveLeads
  const uniqueOwners = useMemo(() => {
    const owners = effectiveLeads.map(l => l.owner).filter(o => o);
    return [...new Set(owners)].sort();
  }, [effectiveLeads]);

  // Handle filter changes
  const updateFilter = (key, val) => {
    setTodayPage(1);
    setFilterPage(1);
    if (key === 'dateType') {
      const range = getPresetRange(val);
      setFilters(prev => ({
        ...prev,
        dateType: val,
        dateStart: range.min,
        dateEnd: range.max
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: val,
        ...(key === 'stage' ? { status: "" } : {}),
        ...(key === 'dateStart' || key === 'dateEnd' ? { dateType: 'custom' } : {})
      }));
    }
  };

  const setFilterToday = () => {
    setTodayPage(1);
    setFilterPage(1);
    setFilters(prev => ({
      ...prev,
      dateType: 'today',
      dateStart: todayStr,
      dateEnd: todayStr
    }));
  };

  const clearFilters = () => {
    setTodayPage(1);
    setFilterPage(1);
    setFilters({
      dateType: "all",
      dateStart: "",
      dateEnd: "",
      owner: "",
      stage: "",
      status: "",
      province: "",
      minRevenue: ""
    });
  };

  // 1. Apply Filters
  const filteredLeads = useMemo(() => {
    return effectiveLeads.filter(l => {
      // Date Filter
      if (filters.dateStart && l.latestContactDate && l.latestContactDate < filters.dateStart) return false;
      if (filters.dateEnd && l.latestContactDate && l.latestContactDate > filters.dateEnd) return false;

      // Owner Filter
      if (filters.owner && l.owner !== filters.owner) return false;

      // Stage / Status
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.status && l.latestStatus !== filters.status) return false;

      // Province
      if (filters.province && l.province !== filters.province) return false;

      // Min Revenue
      if (filters.minRevenue && (l.revenue || 0) < Number(filters.minRevenue)) return false;

      return true;
    });
  }, [effectiveLeads, filters]);

  // 2. Filter Leads Contacted in Selected Period (Default: Today)
  const reportTarget = useMemo(() => {
    let label = "วันนี้";
    let dateStr = parseDateTH(todayStr);

    if (filters.dateStart && filters.dateEnd) {
      if (filters.dateStart === filters.dateEnd) {
        label = `วันที่ ${parseDateTH(filters.dateStart)}`;
        dateStr = parseDateTH(filters.dateStart);
      } else {
        label = `ช่วงวันที่ ${parseDateTH(filters.dateStart)} ถึง ${parseDateTH(filters.dateEnd)}`;
        dateStr = `${parseDateTH(filters.dateStart)} - ${parseDateTH(filters.dateEnd)}`;
      }
    } else if (filters.dateStart) {
      label = `ตั้งแต่ ${parseDateTH(filters.dateStart)}`;
      dateStr = `ตั้งแต่ ${parseDateTH(filters.dateStart)}`;
    } else if (filters.dateEnd) {
      label = `ถึง ${parseDateTH(filters.dateEnd)}`;
      dateStr = `ถึง ${parseDateTH(filters.dateEnd)}`;
    }

    const isContactedInPeriod = (lead) => {
      const fups = effectiveFollowups[lead.id] || [];
      if (filters.dateStart && filters.dateEnd) {
        if (filters.dateStart === filters.dateEnd) {
          return lead.latestContactDate === filters.dateStart || fups.some(f => f.date === filters.dateStart);
        } else {
          const inRange = (d) => d && d >= filters.dateStart && d <= filters.dateEnd;
          return inRange(lead.latestContactDate) || fups.some(f => inRange(f.date));
        }
      } else if (filters.dateStart) {
        return lead.latestContactDate >= filters.dateStart || fups.some(f => f.date >= filters.dateStart);
      } else if (filters.dateEnd) {
        return lead.latestContactDate <= filters.dateEnd || fups.some(f => f.date <= filters.dateEnd);
      } else {
        return lead.latestContactDate === todayStr || fups.some(f => f.date === todayStr);
      }
    };

    const leads = filteredLeads.filter(isContactedInPeriod);

    return { label, dateStr, leads, isContactedInPeriod };
  }, [filteredLeads, effectiveFollowups, filters, todayStr]);

  const todayLeads = reportTarget.leads;

  // Pagination Calculations
  const totalTodayPages = Math.ceil(todayLeads.length / itemsPerPage);
  const actualTodayPage = Math.max(1, Math.min(todayPage, totalTodayPages || 1));
  const paginatedTodayLeads = todayLeads.slice((actualTodayPage - 1) * itemsPerPage, actualTodayPage * itemsPerPage);

  const totalFilterPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const actualFilterPage = Math.max(1, Math.min(filterPage, totalFilterPages || 1));
  const paginatedFilteredLeads = filteredLeads.slice((actualFilterPage - 1) * itemsPerPage, actualFilterPage * itemsPerPage);

  // 3. Compute KPIs
  const kpis = useMemo(() => {
    let totalLeads = filteredLeads.length;
    let pipelineValue = 0;
    let revenueWon = 0;
    let wonCount = 0;
    
    filteredLeads.forEach(l => {
      const val = l.dealValue || 0;
      if (l.stage === 'Closed' && l.latestStatus === 'Won') {
        revenueWon += val;
        wonCount++;
      } else if (l.stage !== 'Closed') {
        pipelineValue += val;
      }
    });

    const winRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : 0;

    return { totalLeads, pipelineValue, revenueWon, winRate, todayCount: todayLeads.length };
  }, [filteredLeads, todayLeads]);

  // 4. Generate Table Data: Performance by Owner
  const ownerPerf = useMemo(() => {
    const map = {};
    filteredLeads.forEach(l => {
      const o = l.owner || "Unassigned";
      if (!map[o]) map[o] = { owner: o, count: 0, active: 0, won: 0, pipelineVal: 0, revenueVal: 0, todayContact: 0 };
      map[o].count++;
      
      if (reportTarget.isContactedInPeriod(l)) {
        map[o].todayContact++;
      }

      const val = l.dealValue || 0;
      if (l.stage === 'Closed' && l.latestStatus === 'Won') {
        map[o].won++;
        map[o].revenueVal += val;
      } else if (l.stage !== 'Closed') {
        map[o].active++;
        map[o].pipelineVal += val;
      }
    });
    return Object.values(map).sort((a, b) => b.revenueVal - a.revenueVal);
  }, [filteredLeads, effectiveFollowups, todayStr]);

  // 5. Generate Table Data: Pipeline by Stage
  const stagePerf = useMemo(() => {
    const list = [
      { name: 'Contact', count: 0, value: 0, color: STAGE_COLORS['Contact'] },
      { name: 'Meeting', count: 0, value: 0, color: STAGE_COLORS['Meeting'] },
      { name: 'Proposal', count: 0, value: 0, color: STAGE_COLORS['Proposal'] },
      { name: 'Approval', count: 0, value: 0, color: STAGE_COLORS['Approval'] },
      { name: 'Closed - Won', count: 0, value: 0, color: '#10B981' },
      { name: 'Closed - Lost', count: 0, value: 0, color: '#EF4444' }
    ];

    filteredLeads.forEach(l => {
      const s = l.stage || 'Contact';
      if (s === 'Closed') {
        if (l.latestStatus === 'Won') {
          list[4].count++;
          list[4].value += (l.dealValue || 0);
        } else {
          list[5].count++;
          list[5].value += (l.dealValue || 0);
        }
      } else {
        const idx = ['Contact', 'Meeting', 'Proposal', 'Approval'].indexOf(s);
        if (idx !== -1) {
          list[idx].count++;
          list[idx].value += (l.dealValue || 0);
        }
      }
    });

    return list;
  }, [filteredLeads]);

  // 6. Generate Table Data: Leads by Province
  const provincePerf = useMemo(() => {
    const map = {};
    filteredLeads.forEach(l => {
      const p = l.province || "ไม่ระบุ";
      if (!map[p]) map[p] = { province: p, count: 0, revenue: 0 };
      map[p].count++;
      if (l.stage === 'Closed' && l.latestStatus === 'Won') {
        map[p].revenue += (l.dealValue || 0);
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredLeads]);

  const inputStyle = {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${RG.border}`,
    fontSize: 13,
    color: RG.text,
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'Sarabun', sans-serif",
  };

  const thStyle = {
    padding: "12px 16px",
    background: RG.background,
    color: RG.textMuted,
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
    borderBottom: `2px solid ${RG.border}`
  };

  const tdStyle = {
    padding: "12px 16px",
    fontSize: 13,
    color: RG.text,
    borderBottom: `1px solid ${RG.border}`
  };

  const exportToExcel = () => {
    // 1. Today's Contacts
    const wsToday = XLSX.utils.json_to_sheet(todayLeads.map(l => {
      const fups = effectiveFollowups[l.id] || [];
      const latestFup = fups.length > 0 ? [...fups].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0] : null;
      return {
        "บริษัท / ชื่อร้าน": l.companyName || "-",
        "ผู้ติดต่อ": l.contactName || "-",
        "เบอร์โทรศัพท์": l.contactPhone ? formatPhoneNumber(l.contactPhone) : "-",
        "เซลส์ผู้ดูแล": l.owner || "-",
        "Stage": l.stage || "-",
        "Status ล่าสุด": l.latestStatus || "-",
        "รายละเอียดติดตามล่าสุด": latestFup?.detail || l.description || "-",
        "นัดติดตามถัดไป": l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"
      };
    }));

    // 2. Owner Performance
    const wsOwner = XLSX.utils.json_to_sheet(ownerPerf.map(o => ({
      "เซลส์ผู้ดูแล": o.owner,
      "Lead Count": o.count,
      "Win Rate (%)": ((o.wonCount / (o.count || 1)) * 100).toFixed(1),
      "Pipeline Value (฿)": o.pipeline,
      "Revenue Won (฿)": o.won
    })));

    // 3. Stage Performance
    const totalVal = kpis.pipelineValue + kpis.revenueWon;
    const wsStage = XLSX.utils.json_to_sheet(stagePerf.map(s => ({
      "Stage": s.stage,
      "Lead Count": s.count,
      "Total Value (฿)": s.value,
      "% of Total Value": totalVal > 0 ? ((s.value / totalVal) * 100).toFixed(1) : "0.0"
    })));

    // 4. Province Performance
    const wsProvince = XLSX.utils.json_to_sheet(provincePerf.map(p => ({
      "Province": p.province,
      "Lead Count": p.count,
      "Revenue Won (฿)": p.value
    })));

    // 5. All Filtered Leads
    const wsAll = XLSX.utils.json_to_sheet(filteredLeads.map(l => ({
      "บริษัท / ลูกค้า": l.companyName || "-",
      "ผู้ติดต่อ": l.contactName || "-",
      "เบอร์โทรศัพท์": l.contactPhone ? formatPhoneNumber(l.contactPhone) : "-",
      "เซลส์ผู้ดูแล": l.owner || "-",
      "จังหวัด": l.province || "-",
      "มูลค่าดีล (บาท)": l.dealValue || 0,
      "Stage": l.stage || "-",
      "Status ล่าสุด": l.latestStatus || "-",
      "วันที่อัปเดตล่าสุด": l.latestContactDate ? parseDateTH(l.latestContactDate) : "-",
      "วันที่ต้องติดตามต่อ": l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsToday, "ติดต่อวันนี้");
    XLSX.utils.book_append_sheet(workbook, wsOwner, "ตามพนักงานขาย");
    XLSX.utils.book_append_sheet(workbook, wsStage, "ตาม Stage");
    XLSX.utils.book_append_sheet(workbook, wsProvince, "ตามจังหวัด");
    XLSX.utils.book_append_sheet(workbook, wsAll, "ข้อมูลดิบ (Raw Data)");
    
    XLSX.writeFile(workbook, `Sales_Report_${todayStr}.xlsx`);
  };

  // Export Today's Contacts Table specifically as Excel
  const exportTodayExcel = () => {
    const ws = XLSX.utils.json_to_sheet(todayLeads.map(l => {
      const fups = effectiveFollowups[l.id] || [];
      const latestFup = fups.length > 0 ? [...fups].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0] : null;
      return {
        "บริษัท / ชื่อร้าน": l.companyName || "-",
        "ผู้ติดต่อ": l.contactName || "-",
        "เบอร์โทรศัพท์": l.contactPhone ? formatPhoneNumber(l.contactPhone) : "-",
        "เซลส์ผู้ดูแล": l.owner || "-",
        "Stage": l.stage || "-",
        "Status ล่าสุด": l.latestStatus || "-",
        "รายละเอียดติดตามล่าสุด": latestFup?.detail || l.description || "-",
        "นัดติดตามถัดไป": l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"
      };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ติดต่อวันนี้");
    XLSX.writeFile(wb, `Today_Contacts_${todayStr}.xlsx`);
  };

  // Export Filtered Leads Table specifically as Excel
  const exportFilteredExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map(l => ({
      "บริษัท / ชื่อร้าน": l.companyName || "-",
      "ผู้ติดต่อ": l.contactName || "-",
      "เบอร์โทรศัพท์": l.contactPhone ? formatPhoneNumber(l.contactPhone) : "-",
      "เซลส์ผู้ดูแล": l.owner || "-",
      "จังหวัด": l.province || "-",
      "Stage": l.stage || "-",
      "Status ล่าสุด": l.latestStatus || "-",
      "มูลค่าโครงการ (บาท)": l.dealValue || 0,
      "นัดติดตามถัดไป": l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายชื่อลูกค้าตามตัวกรอง");
    XLSX.writeFile(wb, `Filtered_Leads_${todayStr}.xlsx`);
  };



  return (
    <div style={{ paddingBottom: 60, fontFamily: "'Sarabun', sans-serif" }}>
      {/* Advance Filter Section */}
      <div style={{ background: RG.surface, padding: 24, borderRadius: 12, border: `1px solid ${RG.border}`, marginBottom: 24, boxShadow: RG.shadowSoft }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: RG.text, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <Filter size={18} /> Advance Filters
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button 
              onClick={() => setUseMockData(prev => !prev)} 
              style={{ 
                padding: "6px 14px", 
                borderRadius: 8, 
                border: `1px solid ${useMockData ? "#10B981" : RG.border}`, 
                background: useMockData ? "#ECFDF5" : RG.surface, 
                color: useMockData ? "#059669" : RG.text, 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: 12, 
                fontFamily: "'Sarabun', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Sparkles size={14} color={useMockData ? "#059669" : "#6B7280"} /> {useMockData ? "✓ กำลังแสดงข้อมูลม็อกอัพ" : "🎲 ม็อกอัพข้อมูลทดสอบ"}
            </button>
            <button 
              onClick={setFilterToday} 
              style={{ 
                padding: "6px 14px", 
                borderRadius: 8, 
                border: `1px solid ${RG.primary}`, 
                background: filters.dateStart === todayStr && filters.dateEnd === todayStr ? RG.primary : RG.surface, 
                color: filters.dateStart === todayStr && filters.dateEnd === todayStr ? RG.surface : RG.primary, 
                cursor: "pointer", 
                fontWeight: 600, 
                fontSize: 12, 
                fontFamily: "'Sarabun', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <CalendarCheck size={14} /> ⚡ ดูเฉพาะวันนี้ (Today)
            </button>
            <button onClick={clearFilters} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${RG.border}`, background: RG.surface, color: RG.text, cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "'Sarabun', sans-serif" }}>
              ล้างตัวกรอง (Clear Filters)
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>ช่วงเวลา</label>
            <select value={filters.dateType} onChange={e => updateFilter('dateType', e.target.value)} style={inputStyle}>
              <option value="today">วันนี้</option>
              <option value="thismonth">เดือนนี้</option>
              <option value="lastmonth">เดือนที่แล้ว</option>
              <option value="thisquarter">ไตรมาสนี้</option>
              <option value="lastquarter">ไตรมาสที่แล้ว</option>
              <option value="last6months">6 เดือนล่าสุด</option>
              <option value="thisyear">ปีนี้</option>
              <option value="all">ทั้งหมด (ไม่กรอง)</option>
              <option value="custom">กำหนดช่วงเวลาแทน</option>
            </select>
          </div>
          {filters.dateType === 'custom' && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>ตั้งแต่</label>
                <input type="date" value={filters.dateStart} onChange={e => updateFilter('dateStart', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>ถึง</label>
                <input type="date" value={filters.dateEnd} onChange={e => updateFilter('dateEnd', e.target.value)} style={inputStyle} />
              </div>
            </>
          )}
          {canViewAll && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>เซลส์ (Owner)</label>
              <select value={filters.owner} onChange={e => updateFilter('owner', e.target.value)} style={inputStyle}>
                <option value="">-- ทั้งหมด --</option>
                {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>Stage</label>
            <select value={filters.stage} onChange={e => updateFilter('stage', e.target.value)} style={inputStyle}>
              <option value="">-- ทั้งหมด --</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>Status</label>
            <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} style={inputStyle} disabled={!filters.stage}>
              <option value="">-- ทั้งหมด --</option>
              {(STAGE_STATUS_MAP[filters.stage] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: RG.textMuted, marginBottom: 4 }}>จังหวัด</label>
            <select value={filters.province} onChange={e => updateFilter('province', e.target.value)} style={inputStyle}>
              <option value="">-- ทั้งหมด --</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Leads", value: kpis.totalLeads, color: RG.primary },
          { label: "📞 ติดต่อวันนี้ (Today)", value: kpis.todayCount, color: "#2563EB", highlight: true },
          { label: "Pipeline Value (Active)", value: `฿${fmtNum(kpis.pipelineValue)}`, color: "#f59e0b" },
          { label: "Revenue Won (Closed Win)", value: `฿${fmtNum(kpis.revenueWon)}`, color: RG.success },
          { label: "Win Rate", value: `${kpis.winRate}%`, color: RG.text }
        ].map((k, i) => (
          <div key={i} style={{ background: k.highlight ? "#EFF6FF" : RG.surface, padding: 20, borderRadius: 12, border: `1px solid ${k.highlight ? "#BFDBFE" : RG.border}`, boxShadow: RG.shadowSoft }}>
            <div style={{ fontSize: 12, color: k.highlight ? RG.primary : RG.textMuted, fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Report Tables Area */}
      {filteredLeads.length === 0 ? (
        <div style={{ background: RG.surface, padding: 48, borderRadius: 12, border: `1px solid ${RG.border}`, textAlign: "center" }}>
          <SearchX size={48} color={RG.border} style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: 0, color: RG.textMuted }}>ไม่พบข้อมูลจากตัวกรองที่เลือก</h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* Dedicated Table 0: Today's Contacts Activity Log */}
          {showTodayTable && (
            <div id="table-today-contacts" style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.primary}44`, overflow: "hidden", boxShadow: RG.shadowSoft }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${RG.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EFF6FF", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <PhoneCall size={18} color={RG.primary} />
                  <h3 style={{ margin: 0, fontSize: 15, color: RG.primary, fontWeight: 700 }}>
                    รายงานการติดตาม / ติดต่อ{reportTarget.label} ({todayLeads.length} รายการ)
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: RG.primary, fontWeight: 600, background: "#DBEAFE", padding: "4px 10px", borderRadius: 12, marginRight: 4 }}>
                    วันที่: {reportTarget.dateStr}
                  </span>
                  {canExport && (
                    <button 
                      onClick={exportTodayExcel} 
                      style={{ background: RG.surface, border: `1px solid ${RG.border}`, color: RG.text, fontSize: 11, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      🟢 Export Excel
                    </button>
                  )}
                </div>
              </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>บริษัท / ชื่อร้าน</th>
                    <th style={thStyle}>ผู้ติดต่อ</th>
                    <th style={thStyle}>เบอร์โทรศัพท์</th>
                    <th style={thStyle}>เซลส์ผู้ดูแล</th>
                    <th style={thStyle}>Stage</th>
                    <th style={thStyle}>Status ล่าสุด</th>
                    <th style={thStyle}>รายละเอียดติดตามล่าสุด</th>
                    <th style={thStyle}>นัดติดตามถัดไป</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTodayLeads.length > 0 ? paginatedTodayLeads.map(l => {
                    const fups = effectiveFollowups[l.id] || [];
                    const latestFup = fups.length > 0 ? [...fups].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0] : null;
                    return (
                      <tr key={l.id}>
                        <td style={{...tdStyle, fontWeight: 600}}>{l.companyName}</td>
                        <td style={tdStyle}>{l.contactName || "-"}</td>
                        <td style={tdStyle}>{formatPhoneNumber(l.contactPhone) || "-"}</td>
                        <td style={{...tdStyle, color: RG.primary, fontWeight: 600}}>{l.owner || "-"}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: (STAGE_COLORS[l.stage] || '#3B82F6') + '22', color: STAGE_COLORS[l.stage] || RG.text }}>
                            {l.stage || 'Contact'}
                          </span>
                        </td>
                        <td style={{...tdStyle, fontWeight: 600}}>{l.latestStatus || "-"}</td>
                        <td style={{...tdStyle, maxWidth: 220, color: RG.textMuted, fontSize: 12}} title={latestFup?.detail || l.description || "-"}>
                          <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap" }}>
                            {latestFup?.detail || l.description || "-"}
                          </div>
                        </td>
                        <td style={{...tdStyle, whiteSpace: "nowrap"}}>
                          {l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} style={{...tdStyle, textAlign: "center", color: RG.textMuted, padding: 24 }}>
                        ยังไม่มีรายการติดต่อหรือติดตามในวันนี้สำหรับตัวกรองที่เลือก (กดปุ่ม "🎲 ม็อกอัพข้อมูลทดสอบ" เพื่อทดสอบดูตัวอย่างได้ครับ)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalTodayPages > 1 && (
              <div className="pagination-panel" style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, borderTop: `1px solid ${RG.border}`, background: RG.background }}>
                <button 
                  disabled={actualTodayPage === 1} 
                  onClick={() => setTodayPage(p => Math.max(1, p - 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${actualTodayPage === 1 ? RG.border : RG.border}`, background: actualTodayPage === 1 ? RG.background : RG.surface, color: actualTodayPage === 1 ? RG.border : RG.text, cursor: actualTodayPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ก่อนหน้า
                </button>
                <span style={{ fontWeight: 600, fontSize: 13 }}>หน้า {actualTodayPage} / {totalTodayPages}</span>
                <button 
                  disabled={actualTodayPage === totalTodayPages} 
                  onClick={() => setTodayPage(p => Math.min(totalTodayPages, p + 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${actualTodayPage === totalTodayPages ? RG.border : RG.border}`, background: actualTodayPage === totalTodayPages ? RG.background : RG.surface, color: actualTodayPage === totalTodayPages ? RG.border : RG.text, cursor: actualTodayPage === totalTodayPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ถัดไป
                </button>
              </div>
            )}
            </div>
          )}

          {/* Row of Table 1 and Table 2 */}
          {(showPerformanceTable || showStageTable) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
              
              {/* Table 1: Sales Performance */}
              {showPerformanceTable && (
                <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${RG.border}`, display: "flex", alignItems: "center", gap: 8, background: RG.background }}>
              <UsersRound size={18} color={RG.primary} />
              <h3 style={{ margin: 0, fontSize: 15, color: RG.text, fontWeight: 700 }}>Sales Performance (ผลงานรายบุคคล)</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Sales Owner</th>
                    <th style={{...thStyle, textAlign: "right"}}>Total Leads</th>
                    <th style={{...thStyle, textAlign: "center"}}>ติดต่อวันนี้</th>
                    <th style={{...thStyle, textAlign: "right"}}>Active Leads</th>
                    <th style={{...thStyle, textAlign: "right"}}>Won Leads</th>
                    <th style={{...thStyle, textAlign: "right"}}>Pipeline Value (฿)</th>
                    <th style={{...thStyle, textAlign: "right"}}>Revenue Won (฿)</th>
                    <th style={{...thStyle, textAlign: "right"}}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const totalPerfPages = Math.ceil(ownerPerf.length / perfItemsPerPage) || 1;
                    const actualPerfPage = Math.min(perfPage, totalPerfPages);
                    const currentPerfItems = ownerPerf.slice((actualPerfPage - 1) * perfItemsPerPage, actualPerfPage * perfItemsPerPage);
                    return currentPerfItems.map(o => (
                      <tr key={o.owner}>
                        <td style={{...tdStyle, fontWeight: 600}}>{o.owner}</td>
                        <td style={{...tdStyle, textAlign: "right"}}>{o.count}</td>
                        <td style={{...tdStyle, textAlign: "center", fontWeight: 600, color: o.todayContact > 0 ? RG.primary : RG.textMuted}}>
                          {o.todayContact > 0 ? `📞 ${o.todayContact}` : "0"}
                        </td>
                        <td style={{...tdStyle, textAlign: "right"}}>{o.active}</td>
                        <td style={{...tdStyle, textAlign: "right", color: RG.success, fontWeight: 600}}>{o.won}</td>
                        <td style={{...tdStyle, textAlign: "right"}}>{fmtNum(o.pipelineVal)}</td>
                        <td style={{...tdStyle, textAlign: "right", fontWeight: 700, color: RG.primary}}>{fmtNum(o.revenueVal)}</td>
                        <td style={{...tdStyle, textAlign: "right"}}>{o.count > 0 ? ((o.won/o.count)*100).toFixed(1) : 0}%</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            {Math.ceil(ownerPerf.length / perfItemsPerPage) > 1 && (
              <div className="pagination-panel" style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, borderTop: `1px solid ${RG.border}`, background: RG.background }}>
                <button 
                  disabled={Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === 1} 
                  onClick={() => setPerfPage(p => Math.max(1, p - 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === 1 ? RG.border : RG.border}`, background: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === 1 ? RG.background : RG.surface, color: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === 1 ? RG.border : RG.text, cursor: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ก่อนหน้า
                </button>
                <span style={{ fontWeight: 600, fontSize: 13 }}>หน้า {Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1)} / {Math.ceil(ownerPerf.length / perfItemsPerPage) || 1}</span>
                <button 
                  disabled={Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === (Math.ceil(ownerPerf.length / perfItemsPerPage) || 1)} 
                  onClick={() => setPerfPage(p => Math.min(Math.ceil(ownerPerf.length / perfItemsPerPage) || 1, p + 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === (Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) ? RG.border : RG.border}`, background: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === (Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) ? RG.background : RG.surface, color: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === (Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) ? RG.border : RG.text, cursor: Math.min(perfPage, Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) === (Math.ceil(ownerPerf.length / perfItemsPerPage) || 1) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table 2: Pipeline by Stage */}
        {showStageTable && (
          <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${RG.border}`, display: "flex", alignItems: "center", gap: 8, background: RG.background }}>
              <TrendingUp size={18} color={RG.primary} />
              <h3 style={{ margin: 0, fontSize: 15, color: RG.text, fontWeight: 700 }}>Pipeline by Stage (จำนวนลีดและมูลค่าแต่ละสเตจ)</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Stage / ผลลัพธ์</th>
                    <th style={{...thStyle, textAlign: "right"}}>จำนวนลีด (Lead Count)</th>
                    <th style={{...thStyle, textAlign: "right"}}>มูลค่า (฿)</th>
                    <th style={{...thStyle, textAlign: "right"}}>สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grandTotal = stagePerf.reduce((sum, item) => sum + item.value, 0);
                    return stagePerf.map(s => {
                      const pct = grandTotal > 0 ? ((s.value / grandTotal) * 100).toFixed(1) : 0;
                      return (
                        <tr key={s.name}>
                          <td style={{...tdStyle, fontWeight: 600}}>
                            <span style={{ color: s.color, marginRight: 8 }}>●</span>
                            {s.name}
                          </td>
                          <td style={{...tdStyle, textAlign: "right"}}>{s.count}</td>
                          <td style={{...tdStyle, textAlign: "right", fontWeight: 600}}>{fmtNum(s.value)}</td>
                          <td style={{...tdStyle, textAlign: "right"}}>{pct}%</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    )}

          {/* Table 3: Filtered Leads List */}
          {showFilteredTable && (
            <div id="table-filtered-leads" style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${RG.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: RG.background, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UsersRound size={18} color={RG.primary} />
                  <h3 style={{ margin: 0, fontSize: 15, color: RG.text, fontWeight: 700 }}>รายชื่อลูกค้าตามตัวกรอง ({filteredLeads.length} รายการ)</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canExport && (
                    <button 
                      onClick={exportFilteredExcel} 
                      style={{ background: RG.surface, border: `1px solid ${RG.border}`, color: RG.text, fontSize: 11, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      🟢 Export Excel
                    </button>
                  )}
                </div>
              </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>บริษัท / ชื่อร้าน</th>
                    <th style={thStyle}>ผู้ติดต่อ</th>
                    <th style={thStyle}>เบอร์โทรศัพท์</th>
                    <th style={thStyle}>เซลส์ผู้ดูแล</th>
                    <th style={thStyle}>จังหวัด</th>
                    <th style={thStyle}>Stage</th>
                    <th style={thStyle}>Status ล่าสุด</th>
                    <th style={{...thStyle, textAlign: "right"}}>มูลค่าโครงการ (฿)</th>
                    <th style={thStyle}>นัดติดตามถัดไป</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredLeads.map(l => (
                    <tr key={l.id}>
                      <td style={{...tdStyle, fontWeight: 600}}>{l.companyName}</td>
                      <td style={tdStyle}>{l.contactName || "-"}</td>
                      <td style={{...tdStyle, fontWeight: 600, color: RG.primary}}>{formatPhoneNumber(l.contactPhone) || "-"}</td>
                      <td style={{...tdStyle, color: RG.primaryMid, fontWeight: 600}}>{l.owner || "-"}</td>
                      <td style={tdStyle}>{l.province || "-"}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: (STAGE_COLORS[l.stage] || '#3B82F6') + '22', color: STAGE_COLORS[l.stage] || RG.text }}>
                          {l.stage || 'Contact'}
                        </span>
                      </td>
                      <td style={{...tdStyle, fontWeight: 600}}>{l.latestStatus || "-"}</td>
                      <td style={{...tdStyle, textAlign: "right", fontWeight: 600}}>{fmtNum(l.dealValue)}</td>
                      <td style={{...tdStyle, whiteSpace: "nowrap"}}>
                        {l.nextFollowupDate ? parseDateTH(l.nextFollowupDate) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalFilterPages > 1 && (
              <div className="pagination-panel" style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, borderTop: `1px solid ${RG.border}`, background: RG.background }}>
                <button 
                  disabled={actualFilterPage === 1} 
                  onClick={() => setFilterPage(p => Math.max(1, p - 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${actualFilterPage === 1 ? RG.border : RG.border}`, background: actualFilterPage === 1 ? RG.background : RG.surface, color: actualFilterPage === 1 ? RG.border : RG.text, cursor: actualFilterPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ก่อนหน้า
                </button>
                <span style={{ fontWeight: 600, fontSize: 13 }}>หน้า {actualFilterPage} / {totalFilterPages}</span>
                <button 
                  disabled={actualFilterPage === totalFilterPages} 
                  onClick={() => setFilterPage(p => Math.min(totalFilterPages, p + 1))} 
                  style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${actualFilterPage === totalFilterPages ? RG.border : RG.border}`, background: actualFilterPage === totalFilterPages ? RG.background : RG.surface, color: actualFilterPage === totalFilterPages ? RG.border : RG.text, cursor: actualFilterPage === totalFilterPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}