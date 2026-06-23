const fs = require("fs");
const file = "D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx";
let code = fs.readFileSync(file, "utf8");

const errorBoundaryCode = `
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "8px", margin: "20px" }}>
          <h2 style={{ color: "#b91c1c" }}>เกิดข้อผิดพลาดในการแสดงผล</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: "10px", borderRadius: "4px" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

if (!code.includes("class ErrorBoundary")) {
  // Insert before export default function App
  code = code.replace("export default function App() {", errorBoundaryCode + "\nexport default function App() {");
  
  // Wrap Reports with ErrorBoundary
  code = code.replace(
    '<Reports leads={masterLeads || leads} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setPage("leads"); }} onViewLead={setSelectedLead} />',
    '<ErrorBoundary><Reports leads={masterLeads || leads} isMaster={!!masterLeads} onExitMaster={() => { setMasterLeads(null); setPage("leads"); }} onViewLead={setSelectedLead} /></ErrorBoundary>'
  );
  
  fs.writeFileSync(file, code);
  console.log("ErrorBoundary injected.");
} else {
  console.log("ErrorBoundary already exists.");
}
