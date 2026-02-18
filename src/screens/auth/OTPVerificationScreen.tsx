// ============================================
// OTP VERIFICATION SCREEN
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { KittenButton as Button } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { sendMockOTP, verifyMockOTP, isValidThaiPhone } from '../../services/otpService';
import { AuthStackParamList } from '../../types';

// ============================================
// Types
// ============================================
type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

// ============================================
// Component
// ============================================
export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { phone, registrationData } = route.params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devOtp, setDevOtp] = useState<string>(''); // For development testing
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP on mount
  useEffect(() => {
    handleSendOTP();
  }, []);

  // Send OTP
  const handleSendOTP = async () => {
    setIsResending(true);
    try {
      const result = await sendMockOTP(phone);
      if (result.success) {
        setCountdown(60);
        // Show OTP in dev mode (remove in production!)
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert(
            '📱 รหัส OTP (Dev Mode)',
            `รหัส OTP ของคุณคือ: ${result.otp}\n\nหมายเหตุ: ใน Production จะส่งผ่าน SMS จริง`,
            [{ text: 'ตกลง' }]
          );
        }
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถส่ง OTP ได้');
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่ง OTP ได้');
    } finally {
      setIsResending(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        Keyboard.dismiss();
        handleVerifyOTP(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('กรุณากรอก OTP', 'กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = verifyMockOTP(phone, code);
      
      if (isValid) {
        // OTP verified! Proceed with registration
        if (Platform.OS === 'web') {
          window.alert('ยืนยันสำเร็จ! ✅\n\nเบอร์โทรศัพท์ของคุณได้รับการยืนยันแล้ว');
          navigation.replace('ChooseRole', {
            phone,
            phoneVerified: true,
            registrationData,
          });
        } else {
          Alert.alert(
            'ยืนยันสำเร็จ! ✅',
            'เบอร์โทรศัพท์ของคุณได้รับการยืนยันแล้ว',
            [
              {
                text: 'ดำเนินการต่อ',
                onPress: () => {
                  navigation.replace('ChooseRole', {
                    phone,
                    phoneVerified: true,
                    registrationData,
                  });
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('รหัส OTP ไม่ถูกต้อง', 'กรุณาตรวจสอบและลองใหม่อีกครั้ง');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถยืนยัน OTP ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNum;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={50} color={COLORS.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>ยืนยันเบอร์โทรศัพท์</Text>
        <Text style={styles.subtitle}>
          เราได้ส่งรหัส OTP 6 หลักไปที่
        </Text>
        <Text style={styles.phone}>{formatPhoneDisplay(phone)}</Text>

        {/* Dev Mode OTP Display */}
        {devOtp && (
          <View style={styles.devOtpContainer}>
            <Text style={styles.devOtpLabel}>🔧 Dev Mode - OTP:</Text>
            <Text style={styles.devOtpCode}>{devOtp}</Text>
          </View>
        )}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify Button */}
        <Button
          title={isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
          onPress={() => handleVerifyOTP()}
          loading={isLoading}
          disabled={otp.join('').length !== 6}
          style={styles.verifyButton}
        />

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>ไม่ได้รับรหัส? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>ส่งใหม่ได้ใน {countdown} วินาที</Text>
          ) : (
            <TouchableOpacity onPress={handleSendOTP} disabled={isResending}>
              <Text style={styles.resendLink}>
                {isResending ? 'กำลังส่ง...' : 'ส่งรหัสใหม่'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Change Phone */}
        <TouchableOpacity 
          style={styles.changePhoneButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.changePhoneText}>เปลี่ยนเบอร์โทรศัพท์</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  phone: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  // Dev OTP Display
  devOtpContainer: {
    backgroundColor: COLORS.warningLight || '#FFF3E0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  devOtpLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  devOtpCode: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 8,
  },

  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.text,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  // Verify Button
  verifyButton: {
    marginBottom: SPACING.lg,
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  countdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  resendLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Change Phone
  changePhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  changePhoneText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});
