// ============================================
// POST JOB SCREEN V2 - Step-by-step Wizard
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { KittenButton as Button, Input, Card, Chip, ModalContainer, CalendarPicker } from '../../components/common';
import CustomAlert, { AlertState, initialAlertState, createAlert } from '../../components/common/CustomAlert';
import { createJob, updateJob } from '../../services/jobService';
import { canUserPostToday, incrementPostCount, getUserSubscription, getPostExpiryDate } from '../../services/subscriptionService';
import { JobPost, SUBSCRIPTION_PLANS } from '../../types';
import {
  ALL_PROVINCES,
  POPULAR_PROVINCES,
  PROVINCES_BY_REGION,
  REGIONS,
  getDistrictsForProvince,
} from '../../constants/locations';
import {
  STAFF_TYPES,
  StaffType,
  LOCATION_TYPES,
  LocationType,
  ALL_DEPARTMENTS,
  HOME_CARE_TYPES,
  PAYMENT_TYPES,
  PaymentType,
  DEDUCT_PERCENT_OPTIONS,
  RATE_TYPES,
  SHIFT_TIMES,
  QUICK_TAGS,
  getStaffTypeLabel,
  formatPayment,
} from '../../constants/jobOptions';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Types
// ============================================
interface Props {
  navigation: any;
  route?: {
    params?: {
      editJob?: JobPost;
    };
  };
}

interface FormData {
  // Step 1: ประเภทงาน
  staffType: StaffType;
  staffTypeOther: string;
  locationType: LocationType;
  
  // Step 2: วันเวลา
  shiftDate: Date;
  shiftDateEnd: Date | null;
  shiftTime: string;
  customStartTime: string;
  customEndTime: string;
  duration: string;
  
  // Step 3: สถานที่
  province: string;
  district: string;
  hospital: string;
  address: string;
  department: string;
  
  // Step 4: ค่าตอบแทน & ติดต่อ
  title: string;
  description: string;
  shiftRate: string;
  rateType: 'shift' | 'hour' | 'day' | 'month';
  paymentType: PaymentType;
  deductPercent: number;
  contactPhone: string;
  contactLine: string;
  isUrgent: boolean;
  tags: string[];
}

const TOTAL_STEPS = 4;

const STEP_TITLES = [
  { title: 'ประเภทงาน', subtitle: 'เลือกประเภทบุคลากรและสถานที่' },
  { title: 'วันเวลา', subtitle: 'เลือกวันที่และเวลาที่ต้องการ' },
  { title: 'สถานที่', subtitle: 'ระบุสถานที่ทำงาน' },
  { title: 'รายละเอียด', subtitle: 'ค่าตอบแทนและข้อมูลติดต่อ' },
];

// ============================================
// Main Component
// ============================================
export default function PostJobScreenV2({ navigation, route }: Props) {
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const editJob = route?.params?.editJob;
  const isEditMode = Boolean(editJob);
  
  // Current step
  const [currentStep, setCurrentStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Form data
  const [form, setForm] = useState<FormData>({
    staffType: 'RN',
    staffTypeOther: '',
    locationType: 'HOSPITAL',
    shiftDate: new Date(),
    shiftDateEnd: null,
    shiftTime: '08:00-16:00',
    customStartTime: '08:00',
    customEndTime: '16:00',
    duration: '',
    province: 'กรุงเทพมหานคร',
    district: '',
    hospital: '',
    address: '',
    department: '',
    title: '',
    description: '',
    shiftRate: '',
    rateType: 'shift',
    paymentType: 'NET',
    deductPercent: 0,
    contactPhone: user?.phone || '',
    contactLine: '',
    isUrgent: false,
    tags: [],
  });
  
  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(initialAlertState);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  
  // Subscription
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  
  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);
  
  // Check subscription
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
  
  // Guest check
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredView}>
          <Text style={styles.centeredIcon}>📝</Text>
          <Text style={styles.centeredTitle}>เข้าสู่ระบบก่อนโพสต์</Text>
          <Button
              onPress={() => navigation.navigate('Auth')}
              style={{ marginTop: SPACING.lg }}
            >เข้าสู่ระบบ</Button>
        </View>
      </SafeAreaView>
    );
  }
  
  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // ประเภทงาน
        if (!form.staffType) newErrors.staffType = 'กรุณาเลือกประเภทบุคลากร';
        if (!form.locationType) newErrors.locationType = 'กรุณาเลือกประเภทสถานที่';
        break;
      case 1: // วันเวลา
        if (!form.shiftDate) newErrors.shiftDate = 'กรุณาเลือกวันที่';
        if (!form.shiftTime) newErrors.shiftTime = 'กรุณาเลือกเวลา';
        break;
      case 2: // สถานที่
        if (!form.province) newErrors.province = 'กรุณาเลือกจังหวัด';
        if (!form.hospital && form.locationType !== 'HOME') {
          newErrors.hospital = 'กรุณากรอกชื่อสถานที่';
        }
        if (form.locationType === 'HOME' && !form.address) {
          newErrors.address = 'กรุณากรอกที่อยู่';
        }
        break;
      case 3: // รายละเอียด
        if (!form.title.trim()) newErrors.title = 'กรุณากรอกหัวข้อ';
        if (!form.shiftRate) newErrors.shiftRate = 'กรุณากรอกค่าตอบแทน';
        if (!form.contactPhone && !form.contactLine) {
          newErrors.contact = 'กรุณากรอกเบอร์โทรหรือ LINE';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigation
  const goNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmit();
      }
    }
  };
  
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };
  
  // Submit
  const handleSubmit = async () => {
    if (!user?.uid) return;
    
    // Check posting limit
    if (!isEditMode) {
      const postStatus = await canUserPostToday(user.uid);
      if (!postStatus.canPost) {
        setAlert(createAlert.warning('ถึงลิมิตโพสต์แล้ว', 'อัพเกรดเป็น Premium เพื่อโพสต์ไม่จำกัด') as AlertState);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const subscription = await getUserSubscription(user.uid);
      const planKey = (subscription?.plan as any) || 'free';
      const expiresAt = getPostExpiryDate(planKey);
      
      // Build shift time
      const shiftTime = form.shiftTime === 'custom' 
        ? `${form.customStartTime}-${form.customEndTime}`
        : form.shiftTime;
      
      const jobData = {
        title: form.title || `หา ${getStaffTypeLabel(form.staffType)} ${form.department || ''}`.trim(),
        staffType: form.staffType,
        staffTypeOther: form.staffTypeOther,
        locationType: form.locationType,
        department: form.department,
        description: form.description,
        shiftRate: parseInt(form.shiftRate),
        rateType: form.rateType,
        paymentType: form.paymentType,
        deductPercent: form.paymentType === 'DEDUCT_PERCENT' ? form.deductPercent : undefined,
        shiftDate: form.shiftDate,
        shiftDateEnd: form.shiftDateEnd || undefined,
        shiftTime,
        duration: form.duration,
        location: {
          province: form.province,
          district: form.district,
          hospital: form.hospital,
          address: form.address,
        },
        contactPhone: form.contactPhone,
        contactLine: form.contactLine,
        status: (form.isUrgent ? 'urgent' : 'active') as 'active' | 'urgent',
        tags: form.tags,
        expiresAt,
      };
      
      if (isEditMode && editJob) {
        await updateJob(editJob.id, jobData);
        setAlert(createAlert.success('แก้ไขสำเร็จ!', 'อัปเดตประกาศเรียบร้อยแล้ว', [
          { text: 'ตกลง', onPress: () => navigation.goBack() }
        ]) as AlertState);
      } else {
        await createJob({
          ...jobData,
          posterId: user.uid,
          posterName: user.displayName || 'ไม่ระบุชื่อ',
          posterPhoto: user.photoURL || '',
          posterVerified: user.isVerified || false,
        });
        await incrementPostCount(user.uid);
        
        setAlert(createAlert.success('โพสต์สำเร็จ! 🎉', 'ประกาศของคุณถูกโพสต์แล้ว', [
          { text: 'ดูประกาศของฉัน', onPress: () => navigation.navigate('MyPosts') }
        ]) as AlertState);
      }
    } catch (error: any) {
      setAlert(createAlert.error('เกิดข้อผิดพลาด', error.message) as AlertState);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter provinces
  const filteredProvinces = provinceSearch
    ? ALL_PROVINCES.filter(p => p.includes(provinceSearch))
    : ALL_PROVINCES;
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };
  
  // ============================================
  // STEP 1: ประเภทงาน
  // ============================================
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Staff Type */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>ต้องการบุคลากรประเภทใด?</Text>
      <View style={styles.optionGrid}>
        {STAFF_TYPES.map((type) => (
          <TouchableOpacity
            key={type.code}
            style={[
              styles.optionCard,
              { borderColor: form.staffType === type.code ? colors.primary : colors.border },
              form.staffType === type.code && { backgroundColor: colors.primaryLight },
            ]}
            onPress={() => setForm({ ...form, staffType: type.code })}
          >
            <Text style={[styles.optionTitle, { color: colors.text }]}>{type.shortName}</Text>
            <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{type.nameTH}</Text>
            {type.requiresLicense && (
              <View style={styles.licenseBadge}>
                <Text style={styles.licenseBadgeText}>ใบประกอบ</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.staffType && <Text style={styles.errorText}>{errors.staffType}</Text>}
      
      {/* Location Type */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
        สถานที่ทำงาน
      </Text>
      <View style={styles.optionGrid}>
        {LOCATION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.code}
            style={[
              styles.optionCard,
              { borderColor: form.locationType === type.code ? colors.primary : colors.border },
              form.locationType === type.code && { backgroundColor: colors.primaryLight },
            ]}
            onPress={() => setForm({ ...form, locationType: type.code })}
          >
            <Text style={styles.optionIcon}>{type.icon}</Text>
            <Text style={[styles.optionTitle, { color: colors.text }]}>{type.nameTH}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.locationType && <Text style={styles.errorText}>{errors.locationType}</Text>}
    </View>
  );
  
  // ============================================
  // STEP 2: วันเวลา
  // ============================================
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Date Picker */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>วันที่ต้องการ</Text>
      <TouchableOpacity
        style={[styles.inputButton, { borderColor: colors.border }]}
        onPress={() => setShowDateModal(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={[styles.inputButtonText, { color: colors.text }]}>
          {form.shiftDate.toLocaleDateString('th-TH', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
          })}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {errors.shiftDate && <Text style={styles.errorText}>{errors.shiftDate}</Text>}
      
      {/* Time Presets */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>เวลา</Text>
      <View style={styles.chipRow}>
        {SHIFT_TIMES.slice(0, 6).map((time) => (
          <Chip
            key={time.value}
            label={time.label.replace(/ \(.*\)/, '')}
            selected={form.shiftTime === time.value}
            onPress={() => setForm({ ...form, shiftTime: time.value })}
          />
        ))}
      </View>
      {errors.shiftTime && <Text style={styles.errorText}>{errors.shiftTime}</Text>}
      
      {/* Custom Time */}
      {form.shiftTime === 'custom' && (
        <View style={styles.row}>
          <TextInput
            style={[styles.timeInput, { borderColor: colors.border, color: colors.text }]}
            value={form.customStartTime}
            onChangeText={(v) => setForm({ ...form, customStartTime: v })}
            placeholder="เริ่ม (เช่น 09:00)"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={{ color: colors.textMuted, marginHorizontal: SPACING.sm }}>ถึง</Text>
          <TextInput
            style={[styles.timeInput, { borderColor: colors.border, color: colors.text }]}
            value={form.customEndTime}
            onChangeText={(v) => setForm({ ...form, customEndTime: v })}
            placeholder="สิ้นสุด (เช่น 17:00)"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      )}
      
      {/* Duration for Home Care */}
      {form.locationType === 'HOME' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
            ระยะเวลาที่ต้องการ
          </Text>
          <View style={styles.chipRow}>
            {['1 วัน', '3 วัน', '1 สัปดาห์', '1 เดือน', 'ระยะยาว'].map((d) => (
              <Chip
                key={d}
                label={d}
                selected={form.duration === d}
                onPress={() => setForm({ ...form, duration: d })}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
  
  // ============================================
  // STEP 3: สถานที่
  // ============================================
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {/* Province */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>จังหวัด</Text>
      <TouchableOpacity
        style={[styles.inputButton, { borderColor: colors.border }]}
        onPress={() => setShowProvinceModal(true)}
      >
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <Text style={[styles.inputButtonText, { color: colors.text }]}>
          {form.province || 'เลือกจังหวัด'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
      
      {/* District */}
      {form.province && getDistrictsForProvince(form.province).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>เขต/อำเภอ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {getDistrictsForProvince(form.province).map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={form.district === d}
                  onPress={() => setForm({ ...form, district: d })}
                />
              ))}
            </View>
          </ScrollView>
        </>
      )}
      
      {/* Hospital/Location Name */}
      {form.locationType !== 'HOME' ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
            {form.locationType === 'HOSPITAL' ? 'ชื่อโรงพยาบาล' : 'ชื่อสถานที่'}
          </Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={form.hospital}
            onChangeText={(v) => setForm({ ...form, hospital: v })}
            placeholder={form.locationType === 'HOSPITAL' ? 'เช่น รพ.รามาธิบดี' : 'เช่น คลินิกความงาม ABC'}
            placeholderTextColor={colors.textMuted}
          />
          {errors.hospital && <Text style={styles.errorText}>{errors.hospital}</Text>}
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
            ที่อยู่ผู้ป่วย
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: colors.border, color: colors.text }]}
            value={form.address}
            onChangeText={(v) => setForm({ ...form, address: v })}
            placeholder="ที่อยู่หรือจุดสังเกต เช่น ซอยลาดพร้าว 101 ใกล้ห้างบิ๊กซี"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </>
      )}
      
      {/* Department */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
        {form.locationType === 'HOME' ? 'ประเภทการดูแล' : 'แผนก'}
      </Text>
      <TouchableOpacity
        style={[styles.inputButton, { borderColor: colors.border }]}
        onPress={() => setShowDepartmentModal(true)}
      >
        <Ionicons name="medical-outline" size={20} color={colors.primary} />
        <Text style={[styles.inputButtonText, { color: form.department ? colors.text : colors.textMuted }]}>
          {form.department || 'เลือกแผนก/ประเภท'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
  
  // ============================================
  // STEP 4: รายละเอียด & ติดต่อ
  // ============================================
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      {/* Title */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>หัวข้อประกาศ</Text>
      <TextInput
        style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
        value={form.title}
        onChangeText={(v) => setForm({ ...form, title: v })}
        placeholder={`หา ${getStaffTypeLabel(form.staffType)} ${form.department || ''}`}
        placeholderTextColor={colors.textMuted}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      
      {/* Rate */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>ค่าตอบแทน</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.textInput, { flex: 1, borderColor: colors.border, color: colors.text }]}
          value={form.shiftRate}
          onChangeText={(v) => setForm({ ...form, shiftRate: v.replace(/[^0-9]/g, '') })}
          placeholder="เช่น 1500"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />
        <View style={styles.rateTypeContainer}>
          {RATE_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt.value}
              style={[
                styles.rateTypeButton,
                { borderColor: form.rateType === rt.value ? colors.primary : colors.border },
                form.rateType === rt.value && { backgroundColor: colors.primary },
              ]}
              onPress={() => setForm({ ...form, rateType: rt.value })}
            >
              <Text style={{ color: form.rateType === rt.value ? '#fff' : colors.text, fontSize: 12 }}>
                {rt.shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {errors.shiftRate && <Text style={styles.errorText}>{errors.shiftRate}</Text>}
      
      {/* Payment Type */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>รูปแบบค่าตอบแทน</Text>
      <View style={styles.chipRow}>
        {PAYMENT_TYPES.map((pt) => (
          <Chip
            key={pt.code}
            label={pt.nameTH}
            selected={form.paymentType === pt.code}
            onPress={() => setForm({ ...form, paymentType: pt.code })}
          />
        ))}
      </View>
      
      {/* Deduct Percent */}
      {form.paymentType === 'DEDUCT_PERCENT' && (
        <View style={[styles.chipRow, { marginTop: SPACING.sm }]}>
          {DEDUCT_PERCENT_OPTIONS.filter(o => o.value > 0).map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={form.deductPercent === opt.value}
              onPress={() => setForm({ ...form, deductPercent: opt.value })}
            />
          ))}
        </View>
      )}
      
      {/* Description */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>รายละเอียดเพิ่มเติม</Text>
      <TextInput
        style={[styles.textInput, styles.textArea, { borderColor: colors.border, color: colors.text }]}
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        placeholder="รายละเอียดงาน ความต้องการพิเศษ ฯลฯ"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
      />
      
      {/* Quick Tags */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>แท็ก (เลือกได้หลายอัน)</Text>
      <View style={styles.chipRow}>
        {QUICK_TAGS.slice(0, 8).map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={form.tags.includes(tag)}
            onPress={() => {
              if (form.tags.includes(tag)) {
                setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
              } else {
                setForm({ ...form, tags: [...form.tags, tag] });
              }
            }}
          />
        ))}
      </View>
      
      {/* Contact */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>ข้อมูลติดต่อ</Text>
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>เบอร์โทร</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={form.contactPhone}
            onChangeText={(v) => setForm({ ...form, contactPhone: v })}
            placeholder="08X-XXX-XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LINE ID</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={form.contactLine}
            onChangeText={(v) => setForm({ ...form, contactLine: v })}
            placeholder="@lineID"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
      
      {/* Urgent Toggle */}
      <TouchableOpacity
        style={[
          styles.urgentToggle,
          { borderColor: form.isUrgent ? colors.error : colors.border },
          form.isUrgent && { backgroundColor: 'rgba(239,68,68,0.1)' },
        ]}
        onPress={() => setForm({ ...form, isUrgent: !form.isUrgent })}
      >
        <Text style={styles.urgentIcon}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.urgentTitle, { color: colors.text }]}>ประกาศด่วน</Text>
          <Text style={[styles.urgentSubtitle, { color: colors.textMuted }]}>
            แสดงเด่นกว่าประกาศปกติ
          </Text>
        </View>
        <Ionicons
          name={form.isUrgent ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={form.isUrgent ? colors.error : colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{STEP_TITLES[currentStep].title}</Text>
          <Text style={styles.headerSubtitle}>{STEP_TITLES[currentStep].subtitle}</Text>
        </View>
        <Text style={styles.stepIndicator}>{currentStep + 1}/{TOTAL_STEPS}</Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            { 
              backgroundColor: colors.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      
      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { borderTopColor: colors.border }]}>
        {currentStep > 0 && (
          <Button
            variant="outline"
            onPress={goBack}
            style={{ flex: 1, marginRight: SPACING.sm }}
          >ย้อนกลับ</Button>
        )}
        <Button
          onPress={goNext}
          disabled={isLoading}
          size="medium"
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 0,
          }}
        >
          {currentStep === TOTAL_STEPS - 1 ? (isLoading ? 'กำลังโพสต์...' : '🚀 โพสต์เลย') : 'ถัดไป'}
        </Button>
      </View>
      
      {/* Province Modal */}
      <ModalContainer
        visible={showProvinceModal}
        onClose={() => setShowProvinceModal(false)}
        title="เลือกจังหวัด"
      >
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
          value={provinceSearch}
          onChangeText={setProvinceSearch}
          placeholder="ค้นหาจังหวัด..."
          placeholderTextColor={colors.textMuted}
        />
        
        {/* Popular */}
        {!provinceSearch && (
          <>
            <Text style={[styles.modalSectionTitle, { color: colors.textMuted }]}>ยอดนิยม</Text>
            <View style={styles.chipRow}>
              {POPULAR_PROVINCES.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={form.province === p}
                  onPress={() => {
                    setForm({ ...form, province: p, district: '' });
                    setShowProvinceModal(false);
                  }}
                />
              ))}
            </View>
          </>
        )}
        
        <ScrollView style={{ maxHeight: 300 }}>
          {filteredProvinces.map((province) => (
            <TouchableOpacity
              key={province}
              style={[
                styles.listItem,
                form.province === province && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => {
                setForm({ ...form, province, district: '' });
                setShowProvinceModal(false);
                setProvinceSearch('');
              }}
            >
              <Text style={[styles.listItemText, { color: colors.text }]}>{province}</Text>
              {form.province === province && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>
      
      {/* Department Modal */}
      <ModalContainer
        visible={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title={form.locationType === 'HOME' ? 'ประเภทการดูแล' : 'เลือกแผนก'}
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {(form.locationType === 'HOME' ? HOME_CARE_TYPES : ALL_DEPARTMENTS).map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.listItem,
                form.department === dept && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => {
                setForm({ ...form, department: dept });
                setShowDepartmentModal(false);
              }}
            >
              <Text style={[styles.listItemText, { color: colors.text }]}>{dept}</Text>
              {form.department === dept && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>
      
      {/* Date Modal */}
      <ModalContainer
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        title="เลือกวันที่"
      >
        <CalendarPicker
          value={form.shiftDate}
          onChange={(date: Date) => {
            setForm({ ...form, shiftDate: date });
            setShowDateModal(false);
          }}
          minDate={new Date()}
        />
      </ModalContainer>
      
      {/* Alert */}
      <CustomAlert {...alert} onClose={() => setAlert(initialAlertState)} />
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  centeredIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  centeredTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  stepIndicator: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  
  // Progress
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  
  // Step Content
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  // Option Grid
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  licenseBadge: {
    marginTop: 4,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  licenseBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Inputs
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  inputButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chipScroll: {
    marginBottom: SPACING.sm,
  },
  
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Rate Type
  rateTypeContainer: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
  },
  rateTypeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: 4,
  },
  
  // Urgent Toggle
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  urgentIcon: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  urgentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  urgentSubtitle: {
    fontSize: FONT_SIZES.xs,
  },
  
  // Error
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  
  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  
  // Modal
  searchInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  modalSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  listItemText: {
    fontSize: FONT_SIZES.md,
  },
});
