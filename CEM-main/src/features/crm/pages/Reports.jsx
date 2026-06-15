import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { STATUSES, STATUS_COLORS } from "../constants/status";
import { RG } from "../constants/theme";
import { today } from "../utils/helpers";
import StatusBadge from "../components/common/StatusBadge";
import { inputStyle } from "../components/common/styles";

export default function Reports({ leads }) { 
  const [mode, setMode] = useState("daily");
  const [selDate, setSelDate] = useState(today());
  const [selMonth, setSelMonth] = useState(today().slice(0, 7));
  
  const [filterStatus, setFilterStatus] = useState("all");
  
  // State ควบคุมการเปิด/ปิดหน้าต่าง Preview Export
  const [showPreview, setShowPreview] = useState(false);
  const reportRef = useRef(null);

  // คำนวณข้อมูล
  const dailyLeads = leads.filter(l => l.latestContactDate === selDate);
  const monthlyLeads = leads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(selMonth));
  const reportLeads = mode === "daily" ? dailyLeads : monthlyLeads;
  
  const finalLeads = filterStatus === "all" 
    ? reportLeads 
    : reportLeads.filter(l => l.latestStatus === filterStatus);

  const statGroups = STATUSES
    .filter(s => filterStatus === "all" || s === filterStatus)
    .map(s => ({ status: s, items: finalLeads.filter(l => l.latestStatus === s) }))
    .filter(g => g.items.length > 0);

  const totalCalls = reportLeads.length;

  // ฟังก์ชันดาวน์โหลด JPG
  const handleDownloadJPG = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff"
      });
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = image;
      link.download = `รายงานสรุป_${mode === "daily" ? `รายวัน_${selDate}` : `รายเดือน_${selMonth}`}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowPreview(false);
    } catch (error) {
      alert("ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ฟังก์ชัน Export Excel
  const handleExportExcel = () => {
    const csvRows = [];
    STATUSES.forEach(status => {
      if (filterStatus !== "all" && filterStatus !== status) return;
      const items = finalLeads.filter(l => l.latestStatus === status);
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
    link.download = `รายงานรายละเอียด_${mode === "daily" ? `รายวัน_${selDate}` : `รายเดือน_${selMonth}`}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ---------------- 1. หน้าจอหลัก (ตารางแบบเดิม) ---------------- */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["daily", "monthly"].map(m => (
              <button 
                key={m} onClick={() => { setMode(m); setFilterStatus("all"); }} 
                style={{ padding: "8px 20px", borderRadius: 8, border: `2px solid ${mode === m ? RG.primary : RG.border}`, background: mode === m ? RG.gradient : "#fff", color: mode === m ? "#fff" : RG.textMuted, cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}
              >
                {m === "daily" ? "รายวัน" : "รายเดือน"}
              </button>
            ))}
          </div>
          {mode === "daily" ? (
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          ) : (
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", backgroundColor: filterStatus !== "all" ? "#f0f8ff" : "#fff" }}>
            <option value="all">แสดงทุกสถานะ</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: `1px solid #28a745`, backgroundColor: "#f2fcf5", color: "#28a745", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            Export (Excel)
          </button>
          <button onClick={() => setShowPreview(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: `1px solid ${RG.border}`, backgroundColor: "#fff", color: RG.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ตัวอย่างและ Export (JPG)
          </button>
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
          <div style={{ fontSize: 12, color: RG.textMuted }}>โทรทั้งหมด</div>
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
                  <tr style={{ background: "#F8E8EC", borderBottom: `1px solid ${RG.border}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "35%" }}>ชื่อบริษัท</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "25%" }}>ผู้ติดต่อ</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", width: "20%" }}>เบอร์โทร</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "20%" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((l, i) => (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? "#fff" : RG.surface, borderBottom: `1px solid ${RG.border}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{l.companyName}</td>
                      <td style={{ padding: "12px 16px" }}>{l.contactName || "-"}</td>
                      <td style={{ padding: "12px 16px" }}>{l.contactPhone || "-"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}><StatusBadge status={l.latestStatus || g.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* ---------------- 2. Modal/Popup สำหรับ Preview รูป A4 ---------------- */}
      {showPreview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          
          <div style={{ background: "#fff", width: "100%", maxWidth: "900px", maxHeight: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            
            {/* Header ของ Modal */}
            <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>ตัวอย่างเอกสารสรุป (JPG)</h3>
              <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888", lineHeight: 1 }}>&times;</button>
            </div>

            {/* พื้นที่เลื่อนดูรูป Preview (ปรับให้มีพื้นหลังสีเทา ให้กระดาษ A4 ดูลอยขึ้นมา) */}
            <div style={{ padding: "30px 20px", overflow: "auto", display: "flex", flex: 1, backgroundColor: "#f0f2f5" }}>
              
              {/* Wrapper จัดให้อยู่ตรงกลางเสมอ */}
              <div style={{ margin: "0 auto" }}>
                
                {/* 📄 ตัวกระดาษ A4 (บังคับกว้าง 800px และ boxSizing เพื่อไม่ให้ล้น) */}
                <div 
                  ref={reportRef} 
                  style={{ 
                    background: "#fff", 
                    padding: "40px", 
                    borderRadius: "8px", 
                    border: "1px solid #ddd", 
                    width: "800px",          // บังคับความกว้างตายตัว เพื่อไม่ให้เลย์เอาต์ตอนถ่ายรูปพัง
                    boxSizing: "border-box", // ให้ Padding คำนวณรวมอยู่ใน 800px
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", borderBottom: `2px solid ${RG.surface}`, paddingBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: 14, color: RG.textMuted, fontWeight: 600, marginBottom: 4 }}>{mode === "daily" ? "สรุปรายวัน" : "สรุปรายเดือน"}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: RG.text, letterSpacing: "0.5px" }}>{mode === "daily" ? selDate : selMonth}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, color: RG.textMuted, fontWeight: 600, marginBottom: 4 }}>โทรทั้งหมด</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: "#d9534f", lineHeight: 1 }}>{totalCalls}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {STATUSES.map(status => {
                      const items = finalLeads.filter(l => l.latestStatus === status);
                      if (filterStatus !== "all" && filterStatus !== status) return null;
                      return (
                        <div key={status} style={{ background: "#fdfdfd", borderRadius: "10px", padding: "16px 20px", border: "1px solid #f0f0f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: items.length > 0 ? "12px" : "0" }}><StatusBadge status={status} /></div>
                              {items.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "4px" }}>
                                  {items.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                      <span style={{ color: "#aaa", fontSize: 14, lineHeight: "18px" }}>•</span>
                                      <span style={{ lineHeight: "18px" }}>{item.companyName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#333", marginTop: "4px" }}>{items.length}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ textAlign: "right", marginTop: "40px", fontSize: 12, color: "#bbb", fontWeight: 600, letterSpacing: "0.5px" }}>QORA CRM</div>
                </div>
              </div>

            </div>

            {/* Footer ของ Modal (ปุ่มกดยืนยันดาวน์โหลด) */}
            <div style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #ddd", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: "8px 20px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={handleDownloadJPG} style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: RG.primary, color: "#fff", cursor: "pointer", fontWeight: 600 }}>ดาวน์โหลดเป็น JPG</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}