import React from "react";
import { RG } from "../../constants/theme";

export default function LeadsPagination({
  paginatedLeads,
  filteredLength,
  totalLength,
  filterStatus,
  filterProvince,
  actualPage,
  totalPages,
  setCurrentPage
}) {
  return (
    <div style={{ padding: "10px 16px", background: RG.surface, borderTop: `1px solid ${RG.border}`, fontSize: 12, color: RG.textMuted, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span>แสดง {paginatedLeads.length} จาก {filteredLength} รายการ (ทั้งหมด {totalLength} รายการ)</span>
        {filterStatus.length > 0 && <span style={{ background: RG.background, padding: "2px 8px", borderRadius: 10 }}>สถานะ: {filterStatus.join(", ")}</span>}
        {filterProvince.length > 0 && <span style={{ background: RG.background, padding: "2px 8px", borderRadius: 10 }}>จังหวัด: {filterProvince.join(", ")}</span>}
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button 
            disabled={actualPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${actualPage === 1 ? RG.border : RG.border}`, background: actualPage === 1 ? RG.background : RG.surface, color: actualPage === 1 ? RG.border : RG.text, cursor: actualPage === 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ก่อนหน้า
          </button>
          <span style={{ fontWeight: 600 }}>หน้า {actualPage} / {totalPages}</span>
          <button 
            disabled={actualPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${actualPage === totalPages ? RG.border : RG.border}`, background: actualPage === totalPages ? RG.background : RG.surface, color: actualPage === totalPages ? RG.border : RG.text, cursor: actualPage === totalPages ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
