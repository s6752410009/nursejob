// ============================================
// OTP SERVICE - Firebase Phone Authentication
// ============================================

import { 
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
  RecaptchaVerifier,
  ConfirmationResult,
  ApplicationVerifier
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// ==========================================
// Config flags
// ==========================================
// NOTE:
// - ตอนนี้แอปยังไม่มีการเชื่อมต่อ SMS gateway / Firebase Phone Auth
// - เพื่อให้ทั้ง debug / release APK ทดสอบ flow ได้เหมือนกัน
//   เราเลยบังคับให้ใช้ Mock OTP ไปก่อน
// - ถ้าพร้อมใช้ OTP จริง ให้เปลี่ยนเป็น false แล้วเซ็ต Firebase / SMS ให้ครบ
const USE_MOCK_OTP_ALWAYS = true;

// ==========================================
// Phone OTP Functions
// ==========================================

/**
 * Format phone number to E.164 format for Thailand
 * Input: 0812345678 or 081-234-5678
 * Output: +66812345678
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading 0 and add Thailand country code
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Add +66 prefix
  if (!cleaned.startsWith('66')) {
    cleaned = '66' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Validate Thai phone number
 */
export function isValidThaiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Thai mobile: starts with 06, 08, 09 and has 10 digits
  return /^0[689]\d{8}$/.test(cleaned);
}

/**
 * Send OTP to phone number
 * For Web: Uses RecaptchaVerifier
 * For Mobile: Uses Firebase's built-in verification
 * 
 * In Development: Uses mock OTP system
 */
export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier
): Promise<{ success: boolean; verificationId?: string; otp?: string; message?: string; error?: string }> {
  // In development mode หรือบังคับให้ใช้ Mock OTP ตลอด
  if (__DEV__ || USE_MOCK_OTP_ALWAYS) {
    return sendMockOTP(phoneNumber);
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!recaptchaVerifier) {
      // For React Native, we'll use a different approach
      // Firebase will handle SMS automatically
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier as any
      );
      
      return { success: true, verificationId, message: 'OTP ถูกส่งแล้ว' };
    }
    
    // For Web with reCAPTCHA
    const provider = new PhoneAuthProvider(auth);
    const verificationId = await provider.verifyPhoneNumber(
      formattedPhone,
      recaptchaVerifier
    );
    
    return { success: true, verificationId, message: 'OTP ถูกส่งแล้ว' };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    let errorMessage = 'ไม่สามารถส่ง OTP ได้';
    
    if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'ส่ง OTP มากเกินไป กรุณารอสักครู่';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'เกินโควต้าการส่ง SMS กรุณาลองใหม่ภายหลัง';
    }
    
    return { success: false, error: errorMessage, message: errorMessage };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  verificationId: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otpCode);
    
    // If user is already signed in, link phone to account
    if (auth.currentUser) {
      await linkWithCredential(auth.currentUser, credential);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        phoneVerified: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Sign in with phone credential
      await signInWithCredential(auth, credential);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    let errorMessage = 'รหัส OTP ไม่ถูกต้อง';
    
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'รหัส OTP ไม่ถูกต้อง';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'รหัส OTP หมดอายุ กรุณาขอใหม่';
    } else if (error.code === 'auth/credential-already-in-use') {
      errorMessage = 'เบอร์นี้ถูกใช้งานแล้ว';
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Update phone verified status in Firestore
 */
export async function updatePhoneVerifiedStatus(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      phoneVerified: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating phone status:', error);
  }
}

// ==========================================
// Simple OTP (without Firebase Phone Auth)
// Using a mock system for demo/development
// ==========================================

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

/**
 * Generate and "send" OTP (Mock version)
 * In production, integrate with SMS gateway like Twilio, AWS SNS, or local Thai providers
 */
export function generateMockOTP(phoneNumber: string): { otp: string; expiresAt: number } {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  // Store OTP
  otpStore.set(phoneNumber, { otp, expiresAt });
  
  console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
  
  return { otp, expiresAt };
}

/**
 * Verify mock OTP
 */
export function verifyMockOTP(phoneNumber: string, inputOTP: string): boolean {
  const stored = otpStore.get(phoneNumber);
  
  if (!stored) {
    return false;
  }
  
  // Check expiry
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return false;
  }
  
  // Check OTP
  if (stored.otp === inputOTP) {
    otpStore.delete(phoneNumber);
    return true;
  }
  
  return false;
}

/**
 * Send OTP via mock system (shows alert with OTP for testing)
 */
export async function sendMockOTP(phoneNumber: string): Promise<{ success: boolean; otp?: string; message?: string; error?: string }> {
  try {
    if (!isValidThaiPhone(phoneNumber)) {
      return { success: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง', message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' };
    }
    
    const { otp } = generateMockOTP(phoneNumber);
    
    // In development, return OTP for testing
    // In production, send via SMS gateway and don't return OTP
    return { success: true, otp, message: 'OTP ถูกส่งแล้ว' };
  } catch (error) {
    return { success: false, error: 'ไม่สามารถส่ง OTP ได้', message: 'ไม่สามารถส่ง OTP ได้' };
  }
}
