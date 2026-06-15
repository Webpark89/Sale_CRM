import { RG } from "../../constants/theme";

export const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${RG.border}`,
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
  color: RG.text,
  fontFamily: "'Sarabun', sans-serif",
};

export const selectStyle = {
  ...inputStyle,
  background: "#fff",
};