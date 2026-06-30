import React from "react";
import { STATUS_COLORS } from "../../constants/status";

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#999";
  return (
    <span style={{ display: "inline-block", width: 90, textAlign: "center", padding: "2px 0", borderRadius: 20, background: color, color: "#FFFFFF", fontSize: 12, fontWeight: 700, border: `1px solid ${color}`, whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
      {status}
    </span>
  );
}