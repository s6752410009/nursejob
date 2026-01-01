// ============================================
// ADMIN DASHBOARD SCREEN
// หน้าจัดการระบบสำหรับผู้ดูแล
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common';

// ============================================
// Types
// ============================================
interface DashboardStats {
  totalUsers: number;
  totalShifts: number;
  activeShifts: number;
  totalContacts: number;
  pendingContacts: number;
  todayNewUsers: number;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'nurse' | 'hospital' | 'admin';
  createdAt: Date;
  isActive: boolean;
}

interface Shift {
  id: string;
  title: string;
  hospitalName: string;
  status: 'active' | 'filled' | 'cancelled';
  createdAt: Date;
  contactsCount: number;
}

// ============================================
// Mock Data for Dashboard
// ============================================
const MOCK_STATS: DashboardStats = {
  totalUsers: 1247,
  totalShifts: 856,
  activeShifts: 234,
  totalContacts: 3421,
  pendingContacts: 89,
  todayNewUsers: 12,
};

const MOCK_USERS: User[] = [
  { id: '1', email: 'nurse1@example.com', displayName: 'สมศรี รักษ์งาน', role: 'nurse', createdAt: new Date('2024-01-15'), isActive: true },
  { id: '2', email: 'nurse2@example.com', displayName: 'สมชาย ใจดี', role: 'nurse', createdAt: new Date('2024-01-14'), isActive: true },
  { id: '3', email: 'hospital1@example.com', displayName: 'โรงพยาบาลศิริราช', role: 'hospital', createdAt: new Date('2024-01-13'), isActive: true },
  { id: '4', email: 'nurse3@example.com', displayName: 'สมหญิง รักษ์พยาบาล', role: 'nurse', createdAt: new Date('2024-01-12'), isActive: false },
  { id: '5', email: 'hospital2@example.com', displayName: 'โรงพยาบาลจุฬาลงกรณ์', role: 'hospital', createdAt: new Date('2024-01-11'), isActive: true },
];

const MOCK_SHIFTS: Shift[] = [
  { id: '1', title: 'กะดึก แผนก ICU', hospitalName: 'โรงพยาบาลศิริราช', status: 'active', createdAt: new Date(), contactsCount: 5 },
  { id: '2', title: 'กะเช้า ER', hospitalName: 'โรงพยาบาลจุฬาลงกรณ์', status: 'active', createdAt: new Date(), contactsCount: 3 },
  { id: '3', title: 'กะบ่าย Ward ทั่วไป', hospitalName: 'โรงพยาบาลรามาธิบดี', status: 'filled', createdAt: new Date(), contactsCount: 8 },
  { id: '4', title: 'กะดึก Pediatric', hospitalName: 'โรงพยาบาลเด็ก', status: 'active', createdAt: new Date(), contactsCount: 2 },
  { id: '5', title: 'กะเช้า OPD', hospitalName: 'โรงพยาบาลศิริราช', status: 'cancelled', createdAt: new Date(), contactsCount: 0 },
];

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ============================================
// Component
// ============================================
export default function AdminDashboardScreen() {
  const { user, logout, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [recentUsers, setRecentUsers] = useState<User[]>(MOCK_USERS);
  const [recentShifts, setRecentShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'shifts'>('overview');

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setStats(MOCK_STATS);
      setRecentUsers(MOCK_USERS);
      setRecentShifts(MOCK_SHIFTS);
      setRefreshing(false);
    }, 1000);
  }, []);

  // Check admin access
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedIcon}>🚫</Text>
          <Text style={styles.accessDeniedTitle}>ไม่มีสิทธิ์เข้าถึง</Text>
          <Text style={styles.accessDeniedText}>
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle user action
  const handleUserAction = (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    const actionText = action === 'activate' ? 'เปิดใช้งาน' : action === 'deactivate' ? 'ปิดใช้งาน' : 'ลบ';
    Alert.alert(
      'ยืนยันการดำเนินการ',
      `คุณต้องการ${actionText}ผู้ใช้นี้หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ยืนยัน', 
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            Alert.alert('สำเร็จ', `${actionText}ผู้ใช้เรียบร้อยแล้ว`);
          }
        },
      ]
    );
  };

  // Handle shift action
  const handleShiftAction = (shiftId: string, action: 'approve' | 'reject' | 'delete') => {
    const actionText = action === 'approve' ? 'อนุมัติ' : action === 'reject' ? 'ปฏิเสธ' : 'ลบ';
    Alert.alert(
      'ยืนยันการดำเนินการ',
      `คุณต้องการ${actionText}กะนี้หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ยืนยัน', 
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            Alert.alert('สำเร็จ', `${actionText}กะเรียบร้อยแล้ว`);
          }
        },
      ]
    );
  };

  // Render overview tab
  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ภาพรวมระบบ</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers}
          icon="👥"
          color={COLORS.primary}
          subtitle={`+${stats.todayNewUsers} วันนี้`}
        />
        <StatCard
          title="กะทั้งหมด"
          value={stats.totalShifts}
          icon="📅"
          color={COLORS.success}
        />
        <StatCard
          title="กะที่เปิดรับ"
          value={stats.activeShifts}
          icon="✅"
          color={COLORS.warning}
        />
        <StatCard
          title="การติดต่อทั้งหมด"
          value={stats.totalContacts}
          icon="📨"
          color={COLORS.info}
          subtitle={`${stats.pendingContacts} รอดำเนินการ`}
        />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>การดำเนินการด่วน</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('users')}>
          <Text style={styles.quickActionIcon}>👤</Text>
          <Text style={styles.quickActionText}>จัดการผู้ใช้</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('shifts')}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>จัดการกะ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Coming Soon', 'ฟีเจอร์นี้กำลังพัฒนา')}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>รายงาน</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Coming Soon', 'ฟีเจอร์นี้กำลังพัฒนา')}>
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>ตั้งค่า</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render users tab
  const renderUsers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>จัดการผู้ใช้</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'ฟีเจอร์นี้กำลังพัฒนา')}>
          <Text style={styles.addButton}>+ เพิ่มผู้ใช้</Text>
        </TouchableOpacity>
      </View>

      {recentUsers.map((item) => (
        <View key={item.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemName}>{item.displayName}</Text>
              <View style={[
                styles.badge,
                { backgroundColor: item.role === 'admin' ? COLORS.danger : item.role === 'hospital' ? COLORS.primary : COLORS.success }
              ]}>
                <Text style={styles.badgeText}>
                  {item.role === 'admin' ? 'แอดมิน' : item.role === 'hospital' ? 'โรงพยาบาล' : 'พยาบาล'}
                </Text>
              </View>
            </View>
            <Text style={styles.listItemSubtext}>{item.email}</Text>
            <View style={styles.listItemFooter}>
              <Text style={[styles.statusText, { color: item.isActive ? COLORS.success : COLORS.danger }]}>
                {item.isActive ? '● ใช้งานอยู่' : '● ปิดใช้งาน'}
              </Text>
            </View>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: item.isActive ? COLORS.warning : COLORS.success }]}
              onPress={() => handleUserAction(item.id, item.isActive ? 'deactivate' : 'activate')}
            >
              <Text style={styles.actionButtonText}>{item.isActive ? 'ปิด' : 'เปิด'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
              onPress={() => handleUserAction(item.id, 'delete')}
            >
              <Text style={styles.actionButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  // Render shifts tab
  const renderShifts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>จัดการกะ</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'ฟีเจอร์นี้กำลังพัฒนา')}>
          <Text style={styles.addButton}>+ สร้างกะ</Text>
        </TouchableOpacity>
      </View>

      {recentShifts.map((item) => (
        <View key={item.id} style={styles.listItem}>
          <View style={styles.listItemInfo}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemName}>{item.title}</Text>
              <View style={[
                styles.badge,
                { 
                  backgroundColor: item.status === 'active' ? COLORS.success 
                    : item.status === 'filled' ? COLORS.primary 
                    : COLORS.danger 
                }
              ]}>
                <Text style={styles.badgeText}>
                  {item.status === 'active' ? 'เปิดรับ' : item.status === 'filled' ? 'หาได้แล้ว' : 'ยกเลิก'}
                </Text>
              </View>
            </View>
            <Text style={styles.listItemSubtext}>{item.hospitalName}</Text>
            <Text style={styles.listItemSubtext}>ผู้สนใจ: {item.contactsCount} คน</Text>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.info }]}
              onPress={() => Alert.alert('ดูรายละเอียด', 'กำลังพัฒนา')}
            >
              <Text style={styles.actionButtonText}>ดู</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
              onPress={() => handleShiftAction(item.id, 'delete')}
            >
              <Text style={styles.actionButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>แผงควบคุม Admin</Text>
          <Text style={styles.headerSubtitle}>ยินดีต้อนรับ, {user?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            ภาพรวม
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            ผู้ใช้
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shifts' && styles.tabActive]}
          onPress={() => setActiveTab('shifts')}
        >
          <Text style={[styles.tabText, activeTab === 'shifts' && styles.tabTextActive]}>
            กะ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'shifts' && renderShifts()}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  // Section
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  addButton: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: SPACING.md,
    margin: '1%',
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  listItemSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  listItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  listItemActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Badge
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Access Denied
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  accessDeniedIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  accessDeniedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  },
  accessDeniedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
