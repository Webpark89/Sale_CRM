import React from "react";
import { STATUSES, STATUS_COLORS } from "../../constants/status";
import { RG } from "../../constants/theme";
import Modal from "../common/Modal";
import Btn from "../common/Btn";
import { inputStyle } from "../common/styles";
import { formatNumberWithCommas, parseNumberFromCommas } from "../../crmHelpers/helpers";

export default function FilterModal({ 
  onClose, 
  filterStatus, 
  setFilterStatus, 
  finFilters, 
  setFinFilters 
}) {
  const [localStatus, setLocalStatus] = React.useState([...filterStatus]);
  const [localFin, setLocalFin] = React.useState(finFilters);

  const toggleStatus = (s) => {
    setLocalStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleFinChange = (field, type, value) => {
    setLocalFin(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const handleApply = () => {
    setFilterStatus(localStatus);
    setFinFilters(localFin);
    onClose();
  };

  const handleClear = () => {
    setLocalStatus([]);
    setLocalFin({
      revenue: { min: "", max: "" },
      registeredCapital: { min: "", max: "" },
      profit: { min: "", max: "" }
    });
  };

  return (
    <Modal title="ตัวกรองขั้นสูง (Advanced Filters)" onClose={onClose} width={500}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Status Filter */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 12 }}>กรองตามสถานะ</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STATUSES.map(s => {
              const isActive = localStatus.includes(s);
              return (
                <button 
                  key={s} 
                  onClick={() => toggleStatus(s)} 
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: 20, 
                    border: `1.5px solid ${isActive ? STATUS_COLORS[s] : RG.border}`, 
                    background: isActive ? STATUS_COLORS[s] + "22" : "#fff", 
                    color: isActive ? STATUS_COLORS[s] : RG.textMuted, 
                    fontSize: 13, 
                    cursor: "pointer", 
                    fontWeight: isActive ? 700 : 400, 
                    fontFamily: "'Sarabun', sans-serif",
                    transition: "all 0.2s"
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Financial Filters */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 12 }}>กรองข้อมูลการเงิน</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 13, color: RG.textMuted }}>รายได้รวม:</div>
              <input 
                type="text" 
                placeholder="ขั้นต่ำ" 
                value={formatNumberWithCommas(localFin.revenue.min)} 
                onChange={e => handleFinChange("revenue", "min", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <span style={{ color: RG.textMuted }}>-</span>
              <input 
                type="text" 
                placeholder="สูงสุด" 
                value={formatNumberWithCommas(localFin.revenue.max)} 
                onChange={e => handleFinChange("revenue", "max", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 13, color: RG.textMuted }}>ทุนจดทะเบียน:</div>
              <input 
                type="text" 
                placeholder="ขั้นต่ำ" 
                value={formatNumberWithCommas(localFin.registeredCapital.min)} 
                onChange={e => handleFinChange("registeredCapital", "min", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <span style={{ color: RG.textMuted }}>-</span>
              <input 
                type="text" 
                placeholder="สูงสุด" 
                value={formatNumberWithCommas(localFin.registeredCapital.max)} 
                onChange={e => handleFinChange("registeredCapital", "max", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 13, color: RG.textMuted }}>กำไร:</div>
              <input 
                type="text" 
                placeholder="ขั้นต่ำ" 
                value={formatNumberWithCommas(localFin.profit.min)} 
                onChange={e => handleFinChange("profit", "min", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <span style={{ color: RG.textMuted }}>-</span>
              <input 
                type="text" 
                placeholder="สูงสุด" 
                value={formatNumberWithCommas(localFin.profit.max)} 
                onChange={e => handleFinChange("profit", "max", parseNumberFromCommas(e.target.value))} 
                style={{ ...inputStyle, flex: 1 }} 
              />
            </div>

          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <Btn variant="Secondary" onClick={handleClear}>ล้างตัวกรอง</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="Secondary" onClick={onClose}>ยกเลิก</Btn>
            <Btn onClick={handleApply}>นำไปใช้</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
