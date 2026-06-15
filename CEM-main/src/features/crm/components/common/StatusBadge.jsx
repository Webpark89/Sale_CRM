import React from "react";
import { STATUS_COLORS } from "../../constants/status";

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#999";
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: color + "22", color, fontSize: 12, fontWeight: 600, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}