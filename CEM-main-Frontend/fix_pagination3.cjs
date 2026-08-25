const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/FollowupHistoryPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Match everything between {/* Pagination */} and </div>\n        </div>\n\n        {/* Filter Modal */}
const regex = /\{\/\* Pagination \*\/\}.*?(?=<\/div>\s*<\/div>\s*\{\/\* Filter Modal \*\/\})/s;

const newPagination = `{/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: \`1px solid \${RG.border}\`, background: RG.surface }}>
                <div style={{ fontSize: 13, color: RG.textMuted }}>
                  แสดง {paginatedFollowups.length} รายการ จากทั้งหมด {filteredFollowups.length} รายการ
                </div>
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
            )}
          `;

if (regex.test(content)) {
  content = content.replace(regex, newPagination);
  fs.writeFileSync(file, content);
  console.log("Pagination replaced via regex!");
} else {
  console.log("Regex didn't match.");
}
