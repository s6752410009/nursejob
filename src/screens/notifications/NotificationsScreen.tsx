// ============================================
// NOTIFICATIONS SCREEN - Production Ready
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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Loading, EmptyState } from '../../components/common';
import {
  getUserNotifications,
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
  NotificationType,
} from '../../services/notificationsService';
import { formatRelativeTime } from '../../utils/helpers';

const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    new_job: 'briefcase',
    application_sent: 'paper-plane',
    application_viewed: 'eye',
    application_accepted: 'checkmark-circle',
    application_rejected: 'close-circle',
    new_message: 'chatbubble',
    new_applicant: 'person-add',
    job_expired: 'time',
    profile_reminder: 'person',
    system: 'information-circle',
  };
  return icons[type] || 'notifications';
};

const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    new_job: colors.primary,
    application_sent: colors.info,
    application_viewed: colors.secondary,
    application_accepted: colors.success,
    application_rejected: colors.error,
    new_message: colors.primary,
    new_applicant: colors.secondary,
    job_expired: colors.warning,
    profile_reminder: colors.info,
    system: colors.textSecondary,
  };
  return colors[type] || colors.primary;
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user, requireAuth } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  // Real-time notifications subscription
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    // Subscribe to real-time notification updates
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    // Navigate based on type
    const { type, data } = notification;
    
    if (type === 'new_message' && data?.conversationId) {
      (navigation as any).navigate('ChatRoom', {
        conversationId: data.conversationId,
      });
    } else if ((type === 'new_job' || type === 'application_accepted' || type === 'application_rejected') && data?.jobId) {
      // Would need to fetch job details first
      Alert.alert('งาน', `Job ID: ${data.jobId}`);
    } else if (type === 'new_applicant' && data?.applicationId) {
      (navigation as any).navigate('Applicants');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;

    try {
      await markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอ่านทั้งหมดได้');
    }
  };

  const handleDelete = (notification: Notification) => {
    Alert.alert(
      'ลบการแจ้งเตือน',
      'ต้องการลบการแจ้งเตือนนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            } catch (error) {
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบได้');
            }
          },
        },
      ]
    );
  };

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
          <View style={{ width: 80 }} />
        </View>
        <EmptyState
          icon="notifications-outline"
          title="เข้าสู่ระบบเพื่อดูการแจ้งเตือน"
          subtitle="รับการแจ้งเตือนงานใหม่และข้อความ"
          actionLabel="เข้าสู่ระบบ"
          onAction={() => (navigation as any).navigate('Auth')}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <Loading message="กำลังโหลด..." />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unread]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + '20' },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllRead}>อ่านทั้งหมด</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
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
            icon="notifications-off-outline"
            title="ไม่มีการแจ้งเตือน"
            subtitle="เมื่อมีกิจกรรมใหม่ จะแสดงที่นี่"
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
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    width: 80,
    alignItems: 'flex-end',
  },
  markAllRead: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  unread: {
    backgroundColor: COLORS.primaryBackground,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: '600',
  },
  body: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    alignSelf: 'center',
  },
});

