const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', 'utf8');

if (!code.includes('const [showMasterModal')) {
  code = code.replace('const [activeTab, setActiveTab] = useState("all");', 
    'const [activeTab, setActiveTab] = useState("all");\n  const [showMasterModal, setShowMasterModal] = useState(false);\n  const [masterPassword, setMasterPassword] = useState("");\n  const [masterLeads, setMasterLeads] = useState(null);');
}

if (!code.includes('loadMasterLeads')) {
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
      setActiveTab("report"); 
    } catch(e) {
      alert(e.message);
    }
  };

  const loadData = useCallback(async () => {`;
  
  code = code.replace('  const loadData = useCallback(async () => {', newApiStr);
}

if (!code.includes('isMaster={!!masterLeads}')) {
  code = code.replace('<Reports leads={leads}', '<Reports leads={masterLeads || leads} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setActiveTab("all"); }}');
}

if (!code.includes('กรอกรหัสผ่านเพื่อดู All Leads Report')) {
  const modalStr = `{showMasterModal && (
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
      
      {showAddModal && (`
  code = code.replace('{showAddModal && (', modalStr);
}

fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', code);
console.log('App.jsx fixed successfully!');
