const fs = require('fs');
const path = require('path');

const srcDir = 'd:\\Sale_CRM\\CEM-main-Frontend\\src\\features\\crm';

const simpleReplacements = [
  { r: /"#fff"/g, v: "RG.surface" },
  { r: /"#ffffff"/g, v: "RG.surface" },
  { r: /'#fff'/g, v: "RG.surface" },
  { r: /'#ffffff'/g, v: "RG.surface" },
  
  { r: /"#f8f9fa"/g, v: "RG.background" },
  { r: /"#f1f5f9"/g, v: "RG.background" },
  { r: /"#f3f4f6"/g, v: "RG.background" },
  { r: /'#f3f4f6'/g, v: "RG.background" },
  { r: /"#f8fafc"/g, v: "RG.background" },
  
  { r: /"#333"/g, v: "RG.text" },
  { r: /"#1e293b"/g, v: "RG.text" },
  { r: /'#1e293b'/g, v: "RG.text" },
  { r: /"#374151"/g, v: "RG.text" },
  { r: /'#374151'/g, v: "RG.text" },
  { r: /"#1f2937"/g, v: "RG.text" },
  
  { r: /"#666"/g, v: "RG.textMuted" },
  { r: /"#777"/g, v: "RG.textMuted" },
  { r: /"#aaa"/g, v: "RG.textMuted" },
  { r: /"#64748b"/g, v: "RG.textMuted" },
  { r: /'#64748b'/g, v: "RG.textMuted" },
  { r: /"#94a3b8"/g, v: "RG.textMuted" },
  { r: /'#94a3b8'/g, v: "RG.textMuted" },
  { r: /"#9ca3af"/g, v: "RG.textMuted" },
  { r: /"#4b5563"/g, v: "RG.textMuted" },
  
  { r: /"#03B5AA"/g, v: "RG.primary" },
  { r: /"#0fa9a8"/g, v: "RG.primary" },
  { r: /'#0fa9a8'/g, v: "RG.primary" },
  { r: /"#6366f1"/g, v: "RG.primary" },
  { r: /'#6366f1'/g, v: "RG.primary" },
  { r: /"#0ea5e9"/g, v: "RG.primary" },
  { r: /"#0369a1"/g, v: "RG.primary" },
  
  { r: /"#0f766e"/g, v: "RG.primaryMid" },
  { r: /"#14b8a6"/g, v: "RG.primaryLight" },
  
  { r: /"#8b5cf6"/g, v: "RG.warn" },
  { r: /"#f59e0b"/g, v: "RG.warn" },
  { r: /"#f97316"/g, v: "RG.warn" },
  
  { r: /"#fca5a5"/g, v: "RG.danger" },
  { r: /"#b91c1c"/g, v: "RG.danger" },
  { r: /"#e74c3c"/g, v: "RG.danger" },
  { r: /"#dc2626"/g, v: "RG.danger" },
  { r: /"#ef4444"/g, v: "RG.danger" },
  
  { r: /"#22c55e"/g, v: "RG.success" },
  { r: /"#15803d"/g, v: "RG.success" },
  { r: /"#10B981"/g, v: "RG.success" },
  
  // Advanced template strings inside styles
  { r: /border:\s*"1px solid #ccc"/g, v: "border: `1px solid ${RG.border}`" },
  { r: /border:\s*"1px solid #eee"/g, v: "border: `1px solid ${RG.border}`" },
  { r: /border:\s*"1px solid #e2e8f0"/g, v: "border: `1px solid ${RG.border}`" },
  { r: /border:\s*"1px solid #e5e7eb"/g, v: "border: `1px solid ${RG.border}`" },
  { r: /border:\s*'1px solid #d1d5db'/g, v: "border: `1px solid ${RG.border}`" },
  { r: /border:\s*"1px solid #d1d5db"/g, v: "border: `1px solid ${RG.border}`" },
  
  { r: /borderTop:\s*"1px solid #e2e8f0"/g, v: "borderTop: `1px solid ${RG.border}`" },
  { r: /borderBottom:\s*"1px solid #e2e8f0"/g, v: "borderBottom: `1px solid ${RG.border}`" },
  { r: /borderBottom:\s*"1px solid #eee"/g, v: "borderBottom: `1px solid ${RG.border}`" },
  { r: /borderBottom:\s*"1px solid #cbd5e1"/g, v: "borderBottom: `1px solid ${RG.border}`" },
  { r: /borderTop:\s*"1px solid #e5e7eb"/g, v: "borderTop: `1px solid ${RG.border}`" },
  { r: /borderBottom:\s*"1px solid #e5e7eb"/g, v: "borderBottom: `1px solid ${RG.border}`" },
  
  { r: /"#ccc"/g, v: "RG.border" },
  { r: /"#eee"/g, v: "RG.border" },
  { r: /"#e2e8f0"/g, v: "RG.border" },
  { r: /"#e5e7eb"/g, v: "RG.border" },
  { r: /"#d1d5db"/g, v: "RG.border" },
  { r: /"#cbd5e1"/g, v: "RG.border" }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      // Exclude theme.js
      if (file === 'theme.js') continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const rep of simpleReplacements) {
        content = content.replace(rep.r, rep.v);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated: " + fullPath);
      }
    }
  }
}

processDir(srcDir);
console.log("Done");
