import React from "react";
import { RG } from "../../constants/theme";

export default function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: RG.textMuted, marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}