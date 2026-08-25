import React from "react";
import { STAGES, STAGE_COLORS, ALL_STATUSES, STATUS_COLORS, STAGE_STATUS_MAP } from "../../constants/status";
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
  filterLatestStatus,
  setFilterLatestStatus,
  finFilters, 
  setFinFilters,
  dateFilters,
  setDateFilters,
  filterProvince,
  setFilterProvince
}) {
  const [localStatus, setLocalStatus] = React.useState([...filterStatus]);
  const [localLatestStatus, setLocalLatestStatus] = React.useState(Array.isArray(filterLatestStatus) ? [...filterLatestStatus] : []);
  const [localFin, setLocalFin] = React.useState(finFilters);
  const [localProvince, setLocalProvince] = React.useState(Array.isArray(filterProvince) ? [...filterProvince] : []);
  const [localDate, setLocalDate] = React.useState(dateFilters || {
    latestContactDate: { min: "", max: "" },
    nextFollowupDate: { min: "", max: "" }
  });

  const toggleStatus = (s) => {
    setLocalStatus(prev => {
      const nextStages = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s];
      setLocalLatestStatus(prevStatuses => {
        const allowedStatuses = nextStages.length > 0 
          ? nextStages.reduce((acc, stage) => [...acc, ...(STAGE_STATUS_MAP[stage] || [])], [])
          : ALL_STATUSES;
        return prevStatuses.filter(st => allowedStatuses.includes(st));
      });
      return nextStages;
    });
  };

  const toggleLatestStatus = (s) => {
    setLocalLatestStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
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
    if (setFilterLatestStatus) setFilterLatestStatus(localLatestStatus);
    setFinFilters(localFin);
    if (setDateFilters) setDateFilters(localDate);
    if (setFilterProvince) setFilterProvince(localProvince);
    onClose();
  };

  const handleClear = () => {
    setLocalStatus([]);
    setLocalLatestStatus([]);
    setLocalProvince([]);
    setLocalFin({
      revenue: { min: "", max: "" },
      registeredCapital: { min: "", max: "" },
      profit: { min: "", max: "" },
      dealValue: { min: "", max: "" }
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
    <Modal title="ตัวกรองขั้นสูง (Advanced Filters)" onClose={onClose} width={920}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Top Section: 2 Columns with Divider */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 24, alignItems: "start" }}>
          
          {/* Left Column: Stage, Status, Province */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stage Filter */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองตาม Stage</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", borderLeft: `2px solid ${RG.border}`, borderRight: `2px solid ${RG.border}`, padding: "0 8px" }}>
                {STAGES.map(s => {
                  const isActive = localStatus.includes(s);
                  return (
                    <button 
                      key={s} 
                      onClick={() => toggleStatus(s)} 
                      style={{ 
                        padding: "5px 12px", 
                        borderRadius: 20, 
                        border: `1.5px solid ${isActive ? STAGE_COLORS[s] : RG.border}`, 
                        background: isActive ? STAGE_COLORS[s] + "22" : RG.surface, 
                        color: isActive ? STAGE_COLORS[s] : RG.textMuted, 
                        fontSize: 12, 
                        cursor: "pointer", 
                        fontWeight: isActive ? 700 : 400, 
                        fontFamily: "'Sarabun', sans-serif",
                        transition: "all 0.15s"
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${RG.border}`, margin: 0 }} />

            {/* Status Filter */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองตามสถานะ (Status)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(localStatus.length > 0 ? localStatus : STAGES).map(stage => (
                    <div key={stage}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", borderLeft: `2px solid ${RG.border}`, borderRight: `2px solid ${RG.border}`, padding: "0 8px" }}>
                        {(STAGE_STATUS_MAP[stage] || []).map(s => {
                          const isActive = localLatestStatus.includes(s);
                          return (
                            <button 
                              key={s} 
                              onClick={() => toggleLatestStatus(s)} 
                              style={{ 
                                padding: "4px 9px", 
                                borderRadius: 20, 
                                border: `1.5px solid ${isActive ? RG.border : RG.border}`, 
                                background: isActive ? "#F1F5F9" : RG.surface, 
                                color: isActive ? RG.text : RG.textMuted, 
                                fontSize: 11, 
                                cursor: "pointer", 
                                fontWeight: isActive ? 700 : 400, 
                                fontFamily: "'Sarabun', sans-serif",
                                transition: "all 0.15s"
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            <hr style={{ border: "none", borderTop: `1px solid ${RG.border}`, margin: 0 }} />

            {/* Province Filter */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองตามจังหวัด</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !localProvince.includes(e.target.value)) {
                      setLocalProvince([...localProvince, e.target.value]);
                    }
                  }}
                  style={{ ...inputStyle, width: "100%", padding: "7px 12px", fontSize: 13 }}
                >
                  <option value="">-- เลือกจังหวัด --</option>
                  {PROVINCES.filter(p => !localProvince.includes(p)).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                
                {localProvince.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 68, overflowY: "auto" }}>
                    {localProvince.map(p => (
                      <div 
                        key={p} 
                        style={{ 
                          background: RG.primary + "15", 
                          color: RG.primary, 
                          padding: "3px 8px", 
                          borderRadius: 12, 
                          fontSize: 11, 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 5,
                          fontWeight: 600
                        }}
                      >
                        {p}
                        <span 
                          onClick={() => toggleProvince(p)}
                          style={{ cursor: "pointer", opacity: 0.7 }}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: 1, backgroundColor: RG.border, alignSelf: "stretch" }}></div>

          {/* Right Column: Financial & Date Filters */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Financial Filters */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองข้อมูลการเงิน</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>มูลค่าโครงการ:</div>
                  <input 
                    type="text" 
                    placeholder="ขั้นต่ำ" 
                    value={formatNumberWithCommas(localFin.dealValue?.min || "")} 
                    onChange={e => handleFinChange("dealValue", "min", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                  <span style={{ color: RG.textMuted }}>-</span>
                  <input 
                    type="text" 
                    placeholder="สูงสุด" 
                    value={formatNumberWithCommas(localFin.dealValue?.max || "")} 
                    onChange={e => handleFinChange("dealValue", "max", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>รายได้รวม:</div>
                  <input 
                    type="text" 
                    placeholder="ขั้นต่ำ" 
                    value={formatNumberWithCommas(localFin.revenue.min)} 
                    onChange={e => handleFinChange("revenue", "min", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                  <span style={{ color: RG.textMuted }}>-</span>
                  <input 
                    type="text" 
                    placeholder="สูงสุด" 
                    value={formatNumberWithCommas(localFin.revenue.max)} 
                    onChange={e => handleFinChange("revenue", "max", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>ทุนจดทะเบียน:</div>
                  <input 
                    type="text" 
                    placeholder="ขั้นต่ำ" 
                    value={formatNumberWithCommas(localFin.registeredCapital.min)} 
                    onChange={e => handleFinChange("registeredCapital", "min", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                  <span style={{ color: RG.textMuted }}>-</span>
                  <input 
                    type="text" 
                    placeholder="สูงสุด" 
                    value={formatNumberWithCommas(localFin.registeredCapital.max)} 
                    onChange={e => handleFinChange("registeredCapital", "max", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 95, fontSize: 12, color: RG.textMuted, flexShrink: 0 }}>กำไร:</div>
                  <input 
                    type="text" 
                    placeholder="ขั้นต่ำ" 
                    value={formatNumberWithCommas(localFin.profit.min)} 
                    onChange={e => handleFinChange("profit", "min", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                  <span style={{ color: RG.textMuted }}>-</span>
                  <input 
                    type="text" 
                    placeholder="สูงสุด" 
                    value={formatNumberWithCommas(localFin.profit.max)} 
                    onChange={e => handleFinChange("profit", "max", parseNumberFromCommas(e.target.value))} 
                    style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} 
                  />
                </div>

              </div>
            </div>

            <hr style={{ border: "none", borderTop: `1px solid ${RG.border}`, margin: 0 }} />

            {/* Date Filters */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 8 }}>กรองข้อมูลวันที่</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {renderDateField("ติดต่อล่าสุด", "latestContactDate")}
                {renderDateField("นัดถัดไป", "nextFollowupDate")}
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, borderTop: `1px solid ${RG.border}`, paddingTop: 14 }}>
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
