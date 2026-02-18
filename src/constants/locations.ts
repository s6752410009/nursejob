// ============================================
// LOCATIONS - จังหวัดทั่วประเทศไทย (77 จังหวัด)
// ============================================

// ภาคกลาง
export const CENTRAL_PROVINCES = [
  'กรุงเทพมหานคร',
  'กำแพงเพชร',
  'ชัยนาท',
  'นครนายก',
  'นครปฐม',
  'นครสวรรค์',
  'นนทบุรี',
  'ปทุมธานี',
  'พระนครศรีอยุธยา',
  'พิจิตร',
  'พิษณุโลก',
  'เพชรบูรณ์',
  'ลพบุรี',
  'สมุทรปราการ',
  'สมุทรสงคราม',
  'สมุทรสาคร',
  'สระบุรี',
  'สิงห์บุรี',
  'สุโขทัย',
  'สุพรรณบุรี',
  'อ่างทอง',
  'อุทัยธานี',
] as const;

// ภาคตะวันออก
export const EASTERN_PROVINCES = [
  'จันทบุรี',
  'ฉะเชิงเทรา',
  'ชลบุรี',
  'ตราด',
  'ปราจีนบุรี',
  'ระยอง',
  'สระแก้ว',
] as const;

// ภาคตะวันตก
export const WESTERN_PROVINCES = [
  'กาญจนบุรี',
  'ตาก',
  'ประจวบคีรีขันธ์',
  'เพชรบุรี',
  'ราชบุรี',
] as const;

// ภาคเหนือ
export const NORTHERN_PROVINCES = [
  'เชียงราย',
  'เชียงใหม่',
  'น่าน',
  'พะเยา',
  'แพร่',
  'แม่ฮ่องสอน',
  'ลำปาง',
  'ลำพูน',
  'อุตรดิตถ์',
] as const;

// ภาคตะวันออกเฉียงเหนือ (อีสาน)
export const NORTHEASTERN_PROVINCES = [
  'กาฬสินธุ์',
  'ขอนแก่น',
  'ชัยภูมิ',
  'นครพนม',
  'นครราชสีมา',
  'บึงกาฬ',
  'บุรีรัมย์',
  'มหาสารคาม',
  'มุกดาหาร',
  'ยโสธร',
  'ร้อยเอ็ด',
  'เลย',
  'ศรีสะเกษ',
  'สกลนคร',
  'สุรินทร์',
  'หนองคาย',
  'หนองบัวลำภู',
  'อุดรธานี',
  'อุบลราชธานี',
  'อำนาจเจริญ',
] as const;

// ภาคใต้
export const SOUTHERN_PROVINCES = [
  'กระบี่',
  'ชุมพร',
  'ตรัง',
  'นครศรีธรรมราช',
  'นราธิวาส',
  'ปัตตานี',
  'พังงา',
  'พัทลุง',
  'ภูเก็ต',
  'ยะลา',
  'ระนอง',
  'สงขลา',
  'สตูล',
  'สุราษฎร์ธานี',
] as const;

// รวมทั้งหมด 77 จังหวัด
export const ALL_PROVINCES = [
  ...CENTRAL_PROVINCES,
  ...EASTERN_PROVINCES,
  ...WESTERN_PROVINCES,
  ...NORTHERN_PROVINCES,
  ...NORTHEASTERN_PROVINCES,
  ...SOUTHERN_PROVINCES,
].sort() as unknown as readonly string[];

// แบ่งตามภาค (สำหรับ UI)
export const PROVINCES_BY_REGION = {
  'ภาคกลาง': CENTRAL_PROVINCES,
  'ภาคตะวันออก': EASTERN_PROVINCES,
  'ภาคตะวันตก': WESTERN_PROVINCES,
  'ภาคเหนือ': NORTHERN_PROVINCES,
  'ภาคตะวันออกเฉียงเหนือ': NORTHEASTERN_PROVINCES,
  'ภาคใต้': SOUTHERN_PROVINCES,
} as const;

export const REGIONS = Object.keys(PROVINCES_BY_REGION) as (keyof typeof PROVINCES_BY_REGION)[];

// จังหวัดยอดนิยม (แสดงก่อน)
export const POPULAR_PROVINCES = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'เชียงใหม่',
  'ภูเก็ต',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
] as const;

// ============================================
// เขต/อำเภอ ตัวอย่าง (สามารถเพิ่มได้)
// ============================================

export const BANGKOK_DISTRICTS = [
  'พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ',
  'ปทุมวัน', 'ป้อมปราบฯ', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา',
  'สัมพันธวงศ์', 'พญาไท', 'ธนบุรี', 'บางกอกใหญ่', 'ห้วยขวาง', 'คลองสาน',
  'ตลิ่งชัน', 'บางกอกน้อย', 'บางขุนเทียน', 'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ',
  'บางพลัด', 'ดินแดง', 'บึงกุ่ม', 'สาทร', 'บางซื่อ', 'จตุจักร',
  'บางคอแหลม', 'ประเวศ', 'คลองเตย', 'สวนหลวง', 'จอมทอง', 'ดอนเมือง',
  'ราชเทวี', 'ลาดพร้าว', 'วัฒนา', 'บางแค', 'หลักสี่', 'สายไหม',
  'คันนายาว', 'สะพานสูง', 'วังทองหลาง', 'คลองสามวา', 'บางนา', 'ทวีวัฒนา',
  'ทุ่งครุ', 'บางบอน',
] as const;

export const NONTHABURI_DISTRICTS = [
  'เมืองนนทบุรี', 'บางกรวย', 'บางใหญ่', 'บางบัวทอง', 'ไทรน้อย', 'ปากเกร็ด',
] as const;

export const CHONBURI_DISTRICTS = [
  'เมืองชลบุรี', 'บ้านบึง', 'หนองใหญ่', 'บางละมุง', 'พานทอง', 'พนัสนิคม',
  'ศรีราชา', 'เกาะสีชัง', 'สัตหีบ', 'บ่อทอง', 'เกาะจันทร์',
] as const;

// รวมอำเภอตามจังหวัด (เพิ่มได้ตามต้องการ)
export const DISTRICTS_BY_PROVINCE: Record<string, readonly string[]> = {
  'กรุงเทพมหานคร': BANGKOK_DISTRICTS,
  'นนทบุรี': NONTHABURI_DISTRICTS,
  'ชลบุรี': CHONBURI_DISTRICTS,
  // สามารถเพิ่มจังหวัดอื่นได้
};

// Helper function
export function getDistrictsForProvince(province: string): readonly string[] {
  return DISTRICTS_BY_PROVINCE[province] || [];
}

export function getRegionForProvince(province: string): string | null {
  for (const [region, provinces] of Object.entries(PROVINCES_BY_REGION)) {
    if ((provinces as readonly string[]).includes(province)) {
      return region;
    }
  }
  return null;
}
