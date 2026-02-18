// ============================================
// SHIFT CARD COMPONENT - บอร์ดหาคนแทน
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { JobPost } from '../../types';
import { Badge, Avatar } from '../common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { formatRelativeTime } from '../../utils/helpers';
import { getStaffTypeLabel, getLocationTypeLabel } from '../../constants/jobOptions';
import { StaffType } from '../../types';

// ============================================
// Helper Functions
// ============================================
const formatShiftRate = (rate: number, rateType: string) => {
  const formattedRate = rate?.toLocaleString('th-TH') || '0';
  switch (rateType) {
    case 'hour': return `${formattedRate} บาท/ชม.`;
    case 'day': return `${formattedRate} บาท/วัน`;
    case 'shift': return `${formattedRate} บาท/เวร`;
    default: return `${formattedRate} บาท`;
  }
};

const formatShiftDate = (date: Date) => {
  if (!date) return 'ตามตกลง';
  const d = date instanceof Date ? date : new Date(date);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  };
  return d.toLocaleDateString('th-TH', options);
};

// ============================================
// Props Interface
// ============================================
interface JobCardProps {
  job: JobPost;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  variant?: 'default' | 'compact';
  showPosterProfile?: boolean; // แสดงปุ่มดูโปรไฟล์
}

// ============================================
// Component
// ============================================
export function JobCard({ 
  job, 
  onPress, 
  onSave, 
  isSaved = false,
  variant = 'default',
  showPosterProfile = true 
}: JobCardProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Navigate to poster's profile
  const handlePosterPress = () => {
    if (showPosterProfile && job.posterId) {
      (navigation as any).navigate('UserProfile', {
        userId: job.posterId,
        userName: job.posterName,
        userPhoto: job.posterPhoto,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent':
        return <Badge text="ด่วน!" variant="danger" size="small" />;
      default:
        return null;
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        style={[styles.cardCompact, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactLeft}>
          <Avatar 
            uri={job.posterPhoto} 
            name={job.posterName} 
            size={40}
          />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.compactLocation} numberOfLines={1}>
            {job.location?.hospital || job.location?.district}
          </Text>
          <Text style={styles.compactRate}>
            {formatShiftRate(job.shiftRate, job.rateType)}
          </Text>
        </View>
        {getStatusBadge(job.status)}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, SHADOWS.medium]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePosterPress} disabled={!showPosterProfile || !job.posterId}>
          <Avatar 
            uri={job.posterPhoto} 
            name={job.posterName} 
            size={50}
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <TouchableOpacity onPress={handlePosterPress} disabled={!showPosterProfile || !job.posterId} style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.posterName,
                    job.posterVerified && styles.posterNameVerified,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  {job.posterName}
                </Text>
              </TouchableOpacity>
            </View>
            {job.posterVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                <Text style={styles.verifiedText}>พยาบาล</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} style={styles.locationIcon} />
            <Text style={styles.location} numberOfLines={1}>
              {job.location?.hospital ? `${job.location.hospital}, ` : ''}{job.location?.district}, {job.location?.province}
            </Text>
          </View>
        </View>
        {onSave && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={onSave}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons 
              name={isSaved ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isSaved ? COLORS.error : COLORS.textMuted} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Job Title */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        {getStatusBadge(job.status)}
        {/* Staff Type Badge */}
        {job.staffType && (
          <View style={styles.staffTypeBadge}>
            <Text style={styles.staffTypeText}>{getStaffTypeLabel((job.staffType as StaffType) || 'OTHER')}</Text>
          </View>
        )}
        {/* Location Type Badge */}
        {job.locationType === 'HOME' && (
          <View style={styles.homeCareBadge}>
            <Text style={styles.homeCareText}>🏠 ดูแลบ้าน</Text>
          </View>
        )}
        <Badge 
          text={job.department} 
          variant="primary" 
          size="small" 
        />
        {/* Payment Type Indicator */}
        {job.paymentType === 'NET' && (
          <View style={styles.netBadge}>
            <Text style={styles.netBadgeText}>NET</Text>
          </View>
        )}
        {job.paymentType === 'DEDUCT_PERCENT' && job.deductPercent && (
          <View style={styles.deductBadge}>
            <Text style={styles.deductBadgeText}>หัก {job.deductPercent}%</Text>
          </View>
        )}
      </View>

      {/* Shift Date & Time */}
      <View style={styles.shiftInfo}>
        <View style={styles.shiftItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} style={styles.shiftIcon} />
          <Text style={styles.shiftText}>{formatShiftDate(job.shiftDate)}</Text>
        </View>
        <View style={styles.shiftItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={styles.shiftIcon} />
          <Text style={styles.shiftText}>{job.shiftTime || 'ตามตกลง'}</Text>
        </View>
      </View>

      {/* Rate */}
      <View style={styles.rateRow}>
        <Ionicons name="cash-outline" size={16} color={COLORS.success} style={styles.rateIcon} />
        <Text style={styles.rate}>{formatShiftRate(job.shiftRate, job.rateType)}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.posted}>
            {formatRelativeTime(job.createdAt)}
          </Text>
          {job.viewsCount !== undefined && job.viewsCount > 0 && (
            <Text style={styles.views}>
              • {job.viewsCount} คนดู
            </Text>
          )}
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.viewMore}>ดูรายละเอียด →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'space-between',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0, // allow text to shrink on small screens
    marginRight: SPACING.sm,
  },
  posterName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  posterNameVerified: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  location: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  saveButton: {
    padding: SPACING.xs,
  },

  // Title
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },

  // Tags
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  staffTypeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  staffTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  homeCareBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  homeCareText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  netBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  netBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  deductBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  deductBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Shift Info
  shiftInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.lg,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftIcon: {
    marginRight: SPACING.xs,
  },
  shiftText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Rate
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rateIcon: {
    marginRight: SPACING.xs,
  },
  rate: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posted: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  views: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  footerRight: {},
  viewMore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Compact variant
  cardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactLeft: {
    marginRight: SPACING.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  compactLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  compactRate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 2,
  },
});

export default JobCard;
