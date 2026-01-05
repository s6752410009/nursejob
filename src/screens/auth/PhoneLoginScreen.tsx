// ============================================
// PHONE LOGIN SCREEN - ล็อกอินด้วยเบอร์โทร + OTP
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, SuccessModal, ErrorModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { sendMockOTP, verifyMockOTP, isValidThaiPhone } from '../../services/otpService';
import { findUserByPhone } from '../../services/authService';
import { AuthStackParamList } from '../../types';

// ============================================
// Types
// ============================================
type PhoneLoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneLogin'>;

interface Props {
  navigation: PhoneLoginScreenNavigationProp;
}

// ============================================
// Component
// ============================================
export default function PhoneLoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  
  // State
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string>('');
  const [phoneError, setPhoneError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { loginWithPhone } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate phone number
  const validatePhone = (): boolean => {
    if (!phone.trim()) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }
    if (!isValidThaiPhone(phone)) {
      setPhoneError('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เช่น 0812345678)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    setIsLoading(true);
    try {
      // Check if user exists first
      const existingUser = await findUserByPhone(phone);
      if (!existingUser) {
        setErrorMessage('ไม่พบบัญชีที่ลงทะเบียนด้วยเบอร์นี้\nกรุณาสมัครสมาชิกก่อน');
        setShowErrorModal(true);
        setIsLoading(false);
        return;
      }

      // Send OTP
      const result = await sendMockOTP(phone);
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        // Show OTP in dev mode
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert(
            '📱 รหัส OTP (Dev Mode)',
            `รหัส OTP ของคุณคือ: ${result.otp}\n\nหมายเหตุ: ใน Production จะส่งผ่าน SMS จริง`,
            [{ text: 'ตกลง' }]
          );
        }
      } else {
        setErrorMessage(result.error || 'ไม่สามารถส่ง OTP ได้');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const result = await sendMockOTP(phone);
      if (result.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert(
            '📱 รหัส OTP ใหม่',
            `รหัส OTP ของคุณคือ: ${result.otp}`,
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
    if (!/^\d*$/.test(value)) return;

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
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP
      const isValid = verifyMockOTP(phone, code);
      if (!isValid) {
        setErrorMessage('รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
        setShowErrorModal(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
        return;
      }

      // Login with phone
      await loginWithPhone(phone);
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'เข้าสู่ระบบไม่สำเร็จ');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => step === 'otp' ? setStep('phone') : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>📱</Text>
            <Text style={styles.title}>
              {step === 'phone' ? 'เข้าสู่ระบบด้วยเบอร์โทร' : 'ยืนยัน OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'กรอกเบอร์โทรที่ลงทะเบียนไว้'
                : `รหัส OTP ถูกส่งไปที่ ${formatPhoneDisplay(phone)}`}
            </Text>
          </View>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <View style={styles.form}>
              <Input
                label="เบอร์โทรศัพท์"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (phoneError) setPhoneError('');
                }}
                placeholder="0812345678"
                keyboardType="phone-pad"
                error={phoneError}
                icon={<Ionicons name="call-outline" size={20} color={COLORS.textMuted} />}
              />

              <Button
                title="ส่งรหัส OTP"
                onPress={handleSendOTP}
                loading={isLoading}
                style={{ marginTop: SPACING.md }}
              />

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>
                  ยังไม่มีบัญชี? <Text style={styles.registerHighlight}>สมัครสมาชิก</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <View style={styles.otpContainer}>
              {/* OTP Inputs */}
              <View style={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      { color: colors.text, backgroundColor: colors.surface, borderColor: digit ? colors.primary : colors.border },
                      digit ? styles.otpInputFilled : null,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    ส่งรหัสใหม่ใน {countdown} วินาที
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={isResending}
                  >
                    <Text style={styles.resendText}>
                      {isResending ? 'กำลังส่ง...' : 'ส่งรหัส OTP ใหม่'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Dev OTP Display */}
              {__DEV__ && devOtp && (
                <View style={styles.devOtpBox}>
                  <Text style={styles.devOtpLabel}>Dev Mode OTP:</Text>
                  <Text style={styles.devOtpCode}>{devOtp}</Text>
                </View>
              )}

              {/* Verify Button */}
              <Button
                title="ยืนยัน"
                onPress={() => handleVerifyOTP()}
                loading={isLoading}
                disabled={otp.join('').length !== 6}
                style={{ marginTop: SPACING.lg }}
              />

              {/* Change Phone */}
              <TouchableOpacity
                style={styles.changePhoneLink}
                onPress={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setCountdown(0);
                }}
              >
                <Text style={styles.changePhoneText}>เปลี่ยนเบอร์โทร</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="เข้าสู่ระบบสำเร็จ"
        message="ยินดีต้อนรับกลับมา!"
        icon="✅"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.getParent()?.goBack();
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="เกิดข้อผิดพลาด"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  registerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  registerHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // OTP Styles
  otpContainer: {
    flex: 1,
    alignItems: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBackground,
  },
  resendContainer: {
    marginTop: SPACING.md,
  },
  countdownText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  changePhoneLink: {
    marginTop: SPACING.lg,
  },
  changePhoneText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },

  // Dev OTP Box
  devOtpBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  devOtpLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    marginBottom: 4,
  },
  devOtpCode: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 4,
  },
});
