// ============================================
// PLACE AUTOCOMPLETE COMPONENT - FREE (OpenStreetMap) + Local Cache
// ============================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';

// ใช้ Nominatim API (OpenStreetMap) - ฟรี 100%
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// ====== LOCAL HOSPITAL DATABASE ======
// Popular hospitals in Thailand for instant search
const LOCAL_HOSPITALS: Array<{ name: string; province: string; district: string }> = [
  // กรุงเทพมหานคร
  { name: 'โรงพยาบาลศิริราช', province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย' },
  { name: 'โรงพยาบาลจุฬาลงกรณ์', province: 'กรุงเทพมหานคร', district: 'ปทุมวัน' },
  { name: 'โรงพยาบาลรามาธิบดี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลพระมงกุฎเกล้า', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลราชวิถี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลกรุงเทพ', province: 'กรุงเทพมหานคร', district: 'วัฒนา' },
  { name: 'โรงพยาบาลบำรุงราษฎร์', province: 'กรุงเทพมหานคร', district: 'วัฒนา' },
  { name: 'โรงพยาบาลสมิติเวช สุขุมวิท', province: 'กรุงเทพมหานคร', district: 'คลองเตย' },
  { name: 'โรงพยาบาลสมิติเวช ศรีนครินทร์', province: 'กรุงเทพมหานคร', district: 'สวนหลวง' },
  { name: 'โรงพยาบาลเปาโล พหลโยธิน', province: 'กรุงเทพมหานคร', district: 'จตุจักร' },
  { name: 'โรงพยาบาลเปาโล เกษตร', province: 'กรุงเทพมหานคร', district: 'จตุจักร' },
  { name: 'โรงพยาบาลพญาไท 1', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลพญาไท 2', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลพญาไท 3', province: 'กรุงเทพมหานคร', district: 'บางซื่อ' },
  { name: 'โรงพยาบาลเวชธานี', province: 'กรุงเทพมหานคร', district: 'ห้วยขวาง' },
  { name: 'โรงพยาบาลวิภาวดี', province: 'กรุงเทพมหานคร', district: 'หลักสี่' },
  { name: 'โรงพยาบาลลาดพร้าว', province: 'กรุงเทพมหานคร', district: 'ลาดพร้าว' },
  { name: 'โรงพยาบาลเจ้าพระยา', province: 'กรุงเทพมหานคร', district: 'บางพลัด' },
  { name: 'โรงพยาบาลธนบุรี', province: 'กรุงเทพมหานคร', district: 'ธนบุรี' },
  { name: 'โรงพยาบาลตากสิน', province: 'กรุงเทพมหานคร', district: 'คลองสาน' },
  { name: 'โรงพยาบาลศิริราช ปิยมหาราชการุณย์', province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย' },
  { name: 'โรงพยาบาลนวมินทร์', province: 'กรุงเทพมหานคร', district: 'บึงกุ่ม' },
  { name: 'โรงพยาบาลสินแพทย์', province: 'กรุงเทพมหานคร', district: 'สะพานสูง' },
  { name: 'โรงพยาบาลมงกุฎวัฒนะ', province: 'กรุงเทพมหานคร', district: 'หลักสี่' },
  { name: 'โรงพยาบาลเซนต์หลุยส์', province: 'กรุงเทพมหานคร', district: 'สาทร' },
  { name: 'โรงพยาบาลบีเอ็นเอช', province: 'กรุงเทพมหานคร', district: 'สาทร' },
  { name: 'โรงพยาบาลราชพิพัฒน์', province: 'กรุงเทพมหานคร', district: 'บางแค' },
  { name: 'โรงพยาบาลหลวงพ่อทวีศักดิ์', province: 'กรุงเทพมหานคร', district: 'หนองแขม' },
  { name: 'โรงพยาบาลเลิดสิน', province: 'กรุงเทพมหานคร', district: 'บางรัก' },
  { name: 'โรงพยาบาลผิวหนัง', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'สถาบันบำราศนราดูร', province: 'กรุงเทพมหานคร', district: 'ดอนเมือง' },
  { name: 'สถาบันสุขภาพเด็กแห่งชาติ', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลทหารผ่านศึก', province: 'กรุงเทพมหานคร', district: 'พญาไท' },
  { name: 'โรงพยาบาลโพลีคลินิก', province: 'กรุงเทพมหานคร', district: 'ปทุมวัน' },
  
  // ปริมณฑล
  { name: 'โรงพยาบาลนนทเวช', province: 'นนทบุรี', district: 'เมืองนนทบุรี' },
  { name: 'โรงพยาบาลกรุงไทย', province: 'นนทบุรี', district: 'บางบัวทอง' },
  { name: 'โรงพยาบาลศูนย์การแพทย์นนทบุรี', province: 'นนทบุรี', district: 'เมืองนนทบุรี' },
  { name: 'โรงพยาบาลปากเกร็ด', province: 'นนทบุรี', district: 'ปากเกร็ด' },
  { name: 'โรงพยาบาลเจษฎา', province: 'นนทบุรี', district: 'บางใหญ่' },
  { name: 'โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ', province: 'ปทุมธานี', district: 'คลองหลวง' },
  { name: 'โรงพยาบาลปทุมธานี', province: 'ปทุมธานี', district: 'เมืองปทุมธานี' },
  { name: 'โรงพยาบาลรังสิต', province: 'ปทุมธานี', district: 'ธัญบุรี' },
  { name: 'โรงพยาบาลสมุทรปราการ', province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ' },
  { name: 'โรงพยาบาลเมืองสมุทรปู่เจ้า', province: 'สมุทรปราการ', district: 'เมืองสมุทรปราการ' },
  { name: 'โรงพยาบาลบางพลี', province: 'สมุทรปราการ', district: 'บางพลี' },
  
  // ภาคกลาง
  { name: 'โรงพยาบาลพระนครศรีอยุธยา', province: 'พระนครศรีอยุธยา', district: 'พระนครศรีอยุธยา' },
  { name: 'โรงพยาบาลราชธานี', province: 'พระนครศรีอยุธยา', district: 'พระนครศรีอยุธยา' },
  { name: 'โรงพยาบาลนครปฐม', province: 'นครปฐม', district: 'เมืองนครปฐม' },
  { name: 'โรงพยาบาลสนามจันทร์', province: 'นครปฐม', district: 'เมืองนครปฐม' },
  { name: 'โรงพยาบาลสระบุรี', province: 'สระบุรี', district: 'เมืองสระบุรี' },
  { name: 'โรงพยาบาลสิงห์บุรี', province: 'สิงห์บุรี', district: 'เมืองสิงห์บุรี' },
  { name: 'โรงพยาบาลอ่างทอง', province: 'อ่างทอง', district: 'เมืองอ่างทอง' },
  
  // ภาคเหนือ
  { name: 'โรงพยาบาลมหาราชนครเชียงใหม่', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลเชียงใหม่ราม', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลลานนา', province: 'เชียงใหม่', district: 'เมืองเชียงใหม่' },
  { name: 'โรงพยาบาลนครพิงค์', province: 'เชียงใหม่', district: 'แม่ริม' },
  { name: 'โรงพยาบาลเชียงรายประชานุเคราะห์', province: 'เชียงราย', district: 'เมืองเชียงราย' },
  { name: 'โรงพยาบาลโอเวอร์บรุ๊ค', province: 'เชียงราย', district: 'เมืองเชียงราย' },
  { name: 'โรงพยาบาลพุทธชินราช พิษณุโลก', province: 'พิษณุโลก', district: 'เมืองพิษณุโลก' },
  { name: 'โรงพยาบาลลำปาง', province: 'ลำปาง', district: 'เมืองลำปาง' },
  { name: 'โรงพยาบาลลำพูน', province: 'ลำพูน', district: 'เมืองลำพูน' },
  { name: 'โรงพยาบาลพะเยา', province: 'พะเยา', district: 'เมืองพะเยา' },
  { name: 'โรงพยาบาลแพร่', province: 'แพร่', district: 'เมืองแพร่' },
  { name: 'โรงพยาบาลน่าน', province: 'น่าน', district: 'เมืองน่าน' },
  
  // ภาคตะวันออกเฉียงเหนือ
  { name: 'โรงพยาบาลศรีนครินทร์ ขอนแก่น', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลขอนแก่น', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลราชพฤกษ์', province: 'ขอนแก่น', district: 'เมืองขอนแก่น' },
  { name: 'โรงพยาบาลมหาราชนครราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  { name: 'โรงพยาบาลเทพรัตน์นครราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  { name: 'โรงพยาบาลกรุงเทพราชสีมา', province: 'นครราชสีมา', district: 'เมืองนครราชสีมา' },
  { name: 'โรงพยาบาลสรรพสิทธิประสงค์', province: 'อุบลราชธานี', district: 'เมืองอุบลราชธานี' },
  { name: 'โรงพยาบาลอุบลรักษ์ธนบุรี', province: 'อุบลราชธานี', district: 'เมืองอุบลราชธานี' },
  { name: 'โรงพยาบาลอุดรธานี', province: 'อุดรธานี', district: 'เมืองอุดรธานี' },
  { name: 'โรงพยาบาลเอกอุดร', province: 'อุดรธานี', district: 'เมืองอุดรธานี' },
  { name: 'โรงพยาบาลร้อยเอ็ด', province: 'ร้อยเอ็ด', district: 'เมืองร้อยเอ็ด' },
  { name: 'โรงพยาบาลมหาสารคาม', province: 'มหาสารคาม', district: 'เมืองมหาสารคาม' },
  { name: 'โรงพยาบาลสกลนคร', province: 'สกลนคร', district: 'เมืองสกลนคร' },
  { name: 'โรงพยาบาลนครพนม', province: 'นครพนม', district: 'เมืองนครพนม' },
  { name: 'โรงพยาบาลสุรินทร์', province: 'สุรินทร์', district: 'เมืองสุรินทร์' },
  { name: 'โรงพยาบาลบุรีรัมย์', province: 'บุรีรัมย์', district: 'เมืองบุรีรัมย์' },
  { name: 'โรงพยาบาลชัยภูมิ', province: 'ชัยภูมิ', district: 'เมืองชัยภูมิ' },
  { name: 'โรงพยาบาลเลย', province: 'เลย', district: 'เมืองเลย' },
  { name: 'โรงพยาบาลหนองคาย', province: 'หนองคาย', district: 'เมืองหนองคาย' },
  { name: 'โรงพยาบาลศรีสะเกษ', province: 'ศรีสะเกษ', district: 'เมืองศรีสะเกษ' },
  { name: 'โรงพยาบาลยโสธร', province: 'ยโสธร', district: 'เมืองยโสธร' },
  { name: 'โรงพยาบาลกาฬสินธุ์', province: 'กาฬสินธุ์', district: 'เมืองกาฬสินธุ์' },
  { name: 'โรงพยาบาลอำนาจเจริญ', province: 'อำนาจเจริญ', district: 'เมืองอำนาจเจริญ' },
  { name: 'โรงพยาบาลมุกดาหาร', province: 'มุกดาหาร', district: 'เมืองมุกดาหาร' },
  
  // ภาคตะวันออก
  { name: 'โรงพยาบาลชลบุรี', province: 'ชลบุรี', district: 'เมืองชลบุรี' },
  { name: 'โรงพยาบาลบางละมุง', province: 'ชลบุรี', district: 'บางละมุง' },
  { name: 'โรงพยาบาลกรุงเทพพัทยา', province: 'ชลบุรี', district: 'บางละมุง' },
  { name: 'โรงพยาบาลพญาไทศรีราชา', province: 'ชลบุรี', district: 'ศรีราชา' },
  { name: 'โรงพยาบาลแหลมฉบัง', province: 'ชลบุรี', district: 'ศรีราชา' },
  { name: 'โรงพยาบาลระยอง', province: 'ระยอง', district: 'เมืองระยอง' },
  { name: 'โรงพยาบาลมงกุฎระยอง', province: 'ระยอง', district: 'เมืองระยอง' },
  { name: 'โรงพยาบาลพระปกเกล้า', province: 'จันทบุรี', district: 'เมืองจันทบุรี' },
  { name: 'โรงพยาบาลตราด', province: 'ตราด', district: 'เมืองตราด' },
  { name: 'โรงพยาบาลเจ้าพระยาอภัยภูเบศร', province: 'ปราจีนบุรี', district: 'เมืองปราจีนบุรี' },
  { name: 'โรงพยาบาลสระแก้ว', province: 'สระแก้ว', district: 'เมืองสระแก้ว' },
  { name: 'โรงพยาบาลฉะเชิงเทรา', province: 'ฉะเชิงเทรา', district: 'เมืองฉะเชิงเทรา' },
  
  // ภาคตะวันตก
  { name: 'โรงพยาบาลหัวหิน', province: 'ประจวบคีรีขันธ์', district: 'หัวหิน' },
  { name: 'โรงพยาบาลกรุงเทพหัวหิน', province: 'ประจวบคีรีขันธ์', district: 'หัวหิน' },
  { name: 'โรงพยาบาลประจวบคีรีขันธ์', province: 'ประจวบคีรีขันธ์', district: 'เมืองประจวบคีรีขันธ์' },
  { name: 'โรงพยาบาลราชบุรี', province: 'ราชบุรี', district: 'เมืองราชบุรี' },
  { name: 'โรงพยาบาลเพชรบุรี', province: 'เพชรบุรี', district: 'เมืองเพชรบุรี' },
  { name: 'โรงพยาบาลกาญจนบุรี', province: 'กาญจนบุรี', district: 'เมืองกาญจนบุรี' },
  { name: 'โรงพยาบาลมะการักษ์', province: 'กาญจนบุรี', district: 'ท่ามะกา' },
  { name: 'โรงพยาบาลสุพรรณบุรี', province: 'สุพรรณบุรี', district: 'เมืองสุพรรณบุรี' },
  { name: 'โรงพยาบาลเจ้าพระยายมราช', province: 'สุพรรณบุรี', district: 'เมืองสุพรรณบุรี' },
  
  // ภาคใต้
  { name: 'โรงพยาบาลสงขลานครินทร์', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลหาดใหญ่', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลสงขลา', province: 'สงขลา', district: 'เมืองสงขลา' },
  { name: 'โรงพยาบาลกรุงเทพหาดใหญ่', province: 'สงขลา', district: 'หาดใหญ่' },
  { name: 'โรงพยาบาลมหาราชนครศรีธรรมราช', province: 'นครศรีธรรมราช', district: 'เมืองนครศรีธรรมราช' },
  { name: 'โรงพยาบาลสุราษฎร์ธานี', province: 'สุราษฎร์ธานี', district: 'เมืองสุราษฎร์ธานี' },
  { name: 'โรงพยาบาลกรุงเทพสมุย', province: 'สุราษฎร์ธานี', district: 'เกาะสมุย' },
  { name: 'โรงพยาบาลวชิระภูเก็ต', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลกรุงเทพภูเก็ต', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลดีบุก', province: 'ภูเก็ต', district: 'เมืองภูเก็ต' },
  { name: 'โรงพยาบาลกระบี่', province: 'กระบี่', district: 'เมืองกระบี่' },
  { name: 'โรงพยาบาลตรัง', province: 'ตรัง', district: 'เมืองตรัง' },
  { name: 'โรงพยาบาลพัทลุง', province: 'พัทลุง', district: 'เมืองพัทลุง' },
  { name: 'โรงพยาบาลนราธิวาสราชนครินทร์', province: 'นราธิวาส', district: 'เมืองนราธิวาส' },
  { name: 'โรงพยาบาลปัตตานี', province: 'ปัตตานี', district: 'เมืองปัตตานี' },
  { name: 'โรงพยาบาลยะลา', province: 'ยะลา', district: 'เมืองยะลา' },
  { name: 'โรงพยาบาลสตูล', province: 'สตูล', district: 'เมืองสตูล' },
  { name: 'โรงพยาบาลชุมพรเขตรอุดมศักดิ์', province: 'ชุมพร', district: 'เมืองชุมพร' },
  { name: 'โรงพยาบาลระนอง', province: 'ระนอง', district: 'เมืองระนอง' },
  { name: 'โรงพยาบาลพังงา', province: 'พังงา', district: 'เมืองพังงา' },
];

// ====== FUZZY SEARCH FUNCTION ======
function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Direct include
  if (textLower.includes(queryLower)) return true;
  
  // Remove common prefixes for matching
  const cleanText = textLower.replace(/^(โรงพยาบาล|รพ\.?|รพ |hospital|clinic|คลินิก)/i, '').trim();
  const cleanQuery = queryLower.replace(/^(โรงพยาบาล|รพ\.?|รพ |hospital|clinic|คลินิก)/i, '').trim();
  
  if (cleanText.includes(cleanQuery)) return true;
  if (cleanQuery.length > 2 && cleanText.includes(cleanQuery.substring(0, cleanQuery.length - 1))) return true;
  
  return false;
}

function searchLocalHospitals(query: string): Array<{ name: string; province: string; district: string }> {
  if (!query || query.length < 1) return [];
  
  return LOCAL_HOSPITALS.filter(h => 
    fuzzyMatch(h.name, query) || 
    fuzzyMatch(h.province, query) || 
    fuzzyMatch(h.district, query)
  ).slice(0, 8);
}

interface PlaceResult {
  name: string;
  province: string;
  district: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  address?: {
    amenity?: string;
    hospital?: string;
    clinic?: string;
    building?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    province?: string;
    county?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function PlaceAutocomplete({
  value,
  onSelect,
  placeholder = 'ค้นหาโรงพยาบาล/คลินิก/สถานที่...',
  label,
  error,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // INSTANT search from local database (no debounce!)
  const searchLocalInstant = (text: string): PlaceResult[] => {
    const localResults = searchLocalHospitals(text);
    return localResults.map(h => ({
      name: h.name,
      province: h.province,
      district: h.district,
      address: `${h.name}, ${h.district}, ${h.province}`,
    }));
  };

  // Search places using Nominatim (FREE) - with debounce
  const searchOnlineDebounced = useCallback(
    debounce(async (text: string, currentLocalResults: PlaceResult[]) => {
      if (!text || text.length < 3) {
        return;
      }

      try {
        // Search in Thailand only
        const params = new URLSearchParams({
          q: text + ' hospital Thailand',
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'th',
          'accept-language': 'th',
        });

        const response = await fetch(`${NOMINATIM_API}?${params}`, {
          headers: {
            'User-Agent': 'NurseShiftApp/1.0',
          },
        });

        const data: NominatimResult[] = await response.json();

        const onlinePlaces: PlaceResult[] = data.map((item) => {
          const addr = item.address || {};
          
          // Extract name
          let name = item.name || 
                     addr.amenity || 
                     addr.hospital || 
                     addr.clinic || 
                     addr.building ||
                     item.display_name.split(',')[0];

          // Extract province
          let province = addr.state || addr.province || '';
          province = province.replace('จังหวัด', '').trim();
          if (province === 'กรุงเทพ' || province.includes('Bangkok')) {
            province = 'กรุงเทพมหานคร';
          }

          // Extract district
          let district = addr.city_district || addr.suburb || addr.county || addr.city || '';
          district = district.replace(/^(เขต|อำเภอ|อ\.)/g, '').trim();

          return {
            name,
            province,
            district,
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        // Merge with local results, avoiding duplicates
        const existingNames = new Set(currentLocalResults.map(r => r.name.toLowerCase()));
        const uniqueOnline = onlinePlaces.filter(p => !existingNames.has(p.name.toLowerCase()));
        
        setResults([...currentLocalResults, ...uniqueOnline]);
        setShowResults(true);
      } catch (error) {
        console.error('Online search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300), // Reduced debounce to 300ms
    []
  );

  const handleTextChange = (text: string) => {
    setQuery(text);
    
    if (!text || text.length < 1) {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    // INSTANT local search (no debounce)
    const localResults = searchLocalInstant(text);
    setResults(localResults);
    setShowResults(localResults.length > 0);

    // Also search online in background (with debounce)
    if (text.length >= 2) {
      setIsLoading(true);
      searchOnlineDebounced(text, localResults);
    }
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.name);
    setShowResults(false);
    Keyboard.dismiss();
    onSelect(place);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect({ name: '', province: '', district: '' });
  };

  const renderResultItem = ({ item }: { item: PlaceResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="location" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
        </Text>
        {(item.district || item.province) && (
          <Text style={styles.resultAddress} numberOfLines={1}>
            {item.district ? `${item.district}, ` : ''}{item.province}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputError]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* No results */}
      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>ไม่พบสถานที่ที่ค้นหา</Text>
          <Text style={styles.noResultsHint}>ลองพิมพ์ชื่อโรงพยาบาลหรือคลินิก</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// Quick Place Picker (Popular hospitals)
// ============================================
interface QuickPlacePickerProps {
  province?: string;
  onSelect: (place: PlaceResult) => void;
}

const POPULAR_HOSPITALS = [
  { name: 'โรงพยาบาลศิริราช', province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย' },
  { name: 'โรงพยาบาลจุฬาลงกรณ์', province: 'กรุงเทพมหานคร', district: 'ปทุมวัน' },
  { name: 'โรงพยาบาลรามาธิบดี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลราชวิถี', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลพระมงกุฎเกล้า', province: 'กรุงเทพมหานคร', district: 'ราชเทวี' },
  { name: 'โรงพยาบาลภูมิพลอดุลยเดช', province: 'กรุงเทพมหานคร', district: 'สายไหม' },
];

export function QuickPlacePicker({ province, onSelect }: QuickPlacePickerProps) {
  const hospitals = province
    ? POPULAR_HOSPITALS.filter((h) => h.province === province).slice(0, 4)
    : POPULAR_HOSPITALS.slice(0, 4);

  if (hospitals.length === 0) return null;

  return (
    <View style={styles.quickPickerContainer}>
      <Text style={styles.quickPickerTitle}>⚡ เลือกเร็ว</Text>
      <View style={styles.quickPickerList}>
        {hospitals.map((hospital, index) => (
          <TouchableOpacity
            key={`${hospital.name}-${index}`}
            style={styles.quickPickerItem}
            onPress={() => onSelect({
              name: hospital.name,
              province: hospital.province,
              district: hospital.district,
            })}
          >
            <Text style={styles.quickPickerItemText}>🏥 {hospital.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    maxHeight: 250,
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  resultsList: {
    borderRadius: BORDER_RADIUS.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  noResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  noResultsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noResultsHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // Quick picker
  quickPickerContainer: {
    marginTop: SPACING.md,
  },
  quickPickerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  quickPickerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  quickPickerItem: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  quickPickerItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
});

export default PlaceAutocomplete;
