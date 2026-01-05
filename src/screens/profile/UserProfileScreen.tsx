// ============================================
// USER PROFILE SCREEN - ดูโปรไฟล์คนอื่น
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Loading, EmptyState, Avatar, Button } from '../../components/common';
import { JobCard } from '../../components/job/JobCard';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { JobPost } from '../../types';

// ============================================
// Types
// ============================================
type UserProfileRouteParams = {
  UserProfile: {
    userId: string;
    userName?: string;
    userPhoto?: string;
  };
};

interface UserData {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role?: string;
  experience?: number;
  skills?: string[];
  department?: string;
  hospital?: string;
  licenseNumber?: string;
  isVerified?: boolean;
  createdAt?: Date;
  privacy?: {
    profileVisible?: boolean;
    showOnlineStatus?: boolean;
  };
  isOnline?: boolean;
  lastActiveAt?: Date;
}

// ============================================
// Component
// ============================================
export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UserProfileRouteParams, 'UserProfile'>>();
  const { colors } = useTheme();
  const { userId, userName, userPhoto } = route.params;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'posts'>('info');
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setError(null);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Check privacy settings
        if (data.privacy?.profileVisible === false) {
          setError('ผู้ใช้นี้ตั้งค่าโปรไฟล์เป็นส่วนตัว');
          setUserData(null);
          return;
        }
        
        setUserData({
          uid: userId,
          displayName: data.displayName || userName || 'ไม่ระบุชื่อ',
          photoURL: data.photoURL || userPhoto,
          bio: data.bio,
          role: data.role,
          experience: data.experience,
          skills: data.skills,
          department: data.department,
          hospital: data.hospital,
          licenseNumber: data.licenseNumber,
          isVerified: data.isVerified,
          createdAt: data.createdAt?.toDate?.(),
          privacy: data.privacy,
          isOnline: data.isOnline,
          lastActiveAt: data.lastActiveAt?.toDate?.(),
        });
      } else {
        // If user not found in Firestore, use passed data
        setUserData({
          uid: userId,
          displayName: userName || 'ไม่ระบุชื่อ',
          photoURL: userPhoto,
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      // Fallback to passed data
      setUserData({
        uid: userId,
        displayName: userName || 'ไม่ระบุชื่อ',
        photoURL: userPhoto,
      });
    }
  }, [userId, userName, userPhoto]);

  // Fetch user's posts
  const fetchUserPosts = useCallback(async () => {
    try {
      const postsQuery = query(
        collection(db, 'jobs'),
        where('posterId', '==', userId),
        where('status', 'in', ['active', 'urgent']),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          title: data.title || 'หาคนแทน',
          posterName: data.posterName || 'ไม่ระบุ',
          posterId: data.posterId || '',
          posterPhoto: data.posterPhoto,
          department: data.department || 'ทั่วไป',
          shiftRate: data.shiftRate || 0,
          rateType: data.rateType || 'shift',
          shiftDate: data.shiftDate?.toDate?.() || new Date(),
          shiftTime: data.shiftTime || '',
          location: data.location || {},
          createdAt: data.createdAt?.toDate?.() || new Date(),
          status: data.status || 'active',
        } as JobPost;
      });
      
      setUserPosts(posts);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setUserPosts([]);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserData(), fetchUserPosts()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchUserData, fetchUserPosts]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserData(), fetchUserPosts()]);
    setIsRefreshing(false);
  };

  // Navigate to job detail
  const handleJobPress = (job: JobPost) => {
    (navigation as any).navigate('JobDetail', { job });
  };

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'ไม่ระบุ';
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Format last active
  const formatLastActive = (date: Date | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return 'เพิ่งใช้งาน';
    if (minutes < 60) return `ใช้งานเมื่อ ${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `ใช้งานเมื่อ ${hours} ชั่วโมงที่แล้ว`;
    return `ใช้งานเมื่อ ${days} วันที่แล้ว`;
  };

  // Loading state
  if (isLoading) {
    return <Loading fullScreen />;
  }

  // Error state (private profile)
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <EmptyState
          icon="lock-closed"
          title="โปรไฟล์ส่วนตัว"
          description={error}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>โปรไฟล์</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={userData?.photoURL}
              name={userData?.displayName}
              size={100}
            />
            {userData?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
              </View>
            )}
            {/* Online status */}
            {userData?.privacy?.showOnlineStatus !== false && (
              <View style={[
                styles.onlineStatus,
                userData?.isOnline ? styles.online : styles.offline
              ]} />
            )}
          </View>

          <Text style={styles.userName}>{userData?.displayName}</Text>
          
          {userData?.role && (
            <View style={styles.roleTag}>
              <Ionicons 
                name={userData.role === 'nurse' ? 'medical' : 'business'} 
                size={14} 
                color={colors.primary} 
              />
              <Text style={styles.roleText}>
                {userData.role === 'nurse' ? 'พยาบาล' : 
                 userData.role === 'hospital' ? 'โรงพยาบาล' : 'ผู้ใช้'}
              </Text>
            </View>
          )}

          {/* Online status text */}
          {userData?.privacy?.showOnlineStatus !== false && (
            <Text style={styles.lastActiveText}>
              {userData?.isOnline ? '🟢 ออนไลน์' : formatLastActive(userData?.lastActiveAt)}
            </Text>
          )}

          {userData?.bio && (
            <Text style={styles.bio}>{userData.bio}</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={activeTab === 'info' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              ข้อมูล
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="document-text" 
              size={20} 
              color={activeTab === 'posts' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
              ประกาศ ({userPosts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <View style={styles.infoSection}>
            {/* Department */}
            {userData?.department && (
              <View style={styles.infoRow}>
                <Ionicons name="medical" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>แผนก</Text>
                  <Text style={styles.infoValue}>{userData.department}</Text>
                </View>
              </View>
            )}

            {/* Hospital */}
            {userData?.hospital && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>สถานที่ทำงาน</Text>
                  <Text style={styles.infoValue}>{userData.hospital}</Text>
                </View>
              </View>
            )}

            {/* Experience */}
            {userData?.experience && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>ประสบการณ์</Text>
                  <Text style={styles.infoValue}>{userData.experience} ปี</Text>
                </View>
              </View>
            )}

            {/* License Number (if verified) */}
            {userData?.isVerified && userData?.licenseNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>เลขใบประกอบวิชาชีพ</Text>
                  <Text style={styles.infoValue}>
                    {userData.licenseNumber.slice(0, 4)}****
                  </Text>
                </View>
              </View>
            )}

            {/* Skills */}
            {userData?.skills && userData.skills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsTitle}>ทักษะ</Text>
                <View style={styles.skillsTags}>
                  {userData.skills.map((skill, index) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Member since */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>เป็นสมาชิกตั้งแต่</Text>
                <Text style={styles.infoValue}>{formatDate(userData?.createdAt)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.postsSection}>
            {userPosts.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="ยังไม่มีประกาศ"
                description="ผู้ใช้นี้ยังไม่มีประกาศที่เปิดอยู่"
              />
            ) : (
              userPosts.map((post) => (
                <JobCard
                  key={post.id}
                  job={post}
                  onPress={() => handleJobPress(post)}
                />
              ))
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  backButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  onlineStatus: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  online: {
    backgroundColor: '#10B981',
  },
  offline: {
    backgroundColor: COLORS.textMuted,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
    marginBottom: SPACING.sm,
  },
  roleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  lastActiveText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  skillsSection: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  skillsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  skillsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillTag: {
    backgroundColor: COLORS.primaryBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  skillTagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  postsSection: {
    padding: SPACING.md,
  },
});

