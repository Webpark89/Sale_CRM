import React from "react";
import { RG } from "../../constants/theme";
import { UsersRound, Settings, Download } from "lucide-react";

export default function LeadsHeader({
  search, setSearch,
  setShowAddLead,
  showFavorites, setShowFavorites,
  filterStatus, finFilters, setShowFilterModal,
  canViewAll, canViewSelect,
  isSellerDropdownOpen, setIsSellerDropdownOpen,
  filterSellers, setFilterSellers,
  leads,
  canExport, canExportAll,
  handleExport
}) {
  const inputStyle = { padding: "8px 12px", borderRadius: "8px", border: `1px solid ${RG.border}`, outline: "none", fontSize: "13px", fontFamily: "'Sarabun', sans-serif" };

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: RG.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: RG.surface, boxShadow: RG.shadowGlow }}>
          <UsersRound size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: RG.text, fontFamily: RG.fontHeading, fontSize: 24, fontWeight: 700 }}>จัดการข้อมูลลูกค้า (Leads)</h2>
          <p style={{ margin: "4px 0 0 0", color: RG.textMuted, fontFamily: RG.fontBody, fontSize: 14 }}>ระบบจัดการฐานข้อมูลลูกค้าและการติดตามการขาย</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShowAddLead(true)} style={{ background: RG.primary, color: RG.surface, border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontFamily: "'Sarabun', sans-serif" }}>
          + เพิ่มลีดใหม่
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาบริษัท, เลขนิติบุคคล, เบอร์..." style={{ ...inputStyle, width: 280 }} />
        
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", borderLeft: `1px solid ${RG.border}`, paddingLeft: 12 }}>
          <button 
            onClick={() => setShowFavorites(!showFavorites)} 
            style={{ 
              padding: "4px 10px", borderRadius: 20, 
              border: `1.5px solid ${showFavorites ? RG.primary : RG.border}`, 
              background: showFavorites ? "#F0FDF4" : RG.surface, 
              color: showFavorites ? RG.primaryMid : RG.textMuted, 
              fontSize: 12, cursor: "pointer", fontWeight: showFavorites ? 700 : 400, 
              fontFamily: "'Sarabun', sans-serif" 
            }}
          >
            {showFavorites ? "⭐ กำลังดูรายการโปรด" : "☆ รายการโปรด"}
          </button>

          <button 
            onClick={() => setShowFilterModal(true)} 
            style={{ 
              padding: "4px 10px", borderRadius: 20, 
              border: `1.5px solid ${(filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) ? RG.primary : RG.border}`, 
              background: (filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) ? RG.surface : "transparent", 
              color: (filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) ? RG.primaryMid : RG.textMuted, 
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4 
            }}>
            <Settings size={14} /> ตัวกรอง {(filterStatus.length > 0 || Object.values(finFilters).some(f => f.min || f.max)) && "(เปิดใช้งาน)"}
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {(canViewAll || canViewSelect) && (
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setIsSellerDropdownOpen(!isSellerDropdownOpen)}
                style={{ ...inputStyle, width: "180px", cursor: "pointer", backgroundColor: filterSellers.length > 0 ? "#F0FDF4" : RG.surface, display: "flex", justifyContent: "space-between", alignItems: "center", border: filterSellers.length > 0 ? `1px solid ${RG.primaryLight}` : `1px solid ${RG.border}` }}
              >
                <span style={{ color: filterSellers.length > 0 ? RG.primaryMid : RG.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <UsersRound size={14} />
                  {filterSellers.length === 0 ? "แสดงทุกเซลส์" : `เลือกแล้ว ${filterSellers.length} เซลส์`}
                </span>
                <span style={{ fontSize: 10 }}>▼</span>
              </div>
              {isSellerDropdownOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: RG.surface, border: `1px solid ${RG.border}`, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 50, padding: "8px 0", marginTop: "4px", maxHeight: "250px", overflowY: "auto" }}>
                  <label style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${RG.border}` }}>
                    <input type="checkbox" checked={filterSellers.length === 0} onChange={() => setFilterSellers([])} style={{ marginRight: 8 }} />
                    แสดงทุกเซลส์
                  </label>
                  {[...new Set(leads.map(l => l.owner).filter(Boolean))].map(seller => (
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

          {canExport && (
            <select 
              onChange={handleExport}
              style={{ 
                padding: "0 14px",
                borderRadius: "8px",
                border: `1px solid ${RG.primary}`,
                backgroundColor: RG.surface,
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
              <option value="">Export</option>
              <optgroup label="เฉพาะหน้าปัจจุบัน (Current View)">
                <option value="current_csv">Excel / CSV</option>
                <option value="current_json">JSON</option>
                <option value="current_pdf">PDF (Print)</option>
              </optgroup>
              {canExportAll && (
                <optgroup label="ทั้งหมด (All Report)">
                  <option value="all_csv">Excel / CSV</option>
                  <option value="all_json">JSON</option>
                  <option value="all_pdf">PDF (Print All)</option>
                </optgroup>
              )}
            </select>
          )}
        </div>
      </div>
    </>
  );
}
