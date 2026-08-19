import React from "react";
import { STATUS_COLORS } from "../../constants/status";

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#999999";
  return (
    <span style={{ 
      display: "inline-block", 
      width: 100, 
      textAlign: "center", 
      padding: "3px 8px", 
      borderRadius: 12, 
      background: `${color}22`, 
      color: color, 
      fontSize: 11, 
      fontWeight: 700, 
      border: `1px solid ${color}44`, 
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    }}>
      {status}
    </span>
  );
}