import React, { useState } from "react";
import { RG } from "../../constants/theme";

export default function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!user || !pass) {
      setErr("กรุณากรอก Username และ Password ให้ครบถ้วน");
      return;
    }

    setErr("");
    setIsLoading(true);

    // จำลองเวลาโหลด 0.6 วินาทีเพื่อให้ดูสมจริง
    setTimeout(() => {
      if (user === "crm" && pass === "1234") {
        localStorage.setItem("crm_session", "authenticated");
        onLogin();
      } else {
        setErr("Username หรือ Password ไม่ถูกต้อง");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: RG.gradientSoft || "#fdf9fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sarabun', sans-serif" }}>
      {/* ฝัง CSS สำหรับ Animation และ Focus State */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-card {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .input-group {
          display: flex;
          align-items: center;
          border: 1px solid ${RG.border || "#e2d8dc"};
          border-radius: 10px;
          background: #fff;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .input-group:focus-within {
          border-color: ${RG.primary || "#d6406e"};
          box-shadow: 0 0 0 3px rgba(214, 64, 110, 0.15);
        }
        .input-field {
          flex: 1;
          border: none;
          outline: none;
          padding: 12px 14px 12px 0;
          font-size: 14px;
          color: ${RG.text || "#333"};
          font-family: 'Sarabun', sans-serif;
        }
        .btn-submit {
          transition: transform 0.1s, filter 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          filter: brightness(1.05);
        }
        .btn-submit:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>

      <div className="login-card" style={{ background: RG.surface || "#fff", borderRadius: 24, boxShadow: "0 20px 40px rgba(192,132,151,0.15)", padding: "48px 40px", width: 380, border: `1px solid ${RG.border || "#e2d8dc"}` }}>
        
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, background: RG.gradient || "linear-gradient(135deg, #d6406e 0%, #a42c54 100%)", borderRadius: 20, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(214, 64, 110, 0.25)" }}>
            <span style={{ fontSize: 32, color: "#fff", fontWeight: 700 }}>Q</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: RG.text || "#333", letterSpacing: "-0.5px" }}>QoraQot CRM</h1>
          <p style={{ margin: "6px 0 0", color: RG.textMuted || "#777", fontSize: 14 }}>ระบบจัดการลีดและการขายครบวงจร</p>
        </div>

        {/* Username Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: RG.textMuted || "#777", marginBottom: 8 }}>ชื่อผู้ใช้งาน (Username)</label>
          <div className="input-group">
            <div style={{ padding: "0 14px", color: "#aaa", display: "flex" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <input 
              className="input-field"
              value={user} 
              onChange={e => setUser(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleLogin()} 
              placeholder="admin หรือ crm" 
            />
          </div>
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: RG.textMuted || "#777", marginBottom: 8 }}>รหัสผ่าน (Password)</label>
          <div className="input-group">
            <div style={{ padding: "0 14px", color: "#aaa", display: "flex" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <input 
              className="input-field"
              type={showPass ? "text" : "password"} 
              value={pass} 
              onChange={e => setPass(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleLogin()} 
              placeholder="••••••••" 
            />
            {/* Toggle Show/Hide Password */}
            <button 
              onClick={() => setShowPass(!showPass)} 
              type="button"
              style={{ background: "none", border: "none", padding: "0 14px", color: showPass ? (RG.primary || "#d6406e") : "#aaa", cursor: "pointer", display: "flex", outline: "none" }}
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message Box */}
        {err && (
          <div style={{ background: "#fdf2f2", borderLeft: `4px solid ${RG.danger || "#e74c3c"}`, padding: "10px 14px", borderRadius: "0 8px 8px 0", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={RG.danger || "#e74c3c"} strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span style={{ color: RG.danger || "#e74c3c", fontSize: 13, fontWeight: 500 }}>{err}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          className="btn-submit"
          onClick={handleLogin} 
          disabled={isLoading}
          style={{ 
            width: "100%", 
            padding: "14px", 
            borderRadius: 10, 
            background: isLoading ? "#ccc" : (RG.gradient || "linear-gradient(135deg, #d6406e 0%, #a42c54 100%)"), 
            border: "none", 
            color: "#fff", 
            fontWeight: 600, 
            fontSize: 15, 
            cursor: isLoading ? "not-allowed" : "pointer", 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: isLoading ? "none" : "0 4px 12px rgba(214, 64, 110, 0.3)",
            fontFamily: "'Sarabun', sans-serif"
          }}
        >
          {isLoading ? (
            <>
              <svg style={{ animation: "spin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
              กำลังตรวจสอบ...
            </>
          ) : "เข้าสู่ระบบ"}
        </button>

        {/* Footer info */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>กรณีลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    </div>
  );
}