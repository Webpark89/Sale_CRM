import React, { useState, useRef } from "react";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { STATUSES, STATUS_COLORS } from "../constants/status";
import { RG } from "../constants/theme";
import { today } from "../utils/helpers";
import { toJpeg } from "html-to-image"; // เพิ่มการนำเข้าสำหรับฟังก์ชัน Export

export default function Dashboard({ leads, followups }) {
  const [filterMonth, setFilterMonth] = useState("");
  const [isExporting, setIsExporting] = useState(false); // State สำหรับควบคุมสถานะการ Export
  const exportRef = useRef(null); // Ref สำหรับกำหนดพื้นที่จำลองภาพเพื่อดาวน์โหลด

  // 1. กรอง Leads สำหรับแสดงผล KPI และ Pie Chart
  const filteredLeads = filterMonth === "" 
    ? leads 
    : leads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(filterMonth));

  // --- คำนวณ KPIs ---
  const total = filteredLeads.length;
  const closed = filteredLeads.filter(l => l.latestStatus === "ปิดการขาย").length;
  const needFollow = filteredLeads.filter(l => l.nextFollowupDate && l.nextFollowupDate <= today()).length;
  const notInterested = filteredLeads.filter(l => l.latestStatus === "ไม่สนใจ").length;
  const meetings = filteredLeads.filter(l => l.latestStatus === "มีตติ้ง").length;

  const pieData = STATUSES.map(s => ({ 
    name: s, 
    value: filteredLeads.filter(l => l.latestStatus === s).length 
  })).filter(d => d.value > 0);

  // --- จัดการแกนเวลา (X-Axis) สำหรับกราฟ ---
  let chartMonths = [];
  if (filterMonth === "") {
    chartMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      return { 
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 
        label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }) 
      };
    });
  } else {
    const [year, month] = filterMonth.split("-");
    const d = new Date(year, month - 1);
    chartMonths = [{
      key: filterMonth,
      label: d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
    }];
  }

  // --- คำนวณข้อมูลกราฟเส้นและกราฟแท่ง ---
  const lineData = chartMonths.map(m => ({
    name: m.label,
    ติดตาม: Object.values(followups).flat().filter(f => f.date && f.date.startsWith(m.key)).length,
    ปิดการขาย: leads.filter(l => l.latestStatus === "ปิดการขาย" && l.latestContactDate && l.latestContactDate.startsWith(m.key)).length,
  }));

  const barData = chartMonths.map(m => ({
    name: m.label,
    โทร: leads.filter(l => l.latestContactDate && l.latestContactDate.startsWith(m.key)).length,
    ปิด: leads.filter(l => l.latestStatus === "ปิดการขาย" && l.latestContactDate && l.latestContactDate.startsWith(m.key)).length,
  }));

  // ตรวจสอบว่าเดือนที่เลือกมีข้อมูลแอนิเมชัน/กราฟหรือไม่
  const hasChartData = lineData.some(d => d.ติดตาม > 0 || d.ปิดการขาย > 0) || barData.some(d => d.โทร > 0 || d.ปิด > 0);

  const kpis = [
    { label: "ลีดทั้งหมด", value: total, icon: "👥", color: "#7B68EE" },
    { label: "ปิดการขาย", value: closed, icon: "✅", color: RG.success },
    { label: "ต้องติดตามวันนี้", value: needFollow, icon: "🔔", color: RG.warn },
    { label: "ไม่สนใจ", value: notInterested, icon: "❌", color: RG.danger },
    { label: "นัดประชุม", value: meetings, icon: "📅", color: RG.primary },
  ];

  // ฟังก์ชันจัดการการ Export หน้าแดชบอร์ดเป็นภาพ JPG
  const handleExport = async () => {
    if (!exportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toJpeg(exportRef.current, {
        quality: 0.95,
        backgroundColor: RG.background || "#fdf9fb", // ใช้สีพื้นหลังของระบบ
        pixelRatio: 2, // เพิ่มความคมชัดให้กับรูปภาพเป็น 2 เท่า
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `dashboard-${filterMonth || "overall"}-${new Date().toISOString().slice(0, 10)}.jpg`;
      a.click();
    } catch (error) {
      console.error("Export failed", error);
      alert("ไม่สามารถส่งออกภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {/* ส่วนหัวและตัวกรองเดือน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ margin: 0, color: RG.text }}>ภาพรวมการขาย</h2>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* ตัวเลือกเดือน */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: `1px solid ${RG.border}`,
                backgroundColor: RG.surface,
                color: RG.text,
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                height: "38px"
              }}
            />
            {filterMonth && (
              <button 
                onClick={() => setFilterMonth("")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#f0f0f0",
                  color: "#555",
                  cursor: "pointer",
                  fontSize: "12px",
                  height: "34px"
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* ปุ่ม Export JPG ทำงานร่วมกับ html-to-image */}
          <button 
            onClick={handleExport}
            disabled={isExporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: `1px solid ${RG.border}`,
              backgroundColor: isExporting ? "#eee" : RG.surface,
              color: RG.text,
              cursor: isExporting ? "not-allowed" : "pointer",
              fontWeight: 500,
              height: "38px"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {isExporting ? "กำลังเซฟ..." : "Export JPG"}
          </button>
        </div>
      </div>

      {/* พื้นที่ครอบคลุมสำหรับดักจับภาพเพื่อ Export */}
      <div ref={exportRef} style={{ padding: "4px", borderRadius: "16px" }}>
        
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, padding: "16px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: RG.textMuted, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* กราฟสัดส่วน และ แนวโน้ม */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, padding: 20, minHeight: 260 }}>
            <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14, fontWeight: 700 }}>สัดส่วนสถานะลีด</h4>
            {pieData.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180, color: RG.textMuted, fontSize: 13 }}>
                ไม่มีข้อมูลสัดส่วนในเดือนนี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={11}>
                    {pieData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#ccc"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, padding: 20, minHeight: 260 }}>
            <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14, fontWeight: 700 }}>
              {filterMonth === "" ? "แนวโน้มการติดตาม (6 เดือน)" : "แนวโน้มการติดตาม (เดือนที่เลือก)"}
            </h4>
            {!hasChartData && filterMonth !== "" ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180, color: RG.textMuted, fontSize: 13 }}>
                ไม่มีข้อมูลการติดตามในเดือนนี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ติดตาม" stroke={RG.primary} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="ปิดการขาย" stroke={RG.success} strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* กราฟ Bar Chart */}
        <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, padding: 20, minHeight: 240 }}>
          <h4 style={{ margin: "0 0 16px", color: RG.text, fontSize: 14, fontWeight: 700 }}>
            {filterMonth === "" ? "Monthly Conversion (6 เดือน)" : "Monthly Conversion (เดือนที่เลือก)"}
          </h4>
          {!hasChartData && filterMonth !== "" ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 150, color: RG.textMuted, fontSize: 13 }}>
              ไม่มีข้อมูลสรุป Conversion ในเดือนนี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="โทร" fill={RG.primary} radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="ปิด" fill={RG.success} radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}