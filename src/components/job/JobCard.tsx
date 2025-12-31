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
import { JobPost } from '../../types';
import { Badge, Avatar } from '../common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { formatRelativeTime } from '../../utils/helpers';

// ============================================
// Helper Functions
// ============================================
const formatShiftRate = (rate: number, rateType: string) => {
  const formattedRate = rate?.toLocaleString('th-TH') || '0';
  switch (rateType) {
    case 'hour': return `${formattedRate} บาท/ชม.`;
    case 'day': return `${formattedRate} บาท/วัน`;
    case 'shift': return `${formattedRate} บาท/กะ`;
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
}

// ============================================
// Component
// ============================================
export function JobCard({ 
  job, 
  onPress, 
  onSave, 
  isSaved = false,
  variant = 'default' 
}: JobCardProps) {

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
        style={styles.cardCompact} 
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
        <Avatar 
          uri={job.posterPhoto} 
          name={job.posterName} 
          size={50}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.posterName} numberOfLines={1}>{job.posterName}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
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
            <Text style={styles.saveIcon}>{isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Job Title */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        {getStatusBadge(job.status)}
        <Badge 
          text={job.department} 
          variant="primary" 
          size="small" 
        />
      </View>

      {/* Shift Date & Time */}
      <View style={styles.shiftInfo}>
        <View style={styles.shiftItem}>
          <Text style={styles.shiftIcon}>📅</Text>
          <Text style={styles.shiftText}>{formatShiftDate(job.shiftDate)}</Text>
        </View>
        <View style={styles.shiftItem}>
          <Text style={styles.shiftIcon}>🕐</Text>
          <Text style={styles.shiftText}>{job.shiftTime || 'ตามตกลง'}</Text>
        </View>
      </View>

      {/* Rate */}
      <View style={styles.rateRow}>
        <Text style={styles.rateIcon}>💰</Text>
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
  posterName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
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
  saveIcon: {
    fontSize: 20,
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
    fontSize: 14,
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
    fontSize: 16,
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
