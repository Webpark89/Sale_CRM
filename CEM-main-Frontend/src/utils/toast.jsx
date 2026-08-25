import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const notify = {
  success: (title, description = "") => {
    sonnerToast.custom((t) => (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px",
        padding: "14px 18px",
        boxShadow: "0 10px 25px -5px rgba(22, 163, 74, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        fontFamily: "'Sarabun', sans-serif", minWidth: 310
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#dcfce7",
          border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#16a34a", flexShrink: 0
        }}>
          <CheckCircle2 size={20} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#14532d", marginBottom: description ? 2 : 0, whiteSpace: "nowrap" }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: "#166534" }}>{description}</div>
          )}
        </div>
        <button onClick={() => sonnerToast.dismiss(t)} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.7 }}>✕</button>
      </div>
    ), { duration: 4000 });
  },

  error: (title, description = "") => {
    sonnerToast.custom((t) => (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
        padding: "14px 18px",
        boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        fontFamily: "'Sarabun', sans-serif", minWidth: 310
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#fee2e2",
          border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#dc2626", flexShrink: 0
        }}>
          <XCircle size={20} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#7f1d1d", marginBottom: description ? 2 : 0, whiteSpace: "nowrap" }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: "#991b1b" }}>{description}</div>
          )}
        </div>
        <button onClick={() => sonnerToast.dismiss(t)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.7 }}>✕</button>
      </div>
    ), { duration: 5000 });
  },

  info: (title, description = "") => {
    sonnerToast.custom((t) => (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px",
        padding: "14px 18px",
        boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        fontFamily: "'Sarabun', sans-serif", minWidth: 310
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#e0f2fe",
          border: "1px solid #7dd3fc", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#0284c7", flexShrink: 0
        }}>
          <Info size={20} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0c4a6e", marginBottom: description ? 2 : 0, whiteSpace: "nowrap" }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: "#075985" }}>{description}</div>
          )}
        </div>
        <button onClick={() => sonnerToast.dismiss(t)} style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.7 }}>✕</button>
      </div>
    ), { duration: 4000 });
  }
};

export default notify;
