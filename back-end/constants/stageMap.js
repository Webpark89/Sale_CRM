// ==========================================
// constants/stageMap.js - Stage/Status definitions
// ==========================================

const STAGES = ['Contact', 'Meeting', 'Proposal', 'Approval', 'Closed'];

const STAGE_STATUS_MAP = {
  Contact:  ['ติดต่อไม่ได้', 'Follow', 'นัด Meeting', 'Lost'],
  Meeting:  ['เก็บ Requirement', 'รอข้อมูล', 'นัดเพิ่ม', 'ทำ Proposal'],
  Proposal: ['ส่ง Proposal', 'แก้ไข', 'ต่อรอง', 'รออนุมัติ'],
  Approval: ['รองบ', 'เปิด PR', 'รอ PO', 'Hold'],
  Closed:   ['Won', 'Lost'],
};

// ทุก status ที่มีในระบบ (flatten)
const ALL_STATUSES = Object.values(STAGE_STATUS_MAP).flat();

// หา stage จาก status (backward lookup)
const getStageByStatus = (status) => {
  for (const [stage, statuses] of Object.entries(STAGE_STATUS_MAP)) {
    if (statuses.includes(status)) return stage;
  }
  return 'Contact';
};

// validate ว่า status ตรงกับ stage
const isValidStageStatus = (stage, status) => {
  if (!STAGE_STATUS_MAP[stage]) return false;
  return STAGE_STATUS_MAP[stage].includes(status);
};

module.exports = { STAGES, STAGE_STATUS_MAP, ALL_STATUSES, getStageByStatus, isValidStageStatus };
