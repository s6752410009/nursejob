// ============================================
// POST SHIFT SCREEN - ประกาศหาคนแทน
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { KittenButton as Button, Input, Card, Chip, ModalContainer, PlaceAutocomplete, QuickPlacePicker, CalendarPicker } from '../../components/common';
import CustomAlert, { AlertState, initialAlertState, createAlert } from '../../components/common/CustomAlert';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DEPARTMENTS, PROVINCES, DISTRICTS_BY_PROVINCE } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createJob, updateJob } from '../../services/jobService';
import { canUserPostToday, incrementPostCount, getUserSubscription, getPostExpiryDate } from '../../services/subscriptionService';
import { MainTabParamList, JobPost, SUBSCRIPTION_PLANS, PRICING } from '../../types';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// Types
// ============================================
type PostJobScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'PostJob'>;

interface Props {
  navigation: PostJobScreenNavigationProp;
  route?: {
    params?: {
      editJob?: JobPost;
    };
  };
}

interface ShiftForm {
  title: string;
  department: string;
  description: string;
  shiftRate: string;
  // broadened to accept other possible rate types from JobPost
  rateType: 'shift' | 'hour' | 'day' | 'month' | 'per_shift' | 'per_day' | 'per_month' | 'negotiable' | string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  province: string;
  district: string;
  hospital: string;
  contactPhone: string;
  contactLine: string;
  isUrgent: boolean;
}

// ============================================
// Component
// ============================================
export default function PostJobScreen({ navigation, route }: Props) {
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  
  // Edit mode
  const editJob = route?.params?.editJob;
  const isEditMode = Boolean(editJob);
  
  // Parse time from string like "08:00-16:00"
  const parseTimeFromString = (timeStr: string, isEnd: boolean): Date => {
    const defaultDate = new Date();
    if (!timeStr) {
      defaultDate.setHours(isEnd ? 16 : 8, 0, 0, 0);
      return defaultDate;
    }
    const parts = timeStr.split('-');
    const timePart = isEnd ? parts[1] : parts[0];
    if (!timePart) {
      defaultDate.setHours(isEnd ? 16 : 8, 0, 0, 0);
      return defaultDate;
    }
    const [hours, minutes] = timePart.split(':').map(Number);
    defaultDate.setHours(hours || 0, minutes || 0, 0, 0);
    return defaultDate;
  };
  
  // Form state
  const [form, setForm] = useState<ShiftForm>({
    title: editJob?.title || '',
    department: editJob?.department || '',
    description: editJob?.description || '',
    shiftRate: editJob?.shiftRate?.toString() || '',
    rateType: editJob?.rateType || 'shift',
    shiftDate: editJob?.shiftDate ? new Date(editJob.shiftDate) : new Date(),
    startTime: parseTimeFromString(editJob?.shiftTime || '', false),
    endTime: parseTimeFromString(editJob?.shiftTime || '', true),
    province: editJob?.location?.province || 'กรุงเทพมหานคร',
    district: editJob?.location?.district || '',
    hospital: editJob?.location?.hospital || '',
    contactPhone: editJob?.contactPhone || user?.phone || '',
    contactLine: editJob?.contactLine || '',
    isUrgent: editJob?.status === 'urgent',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingTime, setEditingTime] = useState<'start' | 'end'>('start');
  
  // Subscription state
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Alert state (SweetAlert style)
  const [alert, setAlert] = useState<AlertState>(initialAlertState);
  const closeAlert = () => setAlert(initialAlertState);

  // Check subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.uid) return;
      
      const subscription = await getUserSubscription(user.uid);
      setUserPlan(subscription?.plan ?? 'free');
      
      const postStatus = await canUserPostToday(user.uid);
      setPostsRemaining(postStatus.postsRemaining);
    };
    
    checkSubscription();
  }, [user?.uid]);

  // Format time for display
  const formatTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('th-TH', options);
  };

  // Generate date options (next 30 days)
  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const date = new Date();
        date.setHours(h, m, 0, 0);
        times.push(date);
      }
    }
    return times;
  };

  // Quick time presets
  const TIME_PRESETS = [
    { label: 'เวรเช้า', start: { h: 8, m: 0 }, end: { h: 16, m: 0 } },
    { label: 'เวรบ่าย', start: { h: 16, m: 0 }, end: { h: 0, m: 0 } },
    { label: 'เวรดึก', start: { h: 0, m: 0 }, end: { h: 8, m: 0 } },
  ];

  const applyTimePreset = (preset: typeof TIME_PRESETS[0]) => {
    const start = new Date();
    start.setHours(preset.start.h, preset.start.m, 0, 0);
    const end = new Date();
    end.setHours(preset.end.h, preset.end.m, 0, 0);
    setForm({ ...form, startTime: start, endTime: end });
  };

  // Rate types
  const RATE_TYPES = [
    { label: '/เวร', value: 'shift' },
    { label: '/ชม.', value: 'hour' },
    { label: '/วัน', value: 'day' },
  ];

  // Guest check
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredView}>
          <Text style={styles.centeredIcon}>📝</Text>
          <Text style={styles.centeredTitle}>เข้าสู่ระบบก่อนโพสต์</Text>
          <Text style={styles.centeredDescription}>
            เข้าสู่ระบบเพื่อประกาศหาคนแทน
          </Text>
          <Button
            onPress={() => (navigation as any).navigate('Auth')}
            style={{ marginTop: SPACING.lg }}
          >
            เข้าสู่ระบบ
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = 'กรุณากรอกหัวข้อ';
    if (!form.department) newErrors.department = 'กรุณาเลือกแผนก';
    if (!form.shiftRate) newErrors.shiftRate = 'กรุณากรอกค่าตอบแทน';
    if (!form.shiftDate) newErrors.shiftDate = 'กรุณาเลือกวันที่';
    if (!form.province) newErrors.province = 'กรุณาเลือกจังหวัด';
    if (!form.hospital.trim()) newErrors.hospital = 'กรุณากรอกชื่อโรงพยาบาล/สถานที่';
    if (!form.contactPhone && !form.contactLine) {
      newErrors.contactPhone = 'กรุณากรอกเบอร์โทรหรือ LINE';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      setAlert({
        ...createAlert.warning('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'),
      } as AlertState);
      return;
    }
    if (!user?.uid) {
      setAlert({
        ...createAlert.error('ต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนโพสต์งาน'),
      } as AlertState);
      return;
    }

    // Check posting limit for free users (only for new posts)
    // If user selected urgent on free plan, route to Payment mock
    if (form.isUrgent && userPlan === 'free' && !isEditMode) {
      const serializeForm = (f: any) => ({
        ...f,
        shiftDate: f.shiftDate ? (f.shiftDate instanceof Date ? f.shiftDate.toISOString() : f.shiftDate) : undefined,
      });
      (navigation as any).navigate('Payment', {
        type: 'urgent_post',
        amount: PRICING.urgentPost,
        title: 'ประกาศด่วน',
        description: 'ติดป้าย "ด่วน" แสดงเด่นกว่าประกาศปกติ',
        formData: serializeForm(form),
      });
      return;
    }

    if (!isEditMode) {
      const postStatus = await canUserPostToday(user.uid);
      if (!postStatus.canPost) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      // Get subscription for expiry date
      const subscription = await getUserSubscription(user.uid);
      const planKey = (subscription?.plan as any) || 'free';
      const expiresAt = getPostExpiryDate(planKey);
      
      // Format time string
      const shiftTime = `${formatTime(form.startTime)}-${formatTime(form.endTime)}`;

      const jobData = {
        title: form.title,
        department: form.department,
        description: form.description,
        shiftRate: parseInt(form.shiftRate),
        rateType: form.rateType as JobPost['rateType'],
        shiftDate: form.shiftDate,
        shiftTime,
        location: {
          province: form.province,
          district: form.district,
          hospital: form.hospital,
        },
        contactPhone: form.contactPhone,
        contactLine: form.contactLine,
        status: (form.isUrgent ? 'urgent' : 'active') as 'active' | 'urgent',
        expiresAt, // Add expiry based on subscription
      };

      if (isEditMode && editJob) {
        // Update existing job
        await updateJob(editJob.id, jobData);
        setAlert({
          ...createAlert.success('แก้ไขสำเร็จ!', 'อัปเดตประกาศเรียบร้อยแล้ว', [
            { text: 'ตกลง', onPress: () => navigation.goBack() }
          ]),
        } as AlertState);
      } else {
        // Create new job and navigate to its detail immediately
        const jobId = await createJob({
          ...jobData,
          posterId: user.uid,
          posterName: user.displayName || 'ไม่ระบุชื่อ',
          posterPhoto: user.photoURL || '',
          posterVerified: Boolean(user.isVerified), // เพิ่ม verified status
        } as Partial<JobPost>);

        // Increment post count for free users
        await incrementPostCount(user.uid);

        // Update remaining posts display
        const postStatus = await canUserPostToday(user.uid);
        setPostsRemaining(postStatus.postsRemaining);

        // Build a best-effort JobPost to pass to JobDetail screen
        const createdJob: JobPost = {
          id: jobId,
          title: jobData.title || '',
          posterName: user.displayName || 'ไม่ระบุชื่อ',
          posterId: user.uid,
          posterPhoto: user.photoURL || '',
          department: jobData.department || '',
          shiftRate: jobData.shiftRate || 0,
          rateType: jobData.rateType as JobPost['rateType'] || 'shift',
          shiftDate: jobData.shiftDate || new Date(),
          shiftTime: jobData.shiftTime || '',
          location: jobData.location || {},
          contactPhone: jobData.contactPhone || '',
          contactLine: jobData.contactLine || '',
          status: (jobData.status as any) || 'active',
          description: jobData.description || '',
          createdAt: new Date(),
          expiresAt: jobData.expiresAt as any,
          viewsCount: 0,
          applicationCount: 0,
        } as JobPost;

        // Serialize created job dates before navigating
        const serializedCreatedJob = {
          ...createdJob,
          shiftDate: createdJob.shiftDate ? (createdJob.shiftDate instanceof Date ? createdJob.shiftDate.toISOString() : createdJob.shiftDate) : undefined,
          createdAt: createdJob.createdAt ? (createdJob.createdAt instanceof Date ? createdJob.createdAt.toISOString() : createdJob.createdAt) : undefined,
        } as any;
        (navigation as any).navigate('JobDetail', { job: serializedCreatedJob });
      }
    } catch (error: any) {
      setAlert({
        ...createAlert.error('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถโพสต์ได้ กรุณาลองใหม่'),
      } as AlertState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        {isEditMode && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isEditMode ? '✏️ แก้ไขประกาศ' : '📝 ประกาศหาคนแทน'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode ? 'แก้ไขข้อมูลประกาศของคุณ' : 'กรอกข้อมูลงานที่ต้องการหาคนแทน'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Status Card */}
        {!isEditMode && (
          <Card style={{...styles.section, ...styles.subCard}}>
            <View style={styles.subscriptionRow}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionPlan}>
                  {userPlan === 'premium' ? '👑 Premium' : '🆓 แพ็กเกจฟรี'}
                </Text>
                {postsRemaining !== null && (
                  <Text style={styles.subscriptionLimit}>
                    เหลือโพสต์วันนี้: <Text style={styles.subscriptionLimitNumber}>{postsRemaining}</Text> ครั้ง
                  </Text>
                )}
                {userPlan === 'free' && (
                  <Text style={styles.subscriptionExpiry}>
                    โพสต์จะแสดง 2 วัน
                  </Text>
                )}
              </View>
              {userPlan === 'free' && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => setShowUpgradeModal(true)}
                >
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.upgradeButtonText}>อัพเกรด</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Title */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>รายละเอียดงาน</Text>
          
          <Input
            label="หัวข้อ *"
            placeholder="เช่น หาคนแทนเวรดึก ICU, งาน OPD"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
            error={errors.title}
          />

          {/* Department */}
          <Text style={styles.inputLabel}>แผนก *</Text>
          <TouchableOpacity
            style={[styles.selectButton, errors.department && styles.selectButtonError]}
            onPress={() => setShowDepartmentModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !form.department && styles.selectButtonPlaceholder
            ]}>
              {form.department || 'เลือกแผนก'}
            </Text>
            <Text style={styles.selectIcon}>▼</Text>
          </TouchableOpacity>
          {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}

          <Input
            label="รายละเอียดเพิ่มเติม"
            placeholder="รายละเอียดงาน, เงื่อนไข, หมายเหตุ..."
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            multiline={true}
            numberOfLines={3}
          />
        </Card>

        {/* Date & Time */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>วันเวลา</Text>
          
          {/* Date Picker - Using CalendarPicker */}
          <CalendarPicker
            label="วันที่ต้องการ *"
            value={form.shiftDate}
            onChange={(date) => setForm({ ...form, shiftDate: date })}
            error={errors.shiftDate}
            minDate={new Date()}
          />

          {/* Time Pickers */}
          <Text style={styles.inputLabel}>ช่วงเวลา *</Text>
          <View style={styles.timePickerRow}>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => {
                setEditingTime('start');
                setShowTimeModal(true);
              }}
            >
              <Text style={styles.timePickerLabel}>เริ่ม</Text>
              <Text style={styles.timePickerValue}>{formatTime(form.startTime)}</Text>
            </TouchableOpacity>
            
            <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
            
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => {
                setEditingTime('end');
                setShowTimeModal(true);
              }}
            >
              <Text style={styles.timePickerLabel}>สิ้นสุด</Text>
              <Text style={styles.timePickerValue}>{formatTime(form.endTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Time Presets */}
          <View style={styles.timePresetsRow}>
            {TIME_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={styles.timePresetButton}
                onPress={() => applyTimePreset(preset)}
              >
                <Text style={styles.timePresetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Rate */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>ค่าตอบแทน</Text>
          
          <View style={styles.rateRow}>
            <View style={styles.rateInput}>
              <Input
                label="ค่าตอบแทน (บาท) *"
                placeholder="เช่น 1500"
                value={form.shiftRate}
                onChangeText={(text) => setForm({ ...form, shiftRate: text.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                error={errors.shiftRate}
              />
            </View>
            <View style={styles.rateTypeContainer}>
              <Text style={styles.inputLabel}>ต่อ</Text>
              <View style={styles.rateTypes}>
                {RATE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.rateTypeButton,
                      form.rateType === type.value && styles.rateTypeButtonActive
                    ]}
                    onPress={() => setForm({ ...form, rateType: type.value as any })}
                  >
                    <Text style={[
                      styles.rateTypeText,
                      form.rateType === type.value && styles.rateTypeTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>สถานที่</Text>
          
          {/* Hospital/Place Search - ค้นหาอัตโนมัติ */}
          <View style={styles.placeSearchContainer}>
            <PlaceAutocomplete
              label="โรงพยาบาล/คลินิก/สถานที่ *"
              value={form.hospital}
              placeholder="พิมพ์ค้นหา เช่น โรงพยาบาลราชวิถี..."
              error={errors.hospital}
              onSelect={(place: { name: string; province: string; district: string }) => {
                setForm({
                  ...form,
                  hospital: place.name,
                  province: place.province || form.province,
                  district: place.district || form.district,
                });
              }}
            />
            
            {/* Quick picker for popular hospitals */}
            {!form.hospital && (
              <QuickPlacePicker
                province={form.province}
                onSelect={(place: { name: string; province: string; district: string }) => {
                  setForm({
                    ...form,
                    hospital: place.name,
                    province: place.province || form.province,
                    district: place.district || form.district,
                  });
                }}
              />
            )}
          </View>
          
          {/* Province - auto filled or manual select */}
          <Text style={styles.inputLabel}>จังหวัด *</Text>
          <TouchableOpacity
            style={[styles.selectButton, errors.province && styles.selectButtonError]}
            onPress={() => setShowProvinceModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {form.province || 'เลือกจังหวัด'}
            </Text>
            <Text style={styles.selectIcon}>▼</Text>
          </TouchableOpacity>

          {/* District */}
          {form.province && DISTRICTS_BY_PROVINCE[form.province] && (
            <>
              <Text style={styles.inputLabel}>
                {form.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !form.district && styles.selectButtonPlaceholder
                ]}>
                  {form.district || (form.province === 'กรุงเทพมหานคร' ? 'เลือกเขต' : 'เลือกอำเภอ')}
                </Text>
                <Text style={styles.selectIcon}>▼</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Urgent Toggle - Premium Feature */}
        <Card style={{...styles.section, ...(form.isUrgent ? styles.urgentSection : {})}}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentTitleRow}>
              <Ionicons name="flash" size={24} color={form.isUrgent ? '#FF6B6B' : colors.textMuted} />
              <View style={styles.urgentTitleContent}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>ประกาศด่วน</Text>
                <Text style={styles.urgentSubtitle}>แสดงโดดเด่นด้านบนสุดของหน้าแรก</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.urgentToggle,
                form.isUrgent && styles.urgentToggleActive
              ]}
              onPress={() => setForm({ ...form, isUrgent: !form.isUrgent })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.urgentToggleCircle,
                form.isUrgent && styles.urgentToggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>

          {form.isUrgent && (
            <View style={styles.urgentBenefits}>
              <View style={styles.urgentBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={styles.urgentBenefitText}>แสดงในแบนเนอร์ด้านบน</Text>
              </View>
              <View style={styles.urgentBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={styles.urgentBenefitText}>เลื่อนอัตโนมัติให้คนเห็นก่อน</Text>
              </View>
              <View style={styles.urgentBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={styles.urgentBenefitText}>ติดป้าย "ด่วน" โดดเด่น</Text>
              </View>
              <View style={styles.urgentPricing}>
                <Text style={styles.urgentPriceLabel}>ค่าบริการ:</Text>
                <Text style={styles.urgentPrice}>฿49/ประกาศ</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Contact */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>ช่องทางติดต่อ</Text>
          
          <Input
            label="เบอร์โทร"
            placeholder="0XX-XXX-XXXX"
            value={form.contactPhone}
            onChangeText={(text) => setForm({ ...form, contactPhone: text })}
            keyboardType="phone-pad"
            error={errors.contactPhone}
          />

          <Input
            label="LINE ID"
            placeholder="@line_id หรือ เบอร์โทร"
            value={form.contactLine}
            onChangeText={(text) => setForm({ ...form, contactLine: text })}
          />
        </Card>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomActions}>
        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {isLoading
            ? (isEditMode ? 'กำลังบันทึก...' : 'กำลังโพสต์...')
            : (isEditMode ? 'บันทึกการแก้ไข ✓' : (form.isUrgent ? 'โพสต์ด่วน ⚡ (฿49)' : 'โพสต์เลย 🚀'))
          }
        </Button>
      </View>

      {/* Province Modal */}
      <ModalContainer
        visible={showProvinceModal}
        onClose={() => setShowProvinceModal(false)}
        title="เลือกจังหวัด"
      >
        <ScrollView style={styles.modalList}>
          {PROVINCES.map((province) => (
            <TouchableOpacity
              key={province}
              style={styles.modalItem}
              onPress={() => {
                setForm({ ...form, province, district: '' });
                setShowProvinceModal(false);
              }}
            >
              <Text style={[
                styles.modalItemText,
                form.province === province && styles.modalItemTextSelected
              ]}>
                {province}
              </Text>
              {form.province === province && (
                <Text style={styles.modalItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>

      {/* District Modal */}
      <ModalContainer
        visible={showDistrictModal}
        onClose={() => setShowDistrictModal(false)}
        title={form.province === 'กรุงเทพมหานคร' ? 'เลือกเขต' : 'เลือกอำเภอ'}
      >
        <ScrollView style={styles.modalList}>
          {(DISTRICTS_BY_PROVINCE[form.province] || []).map((district) => (
            <TouchableOpacity
              key={district}
              style={styles.modalItem}
              onPress={() => {
                setForm({ ...form, district });
                setShowDistrictModal(false);
              }}
            >
              <Text style={[
                styles.modalItemText,
                form.district === district && styles.modalItemTextSelected
              ]}>
                {district}
              </Text>
              {form.district === district && (
                <Text style={styles.modalItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>

      {/* Department Modal */}
      <ModalContainer
        visible={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title="เลือกแผนก"
      >
        <ScrollView style={styles.modalList}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={styles.modalItem}
              onPress={() => {
                setForm({ ...form, department: dept });
                setShowDepartmentModal(false);
              }}
            >
              <Text style={[
                styles.modalItemText,
                form.department === dept && styles.modalItemTextSelected
              ]}>
                {dept}
              </Text>
              {form.department === dept && (
                <Text style={styles.modalItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>

      {/* Time Picker Modal */}
      <ModalContainer
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        title={editingTime === 'start' ? 'เลือกเวลาเริ่ม' : 'เลือกเวลาสิ้นสุด'}
      >
        <ScrollView style={styles.modalList}>
          {generateTimeOptions().map((time, index) => {
            const currentTime = editingTime === 'start' ? form.startTime : form.endTime;
            const isSelected = formatTime(currentTime) === formatTime(time);
            return (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  if (editingTime === 'start') {
                    setForm({ ...form, startTime: time });
                  } else {
                    setForm({ ...form, endTime: time });
                  }
                  setShowTimeModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  isSelected && styles.modalItemTextSelected
                ]}>
                  {formatTime(time)}
                </Text>
                {isSelected && (
                  <Text style={styles.modalItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ModalContainer>

      {/* Upgrade Modal */}
      <ModalContainer
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="🚀 อัพเกรดเป็น Premium"
      >
        <View style={styles.upgradeModalContent}>
          <View style={styles.upgradeHeader}>
            <Text style={styles.upgradeEmoji}>👑</Text>
            <Text style={styles.upgradeTitle}>Premium Plan</Text>
            <Text style={styles.upgradePrice}>฿89<Text style={styles.upgradePriceUnit}>/เดือน</Text></Text>
          </View>

          <View style={styles.upgradeBenefits}>
            <View style={styles.upgradeBenefit}>
              <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
              <Text style={styles.upgradeBenefitText}>โพสต์ได้ไม่จำกัด</Text>
            </View>
            <View style={styles.upgradeBenefit}>
              <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
              <Text style={styles.upgradeBenefitText}>โพสต์แสดงผล 30 วัน (แทน 3 วัน)</Text>
            </View>
            <View style={styles.upgradeBenefit}>
              <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
              <Text style={styles.upgradeBenefitText}>ไม่มีโฆษณารบกวน</Text>
            </View>
            <View style={styles.upgradeBenefit}>
              <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
              <Text style={styles.upgradeBenefitText}>สนับสนุนผู้พัฒนา ❤️</Text>
            </View>
          </View>

          <View style={styles.upgradeCompare}>
            <View style={styles.upgradeCompareRow}>
              <Text style={styles.upgradeCompareLabel}>แพ็กเกจฟรี</Text>
              <Text style={styles.upgradeCompareValue}>2 โพสต์/วัน, อยู่ 3 วัน</Text>
            </View>
            <View style={styles.upgradeCompareRow}>
              <Text style={[styles.upgradeCompareLabel, { color: '#FFD700' }]}>Premium</Text>
              <Text style={[styles.upgradeCompareValue, { color: '#4ADE80' }]}>ไม่จำกัด, อยู่ 30 วัน</Text>
            </View>
          </View>

          <View style={styles.upgradeExtraOptions}>
            <Text style={styles.upgradeExtraTitle}>💡 หรือซื้อแยก:</Text>
            <Text style={styles.upgradeExtraItem}>• โพสต์เพิ่ม 1 โพสต์ = ฿19</Text>
            <Text style={styles.upgradeExtraItem}>• ต่ออายุโพสต์ 1 วัน = ฿19</Text>
            <Text style={styles.upgradeExtraItem}>• ปุ่มต้องการด่วน = ฿49/ครั้ง</Text>
          </View>

          <View style={[styles.upgradeExtraOptions, { backgroundColor: '#FFF8E1', marginTop: SPACING.sm }]}>
            <Text style={[styles.upgradeExtraTitle, { color: '#FF8F00' }]}>🎁 โบนัส Premium:</Text>
            <Text style={[styles.upgradeExtraItem, { color: '#FF8F00' }]}>• แถมปุ่มต้องการด่วนฟรี 1 ครั้ง!</Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeActionButton}
            onPress={() => {
              // TODO: Integrate with payment gateway
              setShowUpgradeModal(false);
              setAlert({
                ...createAlert.info('ระบบชำระเงิน', 'ระบบชำระเงินกำลังพัฒนา\nติดต่อ admin เพื่ออัพเกรด'),
              } as AlertState);
            }}
          >
            <Ionicons name="card" size={20} color="#FFF" />
            <Text style={styles.upgradeActionButtonText}>อัพเกรดตอนนี้ ฿89</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.upgradeLaterButton}
            onPress={() => setShowUpgradeModal(false)}
          >
            <Text style={styles.upgradeLaterButtonText}>ไว้ทีหลัง</Text>
          </TouchableOpacity>
        </View>
      </ModalContainer>

      {/* Custom Alert (SweetAlert style) */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={closeAlert}
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },

  // Section
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Input label
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  // Select button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  selectButtonError: {
    borderColor: COLORS.danger,
  },
  selectButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectButtonPlaceholder: {
    color: COLORS.textMuted,
  },
  selectIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Error text
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },

  // Quick Date Buttons
  quickDateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickDateButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  quickDateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Time Picker Row
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  timePickerButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  timePickerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timePickerValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Time Presets
  timePresetsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  timePresetButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timePresetText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Rate row
  rateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rateInput: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rateTypeContainer: {
    width: 100,
  },
  rateTypes: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  rateTypeButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  rateTypeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  rateTypeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  rateTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },

  // Place Search
  placeSearchContainer: {
    marginBottom: SPACING.md,
    zIndex: 100,
  },

  // Modal
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalItemCheck: {
    color: COLORS.primary,
    fontSize: 18,
  },

  // Centered View
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  centeredIcon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  centeredTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  centeredDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Urgent Section
  urgentSection: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  urgentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: SPACING.sm,
  },
  urgentTitleContent: {
    flex: 1,
  },
  urgentSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  urgentToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  urgentToggleActive: {
    backgroundColor: '#FF6B6B',
  },
  urgentToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  urgentToggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  urgentBenefits: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: BORDER_RADIUS.md,
  },
  urgentBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  urgentBenefitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  urgentPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 107, 0.3)',
  },
  urgentPriceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  urgentPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#FF6B6B',
  },

  // Subscription Card
  subCard: {
    backgroundColor: '#f8f9fa',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  subscriptionLimit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subscriptionLimitNumber: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  subscriptionExpiry: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#FFF',
  },

  // Upgrade Modal
  upgradeModalContent: {
    padding: SPACING.md,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  upgradeEmoji: {
    fontSize: 60,
    marginBottom: SPACING.sm,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: '#FFD700',
  },
  upgradePrice: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  upgradePriceUnit: {
    fontSize: FONT_SIZES.md,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  upgradeBenefits: {
    marginBottom: SPACING.lg,
  },
  upgradeBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  upgradeBenefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  upgradeCompare: {
    backgroundColor: '#f8f9fa',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  upgradeCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  upgradeCompareLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  upgradeCompareValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  upgradeExtraOptions: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  upgradeExtraTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  upgradeExtraItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    lineHeight: 22,
  },
  upgradeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  upgradeActionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#000',
  },
  upgradeLaterButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  upgradeLaterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

