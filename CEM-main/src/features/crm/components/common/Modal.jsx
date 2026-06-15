import React from "react";
import { RG } from "../../constants/theme";

export default function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(60,20,30,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: RG.surface, borderRadius: 16, boxShadow: "0 12px 60px rgba(192,132,151,0.25)", width: wide ? 760 : 520, maxWidth: "96vw", maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${RG.border}` }}>
        <div style={{ padding: "16px 24px", background: RG.gradient, borderRadius: "16px 16px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}