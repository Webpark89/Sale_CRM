import React from "react";
import { RG } from "../../constants/theme";

export default function Btn({ onClick, children, variant = "primary", small, style: sx, disabled }) {
  const base = {
    padding: small ? "6px 14px" : "8px 18px",
    borderRadius: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 14,
    fontWeight: 600,
    transition: "opacity .15s",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "'Sarabun', sans-serif",
    ...sx,
  };

  const styles = {
    primary: { background: RG.gradient, color: "#fff" },
    secondary: { background: "#f5e6ea", color: RG.primary, border: `1px solid ${RG.border}` },
    danger: { background: "#ffecec", color: RG.danger, border: "1px solid #ffcccc" },
    success: { background: "#e8f7ef", color: RG.success, border: "1px solid #b2e4cb" },
  };

  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>
      {children}
    </button>
  );
}