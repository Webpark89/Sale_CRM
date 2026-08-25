// ==========================================
// constants/status.js - Stage/Status definitions (new pipeline system)
// ==========================================

// 5 Stage หลัก
export const STAGES = ['Contact', 'Meeting', 'Proposal', 'Approval', 'Closed'];

// Status ที่รองรับในแต่ละ Stage
export const STAGE_STATUS_MAP = {
  Contact:  ['ติดต่อไม่ได้', 'Follow', 'นัด Meeting', 'Lost (Contact)'],
  Meeting:  ['เก็บ Requirement', 'รอข้อมูล', 'นัดเพิ่ม', 'ทำ Proposal'],
  Proposal: ['ส่ง Proposal', 'แก้ไข', 'ต่อรอง', 'รออนุมัติ'],
  Approval: ['รองบ', 'เปิด PR', 'รอ PO', 'Hold'],
  Closed:   ['Won', 'Lost (Closed)'],
};

// ทุก status ในระบบ (flatten)
export const ALL_STATUSES = Object.values(STAGE_STATUS_MAP).flat();

// Legacy: STATUSES สำหรับ backward compat (ใช้ทดแทน flat list เดิม)
export const STATUSES = ALL_STATUSES;

// สีของแต่ละ Stage
export const STAGE_COLORS = {
  Contact:  '#3B82F6',  // blue
  Meeting:  '#F59E0B',  // amber
  Proposal: '#8B5CF6',  // purple
  Approval: '#EC4899',  // pink
  Closed:   '#10B981',  // green
};

// สีของแต่ละ Status
export const STATUS_COLORS = {
  // Contact
  'ติดต่อไม่ได้': '#6B7280',
  'Follow':       '#3B82F6',
  'นัด Meeting':  '#F59E0B',
  'Lost (Contact)': '#EF4444',
  // Meeting
  'เก็บ Requirement': '#D97706',
  'รอข้อมูล':          '#B45F06',
  'นัดเพิ่ม':          '#92400E',
  'ทำ Proposal':       '#7C3AED',
  // Proposal
  'ส่ง Proposal': '#8B5CF6',
  'แก้ไข':        '#A855F7',
  'ต่อรอง':       '#C084FC',
  'รออนุมัติ':    '#EC4899',
  // Approval
  'รองบ':    '#DB2777',
  'เปิด PR': '#BE185D',
  'รอ PO':   '#9D174D',
  'Hold':    '#6B7280',
  // Closed
  'Won':  '#10B981',
  'Lost (Closed)': '#EF4444',
  'Lost': '#EF4444', // Backward compat
};

// หา stage จาก status
export const getStageByStatus = (status) => {
  for (const [stage, statuses] of Object.entries(STAGE_STATUS_MAP)) {
    if (statuses.includes(status)) return stage;
  }
  return 'Contact';
};

// validate
export const isValidStageStatus = (stage, status) => {
  if (!STAGE_STATUS_MAP[stage]) return false;
  return STAGE_STATUS_MAP[stage].includes(status);
};

// Legacy enums (ใช้ใน Dashboard / Notifications ยังอยู่)
export const STATUS_ENUM = {
  WON:    'Won',
  CLOSED: 'Won',          // backward compat
  LOST:   'Lost (Closed)',
  MEETING: 'Meeting',     // stage name
};

// Priority weight ตาม stage (สำหรับ sort)
export const STAGE_PRIORITY = {
  Approval: 5,
  Proposal: 4,
  Meeting:  3,
  Contact:  2,
  Closed:   1,
};