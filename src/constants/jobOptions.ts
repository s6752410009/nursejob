// ============================================
// JOB CONSTANTS - ประเภทงาน, สถานที่, ค่าตอบแทน
// ============================================

// ============================================
// ประเภทบุคลากร (Staff Types)
// ============================================

export type StaffType = 'RN' | 'PN' | 'NA' | 'CG' | 'SITTER' | 'OTHER';

export interface StaffTypeInfo {
  code: StaffType;
  nameTH: string;
  nameEN: string;
  shortName: string;
  description: string;
  requiresLicense: boolean;
}

export const STAFF_TYPES: StaffTypeInfo[] = [
  {
    code: 'RN',
    nameTH: 'พยาบาลวิชาชีพ',
    nameEN: 'Registered Nurse',
    shortName: 'RN',
    description: 'จบปริญญาตรี มีใบประกอบวิชาชีพ',
    requiresLicense: true,
  },
  {
    code: 'PN',
    nameTH: 'พยาบาลเทคนิค',
    nameEN: 'Practical Nurse',
    shortName: 'PN',
    description: 'จบ ปวส. มีใบประกอบวิชาชีพ',
    requiresLicense: true,
  },
  {
    code: 'NA',
    nameTH: 'ผู้ช่วยพยาบาล',
    nameEN: 'Nurse Aide',
    shortName: 'NA',
    description: 'ผ่านการอบรมหลักสูตรผู้ช่วยพยาบาล',
    requiresLicense: false,
  },
  {
    code: 'CG',
    nameTH: 'ผู้ดูแลผู้สูงอายุ/ผู้ป่วย',
    nameEN: 'Caregiver',
    shortName: 'CG',
    description: 'ผ่านการอบรมหลักสูตร Caregiver',
    requiresLicense: false,
  },
  {
    code: 'SITTER',
    nameTH: 'เฝ้าไข้',
    nameEN: 'Patient Sitter',
    shortName: 'เฝ้าไข้',
    description: 'ดูแลผู้ป่วยในโรงพยาบาลหรือที่บ้าน',
    requiresLicense: false,
  },
  {
    code: 'OTHER',
    nameTH: 'อื่นๆ',
    nameEN: 'Other',
    shortName: 'อื่นๆ',
    description: 'ระบุเอง',
    requiresLicense: false,
  },
];

// Quick lookup
export const STAFF_TYPE_MAP = STAFF_TYPES.reduce((acc, type) => {
  acc[type.code] = type;
  return acc;
}, {} as Record<StaffType, StaffTypeInfo>);

// ============================================
// ประเภทสถานที่ (Location Types)
// ============================================

export type LocationType = 'HOSPITAL' | 'CLINIC' | 'HOME' | 'NURSING_HOME' | 'OTHER';

export interface LocationTypeInfo {
  code: LocationType;
  nameTH: string;
  icon: string;
  description: string;
}

export const LOCATION_TYPES: LocationTypeInfo[] = [
  {
    code: 'HOSPITAL',
    nameTH: 'โรงพยาบาล',
    icon: '🏥',
    description: 'โรงพยาบาลรัฐหรือเอกชน',
  },
  {
    code: 'CLINIC',
    nameTH: 'คลินิก',
    icon: '🏨',
    description: 'คลินิกเอกชน, คลินิกความงาม',
  },
  {
    code: 'HOME',
    nameTH: 'บ้านผู้ป่วย',
    icon: '🏠',
    description: 'ดูแลผู้ป่วยที่บ้าน (Home Care)',
  },
  {
    code: 'NURSING_HOME',
    nameTH: 'สถานดูแลผู้สูงอายุ',
    icon: '🏡',
    description: 'Nursing Home, บ้านพักผู้สูงอายุ',
  },
  {
    code: 'OTHER',
    nameTH: 'อื่นๆ',
    icon: '📍',
    description: 'สถานที่อื่น (ระบุเอง)',
  },
];

export const LOCATION_TYPE_MAP = LOCATION_TYPES.reduce((acc, type) => {
  acc[type.code] = type;
  return acc;
}, {} as Record<LocationType, LocationTypeInfo>);

// ============================================
// แผนก (Departments)
// ============================================

export const HOSPITAL_DEPARTMENTS = [
  'ICU',
  'CCU',
  'ฉุกเฉิน (ER)',
  'ผู้ป่วยใน (IPD)',
  'ผู้ป่วยนอก (OPD)',
  'ห้องผ่าตัด (OR)',
  'ห้องคลอด (LR)',
  'เด็ก (Pediatric)',
  'ทารกแรกเกิด (NICU)',
  'อายุรกรรม (Med)',
  'ศัลยกรรม (Surg)',
  'กระดูกและข้อ (Ortho)',
  'สูติ-นรีเวช (OB-GYN)',
  'จิตเวช (Psych)',
  'ไตเทียม (Dialysis)',
  'มะเร็ง (Onco)',
  'หัวใจ (Cardio)',
  'ประสาท (Neuro)',
  'ทั่วไป',
] as const;

export const HOME_CARE_TYPES = [
  'ดูแลผู้ป่วยติดเตียง',
  'ดูแลผู้สูงอายุ',
  'ดูแลผู้ป่วยหลังผ่าตัด',
  'ดูแลผู้ป่วยโรคเรื้อรัง',
  'เฝ้าไข้ทั่วไป',
  'ดูแลเด็ก',
  'พาไปพบแพทย์',
  'ทำแผล/ให้ยา',
] as const;

// รวม departments ทั้งหมด
export const ALL_DEPARTMENTS = [
  ...HOSPITAL_DEPARTMENTS,
  ...HOME_CARE_TYPES,
] as const;

// ============================================
// ค่าตอบแทน (Payment Options)
// ============================================

export type PaymentType = 'NET' | 'DEDUCT_PERCENT' | 'NEGOTIABLE';

export interface PaymentOption {
  code: PaymentType;
  nameTH: string;
  description: string;
}

export const PAYMENT_TYPES: PaymentOption[] = [
  {
    code: 'NET',
    nameTH: 'รับเต็ม (NET)',
    description: 'ได้รับเต็มจำนวนตามที่ระบุ',
  },
  {
    code: 'DEDUCT_PERCENT',
    nameTH: 'หักเปอร์เซ็นต์',
    description: 'หักค่าบริการจากยอด เช่น หัก 3%',
  },
  {
    code: 'NEGOTIABLE',
    nameTH: 'ตามตกลง',
    description: 'ค่าตอบแทนตามตกลง',
  },
];

// ตัวเลือกหัก %
export const DEDUCT_PERCENT_OPTIONS = [
  { value: 0, label: 'ไม่หัก (NET)' },
  { value: 3, label: 'หัก 3%' },
  { value: 5, label: 'หัก 5%' },
  { value: 10, label: 'หัก 10%' },
  { value: -1, label: 'ระบุเอง' },
] as const;

// ประเภทค่าตอบแทน
export const RATE_TYPES = [
  { value: 'shift', label: 'ต่อเวร', shortLabel: '/เวร' },
  { value: 'day', label: 'ต่อวัน', shortLabel: '/วัน' },
  { value: 'hour', label: 'ต่อชั่วโมง', shortLabel: '/ชม.' },
  { value: 'month', label: 'ต่อเดือน', shortLabel: '/เดือน' },
] as const;

// ============================================
// Shift Times
// ============================================

export const SHIFT_TIMES = [
  { value: '08:00-16:00', label: 'เวรเช้า (08:00-16:00)' },
  { value: '16:00-00:00', label: 'เวรบ่าย (16:00-00:00)' },
  { value: '00:00-08:00', label: 'เวรดึก (00:00-08:00)' },
  { value: '08:00-20:00', label: 'เช้า-บ่าย (08:00-20:00)' },
  { value: '20:00-08:00', label: 'บ่าย-ดึก (20:00-08:00)' },
  { value: '07:00-19:00', label: '12 ชม. กลางวัน (07:00-19:00)' },
  { value: '19:00-07:00', label: '12 ชม. กลางคืน (19:00-07:00)' },
  { value: '00:00-24:00', label: '24 ชม. (ทั้งวัน)' },
  { value: 'custom', label: 'ระบุเวลาเอง' },
] as const;

// ============================================
// Duration Options (สำหรับ Home Care)
// ============================================

export const DURATION_OPTIONS = [
  { value: '1day', label: '1 วัน' },
  { value: '3days', label: '3 วัน' },
  { value: '1week', label: '1 สัปดาห์' },
  { value: '2weeks', label: '2 สัปดาห์' },
  { value: '1month', label: '1 เดือน' },
  { value: 'long_term', label: 'ระยะยาว' },
  { value: 'custom', label: 'ระบุเอง' },
] as const;

// ============================================
// Quick Tags (เพิ่มในประกาศ)
// ============================================

export const QUICK_TAGS = [
  'ด่วน',
  'มีที่พัก',
  'มีอาหาร',
  'มีรถรับส่ง',
  'ทำต่อได้',
  'ไม่ต้องมีประสบการณ์',
  'เริ่มงานทันที',
  'นอนเฝ้า',
  'ไม่ต้องนอนเฝ้า',
  'ผู้ป่วยสุภาพ',
  'ผู้ป่วยติดเตียง',
] as const;

// ============================================
// Helper Functions
// ============================================

export function getStaffTypeLabel(code: StaffType): string {
  return STAFF_TYPE_MAP[code]?.shortName || code;
}

export function getLocationTypeLabel(code: LocationType): string {
  return LOCATION_TYPE_MAP[code]?.nameTH || code;
}

export function formatPayment(amount: number, rateType: string, paymentType: PaymentType, deductPercent?: number): string {
  const formattedAmount = amount.toLocaleString('th-TH');
  const unit = RATE_TYPES.find(r => r.value === rateType)?.shortLabel || '';
  
  let suffix = '';
  if (paymentType === 'DEDUCT_PERCENT' && deductPercent) {
    suffix = ` (หัก ${deductPercent}%)`;
  } else if (paymentType === 'NET') {
    suffix = ' NET';
  }
  
  return `฿${formattedAmount}${unit}${suffix}`;
}

export function calculateNetAmount(amount: number, paymentType: PaymentType, deductPercent?: number): number {
  if (paymentType === 'DEDUCT_PERCENT' && deductPercent) {
    return amount * (1 - deductPercent / 100);
  }
  return amount;
}
