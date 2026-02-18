// ============================================
// FAVORITES SCREEN - Production Ready
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Loading, EmptyState, Avatar } from '../../components/common';
import { 
  getUserFavorites, 
  removeFromFavorites,
  Favorite 
} from '../../services/favoritesService';
import { formatRelativeTime } from '../../utils/helpers';

// Format shift rate
const formatShiftRate = (rate?: number, type?: string): string => {
  if (!rate) return 'ไม่ระบุ';
  const formattedRate = rate.toLocaleString('th-TH');
  const unit = type === 'hour' ? '/ชม.' : type === 'day' ? '/วัน' : '/เวร';
  return `฿${formattedRate}${unit}`;
};

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { user, requireAuth } = useAuth();
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const data = await getUserFavorites(user.uid);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFavorites();
  };

  const handleRemove = (favorite: Favorite) => {
    Alert.alert(
      'นำออกจากรายการโปรด',
      `ต้องการนำ "${favorite.job?.title}" ออกจากรายการโปรดหรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'นำออก',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeFromFavorites(user.uid, favorite.jobId);
              setFavorites(prev => prev.filter(f => f.id !== favorite.id));
            } catch (error) {
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถนำออกได้');
            }
          },
        },
      ]
    );
  };

  const handleJobPress = (favorite: Favorite) => {
    if (favorite.job) {
      const job = favorite.job;
      const serializedJob = {
        ...job,
        shiftDate: job.shiftDate ? (job.shiftDate instanceof Date ? job.shiftDate.toISOString() : job.shiftDate) : undefined,
        shiftDateEnd: (job as any).shiftDateEnd ? ((job as any).shiftDateEnd instanceof Date ? (job as any).shiftDateEnd.toISOString() : (job as any).shiftDateEnd) : undefined,
      } as any;
      (navigation as any).navigate('JobDetail', { job: serializedJob });
    }
  };

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <EmptyState
          icon="🤍"
          title="เข้าสู่ระบบเพื่อดูรายการโปรด"
          description="บันทึกเวรที่สนใจไว้ดูภายหลัง"
          actionText="เข้าสู่ระบบ"
          onAction={() => requireAuth(() => {})}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <Loading text="กำลังโหลด..." />;
  }

  const renderFavorite = ({ item }: { item: Favorite }) => {
    const job = item.job;
    if (!job) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleJobPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Avatar
            uri={job.posterPhoto}
            name={job.posterName || 'ผู้โพสต์'}
            size={48}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.posterName} numberOfLines={1}>
              {job.posterName || 'ผู้โพสต์'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
          >
            <Ionicons name="heart" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.tagText}>{job.location?.province || 'ไม่ระบุ'}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.tagText}>{job.department}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.salary}>
            {formatShiftRate(job.shiftRate, job.rateType)}
          </Text>
          <Text style={styles.date}>
            บันทึกเมื่อ {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {job.status === 'urgent' && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>🔥 ด่วน</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>รายการโปรด</Text>
          <Text style={styles.headerCount}>{favorites.length} เวร</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavorite}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="ยังไม่มีรายการโปรด"
            subtitle="กดไอคอน ❤️ ที่งานที่สนใจเพื่อบันทึกไว้ดูภายหลัง"
            actionLabel="ค้นหางาน"
            onAction={() => navigation.goBack()}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  jobTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  hospitalName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  posterName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verified: {
    color: COLORS.success,
  },
  removeButton: {
    padding: SPACING.sm,
  },
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  salary: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  urgentBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  urgentText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    fontWeight: '600',
  },
});

