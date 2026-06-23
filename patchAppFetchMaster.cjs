const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', 'utf8');

// Update imports
if (!code.includes('fetchMasterLeads')) {
  code = code.replace('fetchLeads,', 'fetchLeads,\n  fetchMasterLeads,');
}

// Update loadMasterLeads
const oldLoadMaster = `  const loadMasterLeads = async () => {
    try {
      const res = await fetch("/api/leads/all", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ password: masterPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "รหัสผ่านไม่ถูกต้อง");
      setMasterLeads(data);
      setShowMasterModal(false);
      setMasterPassword("");
      setPage("reports"); 
    } catch(e) {
      alert(e.message);
    }
  };`;

const newLoadMaster = `  const loadMasterLeads = async () => {
    try {
      const data = await fetchMasterLeads(masterPassword);
      setMasterLeads(data);
      setShowMasterModal(false);
      setMasterPassword("");
      setPage("reports"); 
    } catch(e) {
      alert(e.response?.data?.error || "รหัสผ่านไม่ถูกต้อง");
    }
  };`;

code = code.replace(oldLoadMaster, newLoadMaster);

// Update placeholder password
code = code.replace('placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น admin123)"', 'placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น 123456)"');

fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', code);
console.log('App.jsx updated with fetchMasterLeads and 123456');
