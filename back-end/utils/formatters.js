// ==========================================
// utils/formatters.js - แผนกจัดหน้าตาข้อมูล
// ==========================================
// แผนกนี้มีหน้าที่เอาข้อมูลดิบๆ จาก Database มาแต่งตัวให้สวยงาม ก่อนส่งให้ Frontend
// ทำให้ไฟล์ Controller ของเราไม่ต้องมานั่งทำเรื่องจุกจิกพวกนี้

const formatDateLocal = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/**
 * แปลงข้อมูลลีดให้สวยงาม
 */
const formatLead = (row) => ({
  ...row,
  id:              row.id,
  owner:           row.owner_username,   
  ownerId:         row.owner_id,
  createdBy:       row.created_by,
  creatorUsername: row.creator_username,
  assignerUsername: row.assigner_username,
  prevOwnerUsername: row.prev_owner_username,
  isAcknowledged:  row.is_acknowledged,
  revenue:         Number(row.revenue) || 0,
  registeredCapital: Number(row.registered_capital) || 0,
  profit:          Number(row.profit) || 0,
  isStarred:       !!row.is_starred,
  everHadMeeting:  !!row.ever_had_meeting, 
  latestStatus:    row.latest_status || "ฝากโปรไฟล์", 
  latestContactDate: row.latest_contact_date 
    ? formatDateLocal(row.latest_contact_date)
    : formatDateLocal(new Date()), 
  nextFollowupDate: row.next_followup_date
    ? formatDateLocal(row.next_followup_date)
    : null,
  companyName:     row.company_name,
  companyNumber:   row.company_number,
  contactName:     row.contact_name,
  contactPhone:    row.contact_phone,
  contactEmail:    row.contact_email,
  createdAt:       row.created_at,
  updatedAt:       row.created_at, 
});

/**
 * แปลงข้อมูลการติดตามให้สวยงาม
 */
const formatFollowup = (row) => ({
  id:              row.id,
  leadId:          row.lead_id,
  sequence:        row.sequence,
  date:            row.contact_date
    ? (row.contact_date.toISOString?.().slice(0, 10) ?? String(row.contact_date).slice(0, 10))
    : null,
  detail:          row.detail,
  status:          row.status,
  nextFollowupDate: row.next_followup_date
    ? (row.next_followup_date.toISOString?.().slice(0, 10) ?? String(row.next_followup_date).slice(0, 10))
    : null,
  completed:       !!row.completed,
  createdAt:       row.created_at,
});

/**
 * แปลงวันที่จาก Frontend ให้เป็นรูปแบบที่ Database เข้าใจ (YYYY-MM-DD)
 */
const parseDateForDb = (d) => {
  if (!d) return null;
  if (d.includes('/')) {
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }
  return d;
};

/**
 * ล้างข้อมูลที่ไม่จำเป็นออกก่อนบันทึกลง Audit Log เพื่อให้อ่านง่าย
 */
const cleanAuditData = (data) => {
  if (!data) return null;
  // เลือกเฉพาะฟิลด์ที่สำคัญ และจัดให้อยู่ในรูปแบบ camelCase เพื่อความเป็นระเบียบ
  return {
    companyName: data.companyName || data.company_name,
    companyNumber: data.companyNumber || data.company_number,
    contactName: data.contactName || data.contact_name,
    contactPhone: data.contactPhone || data.contact_phone,
    contactEmail: data.contactEmail || data.contact_email,
    description: data.description,
    revenue: Number(data.revenue) || undefined,
    registeredCapital: Number(data.registeredCapital || data.registered_capital) || undefined,
    profit: Number(data.profit) || undefined,
    isStarred: data.isStarred !== undefined ? !!data.isStarred : (data.is_starred !== undefined ? !!data.is_starred : undefined),
    latestStatus: data.latestStatus || data.latest_status,
    latestContactDate: data.latestContactDate || data.latest_contact_date,
    nextFollowupDate: data.nextFollowupDate || data.next_followup_date,
  };
};

/**
 * เปรียบเทียบข้อมูลเก่าและใหม่ เพื่อหาเฉพาะฟิลด์ที่มีการเปลี่ยนแปลง
 */
const getChangesDiff = (oldData, newDataCleaned) => {
  if (!oldData || !newDataCleaned) return newDataCleaned;
  
  const diff = {};
  const oldCleaned = cleanAuditData(oldData);
  
  for (const key in newDataCleaned) {
    const newVal = newDataCleaned[key];
    const oldVal = oldCleaned[key];
    
    // ข้ามฟิลด์ที่ไม่มีการส่งค่ามา (undefined)
    if (newVal === undefined) continue;
    
    // แปลงวันที่ให้อยู่ในรูปแบบเดียวกันก่อนเปรียบเทียบ
    let compareNew = newVal;
    let compareOld = oldVal;
    
    if (typeof newVal === 'string' && newVal.length > 10 && newVal.includes('T')) {
      compareNew = newVal.slice(0, 10);
    }
    if (typeof oldVal === 'string' && oldVal.length > 10 && oldVal.includes('T')) {
      compareOld = oldVal.slice(0, 10);
    }
    
    if (compareNew !== compareOld) {
      diff[key] = { from: oldVal, to: newVal };
    }
  }
  
  // ถ้าไม่มีอะไรเปลี่ยนเลย ส่งกลับเป็น null
  return Object.keys(diff).length > 0 ? diff : null;
};

// ส่งออกเครื่องมือไปให้ไฟล์อื่นเรียกใช้
module.exports = {
  formatLead,
  formatFollowup,
  parseDateForDb,
  cleanAuditData,
  getChangesDiff
};
