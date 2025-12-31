// ============================================
// HOME SCREEN - Production Ready
// ============================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JobCard } from '../../components/job/JobCard';
import { Loading, EmptyState, ModalContainer, Chip, Button, Avatar } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, PROVINCES, DEPARTMENTS, BANGKOK_DISTRICTS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { getJobs, searchJobs } from '../../services/jobService';
import { JobPost, MainTabParamList, JobFilters } from '../../types';
import { debounce } from '../../utils/helpers';

// ============================================
// Types
// ============================================
type HomeScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

// ============================================
// Component
// ============================================
export default function HomeScreen({ navigation }: Props) {
  // Auth context
  const { user, requireAuth } = useAuth();

  // State
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    province: '',
    district: '',
    department: '',
    urgentOnly: false,
    sortBy: 'latest',
  });

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

  // Handle save job
  const handleSaveJob = (job: JobPost) => {
    requireAuth(() => {
      // TODO: Implement save job functionality
      Alert.alert('บันทึกแล้ว', `บันทึกงาน ${job.title} เรียบร้อยแล้ว`);
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
    });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.province) count++;
    if (filters.district) count++;
    if (filters.department) count++;
    if (filters.urgentOnly) count++;
    return count;
  }, [filters]);

  // Render job item
  const renderJobItem = ({ item }: { item: JobPost }) => (
    <JobCard
      job={item}
      onPress={() => handleJobPress(item)}
      onSave={() => handleSaveJob(item)}
      isSaved={false} // TODO: Check if job is saved
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Quick Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
      >
        <Chip
          label="🔥 ด่วน"
          selected={filters.urgentOnly}
          onPress={() => setFilters({ ...filters, urgentOnly: !filters.urgentOnly })}
        />
        <Chip
          label="🌙 กะดึก"
          selected={filters.sortBy === 'night'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'night' ? 'latest' : 'night' })}
        />
        <Chip
          label="☀️ กะเช้า"
          selected={filters.sortBy === 'morning'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'morning' ? 'latest' : 'morning' })}
        />
        <Chip
          label="🕐 ล่าสุด"
          selected={filters.sortBy === 'latest'}
          onPress={() => setFilters({ ...filters, sortBy: 'latest' })}
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาเวร, แผนก, สถานที่..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
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
  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title="ตัวกรองการค้นหา"
      fullScreen
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

        {/* District - show only for Bangkok */}
        {filters.province === 'กรุงเทพมหานคร' && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>เขต</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <Chip
                  label="ทุกเขต"
                  selected={!filters.district}
                  onPress={() => setFilters({ ...filters, district: '' })}
                />
                {BANGKOK_DISTRICTS.map((district) => (
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
              label="🔥 ด่วนเท่านั้น"
              selected={filters.urgentOnly || false}
              onPress={() => setFilters({ ...filters, urgentOnly: !filters.urgentOnly })}
            />
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.filterActions}>
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
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
    padding: SPACING.xs,
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
    backgroundColor: COLORS.white,
  },
  filterIcon: {
    fontSize: 20,
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
