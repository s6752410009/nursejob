// ============================================
// PROFILE SCREEN - Production Ready
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Avatar, Card, Loading, ModalContainer, Input, Badge, Divider, ConfirmModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, POSITIONS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserShiftContacts } from '../../services/jobService';
import { getFavoritesCount } from '../../services/favoritesService';
import { getUnreadNotificationsCount } from '../../services/notificationsService';
import { getUserVerificationStatus, UserVerificationStatus } from '../../services/verificationService';
import { uploadProfilePhoto } from '../../services/storageService';
import { ShiftContact, MainTabParamList, RootStackParamList } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

// ============================================
// Types
// ============================================
type ProfileScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

// ============================================
// Component
// ============================================
export default function ProfileScreen({ navigation }: Props) {
  // Auth context
  const { user, isAuthenticated, logout, updateUser, isLoading: isAuthLoading, isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // State
  const [contacts, setContacts] = useState<ShiftContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<UserVerificationStatus | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    licenseNumber: '',
    experience: '',
    bio: '',
  });

  // Check if user is hospital (no longer used but kept for reference)
  const isHospital = user?.role === 'hospital';

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadAllData();
      }
    }, [user?.uid])
  );

  // Load all data
  const loadAllData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const [shiftsData, favCount, notifCount, verifyStatus] = await Promise.all([
        getUserShiftContacts(user.uid),
        getFavoritesCount(user.uid),
        getUnreadNotificationsCount(user.uid),
        getUserVerificationStatus(user.uid),
      ]);
      setContacts(shiftsData);
      setFavoritesCount(favCount);
      setUnreadNotifications(notifCount);
      setVerificationStatus(verifyStatus);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditModal && user) {
      setEditForm({
        displayName: user.displayName || '',
        phone: user.phone || '',
        licenseNumber: user.licenseNumber || '',
        experience: user.experience?.toString() || '',
        bio: user.bio || '',
      });
    }
  }, [showEditModal, user]);

  // Handle logout - show modal
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Confirm logout
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      // Don't show success modal - user will be logged out immediately
      // The ProfileScreen will unmount because isAuthenticated becomes false
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle photo change
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const handleChangePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('ไม่มีสิทธิ์', 'กรุณาอนุญาตการเข้าถึงรูปภาพ');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0] && user?.uid) {
      setIsUploadingPhoto(true);
      try {
        // Upload to Firebase Storage
        const photoURL = await uploadProfilePhoto(user.uid, result.assets[0].uri);
        
        // Update user profile with new photo URL
        await updateUser({ photoURL });
        
        Alert.alert('สำเร็จ', 'อัพโหลดรูปโปรไฟล์เรียบร้อยแล้ว');
      } catch (error: any) {
        console.error('Upload photo error:', error);
        Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถอัพโหลดรูปได้');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      await updateUser({
        displayName: editForm.displayName,
        phone: editForm.phone,
        licenseNumber: editForm.licenseNumber,
        experience: parseInt(editForm.experience) || 0,
        bio: editForm.bio,
      });
      setShowEditModal(false);
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error: any) {
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge text="รอพิจารณา" variant="warning" size="small" />;
      case 'reviewed':
        return <Badge text="กำลังพิจารณา" variant="info" size="small" />;
      case 'accepted':
        return <Badge text="ผ่านการคัดเลือก" variant="success" size="small" />;
      case 'rejected':
        return <Badge text="ไม่ผ่าน" variant="danger" size="small" />;
      case 'withdrawn':
        return <Badge text="ถอนใบสมัคร" variant="secondary" size="small" />;
      default:
        return <Badge text={status} variant="secondary" size="small" />;
    }
  };

  // Guest view
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>ยังไม่ได้เข้าสู่ระบบ</Text>
          <Text style={styles.guestDescription}>
            เข้าสู่ระบบเพื่อจัดการโปรไฟล์และดูประวัติการสมัครงาน
          </Text>
          <Button
            title="เข้าสู่ระบบ"
            onPress={() => (navigation as any).navigate('Auth')}
            size="large"
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
          <TouchableOpacity 
            onPress={handleLogout}
            activeOpacity={0.7}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>🚪 ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleChangePhoto}
            disabled={isUploadingPhoto}
          >
            <Avatar 
              uri={user?.photoURL} 
              name={user?.displayName || 'User'} 
              size={100}
            />
            <View style={styles.editAvatarBadge}>
              <Text style={styles.editAvatarIcon}>{isUploadingPhoto ? '⏳' : '📷'}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.roleBadge}>
            <Badge 
              text={
                user?.role === 'hospital' 
                  ? '🏥 โรงพยาบาล' 
                  : user?.role === 'admin'
                    ? '⚙️ แอดมิน'
                    : user?.role === 'nurse' || user?.isVerified
                      ? '👩‍⚕️ พยาบาล ✓'
                      : '👤 ผู้ใช้งานทั่วไป'
              } 
              variant={user?.isVerified ? 'success' : 'primary'}
            />
          </View>

          <Button
            title="แก้ไขโปรไฟล์"
            onPress={() => setShowEditModal(true)}
            variant="outline"
            size="small"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Profile Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>เบอร์โทรศัพท์</Text>
              <Text style={styles.infoValue}>{user?.phone || 'ยังไม่ระบุ'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏥</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>เลขใบประกอบวิชาชีพ</Text>
              <Text style={styles.infoValue}>{user?.licenseNumber || 'ยังไม่ระบุ'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ประสบการณ์</Text>
              <Text style={styles.infoValue}>
                {user?.experience ? `${user.experience} ปี` : 'ยังไม่ระบุ'}
              </Text>
            </View>
          </View>

          {user?.bio && (
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.infoIcon}>📝</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>เกี่ยวกับฉัน</Text>
                <Text style={styles.infoValue}>{user.bio}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Shift Contact History */}
        <View style={styles.applicationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ประวัติการติดต่องาน</Text>
            <Text style={styles.applicationCount}>{contacts.length} รายการ</Text>
          </View>

          {isLoading ? (
            <Loading text="กำลังโหลด..." />
          ) : contacts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>ยังไม่มีประวัติการติดต่อ</Text>
              <Button
                title="ค้นหางาน"
                onPress={() => navigation.getParent()?.navigate('Main', { screen: 'Home' })}
                variant="outline"
                size="small"
                style={{ marginTop: SPACING.sm }}
              />
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card 
                key={contact.id} 
                style={styles.applicationCard}
                onPress={() => {
                  // Navigate to shift detail if job data is available
                  if (contact.job) {
                    (navigation as any).navigate('JobDetail', { job: contact.job });
                  }
                }}
              >
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationInfo}>
                    <Text style={styles.applicationJobTitle}>{contact.job?.title || 'เวร'}</Text>
                    <Text style={styles.applicationHospital}>{contact.job?.posterName || 'ผู้โพสต์'}</Text>
                  </View>
                  {getStatusBadge(contact.status)}
                </View>
                <Text style={styles.applicationDate}>
                  ติดต่อเมื่อ {formatRelativeTime(contact.contactedAt)}
                </Text>
              </Card>
            ))
          )}
        </View>

        {/* Quick Links */}
        <Card style={styles.linksCard}>
          <Text style={styles.linksSectionTitle}>เมนู</Text>
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Favorites')}
          >
            <Text style={styles.linkIcon}>❤️</Text>
            <Text style={styles.linkText}>งานที่บันทึกไว้</Text>
            {favoritesCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{favoritesCount}</Text>
              </View>
            )}
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Notifications')}
          >
            <Text style={styles.linkIcon}>🔔</Text>
            <Text style={styles.linkText}>การแจ้งเตือน</Text>
            {unreadNotifications > 0 && (
              <View style={[styles.countBadge, styles.notificationBadge]}>
                <Text style={styles.countText}>{unreadNotifications}</Text>
              </View>
            )}
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Documents')}
          >
            <Text style={styles.linkIcon}>📄</Text>
            <Text style={styles.linkText}>เอกสารของฉัน</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />

          {/* Verification Link */}
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Verification')}
          >
            <Text style={styles.linkIcon}>✅</Text>
            <Text style={styles.linkText}>ยืนยันตัวตนพยาบาล</Text>
            {verificationStatus?.isVerified ? (
              <View style={[styles.countBadge, { backgroundColor: '#4ADE80' }]}>
                <Text style={styles.countText}>✓</Text>
              </View>
            ) : verificationStatus?.pendingRequest ? (
              <View style={[styles.countBadge, { backgroundColor: '#FFA500' }]}>
                <Text style={styles.countText}>รอ</Text>
              </View>
            ) : null}
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('MyPosts')}
          >
            <Text style={styles.linkIcon}>📝</Text>
            <Text style={styles.linkText}>ประกาศของฉัน</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity 
            style={[styles.linkItem, { backgroundColor: '#FFF8E1' }]} 
            onPress={() => nav.navigate('Shop')}
          >
            <Text style={styles.linkIcon}>🛒</Text>
            <Text style={[styles.linkText, { color: '#FF8F00' }]}>ร้านค้า / ซื้อบริการ</Text>
            <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: '#000', fontWeight: '600' }}>Premium</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />
          
          {isHospital && (
            <>
              <TouchableOpacity 
                style={styles.linkItem} 
                onPress={() => nav.navigate('Applicants')}
              >
                <Text style={styles.linkIcon}>👥</Text>
                <Text style={styles.linkText}>จัดการผู้สมัคร</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
              <Divider />
            </>
          )}
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Settings')}
          >
            <Text style={styles.linkIcon}>⚙️</Text>
            <Text style={styles.linkText}>ตั้งค่า</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <Divider />
          
          <TouchableOpacity 
            style={styles.linkItem} 
            onPress={() => nav.navigate('Help')}
          >
            <Text style={styles.linkIcon}>❓</Text>
            <Text style={styles.linkText}>ช่วยเหลือ</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          {/* Admin Dashboard Link - Only for admins */}
          {isAdmin && (
            <>
              <Divider />
              <TouchableOpacity 
                style={[styles.linkItem, styles.adminLink]} 
                onPress={() => nav.navigate('AdminDashboard')}
              >
                <Text style={styles.linkIcon}>🛡️</Text>
                <Text style={[styles.linkText, styles.adminLinkText]}>แผงควบคุม Admin</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <View style={{ height: SPACING.xl * 2 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <ModalContainer
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="แก้ไขโปรไฟล์"
        fullScreen={true}
      >
        <ScrollView style={styles.editModalContent}>
          <Input
            label="ชื่อ-นามสกุล"
            value={editForm.displayName}
            onChangeText={(text) => setEditForm({ ...editForm, displayName: text })}
            placeholder="ชื่อจริง นามสกุล"
            icon={<Text>👤</Text>}
          />

          <Input
            label="เบอร์โทรศัพท์"
            value={editForm.phone}
            onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
            placeholder="0xx-xxx-xxxx"
            keyboardType="phone-pad"
            icon={<Text>📱</Text>}
          />

          <Input
            label="เลขใบประกอบวิชาชีพ"
            value={editForm.licenseNumber}
            onChangeText={(text) => setEditForm({ ...editForm, licenseNumber: text })}
            placeholder="เลขที่ใบอนุญาต"
            icon={<Text>🏥</Text>}
          />

          <Input
            label="ประสบการณ์ทำงาน (ปี)"
            value={editForm.experience}
            onChangeText={(text) => setEditForm({ ...editForm, experience: text })}
            placeholder="0"
            keyboardType="numeric"
            icon={<Text>⏱️</Text>}
          />

          <View style={styles.bioInput}>
            <Text style={styles.bioLabel}>เกี่ยวกับฉัน</Text>
            <TextInput
              style={styles.bioTextInput}
              value={editForm.bio}
              onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
              placeholder="บอกเล่าเกี่ยวกับตัวคุณ ความเชี่ยวชาญ และสิ่งที่คุณมองหา..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={[styles.editModalActions, { paddingBottom: Math.max(insets.bottom, 16) + SPACING.md }]}>
          <Button
            title="ยกเลิก"
            onPress={() => setShowEditModal(false)}
            variant="outline"
            style={{ flex: 1, marginRight: SPACING.sm }}
          />
          <Button
            title="บันทึก"
            onPress={handleSaveProfile}
            loading={isAuthLoading}
            style={{ flex: 1 }}
          />
        </View>
      </ModalContainer>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="ออกจากระบบ"
        message="คุณต้องการออกจากระบบหรือไม่?"
        icon="🚪"
        confirmText="ออกจากระบบ"
        cancelText="ยกเลิก"
        type="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  logoutButton: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.md,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  editAvatarIcon: {
    fontSize: 16,
  },
  displayName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  email: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: SPACING.sm,
  },

  // Info Card
  infoCard: {
    margin: SPACING.md,
    marginTop: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
    width: 30,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  // Applications
  applicationsSection: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  applicationCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  applicationCard: {
    marginBottom: SPACING.sm,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicationInfo: {
    flex: 1,
  },
  applicationJobTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  applicationHospital: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  applicationDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Links Card
  linksCard: {
    margin: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  linksSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
    width: 30,
  },
  linkText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  linkArrow: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  adminLink: {
    backgroundColor: '#FEF3C7', // Light amber background
  },
  adminLinkText: {
    color: '#B45309', // Amber color for admin text
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: SPACING.sm,
  },
  notificationBadge: {
    backgroundColor: COLORS.danger,
  },
  countText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Guest View
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  guestIcon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  guestTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  guestDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Edit Modal
  editModalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  bioInput: {
    marginBottom: SPACING.md,
  },
  bioLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bioTextInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 100,
    backgroundColor: COLORS.surface,
  },
  editModalActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

