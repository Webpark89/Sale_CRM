import React, { useState, useRef, useEffect } from "react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { STATUSES, STATUS_COLORS, STATUS_ENUM } from "../constants/status";
import { RG } from "../constants/theme";
import { today, fmtNum } from "../crmHelpers/helpers";
import StatusBadge from "../components/common/StatusBadge";
import { inputStyle } from "../components/common/styles";
import { fetchAllLeadsMaster } from "../services/apiService";

export default function Reports({ leads, onViewLead, isMaster, onExitMaster, currentUser }) {
  const [mode, setMode] = useState("all");
  const [selDate, setSelDate] = useState(today());
  const [selMonth, setSelMonth] = useState(today().slice(0, 7));
  
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [filterSellers, setFilterSellers] = useState([]);
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  
  // State ควบคุมการ Export
  const [isExporting, setIsExporting] = useState(false);

  const sellerList = [...new Set(leads.map(l => l.owner).filter(Boolean))];

  const displayLeads = (filterSellers.length === 0 || currentUser?.role !== "admin")
    ? leads
    : leads.filter(l => filterSellers.includes(l.owner));
  const pdfContainerRef = useRef(null);
  
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const footerRef = useRef(null);

  // คำนวณข้อมูล
  const dailyLeads = displayLeads.filter(l => l.latestContactDate === selDate);
  const monthlyLeads = displayLeads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(selMonth));
  const reportLeads = mode === "all" ? displayLeads : (mode === "daily" ? dailyLeads : monthlyLeads);
  
  const filteredLeads = filterStatuses.length === 0
    ? [...reportLeads] 
    : reportLeads.filter(l => filterStatuses.includes(l.latestStatus));

  const finalLeads = filteredLeads.sort((a, b) => {
    const rankA = STATUSES.indexOf(a.latestStatus);
    const rankB = STATUSES.indexOf(b.latestStatus);
    return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
  });

  const handleToggleStatus = (status) => {
    if (status === "all") {
      setFilterStatuses([]);
    } else {
      setFilterStatuses(prev => 
        prev.includes(status) 
          ? prev.filter(s => s !== status) 
          : [...prev, status]
      );
    }
  };

  // แบ่งหน้าสำหรับ PDF
  const chunkedLeads = [];
  const FIRST_PAGE_LIMIT = 12; // ตามที่ผู้ใช้ต้องการ (หน้าแรก 12 บรรทัด)
  const OTHER_PAGE_LIMIT = 15; // ตามที่ผู้ใช้ต้องการ (หน้าถัดไป 15 บรรทัด)
  
  if (finalLeads.length <= FIRST_PAGE_LIMIT) {
    chunkedLeads.push(finalLeads);
  } else {
    chunkedLeads.push(finalLeads.slice(0, FIRST_PAGE_LIMIT));
    let remaining = finalLeads.slice(FIRST_PAGE_LIMIT);
    while (remaining.length > 0) {
      chunkedLeads.push(remaining.slice(0, OTHER_PAGE_LIMIT));
      remaining = remaining.slice(OTHER_PAGE_LIMIT);
    }
  }

  // Group ด้วย reduce ก่อน เพื่อหลีกการทำ .filter() ซ้อนใน .map() ที่เป็น O(N×M)
  const groupedByStatus = finalLeads.reduce((acc, l) => {
    if (!l.latestStatus) return acc;
    acc[l.latestStatus] = acc[l.latestStatus] || [];
    acc[l.latestStatus].push(l);
    return acc;
  }, {});

  const statGroups = STATUSES
    .filter(s => (filterStatuses.length === 0 || filterStatuses.includes(s)) && groupedByStatus[s])
    .map(s => ({ status: s, items: groupedByStatus[s] }));

  const totalCalls = finalLeads.length;
  const { totalMeetings, totalClosed } = finalLeads.reduce((acc, l) => {
    if (l.latestStatus === STATUS_ENUM.MEETING) acc.totalMeetings++;
    if (l.latestStatus === STATUS_ENUM.CLOSED) acc.totalClosed++;
    return acc;
  }, { totalMeetings: 0, totalClosed: 0 });

  const doExportCSV = (targetLeads) => {
    const csvRows = [];
    STATUSES.forEach(status => {
      if (filterStatus !== "all" && filterStatus !== status) return;
      const items = targetLeads.filter(l => l.latestStatus === status);
      if (items.length === 0) return;
      
      csvRows.push(`--- หมวดหมู่: ${status} ---`);
      csvRows.push("วันที่,ชื่อบริษัท,ผู้ติดต่อ,เบอร์โทร,สถานะ");
      items.forEach(l => {
        const row = [
          l.latestContactDate || "-", `"${l.companyName || "-"}"`, `"${l.contactName || "-"}"`, `"${l.contactPhone || "-"}"`, `"${l.latestStatus || "-"}"`
        ];
        csvRows.push(row.join(","));
      });
      csvRows.push(""); 
    });

    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `รายงานรายละเอียด_${mode === "all" ? "ทั้งหมด" : (mode === "daily" ? `รายวัน_${selDate}` : `รายเดือน_${selMonth}`)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const doExportPDF = async () => {
    if (!pdfContainerRef.current) return;
    setIsExporting(true);
    
    // รอให้ React เรนเดอร์ DOM ก่อน (เผื่อหน้าเยอะให้เวลามันหน่อย)
    await new Promise(r => setTimeout(r, 800));
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const pages = pdfContainerRef.current.children;
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        const dataUrl = await toJpeg(pageEl, {
          quality: 0.8,
          backgroundColor: "#FFFFFF",
          pixelRatio: 1.5,
          style: { margin: "0" }
        });
        
        if (i > 0) pdf.addPage();
        
        // A4 ratio: 297/210 = 1.414. The pageEl is 800x1131, so it fits perfectly on A4.
        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`รายงานสรุป_${mode === "all" ? "ทั้งหมด" : (mode === "daily" ? `รายวัน_${selDate}` : `รายเดือน_${selMonth}`)}.pdf`);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async (e) => {
    const val = e.target.value;
    e.target.value = ""; // รีเซ็ต Dropdown
    if (!val) return;

    const [modeStr, format] = val.split("_");

    let prevSeller = filterSellers;
    if (modeStr === "all" && currentUser?.role === "admin") {
      setFilterSellers([]);
      // รอให้ React render ข้อมูลใหม่ก่อน Export
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        if (format === "csv") {
          const dLeads = leads.filter(l => l.latestContactDate === selDate);
          const mLeads = leads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(selMonth));
          const rLeads = modeStr === "all" ? leads : (modeStr === "daily" ? dLeads : mLeads);
          const fLeads = filterStatuses.length === 0 ? rLeads : rLeads.filter(l => filterStatuses.includes(l.latestStatus));
          doExportCSV(fLeads);
        } else if (format === "pdf") {
          await doExportPDF();
        }
      } catch (err) {
        alert(err.response?.data?.error || "เกิดข้อผิดพลาด");
      } finally {
        setFilterSellers(prevSeller);
      }
    } else {
      // current
      if (format === "csv") {
        doExportCSV(finalLeads);
      } else if (format === "pdf") {
        doExportPDF();
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ---------------- 1. หน้าจอหลัก (ตารางแบบเดิม) ---------------- */}
      {isMaster && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#b45309", fontWeight: 600, fontSize: 14 }}>
            ⚠️ โหมดรายงานรวม (All Leads Report) - แสดงข้อมูลลูกค้าของพนักงานทุกคนในระบบ
          </div>
          <button onClick={onExitMaster} style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            ปิดโหมดรายงานรวม
          </button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["all", "daily", "monthly"].map(m => (
              <button 
                key={m} onClick={() => { setMode(m); handleToggleStatus("all"); }} 
                style={{ padding: "8px 20px", borderRadius: 8, border: `2px solid ${mode === m ? RG.primary : RG.border}`, background: mode === m ? RG.gradient : "#fff", color: mode === m ? "#fff" : RG.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}
              >
                {m === "all" ? "ทั้งหมด" : (m === "daily" ? "รายวัน" : "รายเดือน")}
              </button>
            ))}
          </div>
          {mode === "daily" ? (
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          ) : mode === "monthly" ? (
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          ) : null}
          <div style={{ position: "relative" }}>
            <div 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              style={{ ...inputStyle, width: "160px", cursor: "pointer", backgroundColor: filterStatuses.length > 0 ? "#f0f8ff" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>{filterStatuses.length === 0 ? "แสดงทุกสถานะ" : `เลือกแล้ว ${filterStatuses.length} สถานะ`}</span>
              <span style={{ fontSize: 10 }}>▼</span>
            </div>
            {isStatusDropdownOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${RG.border}`, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, padding: "8px 0", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #eee" }}>
                  <input type="checkbox" checked={filterStatuses.length === 0} onChange={() => handleToggleStatus("all")} style={{ marginRight: 8 }} />
                  แสดงทุกสถานะ
                </label>
                {STATUSES.map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={filterStatuses.includes(s)} onChange={() => handleToggleStatus(s)} style={{ marginRight: 8 }} />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
          {currentUser?.role === "admin" && (
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

          <select 
            onChange={handleExport} 
            value="" 
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
            <option value="" disabled>⬇ Export Reports</option>
            <optgroup label="เฉพาะหน้าปัจจุบัน (Current View)">
              <option value="current_csv">.CSV (Excel)</option>
              <option value="current_pdf">.PDF (Print)</option>
            </optgroup>
            {currentUser?.role === "admin" && (
              <optgroup label="ทั้งหมด (All Report)">
                <option value="all_csv">.CSV (Excel)</option>
                <option value="all_pdf">.PDF (Print All)</option>
              </optgroup>
            )}
          </select>
        </div>
      </div>

     {/* Cards สรุปตัวเลขสำหรับหน้าจอหลัก */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        
        {/* การ์ด: โทรทั้งหมด */}
        <div 
          onClick={() => handleToggleStatus("all")} 
          style={{ background: filterStatuses.length === 0 ? "#f8f9fa" : RG.surface, borderRadius: 10, border: filterStatuses.length === 0 ? `2px solid ${RG.primary}` : `1px solid ${RG.border}`, padding: "14px 16px", textAlign: "center", cursor: "pointer" }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: RG.primary }}>{totalCalls}</div>
          <div style={{ fontSize: 12, color: RG.textMuted }}>รายการทั้งหมด</div>
        </div>

        {/* การ์ด: ดึงจาก STATUSES ทั้งหมดอัตโนมัติ */}
        {STATUSES.map(s => (
          <div 
            key={s} 
            onClick={() => handleToggleStatus(s)} 
            style={{ background: filterStatuses.includes(s) ? "#f8f9fa" : RG.surface, borderRadius: 10, border: filterStatuses.includes(s) ? `2px solid ${STATUS_COLORS[s] || RG.primary}` : `1px solid ${RG.border}`, padding: "14px 16px", textAlign: "center", cursor: "pointer" }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS[s] || RG.text }}>
              {reportLeads.filter(l => l.latestStatus === s).length}
            </div>
            <div style={{ fontSize: 12, color: RG.textMuted }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ตารางแสดงผลสำหรับหน้าจอหลัก */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: `1px solid ${RG.border}` }}>
        {statGroups.length === 0 ? (
           <div style={{ textAlign: "center", padding: "40px 0", color: RG.textMuted }}>ไม่พบข้อมูล</div>
        ) : (
          statGroups.map(g => (
            <div key={g.status} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <StatusBadge status={g.status} />
                <span style={{ color: RG.textMuted, fontSize: 13 }}>({g.items.length} บริษัท)</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: `1px solid ${RG.border}`, borderRadius: 8, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: RG.text, borderBottom: `1px solid ${RG.border}`, color: "#fff" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "50%" }}>ชื่อบริษัท</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "30%" }}>สถานะล่าสุด</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "20%" }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((l, i) => (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? "#fff" : RG.surface, borderBottom: `1px solid ${RG.border}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{l.companyName}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <StatusBadge status={l.latestStatus || g.status} />
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button 
                          onClick={() => onViewLead && onViewLead(l)} 
                          style={{ 
                            background: RG.gradient || "#e8b4b8", 
                            border: "none", 
                            color: "#fff", 
                            width: 26, 
                            height: 26, 
                            borderRadius: 6, 
                            cursor: "pointer", 
                            fontSize: 13, 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center" 
                          }}
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* ---------------- 2. พื้นที่จำลองสำหรับสร้าง PDF (ซ่อนไว้เสมอ) ---------------- */}
      <div style={{ position: "fixed", top: "-9999px", left: "-9999px" }}>
        <div ref={pdfContainerRef}>
          {chunkedLeads.map((chunk, pageIndex) => (
            <div 
              key={pageIndex} 
              style={{ 
                width: "800px", 
                height: "1131px", // A4 Ratio (800 * 1.414)
                backgroundColor: "#fff", 
                color: "#000", 
                fontFamily: "'Sarabun', 'Segoe UI', sans-serif",
                padding: "40px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden"
              }}
            >
              <div>
                {/* HEADER (แสดงทุกหน้า) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: `2px solid ${RG.primary}`, paddingBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: 50, height: 50, background: RG.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 24 }}>Q</div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: RG.primary, lineHeight: 1.2 }}>QoraQot CRM</div>
                      <div style={{ fontSize: 13, color: RG.textMuted }}>Sales & Lead Management System</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: RG.text, letterSpacing: "0.5px", marginBottom: "4px", fontFamily: "'Sarabun', sans-serif" }}>
                      {mode === "all" ? "รายงานสรุปการขายทั้งหมด" : (mode === "daily" ? "รายงานสรุปการขายรายวัน" : "รายงานสรุปการขายรายเดือน")}
                    </div>
                    <div style={{ fontSize: 14, color: RG.textMuted }}>
                      ประจำวันที่: <span style={{ color: RG.text, fontWeight: 500 }}>{mode === "all" ? "ทั้งหมด" : (mode === "daily" ? selDate : selMonth)}</span>
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div>
                  {/* Executive Summary (แสดงเฉพาะหน้าแรก) */}
                  {pageIndex === 0 && (
                    <div style={{ marginBottom: "32px" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>สรุปภาพรวม (Executive Summary)</div>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ flex: 1, background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                          <div style={{ fontSize: 13, color: RG.primary, fontWeight: 600, marginBottom: "8px" }}>จำนวนรายการที่พบ</div>
                          <div style={{ fontSize: 28, fontWeight: 700, color: RG.text }}>{totalCalls} <span style={{ fontSize: 14, fontWeight: 400 }}>บริษัท</span></div>
                        </div>
                        <div style={{ flex: 1, background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                          <div style={{ fontSize: 13, color: "#b45309", marginBottom: "8px" }}>นัดหมายมีตติ้ง</div>
                          <div style={{ fontSize: 28, fontWeight: 700, color: "#d97706" }}>{totalMeetings} <span style={{ fontSize: 14, fontWeight: 400 }}>บริษัท</span></div>
                        </div>
                        <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                          <div style={{ fontSize: 13, color: "#166534", marginBottom: "8px" }}>ปิดการขายสำเร็จ</div>
                          <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>{totalClosed} <span style={{ fontSize: 14, fontWeight: 400 }}>บริษัท</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Table */}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>รายละเอียดการติดต่อ {chunkedLeads.length > 1 ? `(หน้า ${pageIndex + 1}/${chunkedLeads.length})` : ""}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: RG.text, borderBottom: "2px solid #cbd5e1" }}>
                          <th style={{ padding: "10px", textAlign: "center", width: "5%", color: "#fff" }}>#</th>
                          <th style={{ padding: "10px", textAlign: "left", width: "30%", color: "#fff" }}>ชื่อบริษัท</th>
                          <th style={{ padding: "10px", textAlign: "left", width: "20%", color: "#fff" }}>ผู้ติดต่อ</th>
                          <th style={{ padding: "10px", textAlign: "left", width: "15%", color: "#fff" }}>เบอร์โทรศัพท์</th>
                          <th style={{ padding: "10px", textAlign: "right", width: "15%", color: "#fff" }}>รายได้/ปี (บาท)</th>
                          <th style={{ padding: "10px", textAlign: "center", width: "15%", color: "#fff" }}>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunk.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: RG.textMuted }}>ไม่พบข้อมูล</td></tr>
                        ) : (
                          chunk.map((l, i) => (
                            <tr key={l.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "10px", textAlign: "center", color: RG.textMuted }}>{(pageIndex === 0 ? 0 : FIRST_PAGE_LIMIT + (pageIndex - 1) * OTHER_PAGE_LIMIT) + i + 1}</td>
                              <td style={{ padding: "10px", fontWeight: 600, color: RG.text }}>{l.companyName || "-"}</td>
                              <td style={{ padding: "10px", color: RG.text }}>{l.contactName || "-"}</td>
                              <td style={{ padding: "10px", color: RG.text }}>{l.contactPhone || "-"}</td>
                              <td style={{ padding: "10px", textAlign: "right", color: RG.text }}>{l.revenue ? fmtNum(l.revenue) : "-"}</td>
                              <td style={{ padding: "10px", textAlign: "center" }}>
                                <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "12px", fontSize: 11, fontWeight: 600, background: STATUS_COLORS[l.latestStatus] ? STATUS_COLORS[l.latestStatus] + "22" : "#eee", color: STATUS_COLORS[l.latestStatus] || "#666" }}>
                                  {l.latestStatus || "-"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FOOTER (ผลักลงมาด้านล่างสุดเสมอเพราะ justifyContent: space-between) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", fontSize: 11, color: RG.textMuted }}>
                <div>พิมพ์เมื่อ: {new Date().toLocaleString("th-TH")}</div>
                <div style={{ fontWeight: 600, letterSpacing: "0.5px" }}>CONFIDENTIAL - QORAQOT CRM</div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}