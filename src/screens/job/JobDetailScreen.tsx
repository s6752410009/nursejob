// ============================================
// SHIFT DETAIL SCREEN - รายละเอียดงาน
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button, Avatar, Badge, Card, ModalContainer } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { contactForShift } from '../../services/jobService';
import { JobPost, RootStackParamList } from '../../types';
import { formatDate, formatRelativeTime, callPhone, openLine, openMapsDirections } from '../../utils/helpers';

// ============================================
// Types
// ============================================
type JobDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JobDetail'>;
type JobDetailScreenRouteProp = RouteProp<RootStackParamList, 'JobDetail'>;

interface Props {
  navigation: JobDetailScreenNavigationProp;
  route: JobDetailScreenRouteProp;
}

// ============================================
// Helpers
// ============================================
const formatShiftRate = (rate: number, type: string): string => {
  const formattedRate = rate.toLocaleString('th-TH');
  const unit = type === 'hour' ? '/ชม.' : type === 'day' ? '/วัน' : '/กะ';
  return `฿${formattedRate}${unit}`;
};

const formatShiftDate = (date: Date): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  return d.toLocaleDateString('th-TH', options);
};

const getShiftTimeLabel = (time: string): string => {
  const timeMap: Record<string, string> = {
    '08:00-16:00': '☀️ กะเช้า',
    '16:00-00:00': '🌅 กะบ่าย', 
    '00:00-08:00': '🌙 กะดึก',
    '08:00-20:00': '☀️ เช้า-บ่าย',
    '20:00-08:00': '🌙 บ่าย-ดึก',
    '00:00-24:00': '⏰ ทั้งวัน',
  };
  return timeMap[time] || time;
};

// ============================================
// Component
// ============================================
export default function JobDetailScreen({ navigation, route }: Props) {
  const { job } = route.params;
  const { user, requireAuth } = useAuth();

  const [isContacting, setIsContacting] = useState(false);
  const [hasContacted, setHasContacted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Handle contact poster
  const handleContact = () => {
    requireAuth(() => {
      if (hasContacted) {
        Alert.alert('แจ้งเตือน', 'คุณได้ติดต่อเรื่องงานนี้ไปแล้ว');
        return;
      }
      setShowContactModal(true);
    });
  };

  // Submit contact
  const submitContact = async () => {
    if (!user) return;

    setIsContacting(true);
    try {
      await contactForShift(
        job.id, 
        user.uid, 
        user.displayName || 'ผู้ใช้',
        user.phone || ''
      );
      setShowContactModal(false);
      setHasContacted(true);
      Alert.alert(
        'แสดงความสนใจแล้ว! 📞',
        'ระบบบันทึกความสนใจของคุณแล้ว\nกรุณาติดต่อผู้โพสต์โดยตรง',
        [{ text: 'ตกลง' }]
      );
    } catch (error: any) {
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'กรุณาลองใหม่');
    } finally {
      setIsContacting(false);
    }
  };

  // Handle call
  const handleCall = () => {
    if (job.contactPhone) {
      callPhone(job.contactPhone);
    } else {
      Alert.alert('ไม่มีเบอร์โทร', 'ประกาศนี้ไม่ได้ระบุเบอร์โทรติดต่อ');
    }
  };

  // Handle LINE
  const handleLine = () => {
    if (job.contactLine) {
      openLine(job.contactLine);
    } else {
      Alert.alert('ไม่มี LINE ID', 'ประกาศนี้ไม่ได้ระบุ LINE ID');
    }
  };

  // Handle directions - open Google Maps with route
  const handleDirections = () => {
    // สร้าง search term รวมชื่อสถานที่และที่ตั้ง
    let searchTerm = '';
    
    if (job.location?.hospital) {
      searchTerm = job.location.hospital;
      // เพิ่มจังหวัดเพื่อความแม่นยำ
      if (job.location?.district) {
        searchTerm += ` ${job.location.district}`;
      }
      if (job.location?.province) {
        searchTerm += ` ${job.location.province}`;
      }
    } else if (job.location?.address) {
      searchTerm = job.location.address;
    } else if (job.location?.province) {
      searchTerm = job.location.province;
    }
    
    if (searchTerm) {
      openMapsDirections(searchTerm);
    } else {
      Alert.alert('ไม่มีที่อยู่', 'ประกาศนี้ไม่ได้ระบุที่ตั้ง');
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      const rateText = formatShiftRate(job.shiftRate, job.rateType);
      const dateText = formatShiftDate(job.shiftDate);
      await Share.share({
        message: `📋 ${job.title}\n📅 ${dateText}\n⏰ ${job.shiftTime}\n💰 ${rateText}\n📍 ${job.location?.hospital || job.location?.province}\n\nดูรายละเอียดที่ NurseShift App`,
        title: job.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle save
  const handleSave = () => {
    requireAuth(() => {
      setIsSaved(!isSaved);
      Alert.alert(
        isSaved ? 'ยกเลิกบันทึกแล้ว' : 'บันทึกแล้ว',
        isSaved ? 'ยกเลิกการบันทึกแล้ว' : 'บันทึกไว้แล้ว'
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Back & Actions */}
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Text style={styles.actionIcon}>{isSaved ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionIcon}>↗️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Poster Info */}
          <View style={styles.posterSection}>
            <Avatar 
              uri={job.posterPhoto}
              name={job.posterName}
              size={60}
            />
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{job.posterName}</Text>
              <Text style={styles.postedTime}>โพสต์ {formatRelativeTime(job.createdAt)}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{job.title}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            {job.status === 'urgent' && (
              <Badge text="🔥 ด่วน" variant="danger" />
            )}
            <Badge text={job.department} variant="primary" />
            <Badge text={getShiftTimeLabel(job.shiftTime)} variant="secondary" />
          </View>
        </View>

        {/* Shift Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📋 รายละเอียดงาน</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>วันที่</Text>
              <Text style={styles.detailValue}>{formatShiftDate(job.shiftDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>เวลา</Text>
              <Text style={styles.detailValue}>{job.shiftTime}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>ค่าตอบแทน</Text>
              <Text style={[styles.detailValue, styles.rateValue]}>
                {formatShiftRate(job.shiftRate, job.rateType)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📍 สถานที่</Text>
          
          {job.location?.hospital && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏥</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>โรงพยาบาล/สถานที่</Text>
                <Text style={styles.detailValue}>{job.location.hospital}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🗺️</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>พื้นที่</Text>
              <Text style={styles.detailValue}>
                {job.location?.district ? `${job.location.district}, ` : ''}
                {job.location?.province || 'ไม่ระบุ'}
              </Text>
            </View>
          </View>

          {(job.location?.hospital || job.location?.address) && (
            <TouchableOpacity style={styles.mapButton} onPress={handleDirections}>
              <Text style={styles.mapButtonText}>🗺️ ดูแผนที่</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Description */}
        {job.description && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>📝 รายละเอียดเพิ่มเติม</Text>
            <Text style={styles.description}>{job.description}</Text>
          </Card>
        )}

        {/* Contact */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>📞 ช่องทางติดต่อ</Text>
          
          <View style={styles.contactButtons}>
            {job.contactPhone && (
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <Text style={styles.contactIcon}>📱</Text>
                <Text style={styles.contactText}>โทร {job.contactPhone}</Text>
              </TouchableOpacity>
            )}
            
            {job.contactLine && (
              <TouchableOpacity style={styles.contactButton} onPress={handleLine}>
                <Text style={styles.contactIcon}>💬</Text>
                <Text style={styles.contactText}>LINE: {job.contactLine}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Views */}
        {job.viewsCount !== undefined && (
          <View style={styles.viewsRow}>
            <Text style={styles.viewsText}>👁 {job.viewsCount} คนดู</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomRate}>
          <Text style={styles.bottomRateLabel}>ค่าตอบแทน</Text>
          <Text style={styles.bottomRateValue}>
            {formatShiftRate(job.shiftRate, job.rateType)}
          </Text>
        </View>
        
        <Button
          title={hasContacted ? '✓ สนใจแล้ว' : 'สนใจงานนี้'}
          onPress={handleContact}
          disabled={hasContacted}
          style={hasContacted ? styles.contactedButton : styles.contactMainButton}
        />
      </View>

      {/* Contact Modal */}
      <ModalContainer
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="ยืนยันความสนใจ"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalIcon}>📞</Text>
          <Text style={styles.modalTitle}>{job.title}</Text>
          <Text style={styles.modalSubtitle}>
            {formatShiftDate(job.shiftDate)} • {job.shiftTime}
          </Text>
          <Text style={styles.modalRate}>
            {formatShiftRate(job.shiftRate, job.rateType)}
          </Text>
          
          <Text style={styles.modalNote}>
            กดยืนยันเพื่อบันทึกความสนใจ{'\n'}
            จากนั้นติดต่อผู้โพสต์โดยตรง
          </Text>

          <View style={styles.modalActions}>
            <Button
              title="ยกเลิก"
              variant="outline"
              onPress={() => setShowContactModal(false)}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <Button
              title={isContacting ? 'กำลังบันทึก...' : 'ยืนยัน'}
              onPress={submitContact}
              loading={isContacting}
              disabled={isContacting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
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
  headerCard: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? SPACING.lg : SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },

  // Poster
  posterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  posterInfo: {
    marginLeft: SPACING.md,
  },
  posterName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  postedTime: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Title
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },

  // Badges
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },

  // Section
  section: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
  },
  rateValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Description
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },

  // Map button
  mapButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  mapButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Contact buttons
  contactButtons: {
    gap: SPACING.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  contactIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Views
  viewsRow: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  viewsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  bottomRate: {
    flex: 1,
  },
  bottomRateLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  bottomRateValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  contactMainButton: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactedButton: {
    backgroundColor: COLORS.textMuted,
  },

  // Modal
  modalContent: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  modalRate: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: SPACING.sm,
  },
  modalNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: SPACING.lg,
  },
});
