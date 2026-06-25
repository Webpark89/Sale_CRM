import React, { useState, useRef } from "react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { STATUSES, STATUS_COLORS } from "../constants/status";
import { RG } from "../constants/theme";
import { today, fmtNum } from "../crmHelpers/helpers";
import StatusBadge from "../components/common/StatusBadge";
import { inputStyle } from "../components/common/styles";
import { fetchAllLeadsMaster } from "../services/apiService";

export default function Reports({ leads, onViewLead, isMaster, onExitMaster }) {
  const [mode, setMode] = useState("all");
  const [selDate, setSelDate] = useState(today());
  const [selMonth, setSelMonth] = useState(today().slice(0, 7));
  
  const [filterStatus, setFilterStatus] = useState("all");
  
  // State ควบคุมการ Export
  const [isExporting, setIsExporting] = useState(false);
  const [tempLeads, setTempLeads] = useState(null);
  
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const footerRef = useRef(null);

  // คำนวณข้อมูล
  const displayLeads = tempLeads || leads;
  const dailyLeads = displayLeads.filter(l => l.latestContactDate === selDate);
  const monthlyLeads = displayLeads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(selMonth));
  const reportLeads = mode === "all" ? displayLeads : (mode === "daily" ? dailyLeads : monthlyLeads);
  
  const finalLeads = filterStatus === "all" 
    ? reportLeads 
    : reportLeads.filter(l => l.latestStatus === filterStatus);

  const statGroups = STATUSES
    .filter(s => filterStatus === "all" || s === filterStatus)
    .map(s => ({ status: s, items: finalLeads.filter(l => l.latestStatus === s) }))
    .filter(g => g.items.length > 0);

  const totalCalls = finalLeads.length;
  const totalMeetings = finalLeads.filter(l => l.latestStatus === "มีตติ้ง").length;
  const totalClosed = finalLeads.filter(l => l.latestStatus === "ปิดการขาย").length;

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
    if (!headerRef.current || !contentRef.current || !footerRef.current) return;
    setIsExporting(true);
    
    // รอให้ React เรนเดอร์ DOM ก่อน
    await new Promise(r => setTimeout(r, 300));
    
    try {
      const exportOptions = {
        quality: 0.8, // ลด quality ลงมาเพื่อลดขนาดไฟล์ (แต่ยังอ่านง่าย)
        backgroundColor: "#FFFFFF",
        pixelRatio: 1.5, // ลด pixelRatio ลงเพื่อลดขนาดไฟล์ (เดิม 2)
        style: { margin: "0" }
      };

      const headerDataUrl = await toJpeg(headerRef.current, exportOptions);
      const contentDataUrl = await toJpeg(contentRef.current, exportOptions);
      const footerDataUrl = await toJpeg(footerRef.current, exportOptions);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const headerProps = pdf.getImageProperties(headerDataUrl);
      const headerImgHeight = (pdfWidth / headerProps.width) * headerProps.height;

      const footerProps = pdf.getImageProperties(footerDataUrl);
      const footerImgHeight = (pdfWidth / footerProps.width) * footerProps.height;

      const contentProps = pdf.getImageProperties(contentDataUrl);
      const contentImgHeight = (pdfWidth / contentProps.width) * contentProps.height;
      
      const availableHeight = pdfHeight - headerImgHeight - footerImgHeight;
      
      let position = headerImgHeight;
      let leftHeight = contentImgHeight;

      // --- หน้าแรก ---
      pdf.addImage(contentDataUrl, "JPEG", 0, position, pdfWidth, contentImgHeight);
      
      // Mask ด้านล่าง (ถ้าเนื้อหาทะลุลงไปทับพื้นที่ Footer)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, pdfHeight - footerImgHeight, pdfWidth, footerImgHeight, "F");

      // วาด Header และ Footer ทับลงไป
      pdf.addImage(headerDataUrl, "JPEG", 0, 0, pdfWidth, headerImgHeight);
      pdf.addImage(footerDataUrl, "JPEG", 0, pdfHeight - footerImgHeight, pdfWidth, footerImgHeight);

      leftHeight -= availableHeight;

      // --- หน้าถัดๆ ไป (ถ้าความสูงรูปภาพมันมากกว่า 1 หน้ากระดาษ) ---
      while (leftHeight > 0) {
        position -= availableHeight; // เลื่อน content ขึ้นไป
        pdf.addPage();
        
        pdf.addImage(contentDataUrl, "JPEG", 0, position, pdfWidth, contentImgHeight);
        
        // Mask ด้านบน (พื้นที่ Header)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, headerImgHeight, "F");
        
        // Mask ด้านล่าง (พื้นที่ Footer)
        pdf.rect(0, pdfHeight - footerImgHeight, pdfWidth, footerImgHeight, "F");

        // วาด Header และ Footer ลงบนทุกๆ หน้า
        pdf.addImage(headerDataUrl, "JPEG", 0, 0, pdfWidth, headerImgHeight);
        pdf.addImage(footerDataUrl, "JPEG", 0, pdfHeight - footerImgHeight, pdfWidth, footerImgHeight);

        leftHeight -= availableHeight;
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

    if (modeStr === "all") {
      const pin = window.prompt("กรุณาใส่รหัสผ่านกลาง (Master PIN) เพื่อดูข้อมูลทั้งหมด:");
      if (!pin) return;
      try {
        const allLeads = await fetchAllLeadsMaster(pin);
        setTempLeads(allLeads);
        
        // รอให้ state อัปเดตและคำนวณ finalLeads ใหม่
        setTimeout(async () => {
          if (format === "csv") {
            // คำนวณ finalLeads แบบจำลองเพราะ state อาจจะยังไม่ได้อัปเดตแบบ sync
            const dLeads = allLeads.filter(l => l.latestContactDate === selDate);
            const mLeads = allLeads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(selMonth));
            const rLeads = mode === "all" ? allLeads : (mode === "daily" ? dLeads : mLeads);
            const fLeads = filterStatus === "all" ? rLeads : rLeads.filter(l => l.latestStatus === filterStatus);
            doExportCSV(fLeads);
            setTempLeads(null); // รีเซ็ตหลังทำเสร็จ
          } else if (format === "pdf") {
            await doExportPDF();
            setTempLeads(null);
          }
        }, 100);
      } catch (err) {
        alert(err.response?.data?.error || "รหัสผ่านไม่ถูกต้อง หรือดึงข้อมูลไม่ได้");
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
                key={m} onClick={() => { setMode(m); setFilterStatus("all"); }} 
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", backgroundColor: filterStatus !== "all" ? "#f0f8ff" : "#fff" }}>
            <option value="all">แสดงทุกสถานะ</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <select 
            onChange={handleExport} 
            defaultValue="" 
            style={{ 
              ...inputStyle, 
              width: "auto", 
              cursor: "pointer", 
              backgroundColor: "#fff",
              color: RG.primary,
              fontWeight: 600,
              border: `2px solid ${RG.primary}`
            }}
          >
            <option value="" disabled>⬇ Export Reports</option>
            <optgroup label="เฉพาะหน้าปัจจุบัน (Current View)">
              <option value="current_csv">.CSV (Excel)</option>
              <option value="current_pdf">.PDF (Print)</option>
            </optgroup>
            <optgroup label="ทั้งหมด (All Report - ใช้รหัส)">
              <option value="all_csv">.CSV (Excel)</option>
              <option value="all_pdf">.PDF (Print All)</option>
            </optgroup>
          </select>
        </div>
      </div>

     {/* Cards สรุปตัวเลขสำหรับหน้าจอหลัก */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        
        {/* การ์ด: โทรทั้งหมด */}
        <div 
          onClick={() => setFilterStatus("all")} 
          style={{ background: filterStatus === "all" ? "#f8f9fa" : RG.surface, borderRadius: 10, border: filterStatus === "all" ? `2px solid ${RG.primary}` : `1px solid ${RG.border}`, padding: "14px 16px", textAlign: "center", cursor: "pointer" }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: RG.primary }}>{totalCalls}</div>
          <div style={{ fontSize: 12, color: RG.textMuted }}>รายการทั้งหมด</div>
        </div>

        {/* การ์ด: ดึงจาก STATUSES ทั้งหมดอัตโนมัติ */}
        {STATUSES.map(s => (
          <div 
            key={s} 
            onClick={() => setFilterStatus(s)} 
            style={{ background: filterStatus === s ? "#f8f9fa" : RG.surface, borderRadius: 10, border: filterStatus === s ? `2px solid ${STATUS_COLORS[s] || RG.primary}` : `1px solid ${RG.border}`, padding: "14px 16px", textAlign: "center", cursor: "pointer" }}
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
        <div style={{ position: "relative", width: "800px", backgroundColor: "#fff", color: "#000", fontFamily: "'Sarabun', 'Segoe UI', sans-serif" }}>
          
          {/* HEADER */}
          <div ref={headerRef} style={{ padding: "40px 40px 0 40px", background: "#fff" }}>
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
          </div>

          {/* CONTENT */}
          <div ref={contentRef} style={{ padding: "0 40px", background: "#fff" }}>
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

            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: RG.text, marginBottom: "16px", borderLeft: `4px solid ${RG.primary}`, paddingLeft: "8px" }}>รายละเอียดการติดต่อ</div>
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
                  {finalLeads.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: RG.textMuted }}>ไม่พบข้อมูล</td></tr>
                  ) : (
                    finalLeads.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #e2e8f0", breakInside: "avoid" }}>
                        <td style={{ padding: "10px", textAlign: "center", color: RG.textMuted }}>{i + 1}</td>
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

          {/* FOOTER */}
          <div ref={footerRef} style={{ padding: "0 40px 40px 40px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", fontSize: 11, color: RG.textMuted }}>
              <div>พิมพ์เมื่อ: {new Date().toLocaleString("th-TH")}</div>
              <div style={{ fontWeight: 600, letterSpacing: "0.5px" }}>CONFIDENTIAL - QORAQOT CRM</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}