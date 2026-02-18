// ============================================
// POST JOB SCREEN - รองรับ 3 ประเภทประกาศ
// 1. หาคนแทนเวร 2. รับสมัครบุคลากร 3. หาคนดูแลผู้ป่วย
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
import { StatusBar, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { KittenButton as Button, Input, Card, Chip, ModalContainer, CalendarPicker, PlaceAutocomplete } from '../../components/common';
import CustomAlert, { AlertState, initialAlertState, createAlert } from '../../components/common/CustomAlert';
import { createJob, updateJob } from '../../services/jobService';
import { canUserPostToday, incrementPostCount, getUserSubscription, getPostExpiryDate } from '../../services/subscriptionService';
import { JobPost, SUBSCRIPTION_PLANS } from '../../types';
import {
  ALL_PROVINCES,
  POPULAR_PROVINCES,
} from '../../constants/locations';
import { getDistrictsForProvince } from '../../constants/districts';
import {
  STAFF_TYPES,
  StaffType,
  LOCATION_TYPES,
  LocationType,
  ALL_DEPARTMENTS,
  HOME_CARE_TYPES,
  PAYMENT_TYPES,
  PaymentType,
  RATE_TYPES,
  DURATION_OPTIONS,
  QUICK_TAGS,
  getStaffTypeLabel,
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
      paidUrgent?: boolean;
      formData?: FormData;
    };
  };
}

// ประเภทประกาศ
type PostType = 'shift' | 'job' | 'homecare';

const POST_TYPES = [
  {
    value: 'shift' as PostType,
    title: 'หาคนแทนเวร',
    subtitle: 'แลกเวร / ขายเวร',
    icon: '🔄',
    color: '#3B82F6',
  },
  {
    value: 'job' as PostType,
    title: 'รับสมัครบุคลากร',
    subtitle: 'ประกาศรับสมัครงาน',
    icon: '👩‍⚕️',
    color: '#10B981',
  },
  {
    value: 'homecare' as PostType,
    title: 'หาคนดูแลผู้ป่วย',
    subtitle: 'เฝ้าไข้ / ดูแลที่บ้าน',
    icon: '🏠',
    color: '#F59E0B',
  },
];

interface FormData {
  // Common
  postType: PostType;
  title: string;
  description: string;
  
  // Staff type
  staffType: StaffType;
  staffTypeOther: string;
  
  // Location
  locationType: LocationType;
  province: string;
  district: string;
  hospital: string;
  address: string;
  department: string;
  
  // Date/Time (for shift)
  shiftDate: Date;
  shiftTime: string;
  customStartTime: string;
  customEndTime: string;
  
  // Duration (for homecare)
  duration: string;
  shiftDateEnd: Date | null;
  
  // Rate
  shiftRate: string;
  rateType: 'shift' | 'hour' | 'day' | 'month';
  paymentType: PaymentType;
  deductPercent: number;
  
  // For job posting
  salaryMin: string;
  salaryMax: string;
  benefits: string[];
  
  // Contact
  contactPhone: string;
  contactLine: string;
  
  // Options
  isUrgent: boolean;
  tags: string[];
}

// ============================================
// Main Component
// ============================================
export default function PostJobScreen({ navigation, route }: Props) {
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const editJob = route?.params?.editJob;
  const isEditMode = Boolean(editJob);
  
  // Current step (0 = select type, 1-4 = form steps)
  const [currentStep, setCurrentStep] = useState(isEditMode ? 1 : 0);
  const [slideAnim] = useState(new Animated.Value(0));
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Form data
  const [form, setForm] = useState<FormData>({
    postType: 'shift',
    title: '',
    description: '',
    staffType: 'RN',
    staffTypeOther: '',
    locationType: 'HOSPITAL',
    province: 'กรุงเทพมหานคร',
    district: '',
    hospital: '',
    address: '',
    department: '',
    shiftDate: new Date(),
    shiftTime: '08:00-16:00',
    customStartTime: '08:00',
    customEndTime: '16:00',
    duration: '',
    shiftDateEnd: null,
    shiftRate: '',
    rateType: 'shift',
    paymentType: 'NET',
    deductPercent: 0,
    salaryMin: '',
    salaryMax: '',
    benefits: [],
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
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  
  // Time options (every 30 minutes)
  const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0');
    const mins = i % 2 === 0 ? '00' : '30';
    return `${hours}:${mins}`;
  });
  
  // Subscription
  const [postsRemaining, setPostsRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  
  // Get total steps based on post type
  const getTotalSteps = () => {
    return 4; // Step 0 is type selection, then 4 more steps
  };
  
  // Animate progress bar
  useEffect(() => {
    if (currentStep === 0) return;
    Animated.timing(progressAnim, {
      toValue: currentStep / getTotalSteps(),
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
  
  // Filter provinces
  const filteredProvinces = provinceSearch
    ? ALL_PROVINCES.filter(p => p.includes(provinceSearch))
    : (showAllProvinces ? ALL_PROVINCES : POPULAR_PROVINCES);
  
  // Get departments based on post type
  const getDepartments = () => {
    if (form.postType === 'homecare' || form.locationType === 'HOME') {
      return HOME_CARE_TYPES;
    }
    return ALL_DEPARTMENTS;
  };
  
  // Guest check
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredView}>
          <Text style={styles.centeredIcon}>📝</Text>
          <Text style={[styles.centeredTitle, { color: colors.text }]}>เข้าสู่ระบบก่อนโพสต์</Text>
          <Text style={[styles.centeredSubtitle, { color: colors.textSecondary }]}>
            กรุณาเข้าสู่ระบบเพื่อลงประกาศ
          </Text>
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
      case 1: // ข้อมูลพื้นฐาน
        if (!form.staffType) newErrors.staffType = 'กรุณาเลือกประเภทบุคลากร';
        if (form.postType !== 'homecare' && !form.locationType) {
          newErrors.locationType = 'กรุณาเลือกประเภทสถานที่';
        }
        if (!form.department) {
          newErrors.department = 'กรุณาเลือกแผนก';
        }
        break;
      case 2: // วันเวลา
        if (form.postType === 'shift' && !form.shiftDate) {
          newErrors.shiftDate = 'กรุณาเลือกวันที่';
        }
        if (form.postType === 'homecare' && !form.duration) {
          newErrors.duration = 'กรุณาเลือกระยะเวลา';
        }
        break;
      case 3: // สถานที่
        if (!form.province) newErrors.province = 'กรุณาเลือกจังหวัด';
        if (form.locationType !== 'HOME' && !form.hospital) {
          newErrors.hospital = 'กรุณากรอกชื่อสถานที่';
        }
        if (form.locationType === 'HOME' && !form.address) {
          newErrors.address = 'กรุณากรอกที่อยู่';
        }
        break;
      case 4: // ค่าตอบแทน & ติดต่อ
        if (!form.shiftRate && form.postType !== 'job') {
          newErrors.shiftRate = 'กรุณากรอกค่าตอบแทน';
        }
        if (form.postType === 'job' && !form.salaryMin) {
          newErrors.salaryMin = 'กรุณากรอกเงินเดือน';
        }
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
    if (currentStep === 0) {
      // Slide animation from step 0 to 1
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(1);
        slideAnim.setValue(0);
      });
      return;
    }
    if (validateStep(currentStep)) {
      if (currentStep < getTotalSteps()) {
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

  // Serialize form for navigation (convert Dates to ISO strings)
  const serializeForm = (f: FormData) => {
    return {
      ...f,
      shiftDate: f.shiftDate ? new Date(f.shiftDate).toISOString() : undefined,
      shiftDateEnd: f.shiftDateEnd ? new Date(f.shiftDateEnd).toISOString() : undefined,
    } as any;
  };

  // Handle return from Payment screen (serializable params)
  React.useEffect(() => {
    const paid = route?.params?.paidUrgent;
    const paidForm = route?.params?.formData as FormData | undefined;
    if (paid && paidForm) {
      // clear params to avoid repeated calls
      try {
        navigation.setParams?.({ paidUrgent: undefined, formData: undefined });
      } catch (e) {}
      // create job using the returned form data
      createJobPost(true, paidForm);
    }
  }, [route?.params?.paidUrgent, route?.params?.formData]);
  
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
    
    // If urgent post selected, go to payment first
    if (form.isUrgent && !isEditMode) {
      navigation.navigate('Payment', {
        type: 'urgent_post',
        amount: 49,
        title: 'ประกาศด่วน',
        description: 'ติดป้าย "ด่วน" แสดงเด่นกว่าประกาศปกติ',
        // pass only serializable data (no functions)
        formData: serializeForm(form),
        // indicate which screen to return to after success
        returnTo: 'PostJob',
      });
      return;
    }
    
    // Create job directly
    await createJobPost(false);
  };
  
  // Create job post function
  const createJobPost = async (isPaidUrgent: boolean, formArg?: FormData) => {
    if (!user?.uid) return;
    
    const usedForm = formArg || form;

    setIsLoading(true);
    try {
      const subscription = await getUserSubscription(user.uid);
      const planKey = (subscription?.plan as any) || 'free';
      const expiresAt = getPostExpiryDate(planKey);
      
      // Build shift time
      const shiftTime = usedForm.shiftTime === 'custom' 
        ? `${usedForm.customStartTime}-${usedForm.customEndTime}`
        : usedForm.shiftTime;
      
      // Build title if empty
      let title = form.title;
      if (!title) {
        const staffLabel = getStaffTypeLabel(form.staffType);
        if (form.postType === 'shift') {
          title = `หา${staffLabel}แทนเวร ${form.department || ''}`.trim();
        } else if (form.postType === 'job') {
          title = `รับสมัคร${staffLabel} ${form.hospital || ''}`.trim();
        } else {
          title = `หาคนดูแล${form.department ? ` (${form.department})` : ''}`.trim();
        }
      }
      
      const jobData = {
        title,
        postType: form.postType,
        staffType: form.staffType,
        staffTypeOther: form.staffTypeOther,
        locationType: form.postType === 'homecare' ? 'HOME' : form.locationType,
        department: form.department,
        description: form.description,
        shiftRate: form.postType === 'job' 
          ? parseInt(form.salaryMin) 
          : parseInt(form.shiftRate),
        rateType: form.postType === 'job' ? 'month' : form.rateType,
        paymentType: form.paymentType,
        deductPercent: form.paymentType === 'DEDUCT_PERCENT' ? form.deductPercent : undefined,
        shiftDate: form.shiftDate,
        shiftDateEnd: form.shiftDateEnd || undefined,
        shiftTime: form.postType === 'shift' ? shiftTime : undefined,
        duration: form.postType === 'homecare' ? form.duration : undefined,
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
          { text: 'ดูประกาศของฉัน', onPress: () => navigation.replace('MyPosts') }
        ]) as AlertState);
      }
    } catch (error: any) {
      setAlert(createAlert.error('เกิดข้อผิดพลาด', error.message) as AlertState);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get step title
  const getStepTitle = () => {
    if (currentStep === 0) {
      return { title: 'เลือกประเภทประกาศ', subtitle: 'คุณต้องการลงประกาศแบบไหน?' };
    }
    
    const titles: Record<PostType, { title: string; subtitle: string }[]> = {
      shift: [
        { title: 'ข้อมูลเวร', subtitle: 'ประเภทบุคลากรและแผนก' },
        { title: 'วันเวลา', subtitle: 'เลือกวันที่และเวลาเวร' },
        { title: 'สถานที่', subtitle: 'ระบุสถานที่ทำงาน' },
        { title: 'ค่าตอบแทน', subtitle: 'กรอกค่าเวรและข้อมูลติดต่อ' },
      ],
      job: [
        { title: 'ตำแหน่งงาน', subtitle: 'ประเภทบุคลากรและแผนก' },
        { title: 'รายละเอียด', subtitle: 'คุณสมบัติและสวัสดิการ' },
        { title: 'สถานที่', subtitle: 'ระบุสถานที่ทำงาน' },
        { title: 'เงินเดือน', subtitle: 'กรอกเงินเดือนและข้อมูลติดต่อ' },
      ],
      homecare: [
        { title: 'ประเภทการดูแล', subtitle: 'เลือกประเภทผู้ป่วย' },
        { title: 'ระยะเวลา', subtitle: 'ระยะเวลาที่ต้องการ' },
        { title: 'สถานที่', subtitle: 'ระบุที่อยู่ผู้ป่วย' },
        { title: 'ค่าจ้าง', subtitle: 'กรอกค่าจ้างและข้อมูลติดต่อ' },
      ],
    };
    
    return titles[form.postType][currentStep - 1] || { title: '', subtitle: '' };
  };
  
  // ============================================
  // STEP 0: เลือกประเภทประกาศ
  // ============================================
  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.typeSelectTitle, { color: colors.text }]}>
        คุณต้องการลงประกาศแบบไหน?
      </Text>
      
      {POST_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.typeCard,
            { borderColor: form.postType === type.value ? type.color : colors.border },
            form.postType === type.value && { backgroundColor: type.color + '10' },
          ]}
          onPress={() => setForm({ ...form, postType: type.value })}
        >
          <Text style={styles.typeIcon}>{type.icon}</Text>
          <View style={styles.typeInfo}>
            <Text style={[styles.typeTitle, { color: colors.text }]}>{type.title}</Text>
            <Text style={[styles.typeSubtitle, { color: colors.textSecondary }]}>{type.subtitle}</Text>
          </View>
          <View style={[
            styles.typeRadio,
            { borderColor: form.postType === type.value ? type.color : colors.border },
            form.postType === type.value && { backgroundColor: type.color },
          ]}>
            {form.postType === type.value && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      ))}
      
      {/* Info box */}
      <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          {form.postType === 'shift' && 'สำหรับหาคนมาแทนเวรเฉพาะวัน หรือขายเวรที่ไม่สะดวกทำ'}
          {form.postType === 'job' && 'สำหรับโรงพยาบาล/คลินิก รับสมัครพยาบาลประจำ'}
          {form.postType === 'homecare' && 'สำหรับหาคนดูแลผู้ป่วยที่บ้าน เฝ้าไข้ทั่วไป'}
        </Text>
      </View>
    </View>
  );
  
  // ============================================
  // STEP 1: ข้อมูลพื้นฐาน
  // ============================================
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Staff Type */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {form.postType === 'homecare' ? 'ต้องการบุคลากรประเภทใด?' : 'ประเภทบุคลากรที่ต้องการ'}
      </Text>
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
      
      {/* Location Type (not for homecare) */}
      {form.postType !== 'homecare' && (
        <>
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
        </>
      )}
      
      {/* Department / Care Type */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
        {form.postType === 'homecare' ? 'ประเภทการดูแล' : 'แผนก'} <Text style={{ color: COLORS.error }}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.inputButton, { borderColor: errors.department ? COLORS.error : colors.border }]}
        onPress={() => setShowDepartmentModal(true)}
      >
        <Ionicons name="medical-outline" size={20} color={errors.department ? COLORS.error : colors.primary} />
        <Text style={[styles.inputButtonText, { color: form.department ? colors.text : colors.textMuted }]}>
          {form.department || (form.postType === 'homecare' ? 'เลือกประเภทการดูแล' : 'เลือกแผนก')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
    </View>
  );
  
  // ============================================
  // STEP 2: วันเวลา / ระยะเวลา
  // ============================================
  const renderStep2 = () => {
    if (form.postType === 'shift') {
      // Shift: เลือกวันและเวลา
      return (
        <View style={styles.stepContent}>
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
          
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>เวลา</Text>
          
          {/* Time Picker Fields */}
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputGroup}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>เริ่ม</Text>
              <TouchableOpacity
                style={[styles.timeInputLarge, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowStartTimeModal(true)}
              >
                <Text style={[styles.timeInputText, { color: form.customStartTime ? colors.text : colors.textMuted }]}>
                  {form.customStartTime || '08:00'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeArrow}>
              <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.timeInputGroup}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>สิ้นสุด</Text>
              <TouchableOpacity
                style={[styles.timeInputLarge, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowEndTimeModal(true)}
              >
                <Text style={[styles.timeInputText, { color: form.customEndTime ? colors.text : colors.textMuted }]}>
                  {form.customEndTime || '16:00'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    
    if (form.postType === 'homecare') {
      // Home care: เลือกระยะเวลา
      return (
        <View style={styles.stepContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ระยะเวลาที่ต้องการ</Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.durationCard,
                  { borderColor: form.duration === opt.value ? colors.primary : colors.border },
                  form.duration === opt.value && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setForm({ ...form, duration: opt.value })}
              >
                <Text style={[styles.durationLabel, { color: colors.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
          
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
            วันที่เริ่ม (ถ้าทราบ)
          </Text>
          <TouchableOpacity
            style={[styles.inputButton, { borderColor: colors.border }]}
            onPress={() => setShowDateModal(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.inputButtonText, { color: colors.text }]}>
              {form.shiftDate.toLocaleDateString('th-TH', { 
                weekday: 'long', day: 'numeric', month: 'long' 
              })}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Job posting: รายละเอียดงาน
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>รายละเอียดงาน</Text>
        <TextInput
          style={[styles.textInput, styles.textArea, { borderColor: colors.border, color: colors.text }]}
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          placeholder="อธิบายลักษณะงาน คุณสมบัติที่ต้องการ ประสบการณ์ ฯลฯ"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
        />
        
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
          สวัสดิการ (เลือกได้หลายอัน)
        </Text>
        <View style={styles.chipRow}>
          {['ประกันสังคม', 'ประกันกลุ่ม', 'โบนัส', 'OT', 'ที่พัก', 'อาหาร', 'รถรับส่ง', 'วันหยุดตามปฏิทิน'].map((benefit) => (
            <Chip
              key={benefit}
              label={benefit}
              selected={form.benefits.includes(benefit)}
              onPress={() => {
                if (form.benefits.includes(benefit)) {
                  setForm({ ...form, benefits: form.benefits.filter(b => b !== benefit) });
                } else {
                  setForm({ ...form, benefits: [...form.benefits, benefit] });
                }
              }}
            />
          ))}
        </View>
      </View>
    );
  };
  
  // ============================================
  // STEP 3: สถานที่
  // ============================================
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {/* Hospital/Place Search FIRST - Auto-fill province/district */}
      {form.postType !== 'homecare' && form.locationType !== 'HOME' ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {form.locationType === 'HOSPITAL' ? 'ค้นหาโรงพยาบาล' : 'ค้นหาสถานที่'}
          </Text>
          <PlaceAutocomplete
            value={form.hospital}
            placeholder={form.locationType === 'HOSPITAL' ? 'พิมพ์ เช่น รามาธิบดี, ศิริราช...' : 'พิมพ์ชื่อสถานที่...'}
            onSelect={(place) => {
              setForm({
                ...form,
                hospital: place.name,
                province: place.province || form.province,
                district: place.district || form.district,
              });
            }}
          />
          {errors.hospital && <Text style={styles.errorText}>{errors.hospital}</Text>}
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
      
      {/* Province - can be auto-filled or manual */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>จังหวัด</Text>
      <TouchableOpacity
        style={[styles.inputButton, { borderColor: colors.border }]}
        onPress={() => setShowProvinceModal(true)}
      >
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <Text style={[styles.inputButtonText, { color: form.province ? colors.text : colors.textMuted }]}>
          {form.province || 'เลือกจังหวัด'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {errors.province && <Text style={styles.errorText}>{errors.province}</Text>}
      
      {/* District - can be auto-filled or manual */}
      {form.province && getDistrictsForProvince(form.province).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>
            {form.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}
          </Text>
          <TouchableOpacity
            style={[styles.selectButton, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setShowDistrictModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              { color: form.district ? colors.text : colors.textMuted }
            ]}>
              {form.district || `เลือก${form.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}...`}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </>
      )}
      
      {/* Hint text */}
      <View style={[styles.infoBox, { backgroundColor: colors.primaryLight, marginTop: SPACING.lg }]}>
        <Ionicons name="bulb-outline" size={18} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          พิมพ์ชื่อโรงพยาบาลด้านบน จะเติมจังหวัด/เขตให้อัตโนมัติ
        </Text>
      </View>
    </View>
  );
  
  // ============================================
  // STEP 4: ค่าตอบแทน & ติดต่อ
  // ============================================
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      {/* Title (optional) */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>หัวข้อประกาศ (ไม่บังคับ)</Text>
      <TextInput
        style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
        value={form.title}
        onChangeText={(v) => setForm({ ...form, title: v })}
        placeholder={
          form.postType === 'shift' ? `หา ${getStaffTypeLabel(form.staffType)} แทนเวร ${form.department || ''}` :
          form.postType === 'job' ? `รับสมัคร ${getStaffTypeLabel(form.staffType)}` :
          `หาคนดูแล ${form.department || ''}`
        }
        placeholderTextColor={colors.textMuted}
      />
      
      {/* Rate/Salary */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
        {form.postType === 'job' ? 'เงินเดือน' : 'ค่าตอบแทน'}
      </Text>
      
      {form.postType === 'job' ? (
        <View style={styles.row}>
          <TextInput
            style={[styles.textInput, { flex: 1, borderColor: colors.border, color: colors.text }]}
            value={form.salaryMin}
            onChangeText={(v) => setForm({ ...form, salaryMin: v.replace(/[^0-9]/g, '') })}
            placeholder="เงินเดือนเริ่มต้น"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <Text style={{ color: colors.textMuted, marginHorizontal: SPACING.sm }}>-</Text>
          <TextInput
            style={[styles.textInput, { flex: 1, borderColor: colors.border, color: colors.text }]}
            value={form.salaryMax}
            onChangeText={(v) => setForm({ ...form, salaryMax: v.replace(/[^0-9]/g, '') })}
            placeholder="สูงสุด (ถ้ามี)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>
      ) : (
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
                onPress={() => setForm({ ...form, rateType: rt.value as any })}
              >
                <Text style={{ color: form.rateType === rt.value ? '#fff' : colors.text, fontSize: 12 }}>
                  {rt.shortLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {errors.shiftRate && <Text style={styles.errorText}>{errors.shiftRate}</Text>}
      {errors.salaryMin && <Text style={styles.errorText}>{errors.salaryMin}</Text>}
      
      {/* Payment Type */}
      {form.postType !== 'job' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>
            รูปแบบค่าตอบแทน
          </Text>
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
          
          {/* Deduct Percent - แสดงเฉพาะถ้าเลือก DEDUCT_PERCENT */}
          {form.paymentType === 'DEDUCT_PERCENT' && (
            <View style={[styles.deductContainer, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.deductLabel, { color: '#92400E' }]}>หักกี่เปอร์เซ็นต์?</Text>
              <View style={styles.deductInputRow}>
                <TextInput
                  style={[styles.deductInput, { borderColor: '#F59E0B', color: colors.text }]}
                  value={form.deductPercent > 0 ? form.deductPercent.toString() : ''}
                  onChangeText={(v) => {
                    const num = parseInt(v.replace(/[^0-9]/g, '')) || 0;
                    setForm({ ...form, deductPercent: Math.min(num, 50) });
                  }}
                  placeholder="เช่น 5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.deductPercentSign, { color: '#92400E' }]}>%</Text>
              </View>
              {form.shiftRate && form.deductPercent > 0 && (
                <Text style={[styles.deductResult, { color: '#059669' }]}> 
                  {'💰 พยาบาลได้รับ: '}฿{Math.round(parseInt(form.shiftRate) * (1 - form.deductPercent / 100)).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </>
      )}
      
      {/* Description */}
      {form.postType !== 'job' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.lg }]}>
            รายละเอียดเพิ่มเติม
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: colors.border, color: colors.text }]}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="รายละเอียดงาน ความต้องการพิเศษ ฯลฯ"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </>
      )}
      
      {/* Tags */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>
        แท็ก (เลือกได้หลายอัน)
      </Text>
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
          { borderColor: form.isUrgent ? COLORS.error : colors.border },
          form.isUrgent && { backgroundColor: 'rgba(239,68,68,0.1)' },
        ]}
        onPress={() => setForm({ ...form, isUrgent: !form.isUrgent })}
      >
        <Text style={styles.urgentIcon}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.urgentTitle, { color: colors.text }]}>ประกาศด่วน</Text>
          <Text style={[styles.urgentSubtitle, { color: colors.textMuted }]}>
            แสดงเด่นกว่าประกาศปกติ ติดป้าย "ด่วน"
          </Text>
          <View style={styles.urgentPriceTag}>
            <Text style={styles.urgentPriceText}>฿49</Text>
          </View>
        </View>
        <Ionicons
          name={form.isUrgent ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={form.isUrgent ? COLORS.error : colors.textMuted}
        />
      </TouchableOpacity>
      {form.isUrgent && (
        <View style={[styles.urgentNote, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="information-circle" size={16} color="#92400E" />
          <Text style={[styles.urgentNoteText, { color: '#92400E' }]}>
            จะต้องชำระเงิน ฿49 ก่อนโพสต์
          </Text>
        </View>
      )}
    </View>
  );
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };
  
  const stepInfo = getStepTitle();
  
  return (
    <>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{stepInfo.title}</Text>
          <Text style={styles.headerSubtitle}>{stepInfo.subtitle}</Text>
        </View>
        {currentStep > 0 && (
          <Text style={styles.stepIndicator}>{currentStep}/{getTotalSteps()}</Text>
        )}
      </View>
      
      {/* Progress Bar (only for steps 1-4) */}
      {currentStep > 0 && (
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
      )}
      
      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {currentStep === 0 ? (
          <Animated.View
            style={{
              flex: 1,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -400], // slide left
                  }),
                },
              ],
            }}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderStepContent()}
            </ScrollView>
          </Animated.View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { borderTopColor: colors.border, backgroundColor: colors.surface }]}> 
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={goBack}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: SPACING.sm,
              backgroundColor: '#fff',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          disabled={isLoading}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            backgroundColor: isLoading ? colors.textMuted : colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading ? 0.7 : 1,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {currentStep === 0 ? 'เริ่มต้น' :
              currentStep === getTotalSteps() ? (isLoading ? 'กำลังโพสต์...' : '🚀 โพสต์เลย') : 
              'ถัดไป'}
          </Text>
        </TouchableOpacity>
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
        {!provinceSearch && !showAllProvinces && (
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
        
        {/* Show All Button */}
        {!provinceSearch && !showAllProvinces && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setShowAllProvinces(true)}
          >
            <Text style={[styles.showMoreText, { color: colors.primary }]}>ดูทั้งหมด 77 จังหวัด</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        <ScrollView style={{ maxHeight: 350 }}>
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
                setShowAllProvinces(false);
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
        title={form.postType === 'homecare' ? 'ประเภทการดูแล' : 'เลือกแผนก'}
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {getDepartments().map((dept) => (
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
      
      {/* District Modal */}
      <ModalContainer
        visible={showDistrictModal}
        onClose={() => {
          setShowDistrictModal(false);
          setDistrictSearch('');
        }}
        title={`เลือก${form.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}`}
      >
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
          value={districtSearch}
          onChangeText={setDistrictSearch}
          placeholder={`ค้นหา${form.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}...`}
          placeholderTextColor={colors.textMuted}
        />
        <ScrollView style={{ maxHeight: 400 }}>
          {getDistrictsForProvince(form.province)
            .filter(d => !districtSearch || d.includes(districtSearch))
            .map((district) => (
            <TouchableOpacity
              key={district}
              style={[
                styles.listItem,
                form.district === district && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => {
                setForm({ ...form, district });
                setShowDistrictModal(false);
                setDistrictSearch('');
              }}
            >
              <Text style={[styles.listItemText, { color: colors.text }]}>{district}</Text>
              {form.district === district && (
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
      
      {/* Start Time Modal */}
      <ModalContainer
        visible={showStartTimeModal}
        onClose={() => setShowStartTimeModal(false)}
        title="เลือกเวลาเริ่ม"
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {TIME_OPTIONS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeOption,
                form.customStartTime === time && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => {
                setForm({ ...form, customStartTime: time, shiftTime: 'custom' });
                setShowStartTimeModal(false);
              }}
            >
              <Text style={[
                styles.timeOptionText,
                { color: form.customStartTime === time ? colors.primary : colors.text }
              ]}>
                {time}
              </Text>
              {form.customStartTime === time && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>
      
      {/* End Time Modal */}
      <ModalContainer
        visible={showEndTimeModal}
        onClose={() => setShowEndTimeModal(false)}
        title="เลือกเวลาสิ้นสุด"
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {TIME_OPTIONS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeOption,
                form.customEndTime === time && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => {
                setForm({ ...form, customEndTime: time, shiftTime: 'custom' });
                setShowEndTimeModal(false);
              }}
            >
              <Text style={[
                styles.timeOptionText,
                { color: form.customEndTime === time ? colors.primary : colors.text }
              ]}>
                {time}
              </Text>
              {form.customEndTime === time && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>
      
      {/* Alert */}
      <CustomAlert {...alert} onClose={() => setAlert(initialAlertState)} />
    </SafeAreaView>
    </>
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
    marginBottom: SPACING.sm,
  },
  centeredSubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
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
  
  // Step 0: Type Selection
  typeSelectTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  typeIcon: {
    fontSize: 36,
    marginRight: SPACING.md,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  typeSubtitle: {
    fontSize: FONT_SIZES.sm,
  },
  typeRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  
  // Section Title
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
  
  // Duration Grid
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  durationDesc: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
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
    minHeight: 100,
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
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: 6,
    textAlign: 'center',
  },
  timeInputLarge: {
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeArrow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  timeOptionText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  quickPresetsLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  presetChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 90,
  },
  presetChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  presetChipTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
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
  
  // Deduct Container
  deductContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  deductLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  deductResult: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
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
  urgentPriceTag: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  urgentPriceText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  urgentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  urgentNoteText: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  
  // Deduct Input
  deductInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deductInput: {
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
    backgroundColor: '#fff',
  },
  deductPercentSign: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginLeft: SPACING.sm,
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
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  showMoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginRight: 4,
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  selectButtonText: {
    fontSize: FONT_SIZES.md,
    flex: 1,
  },
});
