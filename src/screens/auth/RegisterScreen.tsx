// ============================================
// REGISTER SCREEN - Phone OTP Verification First
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
import { KittenButton as Button, Input, ErrorModal, TermsConsentModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { AuthStackParamList } from '../../types';
import { sendOTP, isValidThaiPhone } from '../../services/otpService';
import { Ionicons } from '@expo/vector-icons';

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
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Format phone number for display
  const formatPhoneInput = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanedPhone = phone.replace(/\D/g, '');

    if (!cleanedPhone) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!isValidThaiPhone(cleanedPhone)) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 08X-XXX-XXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue button press - send OTP directly (dev mode)
  const handleContinuePress = async () => {
    if (!validateForm()) return;
    
    // In dev mode, skip terms modal and send OTP directly
    if (__DEV__) {
      await handleSendOTP();
      return;
    }
    
    // Show terms modal for user to accept
    setShowTermsModal(true);
  };

  // Handle send OTP after accepting terms
  const handleSendOTP = async () => {
    setShowTermsModal(false);
    setIsLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const result = await sendOTP(cleanedPhone);
      
      if (result.success) {
        // Show OTP code in dev mode
        if (__DEV__ && result.otp) {
          console.log(`📱 [DEV] OTP: ${result.otp}`);
          
          // On web, Alert.alert callbacks don't work - navigate directly
          if (Platform.OS === 'web') {
            // Use window.alert then navigate
            window.alert(`🔧 Dev Mode\n\nOTP Code: ${result.otp}\n\n(ใน Production จะส่ง SMS จริง)`);
            navigation.navigate('OTPVerification', {
              phone: cleanedPhone,
            });
          } else {
            // On mobile, use Alert with callback
            Alert.alert(
              '🔧 Dev Mode',
              `OTP Code: ${result.otp}\n\n(ใน Production จะส่ง SMS จริง)`,
              [
                {
                  text: 'ตกลง',
                  onPress: () => {
                    navigation.navigate('OTPVerification', {
                      phone: cleanedPhone,
                    });
                  },
                },
              ]
            );
          }
        } else {
          // Navigate to OTP verification
          navigation.navigate('OTPVerification', {
            phone: cleanedPhone,
          });
        }
      } else {
        setErrorMessage(result.error || 'ไม่สามารถส่ง OTP ได้');
        setShowErrorModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
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
            <Text style={styles.subtitle}>กรอกเบอร์โทรศัพท์เพื่อรับรหัส OTP</Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustration}>
              <Ionicons name="phone-portrait-outline" size={64} color={COLORS.primary} />
            </View>
          </View>

          {/* Phone Input Form */}
          <View style={styles.form}>
            {/* Phone Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                เราจะส่งรหัส OTP 6 หลักไปยังเบอร์โทรศัพท์ของคุณเพื่อยืนยันตัวตน
              </Text>
            </View>

            {/* Phone Input */}
            <Input
              label="เบอร์โทรศัพท์"
              value={phone}
              onChangeText={(text) => {
                setPhone(formatPhoneInput(text));
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="08X-XXX-XXXX"
              keyboardType="phone-pad"
              error={errors.phone}
              icon={<Text style={styles.flagIcon}>🇹🇭</Text>}
              maxLength={12}
              required
            />

            {/* Continue Button */}
            <Button
              title={isLoading ? 'กำลังส่ง OTP...' : 'ขอรหัส OTP'}
              onPress={handleContinuePress}
              loading={isLoading}
              fullWidth
              size="large"
              style={styles.continueButton}
              icon={<Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
              iconPosition="right"
            />

            {/* Note */}
            <Text style={styles.noteText}>
              📱 รองรับเบอร์ไทยที่ขึ้นต้นด้วย 06, 08, 09
            </Text>
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

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="ส่ง OTP ไม่สำเร็จ"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Terms Consent Modal */}
      <TermsConsentModal
        visible={showTermsModal}
        onAccept={handleSendOTP}
        onDecline={() => {
          setShowTermsModal(false);
        }}
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

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  form: {
    marginBottom: SPACING.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },
  flagIcon: {
    fontSize: 20,
  },
  continueButton: {
    marginTop: SPACING.lg,
  },
  noteText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    marginTop: 'auto',
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

