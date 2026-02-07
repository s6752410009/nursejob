// ============================================
// ADMIN CONFIGURATION - Secure Credentials
// ============================================
// ⚠️ สำคัญ: ตั้งค่า environment variables ตรงนี้ก่อนใช้
// 
// ตั้งค่าต้องมี 2 วิธี:
// 1. Local Development (.env):
//    EXPO_PUBLIC_ADMIN_USERNAME=
//    EXPO_PUBLIC_ADMIN_PASSWORD_HASH=
//
// 2. Production (Firebase Environment Variables):
//    ใช้ Firebase Cloud Functions secrets
//
// ⚠️ ไม่เคยใส่ password plaintext ใน source code!
// ============================================

import Constants from 'expo-constants';

// ============================================
// Admin Credentials Configuration
// ============================================
export const ADMIN_CONFIG = {
  // อ่าน username จาก .env file
  username: Constants.expoConfig?.extra?.adminUsername || 
           process.env.EXPO_PUBLIC_ADMIN_USERNAME || 
           'admin', // ⚠️ ต้องเปลี่ยนในการใช้จริง
  
  // อ่าน password hash จาก .env file (ไม่ใช่ plaintext password!)
  passwordHash: Constants.expoConfig?.extra?.adminPasswordHash || 
               process.env.EXPO_PUBLIC_ADMIN_PASSWORD_HASH || 
               '', // ⚠️ ต้องใส่ hash ที่ generate มา
  
  // Display name (ตัวเลือก เปลี่ยนค่าตามต้องการ)
  displayName: 'Administrator',
  
  // Email (ตัวเลือก)
  email: 'admin@nursego.admin',
};

// ============================================
// Environment Variable Validation
// ============================================
export function validateAdminConfig(): { valid: boolean; error?: string } {
  if (!ADMIN_CONFIG.username) {
    return {
      valid: false,
      error: '⚠️ ADMIN_USERNAME not configured. Set EXPO_PUBLIC_ADMIN_USERNAME in .env',
    };
  }

  if (!ADMIN_CONFIG.passwordHash) {
    return {
      valid: false,
      error: '⚠️ ADMIN_PASSWORD_HASH not configured. Set EXPO_PUBLIC_ADMIN_PASSWORD_HASH in .env',
    };
  }

  return { valid: true };
}

// ============================================
// How to Setup (วิธีตั้งค่า)
// ============================================
/*
STEP 1: Generate password hash (ใช้ scripts/generateAdminHash.js)
  node scripts/generateAdminHash.js YOUR_PASSWORD
  → จะได้ hash value

STEP 2: เพิ่มใน .env file:
  EXPO_PUBLIC_ADMIN_USERNAME=adminmark
  EXPO_PUBLIC_ADMIN_PASSWORD_HASH=9b4555ae53a43a3fb6d3b2eca73de89c918a8d0483c26fe548c6ce03829a7776

STEP 3: สำหรับ production (Cloud Functions) ตั้งค่า Firebase secrets:
  firebase functions:config:set admin.username="admin" admin.password_hash="..."
*/
