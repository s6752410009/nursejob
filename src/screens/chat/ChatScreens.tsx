// ============================================
// CHAT SCREENS - Production Ready
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Avatar, Loading, EmptyState, Card } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { 
  subscribeToConversations, 
  subscribeToMessages, 
  sendMessage,
  markConversationAsRead,
} from '../../services/chatService';
import { Conversation, Message, RootStackParamList, MainTabParamList } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';

// ============================================
// CHAT LIST SCREEN
// ============================================
type ChatListScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Chat'>;

interface ChatListProps {
  navigation: ChatListScreenNavigationProp;
}

export function ChatListScreen({ navigation }: ChatListProps) {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToConversations(user.uid, (convos) => {
      setConversations(convos);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle conversation press
  const handleConversationPress = (conversation: Conversation) => {
    const otherParticipant = conversation.participantDetails?.find(p => p.id !== user?.uid);
    
    (navigation as any).navigate('ChatRoom', {
      conversationId: conversation.id,
      recipientName: otherParticipant?.displayName || 'ผู้ใช้',
      jobTitle: conversation.jobTitle,
    });
  };

  // Guest view
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>💬</Text>
          <Text style={styles.guestTitle}>ยังไม่ได้เข้าสู่ระบบ</Text>
          <Text style={styles.guestDescription}>
            เข้าสู่ระบบเพื่อดูข้อความและแชทกับโรงพยาบาล
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render conversation item
  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participantDetails?.find(p => p.id !== user?.uid);
    const isUnread = item.unreadCount && item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isUnread ? styles.conversationUnread : undefined]}
        onPress={() => handleConversationPress(item)}
      >
        <Avatar
          uri={otherParticipant?.photoURL}
          name={otherParticipant?.displayName || 'User'}
          size={56}
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, isUnread ? styles.textBold : undefined]}>
              {otherParticipant?.displayName || 'ผู้ใช้'}
            </Text>
            <Text style={styles.conversationTime}>
              {item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : ''}
            </Text>
          </View>
          {item.jobTitle && (
            <Text style={styles.conversationJob} numberOfLines={1}>
              📋 {item.jobTitle}
            </Text>
          )}
          <View style={styles.conversationFooter}>
            <Text 
              style={[styles.conversationMessage, isUnread ? styles.textBold : undefined]}
              numberOfLines={1}
            >
              {item.lastMessage || 'เริ่มต้นการสนทนา'}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ข้อความ</Text>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <Loading text="กำลังโหลดข้อความ..." />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="ยังไม่มีข้อความ"
              description="เมื่อคุณติดต่อกับโรงพยาบาล ข้อความจะแสดงที่นี่"
            />
          }
          contentContainerStyle={conversations.length === 0 ? { flex: 1 } : undefined}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// CHAT ROOM SCREEN
// ============================================
type ChatRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

interface ChatRoomProps {
  navigation: ChatRoomScreenNavigationProp;
  route: ChatRoomScreenRouteProp;
}

export function ChatRoomScreen({ navigation, route }: ChatRoomProps) {
  const { conversationId, recipientName, jobTitle } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });

    // Mark as read
    if (user?.uid) {
      markConversationAsRead(conversationId, user.uid);
    }

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(conversationId, user.uid, user.displayName || 'ผู้ใช้', text);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(text); // Restore text on error
    } finally {
      setIsSending(false);
    }
  };

  // Render message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.uid;
    const showDate = index === messages.length - 1 || 
      new Date(messages[index + 1]?.createdAt).toDateString() !== new Date(item.createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('th-TH', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {new Date(item.createdAt).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isOwn && item.isRead && ' ✓✓'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderContent}>
          <Text style={styles.chatHeaderName}>{recipientName}</Text>
          {jobTitle && (
            <Text style={styles.chatHeaderJob} numberOfLines={1}>
              📋 {jobTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContent}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <Loading text="กำลังโหลดข้อความ..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            inverted={true}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>เริ่มการสนทนา</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor={COLORS.textMuted}
            multiline={true}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={Boolean(!inputText.trim() || isSending)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Guest View
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  guestIcon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  guestTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  guestDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conversationUnread: {
    backgroundColor: COLORS.primaryLight,
  },
  conversationContent: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  conversationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  conversationJob: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  conversationMessage: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  textBold: {
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatHeaderJob: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: 2,
  },

  // Chat Content
  chatContent: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },

  // Date Header
  dateHeader: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },

  // Message Bubble
  messageBubble: {
    maxWidth: '75%',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  sendIcon: {
    fontSize: 20,
    color: COLORS.white,
  },
});

export default { ChatListScreen, ChatRoomScreen };
