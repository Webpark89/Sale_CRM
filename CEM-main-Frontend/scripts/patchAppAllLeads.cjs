const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', 'utf8');

// 1. Add states
const stateStr = `  const [activeTab, setActiveTab] = useState("all");`;
const newStateStr = `  const [activeTab, setActiveTab] = useState("all");
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [masterLeads, setMasterLeads] = useState(null);`;

code = code.replace(stateStr, newStateStr);

// 2. Add API call function
const apiStr = `  const loadData = async () => {`;
const newApiStr = `  const loadMasterLeads = async () => {
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
      setActiveTab("report"); // ไปหน้ารายงานทันที
    } catch(e) {
      alert(e.message);
    }
  };

  const loadData = async () => {`;

code = code.replace(apiStr, newApiStr);

// 3. Update Reports prop
const repStr = `<Reports leads={leads} followups={followups} onViewLead={lead => { setSelectedLead(lead); }} />`;
const newRepStr = `<Reports leads={masterLeads || leads} followups={followups} onViewLead={lead => { setSelectedLead(lead); }} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setActiveTab("all"); }} />`;
code = code.replace(repStr, newRepStr);

// 4. Add the Master Modal JSX
const modalInsertStr = `{showAddModal && (`;
const newModalInsertStr = `{showMasterModal && (
        <Modal title="กรอกรหัสผ่านเพื่อดู All Leads Report" onClose={() => setShowMasterModal(false)}>
          <div style={{ padding: "10px 0" }}>
            <label style={{ display: "block", marginBottom: 8, color: RG.textMuted, fontSize: 13 }}>รหัสกลาง (Central Password)</label>
            <input 
              type="password" 
              value={masterPassword} 
              onChange={e => setMasterPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น admin123)"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: \`1px solid \${RG.border}\`, fontSize: 14 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <Btn variant="outline" onClick={() => setShowMasterModal(false)}>ยกเลิก</Btn>
            <Btn variant="primary" onClick={loadMasterLeads}>เข้าสู่หน้ารวมข้อมูล</Btn>
          </div>
        </Modal>
      )}
      
      {showAddModal && (`;
code = code.replace(modalInsertStr, newModalInsertStr);

// 5. Add Button to header
const btnInsertStr = `<Btn onClick={() => setActiveTab("dashboard")}>ภาพรวม</Btn>`;
const newBtnInsertStr = `<Btn variant="primary" onClick={() => setShowMasterModal(true)} style={{ background: "#f59e0b", borderColor: "#f59e0b" }}>📊 All Leads Report</Btn>
        <Btn onClick={() => setActiveTab("dashboard")}>ภาพรวม</Btn>`;
code = code.replace(btnInsertStr, newBtnInsertStr);

fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', code);
console.log('App.jsx patched for All Leads');
