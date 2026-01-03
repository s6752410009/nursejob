// ============================================
// PLACES SERVICE - Longdo Map API (Thai)
// ============================================
// Free tier: 100,000 requests/month
// ลงทะเบียนขอ API Key ที่: https://map.longdo.com/console

// ⚠️ สำคัญ: ใส่ API Key ของคุณที่นี่
// 1. ไปที่ https://map.longdo.com/console
// 2. ลงทะเบียน/เข้าสู่ระบบ
// 3. สร้าง API Key ใหม่
// 4. copy key มาใส่ที่นี่
const LONGDO_API_KEY = '42cbc4a02c0bc712bafa5e0b44ae2cd7';

const LONGDO_SEARCH_API = 'https://search.longdo.com/mapsearch/json/search';
const LONGDO_SUGGEST_API = 'https://search.longdo.com/mapsearch/json/suggest';

export interface PlaceResult {
  name: string;
  province: string;
  district: string;
  address?: string;
  lat?: number;
  lng?: number;
  type?: string;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

// ============================================
// Longdo Map API - Search Places
// ============================================
interface LongdoSearchResult {
  name: string;
  address?: string;
  lat: number;
  lon: number;
  type?: string;
  subtype?: string;
  prov?: string;
  apts?: string; // district/amphoe
  tumb?: string; // tambon
  road?: string;
  postcode?: string;
}

export async function searchPlacesLongdo(query: string): Promise<PlaceResult[]> {
  if (!query || query.length < 2) return [];
  
  // Check if API key is configured
  if (LONGDO_API_KEY === 'YOUR_LONGDO_API_KEY') {
    console.log('Longdo API Key not configured. Using local database.');
    return [];
  }

  try {
    // ค้นหาโดยไม่จำกัด tag เพื่อให้ได้ผลลัพธ์มากขึ้น
    const params = new URLSearchParams({
      keyword: query,
      key: LONGDO_API_KEY,
      limit: '15',
      // locale: 'th', // ภาษาไทย
    });

    const response = await fetch(`${LONGDO_SEARCH_API}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('Longdo API response:', JSON.stringify(data, null, 2));

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item: LongdoSearchResult) => {
      // Extract province and district from various fields
      let province = item.prov || '';
      let district = item.apts || item.tumb || '';
      
      // ถ้าไม่มี province/district ลองดึงจาก address
      if ((!province || !district) && item.address) {
        const addressParts = item.address.split(' ');
        // หา pattern เช่น "อ.บางบัวทอง จ.นนทบุรี"
        for (const part of addressParts) {
          if (part.startsWith('จ.') || part.startsWith('จังหวัด')) {
            province = province || part.replace(/^(จ\.|จังหวัด)/, '').trim();
          }
          if (part.startsWith('อ.') || part.startsWith('อำเภอ') || part.startsWith('เขต')) {
            district = district || part.replace(/^(อ\.|อำเภอ|เขต)/, '').trim();
          }
        }
      }
      
      return {
        name: item.name,
        province: cleanProvinceName(province),
        district: cleanDistrictName(district),
        address: item.address || `${item.road || ''} ${district} ${province}`.trim(),
        lat: item.lat,
        lng: item.lon,
        type: item.type || item.subtype,
      };
    });
  } catch (error) {
    console.error('Longdo search error:', error);
    return [];
  }
}

// ============================================
// Longdo Map API - Autocomplete Suggest
// ============================================
export async function suggestPlacesLongdo(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  if (LONGDO_API_KEY === 'YOUR_LONGDO_API_KEY') {
    return [];
  }

  try {
    const params = new URLSearchParams({
      keyword: query,
      key: LONGDO_API_KEY,
      limit: '8',
    });

    const response = await fetch(`${LONGDO_SUGGEST_API}?${params}`);
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item: any) => item.w || item.keyword || '');
  } catch (error) {
    console.error('Longdo suggest error:', error);
    return [];
  }
}

// ============================================
// Helper Functions  
// ============================================
function cleanProvinceName(province: string): string {
  return province
    .replace(/^จังหวัด/g, '')
    .replace(/^จ\./g, '')
    .trim();
}

function cleanDistrictName(district: string): string {
  return district
    .replace(/^เขต/g, '')
    .replace(/^อำเภอ/g, '')
    .replace(/^อ\./g, '')
    .trim();
}

// Legacy Google Places functions (keep for compatibility)
export async function getPlacePredictions(
  input: string,
  types: string = 'establishment'
): Promise<PlacePrediction[]> {
  // Use Longdo search instead
  const results = await searchPlacesLongdo(input);
  return results.map((r, index) => ({
    place_id: `longdo_${index}`,
    description: `${r.name}, ${r.district} ${r.province}`.trim(),
    structured_formatting: {
      main_text: r.name,
      secondary_text: `${r.district} ${r.province}`.trim(),
    },
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  // Not needed with Longdo - data comes with search
  return null;
}

// Extract province from address components
export function extractProvince(addressComponents: PlaceDetails['address_components']): string {
  if (!addressComponents) return '';
  const province = addressComponents.find(
    (comp) => comp.types.includes('administrative_area_level_1')
  );
  return province?.long_name || '';
}

// Extract district from address components
export function extractDistrict(addressComponents: PlaceDetails['address_components']): string {
  if (!addressComponents) return '';
  const district = addressComponents.find(
    (comp) => comp.types.includes('administrative_area_level_2') ||
              comp.types.includes('sublocality_level_1') ||
              comp.types.includes('locality')
  );
  return district?.long_name || '';
}

// ============================================
// Thai Hospital/Clinic Database (Fallback)
// ============================================
// เมื่อไม่มี API Key หรือ API ไม่ทำงาน จะใช้ข้อมูลนี้แทน

export const THAI_HOSPITALS: { name: string; province: string; district: string }[] = [
  // กรุงเทพมหานคร
  { name: 'โรงพยาบาลศิริราช', province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย' },
  { name: 'โรงพยาบาลจุฬาลงกรณ์', province: 'กรุงเทพมหานคร', district: 'ปทุมวัน' },
  { name: 'โรงพยาบาลรามาธิบดี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลพระมงกุฎเกล้า', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลราชวิถี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลภูมิพลอดุลยเดช', province: 'กรุงเทพมหานคร', district: 'สายไหม' },
  { name: 'โรงพยาบาลตำรวจ', province: 'กรุงเทพมหานคร', district: 'ปทุมวัน' },
  { name: 'โรงพยาบาลกลาง', province: 'กรุงเทพมหานคร', district: 'ป้อมปราบฯ' },
  { name: 'โรงพยาบาลเจริญกรุงประชารักษ์', province: 'กรุงเทพมหานคร', district: 'บางคอแหลม' },
  { name: 'โรงพยาบาลตากสิน', province: 'กรุงเทพมหานคร', district: 'คลองสาน' },
  { name: 'โรงพยาบาลวชิรพยาบาล', province: 'กรุงเทพมหานคร', district: 'ดุสิต' },
  { name: 'โรงพยาบาลนพรัตนราชธานี', province: 'กรุงเทพมหานคร', district: 'คันนายาว' },
  { name: 'โรงพยาบาลเลิดสิน', province: 'กรุงเทพมหานคร', district: 'บางรัก' },
  { name: 'โรงพยาบาลสมิติเวช สุขุมวิท', province: 'กรุงเทพมหานคร', district: 'คลองเตย' },
  { name: 'โรงพยาบาลบำรุงราษฎร์', province: 'กรุงเทพมหานคร', district: 'วัฒนา' },
  { name: 'โรงพยาบาลกรุงเทพ', province: 'กรุงเทพมหานคร', district: 'วัฒนา' },
  { name: 'โรงพยาบาลพญาไท 1', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลพญาไท 2', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลพญาไท 3', province: 'กรุงเทพมหานคร', district: 'ภาษีเจริญ' },
  { name: 'โรงพยาบาลเปาโล พหลโยธิน', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลเปาโล เกษตร', province: 'กรุงเทพมหานคร', district: 'จตุจักร' },
  { name: 'โรงพยาบาลวิภาวดี', province: 'กรุงเทพมหานคร', district: 'จตุจักร' },
  { name: 'โรงพยาบาลเวชธานี', province: 'กรุงเทพมหานคร', district: 'ห้วยขวาง' },
  { name: 'โรงพยาบาลมงกุฎวัฒนะ', province: 'กรุงเทพมหานคร', district: 'หลักสี่' },
  { name: 'โรงพยาบาลวิชัยยุทธ', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลเซนต์หลุยส์', province: 'กรุงเทพมหานคร', district: 'สาทร' },
  { name: 'โรงพยาบาลบีเอ็นเอช', province: 'กรุงเทพมหานคร', district: 'สาทร' },
  { name: 'โรงพยาบาลพระราม 9', province: 'กรุงเทพมหานคร', district: 'ห้วยขวาง' },
  { name: 'โรงพยาบาลลาดพร้าว', province: 'กรุงเทพมหานคร', district: 'ลาดพร้าว' },
  { name: 'โรงพยาบาลสินแพทย์', province: 'กรุงเทพมหานคร', district: 'ลาดพร้าว' },
  { name: 'โรงพยาบาลนวมินทร์', province: 'กรุงเทพมหานคร', district: 'บึงกุ่ม' },
  { name: 'โรงพยาบาลคามิลเลียน', province: 'กรุงเทพมหานคร', district: 'วัฒนา' },
  { name: 'โรงพยาบาลมิชชั่น', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลเซ็นทรัล เจเนอรัล', province: 'กรุงเทพมหานคร', district: 'บางพลัด' },
  { name: 'โรงพยาบาลยันฮี', province: 'กรุงเทพมหานคร', district: 'บางพลัด' },
  { name: 'โรงพยาบาลธนบุรี', province: 'กรุงเทพมหานคร', district: 'บางกอกใหญ่' },
  { name: 'โรงพยาบาลสิรินธร', province: 'กรุงเทพมหานคร', district: 'ประเวศ' },
  { name: 'โรงพยาบาลหลวงพ่อทวีศักดิ์', province: 'กรุงเทพมหานคร', district: 'หนองแขม' },
  { name: 'โรงพยาบาลราชพิพัฒน์', province: 'กรุงเทพมหานคร', district: 'บางแค' },
  { name: 'โรงพยาบาลผู้สูงอายุบางขุนเทียน', province: 'กรุงเทพมหานคร', district: 'บางขุนเทียน' },
  
  // นนทบุรี
  { name: 'โรงพยาบาลพระนั่งเกล้า', province: 'นนทบุรี', district: 'เมืองนนทบุรี' },
  { name: 'โรงพยาบาลบางใหญ่', province: 'นนทบุรี', district: 'บางใหญ่' },
  { name: 'โรงพยาบาลบางบัวทอง', province: 'นนทบุรี', district: 'บางบัวทอง' },
  { name: 'โรงพยาบาลปากเกร็ด', province: 'นนทบุรี', district: 'ปากเกร็ด' },
  { name: 'โรงพยาบาลศูนย์การแพทย์ปัญญานันทภิกขุ', province: 'นนทบุรี', district: 'ปากเกร็ด' },
  { name: 'โรงพยาบาลนนทเวช', province: 'นนทบุรี', district: 'เมืองนนทบุรี' },
  { name: 'โรงพยาบาลเกษมราษฎร์ รัตนาธิเบศร์', province: 'นนทบุรี', district: 'เมืองนนทบุรี' },
  
  // ปทุมธานี
  { name: 'โรงพยาบาลปทุมธานี', province: 'ปทุมธานี', district: 'เมืองปทุมธานี' },
  { name: 'โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ', province: 'ปทุมธานี', district: 'คลองหลวง' },
  { name: 'โรงพยาบาลรังสิต', province: 'ปทุมธานี', district: 'ธัญบุรี' },
  { name: 'โรงพยาบาลภัทร-ธนบุรี', province: 'ปทุมธานี', district: 'ลำลูกกา' },
  
  // สมุทรปราการ
  { name: 'โรงพยาบาลสมุทรปราการ', province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ' },
  { name: 'โรงพยาบาลบางพลี', province: 'สมุทรปราการ', district: 'บางพลี' },
  { name: 'โรงพยาบาลบางบ่อ', province: 'สมุทรปราการ', district: 'บางบ่อ' },
  { name: 'โรงพยาบาลพระสมุทรเจดีย์สวาทยานนท์', province: 'สมุทรปราการ', district: 'พระสมุทรเจดีย์' },
  { name: 'โรงพยาบาลเมืองสมุทรปากน้ำ', province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ' },
  
  // ชลบุรี
  { name: 'โรงพยาบาลชลบุรี', province: 'ชลบุรี', district: 'เมืองชลบุรี' },
  { name: 'โรงพยาบาลบางละมุง', province: 'ชลบุรี', district: 'บางละมุง' },
  { name: 'โรงพยาบาลพัทยาเมโมเรียล', province: 'ชลบุรี', district: 'บางละมุง' },
  { name: 'โรงพยาบาลกรุงเทพพัทยา', province: 'ชลบุรี', district: 'บางละมุง' },
  { name: 'โรงพยาบาลศรีราชา', province: 'ชลบุรี', district: 'ศรีราชา' },
  { name: 'โรงพยาบาลสมิติเวช ศรีราชา', province: 'ชลบุรี', district: 'ศรีราชา' },
  { name: 'โรงพยาบาลแหลมฉบัง', province: 'ชลบุรี', district: 'ศรีราชา' },
  
  // เชียงใหม่
  { name: 'โรงพยาบาลมหาราชนครเชียงใหม่', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลนครพิงค์', province: 'เชียงใหม่', district: 'แม่ริม' },
  { name: 'โรงพยาบาลลานนา', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลเชียงใหม่ราม', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลแมคคอร์มิค', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลราชเวช', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  
  // ขอนแก่น
  { name: 'โรงพยาบาลศรีนครินทร์', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลขอนแก่น', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลราชพฤกษ์', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลขอนแก่นราม', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  
  // นครราชสีมา
  { name: 'โรงพยาบาลมหาราชนครราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  { name: 'โรงพยาบาลเทพรัตน์นครราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  { name: 'โรงพยาบาลกรุงเทพราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  
  // ภูเก็ต
  { name: 'โรงพยาบาลวชิระภูเก็ต', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลกรุงเทพภูเก็ต', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลสิริโรจน์', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลมิชชั่นภูเก็ต', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  
  // สงขลา
  { name: 'โรงพยาบาลสงขลานครินทร์', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลหาดใหญ่', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลกรุงเทพหาดใหญ่', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลราษฎร์ยินดี', province: 'สงขลา', district: 'หาดใหญ่' },
  
  // ระยอง
  { name: 'โรงพยาบาลระยอง', province: 'ระยอง', district: 'เมืองระยอง' },
  { name: 'โรงพยาบาลกรุงเทพระยอง', province: 'ระยอง', district: 'เมืองระยอง' },
  
  // อุดรธานี
  { name: 'โรงพยาบาลอุดรธานี', province: 'อุดรธานี', district: 'เมืองอุดรธานี' },
  { name: 'โรงพยาบาลศรีสะเกษ', province: 'ศรีสะเกษ', district: 'เมืองศรีสะเกษ' },
  
  // เพิ่มคลินิกยอดนิยม
  { name: 'คลินิกเวชกรรม', province: 'กรุงเทพมหานคร', district: '' },
  { name: 'คลินิกทันตกรรม', province: 'กรุงเทพมหานคร', district: '' },
  { name: 'ศูนย์การแพทย์', province: 'กรุงเทพมหานคร', district: '' },
];

// Search in Thai hospitals database (fallback when no API)
export function searchThaiHospitals(query: string): typeof THAI_HOSPITALS {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return THAI_HOSPITALS.filter(
    (h) => 
      h.name.toLowerCase().includes(lowerQuery) ||
      h.province.includes(query) ||
      h.district.includes(query)
  ).slice(0, 10); // Limit to 10 results
}
