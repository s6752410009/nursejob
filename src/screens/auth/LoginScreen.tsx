// ============================================
// LOGIN SCREEN - Production Ready with Google Sign-In
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Button, Input, Divider, SuccessModal, ErrorModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';
import { validateAdminCredentials } from '../../services/authService';

// Complete auth session for proper redirect handling
WebBrowser.maybeCompleteAuthSession();

// ============================================
// Google OAuth Config
// ============================================
// สำหรับ production คุณต้องสร้าง OAuth credentials ที่ Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = {
  // เปลี่ยนเป็น client ID ของคุณ
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

// ============================================
// Types
// ============================================
type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
  onGuestLogin?: () => void;
}

// ============================================
// Component
// ============================================
export default function LoginScreen({ navigation, onGuestLogin }: Props) {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auth context
  const { login, loginWithGoogle, loginAsAdmin, isLoading, error, clearError } = useAuth();

  // Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    ...GOOGLE_CLIENT_ID,
  });

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      setGoogleLoading(false);
    }
  }, [response]);

  // Handle Google Login
  const handleGoogleLogin = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
      // Navigate back to main after successful Google login
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'กรุณาลองใหม่อีกครั้ง');
      setShowErrorModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเปิดหน้า Google ได้');
      setGoogleLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล หรือ Username';
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if input is admin username
  const isAdminUsername = (input: string): boolean => {
    return validateAdminCredentials(input, password) !== null;
  };

  // Handle login
  const handleLogin = async () => {
    clearError();
    
    if (!validateForm()) return;

    const trimmedInput = email.trim();

    try {
      // Login ผ่าน AuthContext (รองรับทั้ง email, username, และ admin)
      await login(trimmedInput, password);
      
      // Show success modal and navigate back
      setShowSuccessModal(true);
    } catch (err: any) {
      // Check if email not verified - navigate to verification screen
      if (err.code === 'email-not-verified') {
        navigation.navigate('EmailVerification', { email: err.email || trimmedInput });
        return;
      }
      setErrorMessage(err.message || 'กรุณาลองใหม่อีกครั้ง');
      setShowErrorModal(true);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  // Handle register
  const handleRegister = () => {
    navigation.navigate('Register');
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
          {/* Logo & Title */}
          <View style={styles.header}>
            <Text style={styles.logo}>👩‍⚕️</Text>
            <Text style={styles.title}>NurseJob</Text>
            <Text style={styles.subtitle}>แพลตฟอร์มหางานพยาบาล</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="อีเมล หรือ Username"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="อีเมล หรือ Username"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              icon={<Text>👤</Text>}
            />

            <Input
              label="รหัสผ่าน"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="กรอกรหัสผ่าน"
              secureTextEntry={!showPassword}
              error={errors.password}
              icon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              }
              iconPosition="right"
            />

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title="เข้าสู่ระบบ"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="large"
            />

            <Divider text="หรือ" />

            {/* Phone Login Button */}
            <TouchableOpacity
              style={styles.phoneLoginButton}
              onPress={() => navigation.navigate('PhoneLogin')}
            >
              <Text style={styles.phoneLoginIcon}>📱</Text>
              <Text style={styles.phoneLoginText}>
                เข้าสู่ระบบด้วยเบอร์โทร (OTP)
              </Text>
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                (googleLoading || !request) && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || !request}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>
                    เข้าสู่ระบบด้วย Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Guest Mode */}
            {onGuestLogin && (
              <Button
                title="เข้าชมโดยไม่ต้องเข้าสู่ระบบ"
                onPress={onGuestLogin}
                variant="outline"
                fullWidth
              />
            )}
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ยังไม่มีบัญชี? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>สมัครสมาชิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="เข้าสู่ระบบสำเร็จ"
        message="ยินดีต้อนรับกลับมา!"
        icon="✅"
        buttonText="ตกลง"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.getParent()?.goBack();
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="เข้าสู่ระบบไม่สำเร็จ"
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
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  logo: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Phone Login Button
  phoneLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  phoneLoginIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  phoneLoginText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
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
  registerLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
});
