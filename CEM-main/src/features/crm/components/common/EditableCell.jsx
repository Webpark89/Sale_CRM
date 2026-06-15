import React from "react";
import { useState } from "react";
import { RG } from "../../constants/theme";
import { fmtNum } from "../../utils/helpers";
import { inputStyle, selectStyle } from "./styles";

export default function EditableCell({ value, onSave, type = "text", options }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const commit = () => {
    onSave(val);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: "pointer", display: "block", minWidth: 40, padding: "2px 4px", borderRadius: 4, color: RG.text, fontSize: 13 }} title="คลิกเพื่อแก้ไข">
        {type === "number" ? fmtNum(val) : val || "—"}
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

  return <input type={type === "number" ? "number" : "text"} value={val} onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()} autoFocus style={{ ...inputStyle, padding: "2px 6px", fontSize: 13, width: "auto" }} />;
}