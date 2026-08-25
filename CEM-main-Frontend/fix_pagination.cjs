const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldPagination = `            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: \`1px solid \${RG.border}\`, background: RG.surface }}>
                <span style={{ fontSize: 13, color: RG.textMuted }}>
                  หน้า {currentPage} จาก {totalPages} · {filteredFollowups.length} รายการ
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ width: 32, height: 32, borderRadius: 6, border: \`1px solid \${RG.border}\`, background: currentPage === 1 ? "transparent" : "#fff", color: currentPage === 1 ? RG.textMuted : RG.text, cursor: currentPage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: \`1px solid \${p === currentPage ? RG.primary : RG.border}\`, background: p === currentPage ? RG.primary : "#fff", color: p === currentPage ? "#fff" : RG.text, cursor: "pointer", fontWeight: p === currentPage ? 700 : 400, fontSize: 13 }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ width: 32, height: 32, borderRadius: 6, border: \`1px solid \${RG.border}\`, background: currentPage === totalPages ? "transparent" : "#fff", color: currentPage === totalPages ? RG.textMuted : RG.text, cursor: currentPage === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}`;

const newPagination = `            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: \`1px solid \${RG.border}\`, background: RG.surface }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    style={{ padding: "6px 14px", borderRadius: 6, border: \`1px solid \${RG.border}\`, background: currentPage === 1 ? RG.background : RG.surface, color: currentPage === 1 ? RG.textMuted : RG.text, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                  >
                    ก่อนหน้า
                  </button>
                  <span style={{ fontSize: 13, color: RG.text, fontWeight: 600 }}>หน้า {currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    style={{ padding: "6px 14px", borderRadius: 6, border: \`1px solid \${RG.border}\`, background: currentPage === totalPages ? RG.background : RG.surface, color: currentPage === totalPages ? RG.textMuted : RG.text, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}`;

if (content.includes("Array.from({ length: totalPages }")) {
  fs.writeFileSync(file, content.replace(oldPagination, newPagination));
  console.log("FollowupHistoryPage pagination patched!");
} else {
  console.log("Pagination not found or already changed");
}
