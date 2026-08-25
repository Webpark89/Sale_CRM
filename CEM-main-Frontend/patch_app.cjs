const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// Add import
const importStatement = 'import AddLeadPage from "./pages/AddLeadPage";\n';
if (!content.includes('AddLeadPage')) {
  content = content.replace(/(import LeadsPage from "\.\/pages\/LeadsPage";)/, '$1\n' + importStatement);
}

// Add route
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
  // Insert before the generic /leads route
  content = content.replace(/(<Route path="\/leads" element=\{)/, routeString + '        $1');
}

fs.writeFileSync(appPath, content);
console.log('App.jsx updated');
