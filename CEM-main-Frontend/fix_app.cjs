const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Re-add AddLeadPage import
if (!content.includes('AddLeadPage')) {
  content = content.replace(/(import LeadsPage from "\.\/pages\/LeadsPage";)/, '$1\nimport AddLeadPage from "./pages/AddLeadPage";');
}

// 2. Re-add Route
const routeString = `        <Route path="/leads/create" element={
          <AddLeadPage 
            leads={leads} 
            addLead={addLead} 
            allSellers={allSellers} 
            fetchAllSellers={fetchAllSellers} 
            currentUser={currentUser} 
          />
        } />\n`;

if (!content.includes('path="/leads/create"')) {
  content = content.replace(/(<Route path="\/leads" element=\{)/, routeString + '        $1');
}

// 3. Fix addLead return value
content = content.replace(
  /notify\.error\(err\);\n\s*return;/,
  'notify.error(err);\n      return false;'
);

content = content.replace(
  /notify\.success\("สร้างลีดใหม่สำเร็จ"\);\n\s*\} catch \(e\) \{/,
  'notify.success("สร้างลีดใหม่สำเร็จ");\n      return true;\n    } catch (e) {'
);

content = content.replace(
  /notify\.error\(e\.response\?\.data\?\.error \|\| "บันทึกไม่สำเร็จ"\);\n\s*\}/,
  'notify.error(e.response?.data?.error || "บันทึกไม่สำเร็จ");\n      return false;\n    }'
);

fs.writeFileSync(appPath, content);
console.log('App.jsx fixed');
