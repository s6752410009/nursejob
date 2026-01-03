// ============================================
// HOME SCREEN - Production Ready
// ============================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JobCard } from '../../components/job/JobCard';
import { Loading, EmptyState, ModalContainer, Chip, Button, Avatar } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, PROVINCES, DEPARTMENTS, DISTRICTS_BY_PROVINCE } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getJobs, searchJobs, subscribeToJobs } from '../../services/jobService';
import { subscribeToNotifications } from '../../services/notificationsService';
import { subscribeToFavorites, toggleFavorite, Favorite } from '../../services/favoritesService';
import { JobPost, MainTabParamList, JobFilters } from '../../types';
import { debounce } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Types
// ============================================
type HomeScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

// ============================================
// URGENT JOBS BANNER COMPONENT
// ============================================
interface UrgentBannerProps {
  urgentJobs: JobPost[];
  onPress: (job: JobPost) => void;
}

function UrgentJobsBanner({ urgentJobs, onPress }: UrgentBannerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (urgentJobs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % urgentJobs.length;
        
        // Animate fade
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Scroll to next item
        scrollRef.current?.scrollTo({
          x: nextIndex * (SCREEN_WIDTH - 32),
          animated: true,
        });

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [urgentJobs.length, fadeAnim]);

  if (urgentJobs.length === 0) return null;

  const formatShortDate = (date: any) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date.toDate?.() || date;
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={urgentStyles.container}>
      <View style={urgentStyles.header}>
        <View style={urgentStyles.headerLeft}>
          <Ionicons name="flash" size={18} color="#FF6B6B" />
          <Text style={urgentStyles.headerTitle}>งานด่วน!</Text>
          <View style={urgentStyles.badge}>
            <Text style={urgentStyles.badgeText}>PREMIUM</Text>
          </View>
        </View>
        <View style={urgentStyles.dots}>
          {urgentJobs.map((_, index) => (
            <View
              key={index}
              style={[
                urgentStyles.dot,
                index === currentIndex && urgentStyles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH - 32}
        contentContainerStyle={urgentStyles.scrollContent}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
          setCurrentIndex(newIndex);
        }}
      >
        {urgentJobs.map((job, index) => (
          <Animated.View
            key={job.id}
            style={[
              urgentStyles.card,
              { opacity: index === currentIndex ? fadeAnim : 0.7 },
            ]}
          >
            <TouchableOpacity
              style={urgentStyles.cardInner}
              onPress={() => onPress(job)}
              activeOpacity={0.8}
            >
              <View style={urgentStyles.cardLeft}>
                <Text style={urgentStyles.cardTitle} numberOfLines={1}>
                  {job.title || job.department}
                </Text>
                <Text style={urgentStyles.cardLocation} numberOfLines={1}>
                  📍 {job.location?.hospital || job.location?.district}
                </Text>
                <View style={urgentStyles.cardMeta}>
                  <Text style={urgentStyles.cardDate}>
                    📅 {formatShortDate(job.shiftDate)}
                  </Text>
                  <Text style={urgentStyles.cardTime}>
                    ⏰ {job.shiftTime}
                  </Text>
                </View>
              </View>
              <View style={urgentStyles.cardRight}>
                <Text style={urgentStyles.cardPrice}>
                  ฿{job.shiftRate?.toLocaleString()}
                </Text>
                <Text style={urgentStyles.cardPriceUnit}>/{job.rateType || 'เวร'}</Text>
                <View style={urgentStyles.urgentBadge}>
                  <Ionicons name="flash" size={12} color="#FFF" />
                  <Text style={urgentStyles.urgentBadgeText}>ด่วน</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const urgentStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
  },
  scrollContent: {
    gap: SPACING.sm,
  },
  card: {
    width: SCREEN_WIDTH - 32,
  },
  cardInner: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    ...SHADOWS.sm,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#FFF',
  },
  cardLocation: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  cardDate: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  cardTime: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: '#4ADE80',
  },
  cardPriceUnit: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginTop: SPACING.xs,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
});

// ============================================
// Component
// ============================================
export default function HomeScreen({ navigation }: Props) {
  // Auth context
  const { user, requireAuth } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  // State
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    province: '',
    district: '',
    department: '',
    urgentOnly: false,
    sortBy: 'latest',
  });

  // Get urgent jobs for banner (paid premium placement)
  const urgentJobs = useMemo(() => {
    return jobs.filter(job => job.status === 'urgent').slice(0, 5);
  }, [jobs]);

  // Fetch jobs
  const fetchJobs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const fetchedJobs = await getJobs(filters);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดงานได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Real-time notification subscription
  useEffect(() => {
    if (!user?.uid) {
      setNotificationCount(0);
      return;
    }

    // Subscribe to notifications - real-time updates
    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      setNotificationCount(unreadCount);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time favorites subscription
  useEffect(() => {
    if (!user?.uid) {
      setFavoriteIds([]);
      return;
    }

    const unsubscribe = subscribeToFavorites(user.uid, (favorites: Favorite[]) => {
      setFavoriteIds(favorites.map(f => f.jobId));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time jobs subscription
  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to jobs updates
    const unsubscribe = subscribeToJobs((newJobs) => {
      // ถ้าไม่มี filters ให้แสดงงานทั้งหมด
      let filteredJobs = newJobs.filter(job => job.status === 'active' || job.status === 'urgent');
      
      // Apply filters only if they have values
      if (filters.province && filters.province.length > 0) {
        filteredJobs = filteredJobs.filter(job => job.location?.province === filters.province);
      }
      if (filters.district && filters.district.length > 0) {
        filteredJobs = filteredJobs.filter(job => job.location?.district === filters.district);
      }
      if (filters.department && filters.department.length > 0) {
        filteredJobs = filteredJobs.filter(job => job.department === filters.department);
      }
      if (filters.urgentOnly === true) {
        filteredJobs = filteredJobs.filter(job => job.status === 'urgent');
      }
      if (filters.minRate && filters.minRate > 0) {
        filteredJobs = filteredJobs.filter(job => job.shiftRate >= filters.minRate!);
      }
      if (filters.maxRate && filters.maxRate > 0) {
        filteredJobs = filteredJobs.filter(job => job.shiftRate <= filters.maxRate!);
      }
      
      // Filter by shift time (morning/night) - only if explicitly selected
      if (filters.sortBy === 'morning') {
        filteredJobs = filteredJobs.filter(job => {
          const startHour = parseInt(job.shiftTime?.split(':')[0] || '8');
          return startHour >= 5 && startHour < 12;
        });
      } else if (filters.sortBy === 'night') {
        filteredJobs = filteredJobs.filter(job => {
          const startHour = parseInt(job.shiftTime?.split(':')[0] || '8');
          return startHour >= 18 || startHour < 5;
        });
      }
      
      // Sort
      if (filters.sortBy === 'highestPay') {
        filteredJobs = filteredJobs.sort((a, b) => (b.shiftRate || 0) - (a.shiftRate || 0));
      }
      
      console.log(`Jobs loaded: ${newJobs.length} total, ${filteredJobs.length} after filter`);
      setJobs(filteredJobs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filters]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        fetchJobs();
        return;
      }
      
      setIsLoading(true);
      try {
        const results = await searchJobs(query);
        setJobs(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [fetchJobs]
  );

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Handle job press
  const handleJobPress = (job: JobPost) => {
    (navigation as any).navigate('JobDetail', { job });
  };

  // Handle save job (toggle favorite)
  const handleSaveJob = async (job: JobPost) => {
    requireAuth(async () => {
      if (!user?.uid) return;
      
      try {
        const isNowFavorite = await toggleFavorite(user.uid, job.id);
        if (isNowFavorite) {
          toast.success(`เพิ่ม "${job.title}" ไปยังรายการโปรดแล้ว`, '❤️ บันทึกแล้ว');
        } else {
          toast.info(`ลบ "${job.title}" ออกจากรายการโปรดแล้ว`, '💔 ลบออกแล้ว');
        }
      } catch (error) {
        toast.error('ไม่สามารถบันทึกงานได้');
      }
    });
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
    fetchJobs();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      province: '',
      district: '',
      department: '',
      urgentOnly: false,
      sortBy: 'latest',
      minRate: undefined,
      maxRate: undefined,
    });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.province) count++;
    if (filters.district) count++;
    if (filters.department) count++;
    if (filters.urgentOnly) count++;
    if (filters.minRate || filters.maxRate) count++;
    return count;
  }, [filters]);

  // Render job item
  const renderJobItem = ({ item }: { item: JobPost }) => (
    <JobCard
      job={item}
      onPress={() => handleJobPress(item)}
      onSave={() => handleSaveJob(item)}
      isSaved={favoriteIds.includes(item.id)}
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Urgent Jobs Banner - Premium Placement */}
      {urgentJobs.length > 0 && (
        <UrgentJobsBanner 
          urgentJobs={urgentJobs} 
          onPress={handleJobPress} 
        />
      )}

      {/* Quick Filters */}
      <ScrollView 
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
      >
        <Chip
          label="ทั้งหมด"
          selected={!filters.urgentOnly && filters.sortBy === 'latest'}
          onPress={() => setFilters({ ...filters, urgentOnly: false, sortBy: 'latest' })}
        />
        <Chip
          label="🔥 ด่วน"
          selected={filters.urgentOnly}
          onPress={() => setFilters({ ...filters, urgentOnly: !filters.urgentOnly })}
        />
        <Chip
          label="🌙 เวรดึก"
          selected={filters.sortBy === 'night'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'night' ? 'latest' : 'night' })}
        />
        <Chip
          label="☀️ เวรเช้า"
          selected={filters.sortBy === 'morning'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'morning' ? 'latest' : 'morning' })}
        />
        <Chip
          label="💰 ค่าตอบแทนสูง"
          selected={filters.sortBy === 'highestPay'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'highestPay' ? 'latest' : 'highestPay' })}
        />
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          พบ <Text style={styles.resultsCount}>{jobs.length}</Text> งาน
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilters}>ล้างตัวกรอง</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {user ? `สวัสดี, ${user.displayName?.split(' ')[0] || 'คุณ'}` : 'บอร์ดหาคนแทน'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {user ? 'หางานหรือหาคนแทน' : 'เข้าสู่ระบบเพื่อประกาศ'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Notification Icon */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => (navigation as any).navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Profile */}
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => (navigation as any).navigate('Profile')}
            >
              <Avatar 
                uri={user?.photoURL} 
                name={user?.displayName || 'Guest'} 
                size={44} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาเวร, แผนก, สถานที่..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={22} color={activeFilterCount > 0 ? COLORS.white : COLORS.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Job List */}
      {isLoading ? (
        <Loading text="กำลังโหลดงาน..." />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="😢"
              title="ไม่พบเวรที่ตรงกับเงื่อนไข"
              description="ลองเปลี่ยนตัวกรองหรือคำค้นหาดูนะ"
              actionText="ล้างตัวกรอง"
              onAction={clearFilters}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchJobs(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </SafeAreaView>
  );
}

// ============================================
// FILTER MODAL COMPONENT
// ============================================
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: JobFilters;
  setFilters: React.Dispatch<React.SetStateAction<JobFilters>>;
  onApply: () => void;
  onClear: () => void;
}

function FilterModal({ visible, onClose, filters, setFilters, onApply, onClear }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title="ตัวกรองการค้นหา"
      fullScreen={true}
    >
      <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
        {/* Province */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>จังหวัด</Text>
          <View style={styles.filterOptions}>
            <Chip
              label="ทั้งหมด"
              selected={!filters.province}
              onPress={() => setFilters({ ...filters, province: '', district: '' })}
            />
            {PROVINCES.map((province) => (
              <Chip
                key={province}
                label={province}
                selected={filters.province === province}
                onPress={() => setFilters({ ...filters, province, district: '' })}
              />
            ))}
          </View>
        </View>

        {/* District - show for all provinces */}
        {filters.province && DISTRICTS_BY_PROVINCE[filters.province] && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {filters.province === 'กรุงเทพมหานคร' ? 'เขต' : 'อำเภอ'}
            </Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <Chip
                  label={filters.province === 'กรุงเทพมหานคร' ? 'ทุกเขต' : 'ทุกอำเภอ'}
                  selected={!filters.district}
                  onPress={() => setFilters({ ...filters, district: '' })}
                />
                {DISTRICTS_BY_PROVINCE[filters.province].map((district) => (
                  <Chip
                    key={district}
                    label={district}
                    selected={filters.district === district}
                    onPress={() => setFilters({ ...filters, district })}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Department */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>แผนก</Text>
          <View style={styles.filterOptions}>
            <Chip
              label="ทั้งหมด"
              selected={!filters.department}
              onPress={() => setFilters({ ...filters, department: '' })}
            />
            {DEPARTMENTS.map((dept) => (
              <Chip
                key={dept}
                label={dept}
                selected={filters.department === dept}
                onPress={() => setFilters({ ...filters, department: dept })}
              />
            ))}
          </View>
        </View>

        {/* Urgent Only */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>ประเภท</Text>
          <View style={styles.filterOptions}>
            <Chip
              label="ด่วนเท่านั้น"
              selected={filters.urgentOnly || false}
              onPress={() => setFilters({ ...filters, urgentOnly: !filters.urgentOnly })}
            />
          </View>
        </View>

        {/* Rate Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>ช่วงค่าตอบแทน</Text>
          <View style={styles.filterOptions}>
            <Chip
              label="ทั้งหมด"
              selected={!filters.minRate && !filters.maxRate}
              onPress={() => setFilters({ ...filters, minRate: undefined, maxRate: undefined })}
            />
            <Chip
              label="< 1,500"
              selected={filters.maxRate === 1500 && !filters.minRate}
              onPress={() => setFilters({ ...filters, minRate: undefined, maxRate: 1500 })}
            />
            <Chip
              label="1,500 - 2,500"
              selected={filters.minRate === 1500 && filters.maxRate === 2500}
              onPress={() => setFilters({ ...filters, minRate: 1500, maxRate: 2500 })}
            />
            <Chip
              label="2,500 - 3,500"
              selected={filters.minRate === 2500 && filters.maxRate === 3500}
              onPress={() => setFilters({ ...filters, minRate: 2500, maxRate: 3500 })}
            />
            <Chip
              label="> 3,500"
              selected={filters.minRate === 3500 && !filters.maxRate}
              onPress={() => setFilters({ ...filters, minRate: 3500, maxRate: undefined })}
            />
          </View>
        </View>

        {/* Sort By */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>เรียงตาม</Text>
          <View style={styles.filterOptions}>
            <Chip
              label="ล่าสุด"
              selected={filters.sortBy === 'latest' || !filters.sortBy}
              onPress={() => setFilters({ ...filters, sortBy: 'latest' })}
            />
            <Chip
              label="ค่าตอบแทนสูงสุด"
              selected={filters.sortBy === 'highestPay'}
              onPress={() => setFilters({ ...filters, sortBy: 'highestPay' })}
            />
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.filterActions, { paddingBottom: Math.max(insets.bottom, 16) + SPACING.md }]}>
        <Button
          title="ล้างตัวกรอง"
          onPress={onClear}
          variant="outline"
          style={{ flex: 1, marginRight: SPACING.sm }}
        />
        <Button
          title="ค้นหา"
          onPress={onApply}
          style={{ flex: 1 }}
        />
      </View>
    </ModalContainer>
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
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  greeting: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileButton: {
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 22,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listHeader: {
    marginBottom: SPACING.sm,
  },

  // Quick Filters
  quickFilters: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  // Results
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  resultsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  resultsCount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearFilters: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Filter Modal
  filterContent: {
    flex: 1,
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
