// ============================================
// POST SHIFT SCREEN - ประกาศหาคนแทน
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Card, Chip, ModalContainer } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DEPARTMENTS, PROVINCES, DISTRICTS_BY_PROVINCE } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../services/jobService';
import { MainTabParamList } from '../../types';

// ============================================
// Types
// ============================================
type PostJobScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'PostJob'>;

interface Props {
  navigation: PostJobScreenNavigationProp;
}

interface ShiftForm {
  title: string;
  department: string;
  description: string;
  shiftRate: string;
  rateType: 'hour' | 'day' | 'shift';
  shiftDate: string;
  shiftTime: string;
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
export default function PostJobScreen({ navigation }: Props) {
  const { user, isAuthenticated } = useAuth();
  
  // Form state
  const [form, setForm] = useState<ShiftForm>({
    title: '',
    department: '',
    description: '',
    shiftRate: '',
    rateType: 'shift',
    shiftDate: '',
    shiftTime: '',
    province: 'กรุงเทพมหานคร',
    district: '',
    hospital: '',
    contactPhone: user?.phone || '',
    contactLine: '',
    isUrgent: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Shift times
  const SHIFT_TIMES = [
    { label: 'กะเช้า (08:00-16:00)', value: '08:00-16:00' },
    { label: 'กะบ่าย (16:00-00:00)', value: '16:00-00:00' },
    { label: 'กะดึก (00:00-08:00)', value: '00:00-08:00' },
    { label: 'เช้า-บ่าย (08:00-20:00)', value: '08:00-20:00' },
    { label: 'บ่าย-ดึก (20:00-08:00)', value: '20:00-08:00' },
    { label: 'ทั้งวัน (24 ชม.)', value: '00:00-24:00' },
  ];

  // Rate types
  const RATE_TYPES = [
    { label: '/กะ', value: 'shift' },
    { label: '/ชม.', value: 'hour' },
    { label: '/วัน', value: 'day' },
  ];

  // Guest check
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredView}>
          <Text style={styles.centeredIcon}>📝</Text>
          <Text style={styles.centeredTitle}>เข้าสู่ระบบก่อนโพสต์</Text>
          <Text style={styles.centeredDescription}>
            เข้าสู่ระบบเพื่อประกาศหาคนแทน
          </Text>
          <Button
            title="เข้าสู่ระบบ"
            onPress={() => (navigation as any).navigate('Auth')}
            style={{ marginTop: SPACING.lg }}
          />
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
    if (!form.shiftDate) newErrors.shiftDate = 'กรุณากรอกวันที่';
    if (!form.shiftTime) newErrors.shiftTime = 'กรุณาเลือกเวลา';
    if (!form.province) newErrors.province = 'กรุณาเลือกจังหวัด';
    if (!form.contactPhone && !form.contactLine) {
      newErrors.contactPhone = 'กรุณากรอกเบอร์โทรหรือ LINE';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        '⚠️ ข้อมูลไม่ครบ',
        'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
        [{ text: 'ตกลง' }]
      );
      return;
    }
    if (!user?.uid) {
      Alert.alert(
        '❌ ต้องเข้าสู่ระบบ',
        'กรุณาเข้าสู่ระบบก่อนโพสต์งาน',
        [{ text: 'ตกลง' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      // Parse date
      const [day, month, year] = form.shiftDate.split('/');
      const shiftDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      await createJob({
        title: form.title,
        department: form.department,
        description: form.description,
        shiftRate: parseInt(form.shiftRate),
        rateType: form.rateType,
        shiftDate,
        shiftTime: form.shiftTime,
        location: {
          province: form.province,
          district: form.district,
          hospital: form.hospital,
        },
        posterId: user.uid,
        posterName: user.displayName || 'ไม่ระบุชื่อ',
        posterPhoto: user.photoURL || undefined,
        contactPhone: form.contactPhone,
        contactLine: form.contactLine,
        status: form.isUrgent ? 'urgent' : 'active',
      });

      Alert.alert(
        '🎉 โพสต์สำเร็จ!',
        'ประกาศของคุณถูกโพสต์แล้ว\nผู้สนใจจะติดต่อกลับเร็วๆ นี้',
        [{ 
          text: 'กลับหน้าแรก', 
          onPress: () => (navigation as any).navigate('Home') 
        }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ เกิดข้อผิดพลาด', 
        error.message || 'ไม่สามารถโพสต์ได้ กรุณาลองใหม่',
        [{ text: 'ตกลง' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 ประกาศหาคนแทน</Text>
        <Text style={styles.headerSubtitle}>กรอกข้อมูลงานที่ต้องการหาคนแทน</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>รายละเอียดงาน</Text>
          
          <Input
            label="หัวข้อ *"
            placeholder="เช่น หาคนแทนกะดึก ICU, งาน OPD"
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
          
          <Input
            label="วันที่ต้องการ *"
            placeholder="DD/MM/YYYY เช่น 25/01/2025"
            value={form.shiftDate}
            onChangeText={(text) => setForm({ ...form, shiftDate: text })}
            keyboardType="numbers-and-punctuation"
            error={errors.shiftDate}
          />

          {/* Shift Time */}
          <Text style={styles.inputLabel}>เวลา *</Text>
          <TouchableOpacity
            style={[styles.selectButton, errors.shiftTime && styles.selectButtonError]}
            onPress={() => setShowTimeModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !form.shiftTime && styles.selectButtonPlaceholder
            ]}>
              {form.shiftTime ? SHIFT_TIMES.find(t => t.value === form.shiftTime)?.label : 'เลือกเวลา'}
            </Text>
            <Text style={styles.selectIcon}>▼</Text>
          </TouchableOpacity>
          {errors.shiftTime && <Text style={styles.errorText}>{errors.shiftTime}</Text>}

          {/* Urgent toggle */}
          <TouchableOpacity
            style={styles.urgentToggle}
            onPress={() => setForm({ ...form, isUrgent: !form.isUrgent })}
          >
            <Text style={styles.urgentIcon}>{form.isUrgent ? '🔥' : '⬜'}</Text>
            <Text style={styles.urgentText}>ด่วน! ต้องการคนแทนเร็ว</Text>
          </TouchableOpacity>
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
          
          {/* Province */}
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

          <Input
            label="โรงพยาบาล/สถานที่"
            placeholder="ชื่อโรงพยาบาลหรือสถานที่ทำงาน"
            value={form.hospital}
            onChangeText={(text) => setForm({ ...form, hospital: text })}
          />
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
          title={isLoading ? 'กำลังโพสต์...' : 'โพสต์เลย 🚀'}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
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

      {/* Time Modal */}
      <ModalContainer
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        title="เลือกเวลา"
      >
        <ScrollView style={styles.modalList}>
          {SHIFT_TIMES.map((time) => (
            <TouchableOpacity
              key={time.value}
              style={styles.modalItem}
              onPress={() => {
                setForm({ ...form, shiftTime: time.value });
                setShowTimeModal(false);
              }}
            >
              <Text style={[
                styles.modalItemText,
                form.shiftTime === time.value && styles.modalItemTextSelected
              ]}>
                {time.label}
              </Text>
              {form.shiftTime === time.value && (
                <Text style={styles.modalItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ModalContainer>
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

  // Urgent toggle
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  urgentIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  urgentText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
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
});
