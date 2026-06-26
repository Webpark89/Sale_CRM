import React, { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STATUSES, STATUS_COLORS, STATUS_ENUM } from "../constants/status";
import { RG } from "../constants/theme";
import { today } from "../crmHelpers/helpers";
import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { inputStyle } from "../components/common/styles";
export default function Dashboard({ leads, followups, currentUser }) {
  const [filterMonths, setFilterMonths] = useState([]);
  const [isExporting, setIsExporting] = useState(false); 
  const exportRef = useRef(null); 

  const [filterSellers, setFilterSellers] = useState([]);
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
  const sellerList = [...new Set(leads.map(l => l.owner).filter(Boolean))];

  const displayLeads = (filterSellers.length === 0 || currentUser?.role !== "admin")
    ? leads
    : leads.filter(l => filterSellers.includes(l.owner));

  // 1. กรอง Leads สำหรับแสดงผล KPI และ Pie Chart
  const filteredLeads = filterMonths.length === 0 
    ? displayLeads 
    : displayLeads.filter(l => filterMonths.some(m => l.latestContactDate && l.latestContactDate.startsWith(m)));

  // --- คำนวณ KPIs ---
  const currentDateStr = today();
  const kpiStats = filteredLeads.reduce((acc, l) => {
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

  const total = filteredLeads.length;
  const { closed, needFollow, notInterested, meetings, statusCounts } = kpiStats;

  const pieData = STATUSES.map(s => ({ 
    name: s, 
    value: statusCounts[s] || 0 
  })).filter(d => d.value > 0);

  // --- จัดการแกนเวลา (X-Axis) สำหรับกราฟ ---
  let chartMonths = [];
  if (filterMonths.length === 0) {
    chartMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      return { 
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 
        label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }) 
      };
    });
  } else {
    // เรียงเดือนตามเวลา (จากเก่าไปใหม่)
    const sortedMonths = [...filterMonths].sort();
    chartMonths = sortedMonths.map(m => {
      const [year, month] = m.split("-");
      const d = new Date(year, month - 1);
      return {
        key: m,
        label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
      };
    });
  }

  // --- คำนวณข้อมูลกราฟเส้นและกราฟแท่ง ---
  const chartKeys = new Set(chartMonths.map(m => m.key));
  
  const leadStatsByMonth = displayLeads.reduce((acc, l) => {
    if (!l.latestContactDate) return acc;
    
    const mKey = l.latestContactDate.slice(0, 7);
    if (!chartKeys.has(mKey)) return acc;
    
    acc[mKey] = acc[mKey] || { totalContact: 0, closed: 0 };
    acc[mKey].totalContact++;
    
    if (l.latestStatus === STATUS_ENUM.CLOSED) {
      acc[mKey].closed++;
    }
    return acc;
  }, {});

  const followupStatsByMonth = Object.values(followups).flat().reduce((acc, f) => {
    if (!f.date) return acc;
    
    const mKey = f.date.slice(0, 7);
    if (chartKeys.has(mKey)) {
      acc[mKey] = (acc[mKey] || 0) + 1;
    }
    return acc;
  }, {});

  const lineData = chartMonths.map(m => ({
    name: m.label,
    ติดตาม: followupStatsByMonth[m.key] || 0,
    ปิดการขาย: leadStatsByMonth[m.key]?.closed || 0,
  }));

  const barData = chartMonths.map(m => ({
    name: m.label,
    โทร: leadStatsByMonth[m.key]?.totalContact || 0,
    ปิด: leadStatsByMonth[m.key]?.closed || 0,
  }));

  // ตรวจสอบว่าเดือนที่เลือกมีข้อมูลแอนิเมชัน/กราฟหรือไม่
  const hasChartData = lineData.some(d => d.ติดตาม > 0 || d.ปิดการขาย > 0) || barData.some(d => d.โทร > 0 || d.ปิด > 0);

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
    if (mode === "all" && currentUser?.role === "admin") {
      setFilterSellers([]);
      // รอให้ React render ข้อมูลใหม่ก่อน Export
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (!exportRef.current || isExporting) return;
    setIsExporting(true);
    // รอให้จัดสไตล์หัวและท้ายแบบเป็นทางการ
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const filename = `dashboard-${mode}-${filterMonths.length > 0 ? filterMonths.join("_") : "overall"}-${new Date().toISOString().slice(0, 10)}`;

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
      alert("ไม่สามารถส่งออกภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
      // คืนค่า Dashboard กลับเป็น Current View
      if (mode === "all" && currentUser?.role === "admin") {
        setFilterSellers(prevSeller);
      }
    }
  };

  return (
    <div>
      {/* ส่วนหัวและตัวกรองเดือน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          
          {/* ตัวเลือกเดือน (รองรับหลายเดือน) */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input 
                type="month" 
                title="เพิ่มเดือนที่ต้องการดูข้อมูล"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !filterMonths.includes(val)) {
                    setFilterMonths([...filterMonths, val]);
                  }
                  e.target.value = ""; // reset
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${RG.border}`,
                  backgroundColor: RG.surface,
                  color: "transparent", // hide native text
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                  height: "38px",
                  width: "150px"
                }}
              />
              <span style={{ position: "absolute", left: 12, color: RG.textMuted, fontSize: 14, pointerEvents: "none" }}>
                กรุณาเลือกเดือน
              </span>
            </div>
            
            {filterMonths.length === 0 && (
              <span style={{ color: RG.textMuted, fontSize: 13 }}>แสดงข้อมูลทั้งหมด (6 เดือนล่าสุด)</span>
            )}

            {filterMonths.map(m => {
              const [year, month] = m.split("-");
              const d = new Date(year, month - 1);
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 6, background: RG.primaryPale, color: RG.primary, padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })}
                  <button onClick={() => setFilterMonths(filterMonths.filter(x => x !== m))} style={{ background: "transparent", border: "none", color: RG.primary, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              );
            })}

            {filterMonths.length > 0 && (
              <button 
                onClick={() => setFilterMonths([])}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
              >
                Clear All
              </button>
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

            {/* Dropdown Export (PNG/PDF) */}
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
              {currentUser?.role === "admin" && (
                <optgroup label="ทั้งหมด (All Report)">
                  <option value="all_png">PNG Image</option>
                  <option value="all_pdf">PDF (Print All)</option>
                </optgroup>
              )}
            </select>
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
                ประจำเดือน: <span style={{ fontWeight: 600, color: RG.primaryMid }}>{filterMonths.length > 0 ? filterMonths.map(m => new Date(m + "-01").toLocaleDateString("th-TH", { month: "long", year: "numeric" })).join(", ") : "ทั้งหมด (All Time)"}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: RG.primaryMid, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ width: 24, height: 24, background: RG.primary, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>Q</div>
                QoraQot CRM
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
                ไม่มีข้อมูลสัดส่วนในเดือนนี้
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
              {filterMonths.length === 0 ? "แนวโน้มการติดตาม (6 เดือน)" : "แนวโน้มการติดตาม (เดือนที่เลือก)"}
            </h3>
            {!hasChartData && filterMonths.length > 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180, color: RG.textMuted, fontSize: 13 }}>
                ไม่มีข้อมูลการติดตามในเดือนนี้
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
            {filterMonths.length === 0 ? "Monthly Conversion (6 เดือน)" : "Monthly Conversion (เดือนที่เลือก)"}
          </h3>
          {!hasChartData && filterMonths.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 150, color: RG.textMuted, fontSize: 13 }}>
              ไม่มีข้อมูลสรุป Conversion ในเดือนนี้
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
    
        {/* Formal Footer */}
        {isExporting && (
          <div style={{ marginTop: 50, borderTop: "2px solid #e2e8f0", paddingTop: 20, display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 13 }}>
            <div>© 2026 QoraQot CRM System. All rights reserved.</div>
            <div>รายงานสำหรับใช้ภายในองค์กรเท่านั้น (Internal Use Only)</div>
          </div>
        )}
</div>
  );
}