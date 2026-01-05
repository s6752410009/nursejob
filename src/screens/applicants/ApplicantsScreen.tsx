// ============================================
// CONTACTS SCREEN - ผู้สนใจงานที่ประกาศ
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Loading, EmptyState, Avatar, Button } from '../../components/common';
import {
  getHospitalApplications,
  updateApplicationStatus,
  ApplicantDetails,
  ContactStatus,
} from '../../services/applicantsService';
import { formatRelativeTime, formatDate } from '../../utils/helpers';

// Contact status helpers
const getStatusLabel = (status: ContactStatus): string => {
  const labels: Record<ContactStatus, string> = {
    interested: 'สนใจ',
    confirmed: 'ยืนยันแล้ว',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
};

const getStatusColor = (status: ContactStatus): string => {
  const colors: Record<ContactStatus, string> = {
    interested: colors.warning,
    confirmed: colors.success,
    cancelled: colors.error,
  };
  return colors[status] || colors.textSecondary;
};

const statusOptions: { status: ContactStatus; label: string; icon: string }[] = [
  { status: 'interested', label: 'สนใจ', icon: 'star' },
  { status: 'confirmed', label: 'ยืนยันแล้ว', icon: 'checkmark-circle' },
  { status: 'cancelled', label: 'ยกเลิก', icon: 'close-circle' },
];

export default function ApplicantsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ApplicantDetails[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ApplicantDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ContactStatus | 'all'>('all');
  const [selectedContact, setSelectedContact] = useState<ApplicantDetails | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const data = await getHospitalApplications(user.uid);
      setContacts(data);
      filterContacts(data, selectedFilter);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid, selectedFilter]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filterContacts = (data: ApplicantDetails[], filter: ContactStatus | 'all') => {
    if (filter === 'all') {
      setFilteredContacts(data);
    } else {
      setFilteredContacts(data.filter(c => c.status === filter));
    }
  };

  const handleFilterChange = (filter: ContactStatus | 'all') => {
    setSelectedFilter(filter);
    filterContacts(contacts, filter);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadContacts();
  };

  const handleStatusChange = async (status: ContactStatus) => {
    if (!selectedContact) return;

    try {
      await updateApplicationStatus(selectedContact.id, status, user?.displayName);
      
      // Update local state
      const updatedContacts = contacts.map(c => 
        c.id === selectedContact.id ? { ...c, status } : c
      );
      setContacts(updatedContacts);
      filterContacts(updatedContacts, selectedFilter);
      
      setShowStatusModal(false);
      setSelectedContact(null);
      
      Alert.alert('สำเร็จ', `อัพเดทสถานะเป็น "${getStatusLabel(status)}" แล้ว`);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัพเดทสถานะได้');
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('ไม่มีเบอร์โทร', 'ผู้ติดต่อไม่ได้ระบุเบอร์โทรศัพท์');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleLineChat = (phone?: string) => {
    if (!phone) {
      Alert.alert('ไม่มีเบอร์โทร', 'ไม่สามารถเปิด Line ได้');
      return;
    }
    // Open LINE with phone number
    Linking.openURL(`https://line.me/ti/p/~${phone}`);
  };

  const handleViewProfile = (contact: ApplicantDetails) => {
    const profile = contact.userProfile;
    Alert.alert(
      profile?.displayName || contact.userName || 'ผู้สนใจ',
      `📞 โทร: ${contact.userPhone || profile?.phone || '-'}
📧 อีเมล: ${profile?.email || '-'}
🎖️ เลขใบประกอบวิชาชีพ: ${profile?.licenseNumber || '-'}
💼 ประสบการณ์: ${profile?.experience || 0} ปี

${contact.message ? `\n💬 ข้อความ:\n${contact.message}` : ''}`,
      [
        { text: 'ปิด' },
        { 
          text: '📞 โทร', 
          onPress: () => handleCall(contact.userPhone || profile?.phone) 
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading message="กำลังโหลดผู้สนใจ..." />;
  }

  const renderContact = ({ item }: { item: ApplicantDetails }) => {
    const profile = item.userProfile;
    const status = item.status || 'interested';

    return (
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Avatar
            uri={profile?.photoURL}
            name={item.userName || profile?.displayName || 'ผู้สนใจ'}
            size={56}
          />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>
              {item.userName || profile?.displayName || 'ไม่ระบุชื่อ'}
            </Text>
            <Text style={styles.shiftTitle} numberOfLines={1}>
              งาน: {item.job?.title || 'ไม่ระบุ'}
            </Text>
            <Text style={styles.contactDate}>
              ติดต่อเมื่อ {formatRelativeTime(item.contactedAt)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}
            onPress={() => {
              setSelectedContact(item);
              setShowStatusModal(true);
            }}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusLabel(status)}
            </Text>
            <Ionicons name="chevron-down" size={14} color={getStatusColor(status)} />
          </TouchableOpacity>
        </View>

        {/* Shift Info */}
        {item.job && (
          <View style={styles.shiftInfo}>
            <View style={styles.shiftInfoItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.shiftInfoText}>
                {formatDate(item.job.shiftDate)}
              </Text>
            </View>
            <View style={styles.shiftInfoItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.shiftInfoText}>
                {item.job.shiftTime}
              </Text>
            </View>
            <View style={styles.shiftInfoItem}>
              <Ionicons name="cash-outline" size={14} color={colors.primary} />
              <Text style={[styles.shiftInfoText, { color: colors.primary, fontWeight: '600' }]}>
                ฿{item.job.shiftRate?.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Message */}
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>ข้อความ:</Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        )}

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {profile.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {profile.skills.length > 3 && (
              <Text style={styles.moreSkills}>+{profile.skills.length - 3}</Text>
            )}
          </View>
        )}

        {/* Info Row */}
        <View style={styles.infoRow}>
          {profile?.licenseNumber && (
            <View style={styles.infoItem}>
              <Ionicons name="ribbon-outline" size={14} color={colors.success} />
              <Text style={styles.infoText}>มีใบประกอบวิชาชีพ</Text>
            </View>
          )}
          {profile?.experience && profile.experience > 0 && (
            <View style={styles.infoItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>{profile.experience} ปี</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewProfile(item)}
          >
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.actionText}>ดูข้อมูล</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCall(item.userPhone || profile?.phone)}
          >
            <Ionicons name="call-outline" size={18} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>โทร</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => {
              setSelectedContact(item);
              setShowStatusModal(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>อัพเดท</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const FilterChip = ({ status, label, count }: { status: ContactStatus | 'all'; label: string; count: number }) => (
    <TouchableOpacity
      style={[styles.filterChip, selectedFilter === status && styles.filterChipActive]}
      onPress={() => handleFilterChange(status)}
    >
      <Text style={[styles.filterChipText, selectedFilter === status && styles.filterChipTextActive]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ผู้สนใจงานของฉัน</Text>
        <Text style={styles.subtitle}>
          ทั้งหมด {contacts.length} คน
        </Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FilterChip status="all" label="ทั้งหมด" count={contacts.length} />
        <FilterChip
          status="interested"
          label="สนใจ"
          count={contacts.filter(c => c.status === 'interested').length}
        />
        <FilterChip
          status="confirmed"
          label="ยืนยันแล้ว"
          count={contacts.filter(c => c.status === 'confirmed').length}
        />
        <FilterChip
          status="cancelled"
          label="ยกเลิก"
          count={contacts.filter(c => c.status === 'cancelled').length}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="ยังไม่มีผู้สนใจ"
            subtitle={
              selectedFilter === 'all'
                ? 'เมื่อมีคนสนใจงานที่คุณประกาศ จะแสดงที่นี่'
                : `ไม่มีผู้สนใจในสถานะ "${getStatusLabel(selectedFilter as ContactStatus)}"`
            }
          />
        }
      />

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>อัพเดทสถานะ</Text>
            <Text style={styles.modalSubtitle}>
              {selectedContact?.userName || selectedContact?.userProfile?.displayName}
            </Text>

            {statusOptions.map(option => (
              <TouchableOpacity
                key={option.status}
                style={[
                  styles.statusOption,
                  selectedContact?.status === option.status && styles.statusOptionActive,
                ]}
                onPress={() => handleStatusChange(option.status)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={
                    selectedContact?.status === option.status
                      ? colors.white
                      : getStatusColor(option.status)
                  }
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    selectedContact?.status === option.status && styles.statusOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedContact?.status === option.status && (
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  shiftTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  shiftInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  shiftInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftInfoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  messageContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  messageLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  skillTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  skillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  moreSkills: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    gap: 4,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionTextPrimary: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    gap: SPACING.sm,
  },
  statusOptionActive: {
    backgroundColor: COLORS.primary,
  },
  statusOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statusOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

