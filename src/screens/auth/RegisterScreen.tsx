// ============================================
// REGISTER SCREEN - With Phone, Email, Username support
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

// ============================================
// Types
// ============================================
type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

type RegisterMethod = 'email' | 'phone';

// ============================================
// Component
// ============================================
export default function RegisterScreen({ navigation }: Props) {
  // Registration method
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('email');
  
  // Common State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Email State
  const [email, setEmail] = useState('');
  
  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Auth context
  const { register, isLoading, error, clearError } = useAuth();

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Format phone number
  const formatPhoneInput = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Validate phone number
  const isValidPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^0[689]\d{8}$/.test(cleaned);
  };

  // Generate random 6-digit OTP
  const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (!isValidPhone(cleaned)) {
      setErrors({ ...errors, phone: 'กรุณากรอกเบอร์โทรที่ถูกต้อง (เริ่มด้วย 06, 08, 09)' });
      return;
    }

    // Generate OTP (In production, this should be sent via SMS service)
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setCountdown(60);
    setErrors({ ...errors, phone: '' });

    // Show OTP in alert for demo (In production, send via SMS)
    Alert.alert(
      'รหัส OTP (Demo)',
      `รหัส OTP ของคุณคือ: ${newOtp}\n\nหมายเหตุ: ในระบบจริงจะส่งผ่าน SMS`,
      [{ text: 'ตกลง' }]
    );
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      setErrors({ ...errors, otp: '' });
      Alert.alert('สำเร็จ', 'ยืนยันเบอร์โทรสำเร็จแล้ว ✓');
    } else {
      setErrors({ ...errors, otp: 'รหัส OTP ไม่ถูกต้อง' });
    }
  };

  // Validate username
  const isValidUsername = (name: string): boolean => {
    // 3-20 characters, alphanumeric and underscore only
    return /^[a-zA-Z0-9_]{3,20}$/.test(name);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'กรุณากรอกชื่อ-นามสกุล';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // Optional username validation
    if (username.trim() && !isValidUsername(username.trim())) {
      newErrors.username = 'Username ต้องเป็น a-z, 0-9, _ และ 3-20 ตัวอักษร';
    }

    if (registerMethod === 'email') {
      if (!email.trim()) {
        newErrors.email = 'กรุณากรอกอีเมล';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    } else {
      // Phone registration
      if (!phone.trim()) {
        newErrors.phone = 'กรุณากรอกเบอร์โทร';
      } else if (!isValidPhone(phone)) {
        newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
      }
      
      if (!otpVerified) {
        newErrors.otp = 'กรุณายืนยันเบอร์โทรด้วย OTP';
      }
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    if (!agreeTerms) {
      newErrors.terms = 'กรุณายอมรับข้อตกลงและเงื่อนไข';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle register
  const handleRegister = async () => {
    clearError();
    
    if (!validateForm()) return;

    try {
      // For phone registration, use phone as email with @phone.nurseshift.app
      const registrationEmail = registerMethod === 'email' 
        ? email.trim() 
        : `${phone.replace(/\D/g, '')}@phone.nurseshift.app`;

      await register(registrationEmail, password, displayName.trim(), 'nurse');
      Alert.alert(
        'สมัครสมาชิกสำเร็จ 🎉',
        'ยินดีต้อนรับสู่ NurseShift!',
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', err.message || 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle login
  const handleLogin = () => {
    navigation.navigate('Login');
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← ย้อนกลับ</Text>
            </TouchableOpacity>
            <Text style={styles.title}>สมัครสมาชิก</Text>
            <Text style={styles.subtitle}>สร้างบัญชีเพื่อรับ-ส่งเวร</Text>
          </View>

          {/* Registration Method Selection */}
          <View style={styles.methodSection}>
            <Text style={styles.methodLabel}>สมัครด้วย</Text>
            <View style={styles.methodOptions}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  registerMethod === 'email' && styles.methodOptionSelected
                ]}
                onPress={() => setRegisterMethod('email')}
              >
                <Text style={styles.methodIcon}>📧</Text>
                <Text style={[
                  styles.methodText,
                  registerMethod === 'email' && styles.methodTextSelected
                ]}>
                  อีเมล
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  registerMethod === 'phone' && styles.methodOptionSelected
                ]}
                onPress={() => setRegisterMethod('phone')}
              >
                <Text style={styles.methodIcon}>📱</Text>
                <Text style={[
                  styles.methodText,
                  registerMethod === 'phone' && styles.methodTextSelected
                ]}>
                  เบอร์โทร
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Form */}
          <View style={styles.form}>
            <Input
              label="ชื่อ-นามสกุล"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) setErrors({ ...errors, displayName: '' });
              }}
              placeholder="ชื่อจริง นามสกุล"
              error={errors.displayName}
              icon={<Text>👤</Text>}
              required
            />

            <Input
              label="Username (ไม่บังคับ)"
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              placeholder="เช่น nurse_somchai"
              error={errors.username}
              icon={<Text>@</Text>}
              autoCapitalize="none"
            />

            {/* Email Input */}
            {registerMethod === 'email' && (
              <Input
                label="อีเมล"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                icon={<Text>📧</Text>}
                required
              />
            )}

            {/* Phone Input with OTP */}
            {registerMethod === 'phone' && (
              <>
                <View style={styles.phoneSection}>
                  <View style={styles.phoneInputContainer}>
                    <Input
                      label="เบอร์โทร"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(formatPhoneInput(text));
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                        setOtpVerified(false);
                        setOtpSent(false);
                      }}
                      placeholder="08X-XXX-XXXX"
                      keyboardType="phone-pad"
                      error={errors.phone}
                      icon={<Text>📱</Text>}
                      required
                      editable={!otpVerified}
                    />
                  </View>
                  
                  {!otpVerified && (
                    <TouchableOpacity
                      style={[
                        styles.otpButton,
                        (countdown > 0 || !isValidPhone(phone)) && styles.otpButtonDisabled
                      ]}
                      onPress={handleSendOtp}
                      disabled={countdown > 0 || !isValidPhone(phone)}
                    >
                      <Text style={styles.otpButtonText}>
                        {countdown > 0 ? `รอ ${countdown}s` : otpSent ? 'ส่งอีกครั้ง' : 'ส่ง OTP'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {otpVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ ยืนยันแล้ว</Text>
                    </View>
                  )}
                </View>

                {/* OTP Input */}
                {otpSent && !otpVerified && (
                  <View style={styles.otpSection}>
                    <View style={styles.otpInputContainer}>
                      <Input
                        label="รหัส OTP"
                        value={otp}
                        onChangeText={(text) => {
                          setOtp(text.replace(/\D/g, '').slice(0, 6));
                          if (errors.otp) setErrors({ ...errors, otp: '' });
                        }}
                        placeholder="กรอกรหัส 6 หลัก"
                        keyboardType="number-pad"
                        maxLength={6}
                        error={errors.otp}
                        icon={<Text>🔐</Text>}
                        required
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.verifyButton,
                        otp.length !== 6 && styles.verifyButtonDisabled
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={otp.length !== 6}
                    >
                      <Text style={styles.verifyButtonText}>ยืนยัน</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            <Input
              label="รหัสผ่าน"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              secureTextEntry={!showPassword}
              error={errors.password}
              icon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              }
              iconPosition="right"
              required
            />

            <Input
              label="ยืนยันรหัสผ่าน"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              secureTextEntry={!showPassword}
              error={errors.confirmPassword}
              required
            />

            {/* Terms Agreement */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                ฉันยอมรับ{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Terms' as any)}
                >
                  ข้อตกลงและเงื่อนไข
                </Text>
                {' '}และ{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Privacy' as any)}
                >
                  นโยบายความเป็นส่วนตัว
                </Text>
              </Text>
            </View>
            {errors.terms && (
              <Text style={styles.termsError}>{errors.terms}</Text>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Register Button */}
            <Button
              title="สมัครสมาชิก"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="large"
              style={{ marginTop: SPACING.md }}
              disabled={registerMethod === 'phone' && !otpVerified}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>มีบัญชีอยู่แล้ว? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Header
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Method Selection
  methodSection: {
    marginBottom: SPACING.lg,
  },
  methodLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  methodOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  methodOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#e8f4fd',
  },
  methodIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  methodText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  methodTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Form
  form: {
    marginBottom: SPACING.xl,
  },

  // Phone Section
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  phoneInputContainer: {
    flex: 1,
  },
  otpButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  otpButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  otpButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  verifiedText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },

  // OTP Section
  otpSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  otpInputContainer: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    padding: SPACING.xs,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsError: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    marginLeft: 30,
  },

  // Error
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
});
