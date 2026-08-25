const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `              {/* Status Filter */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองตามสถานะ (Status)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(localStatus.length > 0 ? [...new Set(localStatus.reduce((acc, stage) => [...acc, ...(STAGE_STATUS_MAP[stage] || [])], []))] : ALL_STATUSES).map(s => {
                    const isActive = localLatestStatus.includes(s);
                    const sColor = STATUS_COLORS[s] || RG.textMuted;
                    return (
                      <button 
                        key={s} 
                        onClick={() => toggleLatestStatus(s)} 
                        style={{ 
                          padding: "4px 9px", 
                          borderRadius: 20, 
                          border: \`1.5px solid \${isActive ? RG.border : RG.border}\`, 
                          background: isActive ? "#F1F5F9" : RG.surface, 
                          color: isActive ? RG.text : RG.textMuted, 
                          fontSize: 11, 
                          cursor: "pointer", 
                          fontWeight: isActive ? 700 : 400, 
                          fontFamily: "'Sarabun', sans-serif",
                          transition: "all 0.15s"
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>`;

const newBlock = `              {/* Status Filter */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองตามสถานะ (Status)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(localStatus.length > 0 ? localStatus : STAGES).map(stage => (
                    <div key={stage}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: STAGE_COLORS[stage] || RG.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                        {stage}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(STAGE_STATUS_MAP[stage] || []).map(s => {
                          const isActive = localLatestStatus.includes(s);
                          return (
                            <button 
                              key={s} 
                              onClick={() => toggleLatestStatus(s)} 
                              style={{ 
                                padding: "4px 9px", 
                                borderRadius: 20, 
                                border: \`1.5px solid \${isActive ? RG.border : RG.border}\`, 
                                background: isActive ? "#F1F5F9" : RG.surface, 
                                color: isActive ? RG.text : RG.textMuted, 
                                fontSize: 11, 
                                cursor: "pointer", 
                                fontWeight: isActive ? 700 : 400, 
                                fontFamily: "'Sarabun', sans-serif",
                                transition: "all 0.15s"
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>`;

if (content.includes("{(localStatus.length > 0 ? [...new Set(localStatus.reduce")) {
  fs.writeFileSync(file, content.replace(oldBlock, newBlock));
  console.log("FilterModal patched for grouped status");
} else {
  console.log("Could not find block in FilterModal");
}
