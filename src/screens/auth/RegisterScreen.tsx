// ============================================
// REGISTER SCREEN - Simple with Email, Phone, Username
// ============================================

import React, { useState } from 'react';
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
import { CommonActions } from '@react-navigation/native';
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

// ============================================
// Component
// ============================================
export default function RegisterScreen({ navigation }: Props) {
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth context
  const { register, isLoading, error, clearError } = useAuth();

  // Format phone number
  const formatPhoneInput = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Validate phone number
  const isValidPhone = (phoneNumber: string): boolean => {
    if (!phoneNumber) return true; // Phone is optional
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^0[689]\d{8}$/.test(cleaned);
  };

  // Validate username
  const isValidUsername = (name: string): boolean => {
    if (!name) return true; // Username is optional
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

    if (username.trim() && !isValidUsername(username.trim())) {
      newErrors.username = 'Username ต้องเป็น a-z, 0-9, _ และ 3-20 ตัวอักษร';
    }

    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
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
      await register(
        email.trim(), 
        password, 
        displayName.trim(), 
        'nurse',
        username.trim() || undefined,
        phone.replace(/\D/g, '') || undefined
      );
      
      // Show success alert
      Alert.alert(
        '🎉 สมัครสมาชิกสำเร็จ',
        'ยินดีต้อนรับสู่ NurseShift!\nคุณสามารถเริ่มใช้งานได้เลย',
        [{ 
          text: 'เริ่มใช้งาน',
          onPress: () => {
            // Navigation will be handled by auth state change
          }
        }]
      );
    } catch (err: any) {
      Alert.alert(
        '❌ สมัครสมาชิกไม่สำเร็จ', 
        err.message || 'กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    }
  };

  // Handle login navigation
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

          {/* Register Form */}
          <View style={styles.form}>
            {/* Name */}
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

            {/* Username */}
            <Input
              label="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              placeholder="สำหรับใช้ login (เช่น nurse_somchai)"
              error={errors.username}
              icon={<Text>@</Text>}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              💡 ใช้ Username หรือ Email ในการเข้าสู่ระบบได้
            </Text>

            {/* Email */}
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

            {/* Phone */}
            <Input
              label="เบอร์โทร"
              value={phone}
              onChangeText={(text) => {
                setPhone(formatPhoneInput(text));
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="08X-XXX-XXXX"
              keyboardType="phone-pad"
              error={errors.phone}
              icon={<Text>📱</Text>}
            />

            {/* Password */}
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

            {/* Confirm Password */}
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
                <Text style={styles.termsLink}>ข้อตกลงและเงื่อนไข</Text>
                {' '}และ{' '}
                <Text style={styles.termsLink}>นโยบายความเป็นส่วนตัว</Text>
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
              title={isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="large"
              style={{ marginTop: SPACING.md }}
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

  // Form
  form: {
    marginBottom: SPACING.xl,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
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
    paddingBottom: SPACING.xl,
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
