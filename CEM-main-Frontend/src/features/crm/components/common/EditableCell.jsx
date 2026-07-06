import React, { useState, useEffect } from "react";
import { RG } from "../../constants/theme";
import { fmtNum, parseDateTH, formatNumberWithCommas, parseNumberFromCommas, formatPhoneNumber } from "../../crmHelpers/helpers";
import { inputStyle, selectStyle } from "./styles";
import { STATUS_COLORS } from "../../constants/status";

export default function EditableCell({ value, onSave, type = "text", options }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const commit = () => {
    onSave(val);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span 
        onClick={() => setEditing(true)} 
        style={{ 
          cursor: "pointer", 
          display: "block", 
          minWidth: 40, 
          maxWidth: type === "text" ? 180 : "none",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "2px 4px", 
          borderRadius: 4, 
          color: STATUS_COLORS[val] ? STATUS_COLORS[val] : "#1f2937", 
          fontSize: 13,
          fontWeight: 500
        }} 
        title={val ? String(val) : "คลิกเพื่อแก้ไข"}
      >
        {type === "number" ? fmtNum(val) : type === "date" ? parseDateTH(val) : val || "—"}
      </span>
    );
  }

  if (type === "select") {
    return (
      <select value={val} onChange={e => setVal(e.target.value)} onBlur={commit} autoFocus style={{ ...selectStyle, padding: "2px 6px", fontSize: 13, width: "auto" }}>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (type === "date") {
    return <input type="date" value={val} onChange={e => setVal(e.target.value)} onBlur={commit} autoFocus style={{ ...inputStyle, padding: "2px 6px", fontSize: 13, width: "auto" }} />;
  }
  if (type === "phone") {
    return (
      <input 
        type="text" 
        value={formatPhoneNumber(val)} 
        onChange={e => setVal(formatPhoneNumber(e.target.value))} 
        onBlur={commit} 
        onKeyDown={e => e.key === "Enter" && commit()} 
        autoFocus 
        style={{ ...inputStyle, padding: "2px 6px", fontSize: 13, width: "auto" }} 
      />
    );
  }

  if (type === "number") {
    return (
      <input 
        type="text" 
        value={formatNumberWithCommas(val)} 
        onChange={e => setVal(parseNumberFromCommas(e.target.value))} 
        onBlur={commit} 
        onKeyDown={e => e.key === "Enter" && commit()} 
        autoFocus 
        style={{ ...inputStyle, padding: "2px 6px", fontSize: 13, width: "auto" }} 
      />
    );
  }

  return <input type="text" value={val} onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()} autoFocus style={{ ...inputStyle, padding: "2px 6px", fontSize: 13, width: "auto" }} />;
}