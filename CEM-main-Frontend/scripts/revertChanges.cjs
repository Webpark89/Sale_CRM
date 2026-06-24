const fs = require("fs");

const appFile = "D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx";
let appCode = fs.readFileSync(appFile, "utf8");

// Remove ErrorBoundary class
appCode = appCode.replace(/class ErrorBoundary extends React\.Component \{[\s\S]*?\}\s*/, '');

// Revert state variables
appCode = appCode.replace('const [activeTab, setActiveTab] = useState("all");\n  const [showMasterModal, setShowMasterModal] = useState(false);\n  const [masterPassword, setMasterPassword] = useState("");\n  const [masterLeads, setMasterLeads] = useState(null);', 'const [activeTab, setActiveTab] = useState("all");');

// Revert loadMasterLeads function
appCode = appCode.replace(/  const loadMasterLeads = async \(\) => \{[\s\S]*?  \};\n/, '');

// Revert fetchMasterLeads import
appCode = appCode.replace('  fetchMasterLeads,\n', '');

// Revert All Leads Report button and Modal
appCode = appCode.replace(/<Btn variant="primary" onClick=\{.*?\} style=\{.*?\}\>📊 All Leads Report<\/Btn>\s*/, '');
appCode = appCode.replace(/\{\/\* Modal สำหรับกรอกรหัสผ่านเพื่อดู Report รวม \*\/\}([\s\S]*?)<\/Modal>\s*\)}/, '');

// Revert the Reports component call
appCode = appCode.replace(
  '<ErrorBoundary><Reports leads={masterLeads || leads} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setPage("leads"); }} onViewLead={setSelectedLead} /></ErrorBoundary>',
  '<Reports leads={leads} onViewLead={setSelectedLead} />'
);

appCode = appCode.replace(
  '<Reports leads={masterLeads || leads} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setPage("leads"); }} onViewLead={setSelectedLead} />',
  '<Reports leads={leads} onViewLead={setSelectedLead} />'
);

// Write back
fs.writeFileSync(appFile, appCode);
console.log("Reverted App.jsx");

const apiFile = "D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/services/apiService.js";
let apiCode = fs.readFileSync(apiFile, "utf8");
apiCode = apiCode.replace(/export const fetchMasterLeads = async \(password\) => \{[\s\S]*?\};\n\n/, '');
fs.writeFileSync(apiFile, apiCode);
console.log("Reverted apiService.js");

const statusFile = "D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/constants/status.js";
let statusCode = fs.readFileSync(statusFile, "utf8");
statusCode = statusCode.replace('มีตติ้ง: "#FFA500"', 'มีตติ้ง: "#FFC107"');
fs.writeFileSync(statusFile, statusCode);
console.log("Reverted status.js");

