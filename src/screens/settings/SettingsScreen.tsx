// ============================================
// SETTINGS SCREEN - Production Ready
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';

interface Settings {
  notifications: {
    pushEnabled: boolean;
    newJobs: boolean;
    messages: boolean;
    applications: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showOnlineStatus: boolean;
  };
  preferences: {
    language: 'th' | 'en';
    theme: 'light' | 'dark' | 'system';
  };
}

const defaultSettings: Settings = {
  notifications: {
    pushEnabled: true,
    newJobs: true,
    messages: true,
    applications: true,
    marketing: false,
  },
  privacy: {
    profileVisible: true,
    showOnlineStatus: true,
  },
  preferences: {
    language: 'th',
    theme: 'light',
  },
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('settings');
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateNotification = (key: keyof Settings['notifications'], value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    };
    saveSettings(newSettings);
  };

  const updatePrivacy = (key: keyof Settings['privacy'], value: boolean) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            await logout();
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'ลบบัญชี',
      'การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบอย่างถาวร',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบบัญชี',
          style: 'destructive',
          onPress: () => {
            Alert.alert('ติดต่อเรา', 'กรุณาติดต่อ support@nursejob.th เพื่อขอลบบัญชี');
          },
        },
      ]
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    onPress,
    showArrow,
    destructive,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={destructive ? COLORS.error : COLORS.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {onValueChange !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={value ? COLORS.primary : COLORS.white}
        />
      )}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <SectionHeader title="การแจ้งเตือน" />
        <View style={styles.section}>
          <SettingRow
            icon="notifications"
            title="การแจ้งเตือน Push"
            subtitle="เปิด/ปิดการแจ้งเตือนทั้งหมด"
            value={settings.notifications.pushEnabled}
            onValueChange={(v) => updateNotification('pushEnabled', v)}
          />
          <SettingRow
            icon="briefcase"
            title="งานใหม่"
            subtitle="แจ้งเตือนเมื่อมีงานที่ตรงกับความสนใจ"
            value={settings.notifications.newJobs}
            onValueChange={(v) => updateNotification('newJobs', v)}
          />
          <SettingRow
            icon="chatbubble"
            title="ข้อความ"
            subtitle="แจ้งเตือนเมื่อได้รับข้อความใหม่"
            value={settings.notifications.messages}
            onValueChange={(v) => updateNotification('messages', v)}
          />
          <SettingRow
            icon="document-text"
            title="สถานะการสมัคร"
            subtitle="แจ้งเตือนเมื่อมีการอัพเดทใบสมัคร"
            value={settings.notifications.applications}
            onValueChange={(v) => updateNotification('applications', v)}
          />
          <SettingRow
            icon="megaphone"
            title="โปรโมชั่น"
            subtitle="รับข่าวสารและโปรโมชั่น"
            value={settings.notifications.marketing}
            onValueChange={(v) => updateNotification('marketing', v)}
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="ความเป็นส่วนตัว" />
        <View style={styles.section}>
          <SettingRow
            icon="eye"
            title="โปรไฟล์สาธารณะ"
            subtitle="อนุญาตให้โรงพยาบาลดูโปรไฟล์ของคุณ"
            value={settings.privacy.profileVisible}
            onValueChange={(v) => updatePrivacy('profileVisible', v)}
          />
          <SettingRow
            icon="radio-button-on"
            title="แสดงสถานะออนไลน์"
            subtitle="ให้ผู้อื่นเห็นว่าคุณออนไลน์อยู่"
            value={settings.privacy.showOnlineStatus}
            onValueChange={(v) => updatePrivacy('showOnlineStatus', v)}
          />
        </View>

        {/* Support */}
        <SectionHeader title="ช่วยเหลือและสนับสนุน" />
        <View style={styles.section}>
          <SettingRow
            icon="help-circle"
            title="คำถามที่พบบ่อย"
            onPress={() => (navigation as any).navigate('Help')}
            showArrow
          />
          <SettingRow
            icon="mail"
            title="ติดต่อเรา"
            subtitle="support@nursejob.th"
            onPress={() => Linking.openURL('mailto:support@nursejob.th')}
            showArrow
          />
          <SettingRow
            icon="star"
            title="ให้คะแนนแอป"
            onPress={() => Alert.alert('ขอบคุณ!', 'ขอบคุณที่สนับสนุนเรา')}
            showArrow
          />
        </View>

        {/* Legal */}
        <SectionHeader title="ข้อมูลทางกฎหมาย" />
        <View style={styles.section}>
          <SettingRow
            icon="document"
            title="เงื่อนไขการใช้งาน"
            onPress={() => (navigation as any).navigate('Terms')}
            showArrow
          />
          <SettingRow
            icon="shield-checkmark"
            title="นโยบายความเป็นส่วนตัว"
            onPress={() => (navigation as any).navigate('Privacy')}
            showArrow
          />
        </View>

        {/* Account */}
        {user && (
          <>
            <SectionHeader title="บัญชี" />
            <View style={styles.section}>
              <SettingRow
                icon="log-out"
                title="ออกจากระบบ"
                onPress={handleLogout}
                destructive
              />
              <SettingRow
                icon="trash"
                title="ลบบัญชี"
                subtitle="ลบข้อมูลทั้งหมดอย่างถาวร"
                onPress={handleDeleteAccount}
                destructive
              />
            </View>
          </>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>NurseJob</Text>
          <Text style={styles.appVersion}>เวอร์ชัน 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 NurseJob Thailand</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  section: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rowIconDestructive: {
    backgroundColor: COLORS.errorLight,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  rowTitleDestructive: {
    color: COLORS.error,
  },
  rowSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  appName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  copyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
