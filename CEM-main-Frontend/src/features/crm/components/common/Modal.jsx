import React, { useState } from "react";
import { RG } from "../../constants/theme";

export default function Modal({ title, onClose, children, wide, width }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Wait for the close animation to finish
  };

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modalPopOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(10px); }
        }
      `}</style>
      <div 
        style={{ position: "fixed", inset: 0, background: "rgba(60,20,30,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: isClosing ? "modalFadeOut 0.2s ease-in forwards" : "modalFadeIn 0.2s ease-out" }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div style={{ background: RG.surface, borderRadius: 8, boxShadow: RG.shadowGlow, width: width || (wide ? 760 : 520), maxWidth: "96vw", maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${RG.border}`, animation: isClosing ? "modalPopOut 0.2s ease-in forwards" : "modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ padding: "16px 24px", background: RG.primary, borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, color: RG.surface, fontSize: 16, fontWeight: 700 }}>{title}</h3>
            <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: RG.surface, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
        </div>
      </div>
    </>
  );
}