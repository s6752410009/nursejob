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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button, Avatar, Badge, Card, ModalContainer, BackButton, ConfirmModal, SuccessModal, ErrorModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { contactForShift, deleteJob, updateJob } from '../../services/jobService';
import { getOrCreateConversation, reportJob } from '../../services/chatService';
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
  const unit = type === 'hour' ? '/ชม.' : type === 'day' ? '/วัน' : '/เวร';
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
    '08:00-16:00': 'เวรเช้า',
    '16:00-00:00': 'เวรบ่าย', 
    '00:00-08:00': 'เวรดึก',
    '08:00-20:00': 'เช้า-บ่าย',
    '20:00-08:00': 'บ่าย-ดึก',
    '00:00-24:00': 'ทั้งวัน',
  };
  return timeMap[time] || time;
};

// ============================================
// Component
// ============================================
export default function JobDetailScreen({ navigation, route }: Props) {
  const { job } = route.params;
  const { user, requireAuth, isAuthenticated } = useAuth();

  const [isContacting, setIsContacting] = useState(false);
  const [hasContacted, setHasContacted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Check if user is logged in
  const isLoggedIn = isAuthenticated && user;
  
  // Check if user is the owner of this job
  const isOwner = user && (user.uid === job.posterId || user.id === job.posterId);

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
        message: `${job.title}\nวันที่: ${dateText}\nเวลา: ${job.shiftTime}\nค่าตอบแทน: ${rateText}\nสถานที่: ${job.location?.hospital || job.location?.province}\n\nดูรายละเอียดที่ NurseShift App`,
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

  // Handle start chat with poster
  const handleStartChat = async () => {
    requireAuth(async () => {
      if (!user || !job.posterId) return;
      
      // Don't allow chatting with yourself
      if (user.uid === job.posterId || user.id === job.posterId) {
        Alert.alert('ไม่สามารถแชทได้', 'คุณไม่สามารถแชทกับตัวเองได้');
        return;
      }
      
      setIsStartingChat(true);
      try {
        const conversationId = await getOrCreateConversation(
          user.uid,
          user.displayName || 'ผู้ใช้',
          job.posterId,
          job.posterName || 'ผู้โพสต์',
          job.id,
          job.title,
          job.location?.hospital || undefined
        );
        
        // Navigate to chat room
        (navigation as any).navigate('ChatRoom', {
          conversationId,
          recipientName: job.posterName || 'ผู้โพสต์',
          jobTitle: job.title,
        });
      } catch (error: any) {
        setErrorMessage(error.message || 'ไม่สามารถเริ่มแชทได้ กรุณาลองใหม่');
        setShowErrorModal(true);
      } finally {
        setIsStartingChat(false);
      }
    });
  };

  // Handle report job
  const handleReportJob = () => {
    requireAuth(() => {
      setShowReportModal(true);
    });
  };

  const submitReport = async () => {
    if (!user || !reportReason.trim()) return;
    
    setIsReporting(true);
    try {
      await reportJob(job.id, user.uid, user.displayName || 'ผู้ใช้', reportReason.trim());
      setShowReportModal(false);
      setReportReason('');
      Alert.alert('รายงานแล้ว', 'ขอบคุณสำหรับการรายงาน ทีมงานจะตรวจสอบโดยเร็ว');
    } catch (error: any) {
      setErrorMessage(error.message || 'ไม่สามารถรายงานได้ กรุณาลองใหม่');
      setShowErrorModal(true);
    } finally {
      setIsReporting(false);
    }
  };

  // Handle delete job (for owner only)
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteJob(job.id);
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowDeleteModal(false);
      setErrorMessage(error.message || 'ไม่สามารถลบได้ กรุณาลองใหม่');
      setShowErrorModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit job (for owner only)
  const handleEdit = () => {
    (navigation as any).navigate('PostJob', { editJob: job });
  };

  // Handle mark as filled
  const handleMarkAsFilled = async () => {
    try {
      await updateJob(job.id, { status: 'closed' });
      Alert.alert('สำเร็จ', 'ปิดรับสมัครแล้ว');
      navigation.goBack();
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่');
    }
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
              {!isOwner && (
                <TouchableOpacity style={styles.actionButton} onPress={handleReportJob}>
                  <Ionicons name="flag-outline" size={20} color={COLORS.warning} />
                </TouchableOpacity>
              )}
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
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>รายละเอียดงาน</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>วันที่</Text>
              <Text style={styles.detailValue}>{formatShiftDate(job.shiftDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>เวลา</Text>
              <Text style={styles.detailValue}>{job.shiftTime}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={COLORS.success} style={styles.detailIcon} />
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
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>สถานที่</Text>
          </View>
          
          {job.location?.hospital && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>โรงพยาบาล/สถานที่</Text>
                <Text style={styles.detailValue}>{job.location.hospital}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="map-outline" size={20} color={COLORS.primary} style={styles.detailIcon} />
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
              <Ionicons name="navigate-outline" size={16} color={COLORS.white} />
              <Text style={styles.mapButtonText}>ดูแผนที่</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Description - Only show for logged in users */}
        {job.description && isLoggedIn && (
          <Card style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
            </View>
            <Text style={styles.description}>{job.description}</Text>
          </Card>
        )}

        {/* Owner Actions - Only show for job owner */}
        {isOwner && (
          <Card style={styles.ownerSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>จัดการประกาศ</Text>
            </View>
            <Text style={styles.ownerNote}>คุณเป็นเจ้าของประกาศนี้</Text>
            
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.ownerButton} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                <Text style={styles.ownerButtonText}>แก้ไข</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.ownerButton} onPress={handleMarkAsFilled}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
                <Text style={styles.ownerButtonText}>ปิดรับ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.ownerButton, styles.deleteButton]} 
                onPress={() => setShowDeleteModal(true)}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={[styles.ownerButtonText, styles.deleteButtonText]}>ลบ</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Contact - Only show for logged in users */}
        {isLoggedIn ? (
          <Card style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>ช่องทางติดต่อ</Text>
            </View>
            
            <View style={styles.contactButtons}>
              {job.contactPhone && (
                <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                  <Text style={styles.contactText}>โทร {job.contactPhone}</Text>
                </TouchableOpacity>
              )}
              
              {job.contactLine && (
                <TouchableOpacity style={styles.contactButton} onPress={handleLine}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.success} />
                  <Text style={styles.contactText}>LINE: {job.contactLine}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ) : (
          <Card style={styles.lockedSection}>
            <View style={styles.lockedContent}>
              <Ionicons name="lock-closed" size={32} color={COLORS.textMuted} />
              <Text style={styles.lockedTitle}>เข้าสู่ระบบเพื่อดูข้อมูลติดต่อ</Text>
              <Text style={styles.lockedDescription}>
                สมัครสมาชิกฟรี เพื่อดูรายละเอียดงานและติดต่อผู้โพสต์
              </Text>
              <Button
                title="เข้าสู่ระบบ / สมัครสมาชิก"
                onPress={() => (navigation as any).navigate('Auth')}
                style={{ marginTop: SPACING.md }}
              />
            </View>
          </Card>
        )}

        {/* Views */}
        {job.viewsCount !== undefined && (
          <View style={styles.viewsRow}>
            <Ionicons name="eye-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.viewsText}>{job.viewsCount} คนดู</Text>
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
        
        {!isOwner && (
          <View style={styles.bottomButtons}>
            {/* Chat Button */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleStartChat}
              disabled={isStartingChat}
            >
              <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
              <Text style={styles.chatButtonText}>
                {isStartingChat ? 'กำลังเปิด...' : 'แชท'}
              </Text>
            </TouchableOpacity>
            
            {/* Contact Button */}
            <Button
              title={hasContacted ? '✓ สนใจแล้ว' : 'สนใจงานนี้'}
              onPress={handleContact}
              disabled={hasContacted}
              style={styles.contactMainButton}
            />
          </View>
        )}
        
        {isOwner && (
          <View style={styles.bottomButtons}>
            <Button
              title="แก้ไข"
              variant="outline"
              onPress={handleEdit}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <Button
              title="ลบประกาศ"
              variant="danger"
              onPress={() => setShowDeleteModal(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="ลบประกาศ"
        message={`คุณต้องการลบประกาศ "${job.title}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText={isDeleting ? 'กำลังลบ...' : 'ลบประกาศ'}
        cancelText="ยกเลิก"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        type="danger"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="ลบสำเร็จ"
        message="ลบประกาศเรียบร้อยแล้ว"
        icon="✅"
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="เกิดข้อผิดพลาด"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Report Modal */}
      <ModalContainer visible={showReportModal} onClose={() => setShowReportModal(false)}>
        <View style={styles.reportModalContent}>
          <View style={styles.reportHeader}>
            <Ionicons name="flag" size={32} color={COLORS.warning} />
            <Text style={styles.reportTitle}>รายงานประกาศ</Text>
          </View>
          <Text style={styles.reportSubtitle}>กรุณาระบุเหตุผลในการรายงาน</Text>
          
          <View style={styles.reportReasons}>
            {['ข้อมูลเท็จ', 'หลอกลวง', 'เนื้อหาไม่เหมาะสม', 'อื่นๆ'].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reportReasonButton,
                  reportReason === reason && styles.reportReasonButtonActive
                ]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={[
                  styles.reportReasonText,
                  reportReason === reason && styles.reportReasonTextActive
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.reportButtons}>
            <Button
              title="ยกเลิก"
              variant="outline"
              onPress={() => {
                setShowReportModal(false);
                setReportReason('');
              }}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <Button
              title={isReporting ? "กำลังส่ง..." : "ส่งรายงาน"}
              variant="primary"
              onPress={submitReport}
              disabled={!reportReason || isReporting}
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailIcon: {
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
    color: COLORS.white,
    marginLeft: SPACING.xs,
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
    gap: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Views
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 30,
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
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.md,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  contactMainButton: {
    flex: 1,
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

  // Locked Section
  lockedSection: {
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  lockedTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },

  // Owner Section
  ownerSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  ownerNote: {
    fontSize: FONT_SIZES.sm,
    color: '#92400e',
    marginBottom: SPACING.md,
  },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ownerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ownerButtonIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  ownerButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: COLORS.error,
  },

  // Report Modal
  reportModalContent: {
    padding: SPACING.lg,
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  reportTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  reportSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  reportReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  reportReasonButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportReasonButtonActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  reportReasonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  reportReasonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  reportButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});
