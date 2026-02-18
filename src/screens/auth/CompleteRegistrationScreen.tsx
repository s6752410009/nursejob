// ============================================
// COMPLETE REGISTRATION SCREEN (After OTP Verification)
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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { KittenButton as Button, Input, SuccessModal, ErrorModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';
import { getErrorMessage } from '../../utils/helpers';

// ============================================
// Types
// ============================================
type CompleteRegistrationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'CompleteRegistration'>;
type CompleteRegistrationScreenRouteProp = RouteProp<AuthStackParamList, 'CompleteRegistration'>;

interface Props {
  navigation: CompleteRegistrationScreenNavigationProp;
  route: CompleteRegistrationScreenRouteProp;
}

// ============================================
// Component
// ============================================
export default function CompleteRegistrationScreen({ navigation, route }: Props) {
  const { phone, phoneVerified, role } = route.params;
  
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

// Auth context
const { register, isLoading, clearError, user } = useAuth();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'กรุณากรอกชื่อ-นามสกุล';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    clearError();
    if (!validateForm()) return;

    try {
      await register(
        email.trim(),
        password,
        displayName.trim(),
        role || 'user', // ใช้ role ที่เลือก หรือ 'user' ถ้าไม่ได้เลือก
        undefined, // username
        phone // verified phone
      );
      
      // ถ้า register สำเร็จ ให้แสดง success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      // เคสที่ Firebase สร้างบัญชีสำเร็จ แต่ขั้นตอนหลังจากนั้น error
      // (เช่น เก็บข้อมูลลง AsyncStorage หรือ network บางส่วน) ทำให้ register() โยน error
      // ถ้า context มี user แล้ว ให้ถือว่าสมัครสำเร็จ แล้วพาไปหน้า Login
      if (user) {
        setShowSuccessModal(true);
        return;
      }

      let message = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      if (!message.includes('อีเมล') && !message.includes('รหัสผ่าน') && !message.includes('บัญชี')) {
        message = getErrorMessage(err);
      }
      setErrorMessage(message);
      setShowErrorModal(true);
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
            <Text style={styles.title}>สร้างบัญชี</Text>
            <Text style={styles.subtitle}>กรอกข้อมูลเพิ่มเติมเพื่อสมัครสมาชิก</Text>
          </View>

          {/* Verified Phone Badge */}
          <View style={styles.verifiedPhoneContainer}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.verifiedText}>เบอร์ที่ยืนยันแล้ว</Text>
            </View>
            <Text style={styles.phoneNumber}>{formatPhoneDisplay(phone)}</Text>
          </View>

          {/* Form */}
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
              label="อีเมล"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon={<Text>📧</Text>}
              required
            />

            <View>
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
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={COLORS.textMuted} 
                    />
                  </TouchableOpacity>
                }
                iconPosition="right"
                required
              />
            </View>

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
              icon={<Text>🔒</Text>}
              required
            />

            {/* Register Button */}
            <Button
              title="สมัครสมาชิก"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="สมัครสมาชิกสำเร็จ!"
        message="คุณสามารถเข้าสู่ระบบได้แล้ว"
        buttonText="เข้าสู่ระบบ"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.replace('Login');
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="เกิดข้อผิดพลาด"
        message={errorMessage}
        buttonText="ลองใหม่"
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
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
  },

  // Verified Phone
  verifiedPhoneContainer: {
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  verifiedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  phoneNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Form
  form: {
    gap: SPACING.md,
  },
  registerButton: {
    marginTop: SPACING.md,
  },
});
