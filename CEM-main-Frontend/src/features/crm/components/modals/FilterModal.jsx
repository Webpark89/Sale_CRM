import React from "react";
import { STATUSES, STATUS_COLORS } from "../../constants/status";
import { RG } from "../../constants/theme";
import Modal from "../common/Modal";
import Btn from "../common/Btn";
import { inputStyle } from "../common/styles";
import { formatNumberWithCommas, parseNumberFromCommas } from "../../crmHelpers/helpers";

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", 
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", 
  "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", 
  "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", 
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", 
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

export default function FilterModal({ 
  onClose, 
  filterStatus, 
  setFilterStatus, 
  finFilters, 
  setFinFilters,
  dateFilters,
  setDateFilters,
  filterProvince,
  setFilterProvince
}) {
  const [localStatus, setLocalStatus] = React.useState([...filterStatus]);
  const [localFin, setLocalFin] = React.useState(finFilters);
  const [localProvince, setLocalProvince] = React.useState(Array.isArray(filterProvince) ? [...filterProvince] : []);
  const [localDate, setLocalDate] = React.useState(dateFilters || {
    latestContactDate: { min: "", max: "" },
    nextFollowupDate: { min: "", max: "" }
  });

  const toggleStatus = (s) => {
    setLocalStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleProvince = (p) => {
    setLocalProvince(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
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

  const getDateRangeByPreset = (preset) => {
    const d = new Date();
    const format = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    const todayStr = format(d);
    
    if (preset === "today") return { min: todayStr, max: todayStr };
    if (preset === "last6months") {
      const past = new Date(d.getFullYear(), d.getMonth() - 5, 1);
      return { min: format(past), max: todayStr };
    }
    if (preset === "thismonth") {
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
      return { min: format(firstDay), max: todayStr };
    }
    if (preset === "lastmonth") {
      const firstDay = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth(), 0);
      return { min: format(firstDay), max: format(lastDay) };
    }
    if (preset === "thisquarter") {
      const currentQuarter = Math.floor(d.getMonth() / 3);
      const firstDay = new Date(d.getFullYear(), currentQuarter * 3, 1);
      return { min: format(firstDay), max: todayStr };
    }
    if (preset === "lastquarter") {
      const currentQuarter = Math.floor(d.getMonth() / 3);
      const firstDay = new Date(d.getFullYear(), currentQuarter * 3 - 3, 1);
      const lastDay = new Date(d.getFullYear(), currentQuarter * 3, 0);
      return { min: format(firstDay), max: format(lastDay) };
    }
    if (preset === "thisyear") {
      const firstDay = new Date(d.getFullYear(), 0, 1);
      return { min: format(firstDay), max: todayStr };
    }
    return { min: "", max: "" };
  };

  const handleDatePreset = (field, preset) => {
    const range = getDateRangeByPreset(preset);
    setLocalDate(prev => ({
      ...prev,
      [field]: { ...range, type: preset }
    }));
  };

  const handleDateChange = (field, type, value) => {
    setLocalDate(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value,
        type: "custom"
      }
    }));
  };

  const handleApply = () => {
    setFilterStatus(localStatus);
    setFinFilters(localFin);
    if (setDateFilters) setDateFilters(localDate);
    if (setFilterProvince) setFilterProvince(localProvince);
    onClose();
  };

  const handleClear = () => {
    setLocalStatus([]);
    setLocalProvince([]);
    setLocalFin({
      revenue: { min: "", max: "" },
      registeredCapital: { min: "", max: "" },
      profit: { min: "", max: "" }
    });
    setLocalDate({
      latestContactDate: { min: "", max: "", type: "all" },
      nextFollowupDate: { min: "", max: "", type: "all" }
    });
  };

  const renderDateField = (label, field) => {
    const val = localDate[field] || { min: "", max: "", type: "all" };
    const currentType = val.type || "all";
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 120, fontSize: 13, color: RG.textMuted }}>{label}:</div>
          <select 
            value={currentType}
            onChange={(e) => handleDatePreset(field, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="today">วันนี้</option>
            <option value="thismonth">เดือนนี้</option>
            <option value="lastmonth">เดือนที่แล้ว</option>
            <option value="thisquarter">ไตรมาสนี้</option>
            <option value="lastquarter">ไตรมาสที่แล้ว</option>
            <option value="last6months">6 เดือนล่าสุด</option>
            <option value="thisyear">ปีนี้</option>
            <option value="all">ทั้งหมด (ไม่กรอง)</option>
            <option value="custom">กำหนดช่วงเวลาแทน</option>
          </select>
        </div>
        
        {currentType === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 132 }}>
            <input 
              type="date" 
              value={val.min || ""} 
              onChange={e => handleDateChange(field, "min", e.target.value)} 
              style={{ ...inputStyle, flex: 1 }} 
            />
            <span style={{ color: RG.textMuted }}>-</span>
            <input 
              type="date" 
              value={val.max || ""} 
              onChange={e => handleDateChange(field, "max", e.target.value)} 
              style={{ ...inputStyle, flex: 1 }} 
            />
          </div>
        )}
      </div>
    );
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

        {/* Province Filter */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 12 }}>กรองตามจังหวัด</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !localProvince.includes(e.target.value)) {
                  setLocalProvince([...localProvince, e.target.value]);
                }
              }}
              style={{ ...inputStyle, width: "100%" }}
            >
              <option value="">-- เลือกจังหวัด --</option>
              {PROVINCES.filter(p => !localProvince.includes(p)).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            
            {localProvince.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {localProvince.map(p => (
                  <div 
                    key={p} 
                    style={{ 
                      background: RG.primary + "15", 
                      color: RG.primary, 
                      padding: "4px 10px", 
                      borderRadius: 12, 
                      fontSize: 12, 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6,
                      fontWeight: 600
                    }}
                  >
                    {p}
                    <span 
                      onClick={() => toggleProvince(p)}
                      style={{ cursor: "pointer", opacity: 0.6 }}
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
            )}
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

        {/* Date Filters */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 12 }}>กรองข้อมูลวันที่</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {renderDateField("ติดต่อล่าสุด", "latestContactDate")}
            {renderDateField("นัดถัดไป", "nextFollowupDate")}
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
