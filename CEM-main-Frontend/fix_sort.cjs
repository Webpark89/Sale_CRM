const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const oldSort = `      } else {
        // ตั้งค่า Default 
        const weightA = PRIORITY_WEIGHT[a.stage] || 0;
        const weightB = PRIORITY_WEIGHT[b.stage] || 0;
        if (weightB !== weightA) return weightB - weightA;
        const dateA = new Date(a.latestContactDate || 0).getTime();
        const dateB = new Date(b.latestContactDate || 0).getTime();
        return dateB - dateA;
      }`;

const newSort = `      } else {
        // ตั้งค่า Default ใหม่: เรียงตามเวลาที่สร้าง (ใหม่สุดขึ้นก่อน)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      }`;

if (content.includes("PRIORITY_WEIGHT[a.stage]")) {
    content = content.replace(/      \} else \{\r?\n\s*\/\/.*?\r?\n\s*const weightA = PRIORITY_WEIGHT\[a\.stage\] \|\| 0;\r?\n\s*const weightB = PRIORITY_WEIGHT\[b\.stage\] \|\| 0;\r?\n\s*if \(weightB !== weightA\) return weightB - weightA;\r?\n\s*const dateA = new Date\(a\.latestContactDate \|\| 0\)\.getTime\(\);\r?\n\s*const dateB = new Date\(b\.latestContactDate \|\| 0\)\.getTime\(\);\r?\n\s*return dateB - dateA;\r?\n\s*\}/, newSort);
    fs.writeFileSync(appPath, content);
    console.log('App.jsx default sort fixed');
} else {
    console.log('Could not find the block to replace');
}
