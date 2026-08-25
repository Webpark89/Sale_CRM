const fs = require('fs');

let file = 'd:/Sale_CRM/CEM-main-Frontend/src/utils/exportHelpers.js';
let content = fs.readFileSync(file, 'utf8');

// Replace status counts to stage counts
content = content.replace(
  /const statusCounts = leads\.reduce\(\(acc, l\) => \{[\s\S]*?return acc;\n  \}, \{\}\);/,
  `const stageCounts = leads.reduce((acc, l) => {
    const stage = l.stage || "ไม่ระบุ";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});`
);

// Replace getStatusColor with getStageColor
content = content.replace(
  /const getStatusColor = \(status\) => \{[\s\S]*?\}\n  \};/,
  `const getStageColor = (stage) => {
    switch(stage) {
      case "Contact": return { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" };
      case "Meeting": return { bg: "#FEF3C7", border: "#F59E0B", text: "#B45309" };
      case "Proposal": return { bg: "#F3E8FF", border: "#8B5CF6", text: "#6D28D9" };
      case "Approval": return { bg: "#FCE7F3", border: "#EC4899", text: "#BE185D" };
      case "Closed": return { bg: "#D1FAE5", border: "#10B981", text: "#047857" };
      default: return { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };
    }
  };`
);

// Replace summaryHtml logic
content = content.replace(
  /const summaryHtml = Object\.entries\(statusCounts\)[\s\S]*?\}\)\.join\(''\);/,
  `const summaryHtml = Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([stage, count]) => {
      const colors = getStageColor(stage);
      return \`
      <div style="flex: 0 0 calc(33.333% - 10px); box-sizing: border-box; background: \${colors.bg} !important; border: 1px solid \${colors.border} !important; color: \${colors.text} !important; padding: 12px; border-radius: 8px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 4px;">\${stage}</div>
        <div style="font-size: 26px; font-weight: bold;">\${count} <span style="font-size: 14px; font-weight: normal;">ลีด</span></div>
      </div>
    \`}).join('');`
);

// Replace the title of summary
content = content.replace(
  /<div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px;">📊 สรุปยอดตามสถานะ:<\/div>/,
  `<div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px;">📊 สรุปยอดตาม Stage:</div>`
);

// Replace table headers
content = content.replace(
  /<tr><th colspan="11" style="height: 4\.2cm; border: none; padding: 0;"><\/th><\/tr>\s*<tr>\s*<th class="col-header text-center nowrap">ลำดับ<\/th>[\s\S]*?<th class="col-header nowrap">ผู้ดูแล<\/th>\s*<\/tr>/,
  `<tr><th colspan="10" style="height: 4.2cm; border: none; padding: 0;"></th></tr>
            <tr>
              <th class="col-header text-center nowrap">ลำดับ</th>
              <th class="col-header" style="max-width: 140px; white-space: normal;">บริษัท</th>
              <th class="col-header nowrap">ผู้ติดต่อ</th>
              <th class="col-header nowrap">เบอร์โทร</th>
              <th class="col-header text-right nowrap">มูลค่าโครงการ</th>
              <th class="col-header nowrap">Stage</th>
              <th class="col-header nowrap">สถานะล่าสุด</th>
              <th class="col-header text-center nowrap">ติดต่อล่าสุด</th>
              <th class="col-header text-center nowrap">นัดถัดไป</th>
              <th class="col-header nowrap">ผู้ดูแล</th>
            </tr>`
);

// Replace table rows
content = content.replace(
  /<tr>\s*<td class="text-center nowrap">\$\{index \+ 1\}<\/td>[\s\S]*?<td class="nowrap">\$\{l\.owner \|\| '-'\}<\/td>\s*<\/tr>/,
  `<tr>
                <td class="text-center nowrap">\${index + 1}</td>
                <td style="line-height: 1.4; max-width: 140px; white-space: normal; word-wrap: break-word;">\${l.companyName || '-'}</td>
                <td class="nowrap">\${l.contactName || '-'}</td>
                <td class="nowrap">\${l.contactPhone || '-'}</td>
                <td class="text-right nowrap">\${l.dealValue ? Number(l.dealValue).toLocaleString() : '-'}</td>
                <td class="nowrap">\${l.stage || '-'}</td>
                <td class="nowrap"><b>\${l.latestStatus || '-'}</b></td>
                <td class="text-center nowrap">\${formatDateShort(l.latestContactDate || l.updatedAt)}</td>
                <td class="text-center nowrap">\${formatDateShort(l.nextFollowupDate)}</td>
                <td class="nowrap">\${l.owner || '-'}</td>
              </tr>`
);

// Replace footer colspan
content = content.replace(
  /<tr><td colspan="11" style="height: 2cm; border: none; padding: 0;"><\/td><\/tr>/,
  `<tr><td colspan="10" style="height: 2cm; border: none; padding: 0;"></td></tr>`
);

fs.writeFileSync(file, content);
console.log('Export page patched');
