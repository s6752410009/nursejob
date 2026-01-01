// ============================================
// ADMIN LOGIN SCREEN
// หน้าเข้าสู่ระบบสำหรับ Admin
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
import { useNavigation } from '@react-navigation/native';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

// ============================================
// Types
// ============================================
type AdminLoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'AdminLogin'>;

interface Props {
  navigation?: AdminLoginScreenNavigationProp;
}

// ============================================
// Component
// ============================================
export default function AdminLoginScreen({ navigation }: Props) {
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Auth context
  const { loginAsAdmin, isLoading, error, clearError } = useAuth();
  const nav = useNavigation<any>();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'กรุณากรอก Username';
    }

    if (!password) {
      newErrors.password = 'กรุณากรอก Password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle admin login
  const handleAdminLogin = async () => {
    clearError();
    
    if (!validateForm()) return;

    try {
      await loginAsAdmin(username.trim(), password);
      // Navigation will be handled by the auth state change
    } catch (err: any) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', err.message || 'Username หรือ Password ไม่ถูกต้อง');
    }
  };

  // Handle back to normal login
  const handleBackToLogin = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      nav.navigate('Login');
    }
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
            <Text style={styles.logo}>🛡️</Text>
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>เข้าสู่ระบบสำหรับผู้ดูแลระบบ</Text>
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              หน้านี้สำหรับผู้ดูแลระบบเท่านั้น{'\n'}
              การเข้าถึงโดยไม่ได้รับอนุญาตถือเป็นการละเมิด
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: undefined });
              }}
              placeholder="กรอก Username"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              icon={<Text>👤</Text>}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="กรอก Password"
              secureTextEntry={!showPassword}
              error={errors.password}
              icon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              }
              iconPosition="right"
            />

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title="เข้าสู่ระบบ Admin"
              onPress={handleAdminLogin}
              loading={isLoading}
              fullWidth
              size="large"
              style={styles.adminButton}
            />
          </View>

          {/* Back to normal login */}
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>← กลับไปหน้า Login ปกติ</Text>
          </TouchableOpacity>
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
    backgroundColor: '#1F2937', // Dark background for admin
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
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B', // Amber color for admin
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: '#9CA3AF',
  },

  // Warning
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
    lineHeight: 20,
  },

  // Form
  form: {
    backgroundColor: '#374151',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: '#F59E0B',
  },

  // Back button
  backButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: FONT_SIZES.md,
  },
});
