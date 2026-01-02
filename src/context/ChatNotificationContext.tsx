// ============================================
// GLOBAL CHAT NOTIFICATION CONTEXT
// Shows toast on ALL screens except active ChatRoom
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { subscribeToConversations } from '../services/chatService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { Conversation } from '../types';

interface ChatNotificationContextType {
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({
  unreadCount: 0,
  activeConversationId: null,
  setActiveConversationId: () => {},
});

export const useChatNotification = () => useContext(ChatNotificationContext);

// Toast Notification Component
interface ToastProps {
  visible: boolean;
  senderName: string;
  message: string;
  onHide: () => void;
  onPress: () => void;
}

function GlobalToast({ visible, senderName, message, onHide, onPress }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity 
        style={styles.toastContent}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.toastIcon}>
          <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.white} />
        </View>
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastSender} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.toastMessage} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.toastCloseBtn}>
          <Ionicons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface Props {
  children: React.ReactNode;
  navigation?: any;
}

export function ChatNotificationProvider({ children, navigation }: Props) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ 
    senderName: '', 
    message: '',
    conversationId: '',
  });
  
  // Store previous conversations to detect new messages
  const previousConversations = useRef<Map<string, { lastMessage: string; lastMessageAt: any }>>(new Map());
  const isFirstLoad = useRef(true);

  // Play notification sound
  const playSound = useCallback(() => {
    try {
      if (Platform.OS === 'web') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Nice notification sound
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.15;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        setTimeout(() => oscillator.stop(), 300);
      } else {
        // Vibrate on mobile
        Vibration.vibrate(200);
      }
    } catch (error) {
      console.log('Could not play sound');
    }
  }, []);

  // Subscribe to all conversations
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToConversations(user.uid, (conversations) => {
      // Calculate total unread
      let totalUnread = 0;
      
      conversations.forEach(conv => {
        // Count unread for this conversation - support both old and new format
        const unreadForConv = conv.unreadBy?.[user.uid] ?? conv.unreadCount ?? 0;
        totalUnread += unreadForConv;

        // Check for new messages (not first load, not active conversation)
        if (!isFirstLoad.current) {
          const prevConv = previousConversations.current.get(conv.id);
          
          // New message detected
          if (prevConv && 
              conv.lastMessage !== prevConv.lastMessage &&
              conv.id !== activeConversationId) {
            
            // Get sender name (the other participant)
            const otherParticipant = conv.participantDetails?.find(p => p.id !== user.uid);
            const senderName = otherParticipant?.name || 'ผู้ใช้';
            
            // Show toast
            setToastData({
              senderName,
              message: conv.lastMessage || 'ส่งข้อความใหม่',
              conversationId: conv.id,
            });
            setShowToast(true);
            playSound();
          }
        }

        // Update previous state
        previousConversations.current.set(conv.id, {
          lastMessage: conv.lastMessage || '',
          lastMessageAt: conv.lastMessageAt,
        });
      });

      setUnreadCount(totalUnread);
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [user?.uid, activeConversationId, playSound]);

  // Handle toast press - navigate to chat
  const handleToastPress = useCallback(() => {
    if (navigation && toastData.conversationId) {
      navigation.navigate('ChatRoom', {
        conversationId: toastData.conversationId,
        recipientName: toastData.senderName,
      });
    }
    setShowToast(false);
  }, [navigation, toastData]);

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCount,
        activeConversationId,
        setActiveConversationId,
      }}
    >
      {children}
      
      {/* Global Toast - shows on all screens */}
      <GlobalToast
        visible={showToast}
        senderName={toastData.senderName}
        message={toastData.message}
        onHide={() => setShowToast(false)}
        onPress={handleToastPress}
      />
    </ChatNotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  toastIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastSender: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  toastCloseBtn: {
    padding: 8,
    marginLeft: SPACING.xs,
  },
});
