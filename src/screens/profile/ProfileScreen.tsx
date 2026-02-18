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
import { KittenButton as Button, Avatar, Card, Loading, ModalContainer, Input, Badge, Divider, ConfirmModal, ProfileProgressBar } from '../../components/common';
import { sendOTP, verifyOTP } from '../../services/otpService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, POSITIONS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserShiftContacts } from '../../services/jobService';
import { getUserSubscription } from '../../services/subscriptionService';
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
  // Eva icons
  const EvaIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 24, color = colors.primary }) => (
    <Ionicons name={name as any} size={size} color={color} />
  );

  // State
  const [contacts, setContacts] = useState<ShiftContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  // OTP states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [otpError, setOtpError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<UserVerificationStatus | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
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
      try {
        const sub = await getUserSubscription(user.uid);
        setUserPlan(sub?.plan ?? 'free');
      } catch (err) {
        console.error('Error loading subscription in profile', err);
      }
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
  // Save profile with OTP verification if phone changed
  const handleSaveProfile = async () => {
    if (editForm.phone !== user?.phone) {
      // Phone changed, start OTP flow
      setOtpLoading(true);
      setOtpError('');
      try {
        await sendOTP(editForm.phone);
        setOtpSent(true);
        setShowOTPModal(true);
        setPendingProfile({
          displayName: editForm.displayName,
          phone: editForm.phone,
          licenseNumber: editForm.licenseNumber,
          experience: parseInt(editForm.experience) || 0,
          bio: editForm.bio,
        });
      } catch (error: any) {
        setOtpError(error.message || 'ส่งรหัส OTP ไม่สำเร็จ');
      } finally {
        setOtpLoading(false);
      }
      return;
    }
    // Phone not changed, update directly
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

  // Confirm OTP and update profile
  const handleConfirmOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await verifyOTP(editForm.phone, otpValue);
      // OTP correct, update profile
      await updateUser(pendingProfile);
      setShowEditModal(false);
      setShowOTPModal(false);
      setOtpValue('');
      setPendingProfile(null);
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error: any) {
      setOtpError(error.message || 'รหัส OTP ไม่ถูกต้อง');
    } finally {
      setOtpLoading(false);
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>ยังไม่ได้เข้าสู่ระบบ</Text>
          <Text style={styles.guestDescription}>
            เข้าสู่ระบบเพื่อจัดการโปรไฟล์และดูประวัติการสมัครงาน
          </Text>
          <Button
            onPress={() => (navigation as any).navigate('Auth')}
            size="large"
            style={{ marginTop: SPACING.lg }}
          >
            <Text>เข้าสู่ระบบ</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, backgroundColor: colors.primary }]}> 
          <Text style={[styles.headerTitle, { fontWeight: 'bold', fontSize: 22, color: '#fff' }]}>โปรไฟล์</Text>
          <Button
            onPress={handleLogout}
            variant="danger"
            size="small"
            style={{ paddingHorizontal: 14, paddingVertical: 6 }}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontWeight: '600' }}>ออกจากระบบ</Text>
          </Button>
        </View>

        {/* Profile Card Modern */}
        <Card style={{ alignItems: 'center', borderRadius: 20, margin: 0, marginBottom: 18, padding: 0, overflow: 'hidden', backgroundColor: colors.surface }}>
          <View style={{ width: '100%', alignItems: 'center', padding: 24, backgroundColor: colors.primary + '10' }}>
            <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto} style={{ marginBottom: 10 }}>
              <Avatar uri={user?.photoURL} name={user?.displayName || 'User'} size={96} />
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 16, padding: 4 }}>
                <Ionicons name={isUploadingPhoto ? 'cloud-upload-outline' : 'camera-outline'} size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, color: colors.text, marginBottom: 2 }}>{user?.displayName}</Text>
              {userPlan === 'premium' && (
                <View style={{ marginLeft: 8, backgroundColor: COLORS.premium, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: COLORS.black, fontWeight: '700', fontSize: 12 }}>Premium</Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 15 }}>{user?.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Badge
                text={user?.role === 'hospital' ? 'โรงพยาบาล' : user?.role === 'admin' ? 'แอดมิน' : user?.role === 'nurse' || user?.isVerified ? 'พยาบาล ✓' : 'ผู้ใช้งานทั่วไป'}
                variant={user?.isVerified ? 'success' : user?.role === 'admin' ? 'info' : 'primary'}
                style={{ marginRight: 8 }}
              />
              {user?.isVerified && <Ionicons name="shield-checkmark" size={18} color={colors.success} style={{ marginLeft: 2 }} />}
            </View>
            <Button
              onPress={() => setShowEditModal(true)}
              variant="outline"
              size="small"
              style={{ marginTop: 14, borderRadius: 8, paddingHorizontal: 18 }}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>แก้ไขโปรไฟล์</Text>
            </Button>
          </View>
        </Card>

        {/* Profile Progress Bar */}
        <ProfileProgressBar user={user as any} onPress={() => setShowEditModal(true)} />

        {/* Profile Info Modern */}
        <Card style={{ borderRadius: 16, marginBottom: 18 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>ข้อมูลส่วนตัว</Text>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>เบอร์โทรศัพท์</Text>
                <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15 }}>{user?.phone || 'ยังไม่ระบุ'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>เลขใบประกอบวิชาชีพ</Text>
                <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15 }}>{user?.licenseNumber || 'ยังไม่ระบุ'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>ประสบการณ์</Text>
                <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15 }}>{user?.experience ? `${user.experience} ปี` : 'ยังไม่ระบุ'}</Text>
              </View>
            </View>
            {user?.bio && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>เกี่ยวกับฉัน</Text>
                  <Text style={{ color: colors.text, fontSize: 15 }}>{user.bio}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Shift Contact History Modern */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>ประวัติการติดต่องาน</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{contacts.length} รายการ</Text>
          </View>
          {isLoading ? (
            <Loading text="กำลังโหลด..." />
          ) : contacts.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="document-text-outline" size={36} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>ยังไม่มีประวัติการติดต่อ</Text>
              <Button
                onPress={() => navigation.getParent()?.navigate('Main', { screen: 'Home' })}
                variant="outline"
                size="small"
                style={{ marginTop: 12 }}
              >
                <Ionicons name="search-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={{ color: colors.primary, fontWeight: '600' }}>ค้นหางาน</Text>
              </Button>
            </Card>
          ) : (
            contacts.map((contact) => (
                <Card
                key={contact.id}
                style={{ marginBottom: 10, borderRadius: 12, padding: 14 }}
                onPress={() => {
                  if (contact.job) {
                    const job = contact.job;
                    const serializedJob = {
                      ...job,
                      shiftDate: job.shiftDate
                        ? (job.shiftDate instanceof Date ? job.shiftDate.toISOString() : job.shiftDate)
                        : undefined,
                      shiftDateEnd: (job as any).shiftDateEnd
                        ? ((job as any).shiftDateEnd instanceof Date ? (job as any).shiftDateEnd.toISOString() : (job as any).shiftDateEnd)
                        : undefined,
                    } as any;
                    (navigation as any).navigate('JobDetail', { job: serializedJob });
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: colors.text, fontSize: 15 }}>{contact.job?.title || 'เวร'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>{contact.job?.posterName || 'ผู้โพสต์'}</Text>
                  </View>
                  {getStatusBadge(contact.status)}
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  ติดต่อเมื่อ {formatRelativeTime(contact.contactedAt)}
                </Text>
              </Card>
            ))
          )}
        </View>

        {/* Quick Links Modern */}
        <Card style={{ borderRadius: 16, marginBottom: 18 }}>
          <Text style={[styles.linksSectionTitle, { marginBottom: 8 }]}>เมนู</Text>
          <View style={{ gap: 2 }}>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Favorites')}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>งานที่บันทึกไว้</Text>
              {favoritesCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.countText}>{favoritesCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>การแจ้งเตือน</Text>
              {unreadNotifications > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.countText}>{unreadNotifications}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Documents')}>
              <Ionicons name="document-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>เอกสารของฉัน</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Verification')}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>ยืนยันตัวตนพยาบาล</Text>
              {verificationStatus?.isVerified ? (
                <View style={[styles.countBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              ) : verificationStatus?.pendingRequest ? (
                <View style={[styles.countBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.countText}>รอ</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('MyPosts')}>
              <Ionicons name="list-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>ประกาศของฉัน</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12, backgroundColor: '#FFF8E1', borderRadius: 10 }]} onPress={() => nav.navigate('Shop')}>
              <Ionicons name="cart-outline" size={20} color="#FF8F00" />
              <Text style={[styles.linkText, { color: '#FF8F00' }]}>ร้านค้า / ซื้อบริการ</Text>
              <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: '#000', fontWeight: '600' }}>Premium</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {isHospital && (
              <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Applicants')}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={styles.linkText}>จัดการผู้สมัคร</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Settings')}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>ตั้งค่า</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.linkItem, { gap: 12 }]} onPress={() => nav.navigate('Help')}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.linkText}>ช่วยเหลือ</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={[styles.linkItem, { gap: 12, backgroundColor: '#F3F4F6', borderRadius: 10 }]} onPress={() => nav.navigate('AdminDashboard')}>
                <Ionicons name="shield-outline" size={20} color={colors.info} />
                <Text style={[styles.linkText, { color: colors.info, fontWeight: 'bold' }]}>แผงควบคุม Admin</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}
          </View>
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
              style={[styles.bioTextInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
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
            onPress={() => setShowEditModal(false)}
            variant="outline"
            style={{ flex: 1, marginRight: SPACING.sm }}
          >
            <Text>ยกเลิก</Text>
          </Button>
          <Button
            onPress={handleSaveProfile}
            disabled={otpLoading}
            style={{ flex: 1 }}
          >
            <Text>{isAuthLoading || otpLoading ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
          </Button>
              {/* OTP Modal */}
              <ModalContainer
                visible={showOTPModal}
                onClose={() => setShowOTPModal(false)}
                title="ยืนยันเบอร์โทรศัพท์"
              >
                <View style={{ padding: 24 }}>
                  <Text style={{ fontSize: 16, marginBottom: 12 }}>กรอกรหัส OTP ที่ส่งไปยัง {editForm.phone}</Text>
                  <Input
                    label="รหัส OTP"
                    value={otpValue}
                    onChangeText={setOtpValue}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  {otpError ? <Text style={{ color: 'red', marginTop: 8 }}>{otpError}</Text> : null}
                  <Button
                    onPress={handleConfirmOTP}
                    style={{ marginTop: 16 }}
                    disabled={otpLoading}
                  >
                    <Text>{otpLoading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส'}</Text>
                  </Button>
                  <Button
                    onPress={async () => {
                      setOtpLoading(true);
                      setOtpError('');
                      try {
                        await sendOTP(editForm.phone);
                        setOtpSent(true);
                      } catch (error: any) {
                        setOtpError(error.message || 'ส่งรหัส OTP ไม่สำเร็จ');
                      } finally {
                        setOtpLoading(false);
                      }
                    }}
                    variant="outline"
                    style={{ marginTop: 8 }}
                    disabled={otpLoading}
                  >
                    <Text>ขอรหัสใหม่</Text>
                  </Button>
                </View>
              </ModalContainer>
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

