import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RG } from "../../constants/theme";

export default function Sidebar({ isSidebarExpanded, setIsSidebarExpanded, navItems, page }) {
  const navigate = useNavigate();

  return (
    <aside 
      style={{ 
        width: isSidebarExpanded ? 240 : 80, 
        background: "rgba(2, 52, 54, 0.6)", // Glassmorphism Dark Teal
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: isSidebarExpanded ? "32px 20px" : "32px 10px", 
        display: "flex", 
        flexDirection: "column", 
        borderRight: `1px solid rgba(156, 234, 239, 0.2)`, 
        position: "fixed", 
        top: 0, 
        left: 0,
        height: "100vh", 
        zIndex: 110,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        style={{
          position: "absolute",
          top: "50%",
          marginTop: -16,
          right: -16,
          width: 32,
          height: 32,
          background: "#fff",
          border: `2px solid ${RG.primary}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: RG.primary,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 120,
          transition: "transform 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {isSidebarExpanded ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2 }}>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: -2 }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        )}
      </button>

      {/* Logo Section */}
      <div style={{ display: "flex", alignItems: "center", gap: isSidebarExpanded ? 12 : 0, justifyContent: isSidebarExpanded ? "flex-start" : "center", marginBottom: 48, transition: "all 0.3s" }}>
        <div style={{ minWidth: 42, width: 42, height: 42, background: "linear-gradient(135deg, #07BEB8, #68D8D6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#023436", fontSize: 22, boxShadow: "0 4px 15px rgba(104, 216, 214, 0.4)", textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}>S</div>
        <div style={{ display: "flex", flexDirection: "column", opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? "auto" : 0, overflow: "hidden", transition: "all 0.2s", whiteSpace: "nowrap" }}>
          <span style={{ color: "#fff", fontFamily: RG.fontHeading, fontWeight: 700, fontSize: 18, lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Sales CRM</span>
          <span style={{ color: RG.primaryLight, fontFamily: RG.fontBody, fontSize: 11, lineHeight: 1.2, fontWeight: 600 }}>System Management</span>
        </div>
      </div>

      {/* Menu Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {isSidebarExpanded && <div style={{ fontSize: 11, fontWeight: 700, fontFamily: RG.fontHeading, color: RG.primaryGhost, letterSpacing: 1, marginBottom: 8, paddingLeft: 20, textAlign: "left", opacity: isSidebarExpanded ? 1 : 0.5, transition: "all 0.3s" }}>MENU</div>}
        {navItems.map(n => (
          <button key={n.key} onClick={() => navigate("/" + n.key)} style={{ position: "relative", padding: isSidebarExpanded ? "14px 20px" : "14px 0", borderRadius: 12, border: "none", background: page === n.key ? "linear-gradient(195deg, #07BEB8, #037971)" : "transparent", color: page === n.key ? "#fff" : "rgba(255,255,255,0.8)", cursor: "pointer", fontWeight: page === n.key ? 600 : 400, fontSize: 15, fontFamily: RG.fontHeading, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: isSidebarExpanded ? "flex-start" : "center", gap: isSidebarExpanded ? 12 : 0, boxShadow: page === n.key ? "0 4px 20px 0 rgba(0, 0, 0, 0.14), 0 7px 10px -5px rgba(3, 181, 170, 0.4)" : "none", whiteSpace: "nowrap", marginBottom: 4 }}>
            {page === n.key && <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 4, height: 20, background: "#fff", borderRadius: "0 4px 4px 0" }} />}
            <span style={{ fontSize: 20, width: 24, display: "flex", justifyContent: "center", opacity: page === n.key ? 1 : 0.8 }}>{n.icon}</span> 
            <span style={{ opacity: isSidebarExpanded ? 1 : 0, width: isSidebarExpanded ? "auto" : 0, overflow: "hidden", transition: "all 0.2s" }}>{n.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
