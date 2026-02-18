// ============================================
// ADMIN DASHBOARD SCREEN - Production Ready
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
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar, ConfirmModal, SuccessModal, ErrorModal } from '../../components/common';
import {
  getDashboardStats,
  getAllUsers,
  getAllJobs,
  getAllConversations,
  updateUserStatus,
  verifyUser,
  deleteUser,
  updateJobStatus,
  deleteJob as deleteJobAdmin,
  deleteConversation,
  getConversationMessages,
  searchUsers,
  DashboardStats,
  AdminUser,
  AdminJob,
  AdminConversation,
} from '../../services/adminService';
import { getUserSubscription, updateUserSubscription } from '../../services/subscriptionService';
import { Subscription, SubscriptionPlan, SUBSCRIPTION_PLANS } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';

// ============================================
// Types
// ============================================
type TabType = 'overview' | 'users' | 'jobs';

// Selected user for profile view
interface SelectedUserProfile {
  user: AdminUser;
  conversations: AdminConversation[];
}

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
        <Ionicons name={icon as any} size={24} color={color} />
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
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalConversations: 0,
    todayNewUsers: 0,
    todayNewJobs: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalAction, setModalAction] = useState<{
    type: string;
    id: string;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Helper to blur active element on web to avoid aria-hidden focus warnings
  const safeBlur = () => {
    if (typeof document !== 'undefined') {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) active.blur();
      } catch (e) {
        // ignore
      }
    }
  };
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Selected chat for viewing
  const [selectedChat, setSelectedChat] = useState<AdminConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Selected user profile
  const [selectedUserProfile, setSelectedUserProfile] = useState<SelectedUserProfile | null>(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [selectedUserSubscription, setSelectedUserSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subEditPosts, setSubEditPosts] = useState('0');
  const [subSelectedPlan, setSubSelectedPlan] = useState<SubscriptionPlan>('free');

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [statsData, usersData, jobsData, chatsData] = await Promise.all([
        getDashboardStats(),
        getAllUsers(100),
        getAllJobs(100),
        getAllConversations(100),
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setJobs(jobsData);
      setConversations(chatsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Search users
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      const usersData = await getAllUsers(100);
      setUsers(usersData);
      return;
    }
    
    const results = await searchUsers(searchQuery);
    setUsers(results);
  }, [searchQuery]);

  // User actions
  const handleToggleUserStatus = (userItem: AdminUser) => {
    const action = userItem.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
    setModalAction({
      type: 'toggleStatus',
      id: userItem.id,
      title: `${action}บัญชี`,
      message: `คุณต้องการ${action}บัญชี "${userItem.displayName}" หรือไม่?`,
      onConfirm: async () => {
        await updateUserStatus(userItem.id, !userItem.isActive);
        setUsers(prev => prev.map(u => 
          u.id === userItem.id ? { ...u, isActive: !u.isActive } : u
        ));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  const handleVerifyUser = (userItem: AdminUser) => {
    const action = userItem.isVerified ? 'ยกเลิกการยืนยัน' : 'ยืนยัน';
    setModalAction({
      type: 'verify',
      id: userItem.id,
      title: `${action}บัญชี`,
      message: `คุณต้องการ${action}บัญชี "${userItem.displayName}" หรือไม่?`,
      onConfirm: async () => {
        await verifyUser(userItem.id, !userItem.isVerified);
        setUsers(prev => prev.map(u => 
          u.id === userItem.id ? { ...u, isVerified: !u.isVerified } : u
        ));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  const handleDeleteUser = (userItem: AdminUser) => {
    setModalAction({
      type: 'deleteUser',
      id: userItem.id,
      title: 'ลบบัญชี',
      message: `คุณต้องการลบบัญชี "${userItem.displayName}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      onConfirm: async () => {
        await deleteUser(userItem.id);
        setUsers(prev => prev.filter(u => u.id !== userItem.id));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  // View user profile with their chats
  const handleViewUserProfile = async (userItem: AdminUser) => {
    setIsLoadingUserProfile(true);
    try {
      // Filter conversations where this user is a participant
      const userConversations = conversations.filter(chat => 
        chat.participants?.includes(userItem.id) || 
        chat.participantDetails?.some(p => p.id === userItem.id)
      );
      setSelectedUserProfile({
        user: userItem,
        conversations: userConversations,
      });

      // Load subscription info for this user
      try {
        setSubLoading(true);
        const sub = await getUserSubscription(userItem.uid || userItem.id);
        setSelectedUserSubscription(sub);
        setSubSelectedPlan(sub.plan || 'free');
        setSubEditPosts(String(sub.postsToday || 0));
      } catch (err) {
        console.error('Error loading subscription for user:', err);
        setSelectedUserSubscription(null);
      } finally {
        setSubLoading(false);
      }
    } catch (error) {
      setErrorMessage('ไม่สามารถโหลดข้อมูลได้');
      setShowErrorModal(true);
    } finally {
      setIsLoadingUserProfile(false);
    }
  };

  // Job actions
  const handleToggleJobStatus = (job: AdminJob) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    const action = newStatus === 'closed' ? 'ปิด' : 'เปิด';
    setModalAction({
      type: 'toggleJobStatus',
      id: job.id,
      title: `${action}ประกาศ`,
      message: `คุณต้องการ${action}ประกาศ "${job.title}" หรือไม่?`,
      onConfirm: async () => {
        await updateJobStatus(job.id, newStatus);
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: newStatus } : j
        ));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  const handleDeleteJob = (job: AdminJob) => {
    setModalAction({
      type: 'deleteJob',
      id: job.id,
      title: 'ลบประกาศ',
      message: `คุณต้องการลบประกาศ "${job.title}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      onConfirm: async () => {
        await deleteJobAdmin(job.id);
        setJobs(prev => prev.filter(j => j.id !== job.id));
        setStats(prev => ({ ...prev, totalJobs: prev.totalJobs - 1 }));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  // Chat actions
  const handleViewChat = async (chat: AdminConversation) => {
    setSelectedChat(chat);
    setIsLoadingMessages(true);
    try {
      const messages = await getConversationMessages(chat.id);
      setChatMessages(messages);
    } catch (error) {
      setErrorMessage('ไม่สามารถโหลดข้อความได้');
      setShowErrorModal(true);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleDeleteChat = (chat: AdminConversation) => {
    setModalAction({
      type: 'deleteChat',
      id: chat.id,
      title: 'ลบการสนทนา',
      message: `คุณต้องการลบการสนทนานี้หรือไม่?\n\nข้อความทั้งหมดจะถูกลบ`,
      onConfirm: async () => {
        await deleteConversation(chat.id);
        setConversations(prev => prev.filter(c => c.id !== chat.id));
        setStats(prev => ({ ...prev, totalConversations: prev.totalConversations - 1 }));
      },
    });
    safeBlur();
    setShowConfirmModal(true);
  };

  // Confirm modal action
  const handleConfirmAction = async () => {
    if (!modalAction) return;
    
    try {
      await modalAction.onConfirm();
      setShowConfirmModal(false);
      setSuccessMessage('ดำเนินการสำเร็จ');
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowConfirmModal(false);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาด');
      setShowErrorModal(true);
    }
  };

  // Subscription management helpers (admin)
  const handleSaveSubscription = async () => {
    if (!selectedUserProfile) return;
    const userId = selectedUserProfile.user.uid || selectedUserProfile.user.id;
    setSubLoading(true);
    try {
      const partial: any = {
        plan: subSelectedPlan,
      };
      // Only set postsToday when provided
      const postsNum = parseInt(subEditPosts || '0');
      partial.postsToday = isNaN(postsNum) ? 0 : postsNum;
      // If free plan, set lastPostDate to today to align counters
      if (subSelectedPlan === 'free') {
        partial.lastPostDate = new Date().toISOString().split('T')[0];
      } else {
        // Do not send undefined to Firestore update (causes invalid-data error)
        // Remove any lastPostDate field so updateDoc won't receive an undefined value
        if ('lastPostDate' in partial) delete (partial as any).lastPostDate;
      }

      await updateUserSubscription(userId, partial);
      // reload subscription
      const sub = await getUserSubscription(userId);
      setSelectedUserSubscription(sub);
      setSuccessMessage('อัพเดทข้อมูลสมาชิกเรียบร้อย');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error updating subscription:', err);
      setErrorMessage(err.message || 'ไม่สามารถอัพเดทข้อมูลสมาชิกได้');
      setShowErrorModal(true);
    } finally {
      setSubLoading(false);
    }
  };

  const handleResetPosts = async () => {
    if (!selectedUserProfile) return;
    const userId = selectedUserProfile.user.uid || selectedUserProfile.user.id;
    setSubLoading(true);
    try {
      await updateUserSubscription(userId, {
        postsToday: 0,
        lastPostDate: new Date().toISOString().split('T')[0],
      });
      const sub = await getUserSubscription(userId);
      setSelectedUserSubscription(sub);
      setSubEditPosts(String(sub.postsToday || 0));
      setSuccessMessage('รีเซ็ทจำนวนโพสต์เรียบร้อย');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error resetting posts:', err);
      setErrorMessage(err.message || 'ไม่สามารถรีเซ็ทโพสต์ได้');
      setShowErrorModal(true);
    } finally {
      setSubLoading(false);
    }
  };

  // Check admin access
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={COLORS.danger} />
          <Text style={styles.accessDeniedTitle}>ไม่มีสิทธิ์เข้าถึง</Text>
          <Text style={styles.accessDeniedText}>
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render tabs
  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={activeTab === tab ? COLORS.white : COLORS.textSecondary}
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render overview tab
  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ภาพรวมระบบ</Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers}
          icon="people"
          color={COLORS.primary}
          subtitle={`+${stats.todayNewUsers} วันนี้`}
        />
        <StatCard
          title="ประกาศทั้งหมด"
          value={stats.totalJobs}
          icon="briefcase"
          color={COLORS.success}
          subtitle={`+${stats.todayNewJobs} วันนี้`}
        />
        <StatCard
          title="ประกาศที่เปิดรับ"
          value={stats.activeJobs}
          icon="checkmark-circle"
          color={COLORS.warning}
        />
        <StatCard
          title="การสนทนา"
          value={stats.totalConversations}
          icon="chatbubbles"
          color={COLORS.info}
        />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>การดำเนินการด่วน</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('users')}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
          <Text style={styles.quickActionText}>จัดการผู้ใช้</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => setActiveTab('jobs')}>
          <Ionicons name="document-text" size={24} color={COLORS.success} />
          <Text style={styles.quickActionText}>จัดการประกาศ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => navigation.navigate('AdminVerification' as never)}
        >
          <Ionicons name="shield-checkmark" size={24} color={COLORS.info} />
          <Text style={styles.quickActionText}>ตรวจใบอนุญาต</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => navigation.navigate('AdminReports' as never)}
        >
          <Ionicons name="flag" size={24} color={COLORS.danger} />
          <Text style={styles.quickActionText}>ดูรายงาน</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => navigation.navigate('AdminFeedback' as never)}
        >
          <Ionicons name="chatbox-ellipses" size={24} color="#8B5CF6" />
          <Text style={styles.quickActionText}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.warning} />
          <Text style={styles.quickActionText}>รีเฟรช</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Users */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>ผู้ใช้ล่าสุด</Text>
      {users.slice(0, 5).map((userItem) => (
        <View key={userItem.id} style={styles.listItem}>
          <Avatar uri={userItem.photoURL} name={userItem.displayName} size={40} />
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemName}>{userItem.displayName}</Text>
            <Text style={styles.listItemSubtext}>{userItem.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: userItem.isActive ? COLORS.successLight : COLORS.dangerLight }]}>
            <Text style={[styles.statusBadgeText, { color: userItem.isActive ? COLORS.success : COLORS.danger }]}>
              {userItem.isActive ? 'ใช้งาน' : 'ปิด'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Render users tab
  const renderUsers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>จัดการผู้ใช้ ({users.length})</Text>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ค้นหาด้วย ชื่อ, อีเมล, เบอร์โทร..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(); }}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {users.map((userItem) => (
        <View key={userItem.id} style={styles.userCard}>
          <TouchableOpacity 
            style={styles.userCardHeader}
            onPress={() => handleViewUserProfile(userItem)}
            activeOpacity={0.7}
          >
            <Avatar uri={userItem.photoURL} name={userItem.displayName} size={50} />
            <View style={styles.userCardInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{userItem.displayName}</Text>
                {userItem.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                )}
                {userItem.isAdmin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{userItem.email}</Text>
              {userItem.phone && <Text style={styles.userPhone}>📞 {userItem.phone}</Text>}
              {userItem.username && <Text style={styles.userUsername}>@{userItem.username}</Text>}
              <Text style={styles.userDate}>สมัคร: {formatRelativeTime(userItem.createdAt)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          
          <View style={styles.userCardActions}>
            <TouchableOpacity
              style={[styles.userActionButton, { backgroundColor: userItem.isVerified ? COLORS.warningLight : COLORS.successLight }]}
              onPress={() => handleVerifyUser(userItem)}
            >
              <Ionicons name={userItem.isVerified ? "close-circle" : "checkmark-circle"} size={16} color={userItem.isVerified ? COLORS.warning : COLORS.success} />
              <Text style={[styles.userActionText, { color: userItem.isVerified ? COLORS.warning : COLORS.success }]}>
                {userItem.isVerified ? 'ยกเลิกยืนยัน' : 'ยืนยัน'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.userActionButton, { backgroundColor: userItem.isActive ? COLORS.warningLight : COLORS.successLight }]}
              onPress={() => handleToggleUserStatus(userItem)}
            >
              <Ionicons name={userItem.isActive ? "pause" : "play"} size={16} color={userItem.isActive ? COLORS.warning : COLORS.success} />
              <Text style={[styles.userActionText, { color: userItem.isActive ? COLORS.warning : COLORS.success }]}>
                {userItem.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.userActionButton, { backgroundColor: COLORS.dangerLight }]}
              onPress={() => handleDeleteUser(userItem)}
            >
              <Ionicons name="trash" size={16} color={COLORS.danger} />
              <Text style={[styles.userActionText, { color: COLORS.danger }]}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {users.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>ไม่พบผู้ใช้</Text>
        </View>
      )}
    </View>
  );

  // Render jobs tab
  const renderJobs = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>จัดการประกาศ ({jobs.length})</Text>
      
      {jobs.map((job) => (
        <View key={job.id} style={styles.jobCard}>
          <View style={styles.jobCardHeader}>
            <View style={styles.jobCardInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobPoster}>โดย: {job.posterName}</Text>
              <Text style={styles.jobRate}>฿{job.shiftRate.toLocaleString()}</Text>
              <Text style={styles.jobDate}>{formatRelativeTime(job.createdAt)}</Text>
            </View>
            <View style={[
              styles.jobStatusBadge,
              { backgroundColor: job.status === 'active' ? COLORS.successLight : 
                job.status === 'urgent' ? COLORS.dangerLight : COLORS.textMuted + '20' }
            ]}>
              <Text style={[
                styles.jobStatusText,
                { color: job.status === 'active' ? COLORS.success : 
                  job.status === 'urgent' ? COLORS.danger : COLORS.textMuted }
              ]}>
                {job.status === 'active' ? 'เปิดรับ' : job.status === 'urgent' ? 'ด่วน' : 'ปิดแล้ว'}
              </Text>
            </View>
          </View>
          
          <View style={styles.jobCardActions}>
            <TouchableOpacity
              style={[styles.userActionButton, { backgroundColor: job.status === 'active' ? COLORS.warningLight : COLORS.successLight }]}
              onPress={() => handleToggleJobStatus(job)}
            >
              <Ionicons name={job.status === 'active' ? "close-circle" : "checkmark-circle"} size={16} color={job.status === 'active' ? COLORS.warning : COLORS.success} />
              <Text style={[styles.userActionText, { color: job.status === 'active' ? COLORS.warning : COLORS.success }]}>
                {job.status === 'active' ? 'ปิดประกาศ' : 'เปิดประกาศ'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.userActionButton, { backgroundColor: COLORS.dangerLight }]}
              onPress={() => handleDeleteJob(job)}
            >
              <Ionicons name="trash" size={16} color={COLORS.danger} />
              <Text style={[styles.userActionText, { color: COLORS.danger }]}>ลบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      {jobs.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>ไม่มีประกาศ</Text>
        </View>
      )}
    </View>
  );

  // Render user profile view (instead of all chats tab)
  const renderUserProfile = () => {
    if (!selectedUserProfile) {
      return (
        <View style={styles.section}>
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateTitle}>เลือกผู้ใช้เพื่อดูโปรไฟล์</Text>
            <Text style={styles.emptyStateText}>กดที่ผู้ใช้ในแท็บ "ผู้ใช้" เพื่อดูรายละเอียดและแชทของเขา</Text>
          </View>
        </View>
      );
    }
    
    const { user: profileUser, conversations: userChats } = selectedUserProfile;
    
    return (
      <View style={styles.section}>
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeProfileButton}
          onPress={() => setSelectedUserProfile(null)}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
          <Text style={styles.closeProfileText}>ปิดโปรไฟล์</Text>
        </TouchableOpacity>
        
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <Avatar uri={profileUser.photoURL} name={profileUser.displayName} size={80} />
          <View style={styles.profileInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.profileName}>{profileUser.displayName}</Text>
              {profileUser.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              )}
              {profileUser.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.profileDetailRow}>
                <Ionicons name="mail-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.profileDetailText}>{profileUser.email}</Text>
              </View>
              
              {profileUser.phone && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.profileDetailText}>{profileUser.phone}</Text>
                </View>
              )}
              
              {profileUser.username && (
                <View style={styles.profileDetailRow}>
                  <Ionicons name="at-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.profileDetailText}>@{profileUser.username}</Text>
                </View>
              )}
              
              <View style={styles.profileDetailRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.profileDetailText}>สมัคร {formatRelativeTime(profileUser.createdAt)}</Text>
              </View>
              
              <View style={styles.profileDetailRow}>
                <Ionicons name="id-card-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.profileDetailText}>ID: {profileUser.id}</Text>
              </View>
            </View>
            
            {/* Status badges */}
            <View style={styles.profileBadges}>
              <View style={[styles.profileBadge, { backgroundColor: profileUser.isActive ? COLORS.successLight : COLORS.dangerLight }]}>
                <Text style={[styles.profileBadgeText, { color: profileUser.isActive ? COLORS.success : COLORS.danger }]}>
                  {profileUser.isActive ? '✓ ใช้งานอยู่' : '✗ ปิดใช้งาน'}
                </Text>
              </View>
              <View style={[styles.profileBadge, { backgroundColor: profileUser.isVerified ? COLORS.successLight : COLORS.warningLight }]}>
                <Text style={[styles.profileBadgeText, { color: profileUser.isVerified ? COLORS.success : COLORS.warning }]}>
                  {profileUser.isVerified ? '✓ ยืนยันแล้ว' : '⏳ รอยืนยัน'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
            {/* Subscription Controls */}
        <View style={[styles.subscriptionBox, { padding: SPACING.md, marginTop: SPACING.md, borderRadius: 12, backgroundColor: COLORS.surface }]}>
          <Text style={[styles.sectionTitle, { marginBottom: SPACING.sm }]}>ข้อมูลสมาชิก / แพ็กเกจ</Text>
          {subLoading ? (
            <ActivityIndicator />
          ) : selectedUserSubscription ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                <Text style={{ color: COLORS.textSecondary }}>แพ็กเกจปัจจุบัน</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setSubSelectedPlan('free')} style={[styles.planButton, subSelectedPlan === 'free' && styles.planButtonActive]}>
                    <Text style={subSelectedPlan === 'free' ? styles.planButtonTextActive : styles.planButtonText}>ฟรี</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSubSelectedPlan('premium')} style={[styles.planButton, subSelectedPlan === 'premium' && styles.planButtonActive]}>
                    <Text style={subSelectedPlan === 'premium' ? styles.planButtonTextActive : styles.planButtonText}>Premium</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: SPACING.sm }}>
                <Text style={{ color: COLORS.textSecondary }}>โพสต์วันนี้</Text>
                <TextInput
                  value={subEditPosts}
                  onChangeText={setSubEditPosts}
                  keyboardType="number-pad"
                  style={[styles.input, { marginTop: 6, paddingVertical: 8, paddingHorizontal: 10 }]}
                />
              </View>

              <Text style={{ color: COLORS.textSecondary, marginBottom: SPACING.sm }}>
                ที่เหลือ: {(() => {
                  const planKey = (selectedUserSubscription?.plan as keyof typeof SUBSCRIPTION_PLANS) || 'free';
                  const planInfo = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free;
                  const max = planInfo.maxPostsPerDay;
                  if (max == null) return 'ไม่จำกัด';
                  const used = Number(selectedUserSubscription?.postsToday || 0);
                  return Math.max(0, (max || 0) - used) + ' โพสต์';
                })()}
              </Text>

              <View style={{ flexDirection: 'row', marginTop: SPACING.sm }}>
                <TouchableOpacity style={[styles.adminActionButton, { marginRight: SPACING.sm }]} onPress={handleSaveSubscription}>
                  <Text style={styles.adminActionText}>บันทึก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.adminActionButton, { backgroundColor: COLORS.warning }]} onPress={handleResetPosts}>
                  <Text style={styles.adminActionText}>รีเซ็ทโพสต์</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={{ color: COLORS.textSecondary }}>ไม่มีข้อมูลสมาชิก</Text>
          )}
        </View>

        {/* User's Conversations */}
        <Text style={styles.sectionTitle}>แชทของ {profileUser.displayName} ({userChats.length})</Text>
        
        {/* Chat viewer modal */}
        {selectedChat && (
          <View style={styles.chatViewer}>
            <View style={styles.chatViewerHeader}>
              <Text style={styles.chatViewerTitle}>
                {selectedChat.participantDetails?.map(p => p.name || p.displayName).join(' ↔ ')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedChat(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {selectedChat.jobTitle && (
              <Text style={styles.chatViewerJob}>งาน: {selectedChat.jobTitle}</Text>
            )}
            
            {isLoadingMessages ? (
              <ActivityIndicator style={{ marginVertical: SPACING.lg }} />
            ) : (
              <ScrollView style={styles.chatMessages}>
                {chatMessages.map((msg, index) => (
                  <View key={index} style={styles.chatMessage}>
                    <Text style={styles.chatMessageSender}>{msg.senderName}</Text>
                    <Text style={styles.chatMessageText}>{msg.text}</Text>
                    <Text style={styles.chatMessageTime}>{formatRelativeTime(msg.createdAt)}</Text>
                  </View>
                ))}
                {chatMessages.length === 0 && (
                  <Text style={styles.noMessages}>ไม่มีข้อความ</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
        
        {userChats.length > 0 ? (
          userChats.map((chat) => (
            <View key={chat.id} style={styles.chatCard}>
              <TouchableOpacity style={styles.chatCardContent} onPress={() => handleViewChat(chat)}>
                <View style={styles.chatCardInfo}>
                  <Text style={styles.chatParticipants}>
                    คุยกับ: {chat.participantDetails?.filter(p => p.id !== profileUser.id).map(p => p.name || p.displayName).join(', ') || 'ไม่ทราบ'}
                  </Text>
                  {chat.jobTitle && (
                    <Text style={styles.chatJobTitle}>งาน: {chat.jobTitle}</Text>
                  )}
                  <Text style={styles.chatLastMessage} numberOfLines={1}>
                    {chat.lastMessage || 'ไม่มีข้อความ'}
                  </Text>
                  <Text style={styles.chatDate}>{formatRelativeTime(chat.lastMessageAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.chatDeleteButton]}
                onPress={() => handleDeleteChat(chat)}
              >
                <Ionicons name="trash" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>ไม่มีแชท</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>สวัสดี, {user?.displayName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTabButton('overview', 'ภาพรวม', 'grid')}
        {renderTabButton('users', 'ผู้ใช้', 'people')}
        {renderTabButton('jobs', 'ประกาศ', 'briefcase')}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && (selectedUserProfile ? renderUserProfile() : renderUsers())}
        {activeTab === 'jobs' && renderJobs()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        title={modalAction?.title || 'ยืนยัน'}
        message={modalAction?.message || ''}
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirmModal(false)}
        type={modalAction?.type.includes('delete') ? 'danger' : 'warning'}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="สำเร็จ"
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        title="เกิดข้อผิดพลาด"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  accessDeniedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.danger,
    marginTop: SPACING.lg,
  },
  accessDeniedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    padding: SPACING.sm,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  tabButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: '1%',
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  quickActionButton: {
    width: '23%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: '1%',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  listItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  listItemSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },

  // User Card
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  userCardHeader: {
    flexDirection: 'row',
  },
  userCardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  userPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  userUsername: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  userDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  adminBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  userCardActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  userActionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  // Job Card
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobCardInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  jobPoster: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  jobRate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  jobDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  jobStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  jobStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  jobCardActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  // Chat Card
  chatCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  chatCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  chatCardInfo: {
    flex: 1,
  },
  chatParticipants: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatJobTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  chatLastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chatDeleteButton: {
    padding: SPACING.md,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },

  // Chat Viewer
  chatViewer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    maxHeight: 400,
    ...SHADOWS.medium,
  },
  chatViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  chatViewerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  chatViewerJob: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  chatMessages: {
    maxHeight: 300,
  },
  chatMessage: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  chatMessageSender: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chatMessageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: 2,
  },
  chatMessageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noMessages: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  
  // View Profile Hint
  viewProfileHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewProfileHintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  
  // Close Profile Button
  closeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeProfileText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  profileDetails: {
    marginTop: SPACING.md,
    width: '100%',
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    justifyContent: 'center',
  },
  profileDetailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  profileBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  profileBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  subscriptionBox: {
    marginVertical: SPACING.sm,
  },
  planButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planButtonText: {
    color: COLORS.textSecondary,
  },
  planButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  adminActionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  adminActionText: {
    color: '#fff',
    fontWeight: '600',
  },
});
