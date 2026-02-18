import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/helpers';
import { deleteConversation, hideConversation } from '../../services/chatService';
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
  Platform,
  Animated,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Loading, EmptyState, ConfirmModal } from '../../components/common';
import { SafeAreaView } from 'react-native-safe-area-context';
// EmptyState ไม่มีใน common, ใช้ LoadingOverlay หรือสร้างคอมโพเนนต์ใหม่ถ้าจำเป็น
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../theme';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useChatNotification } from '../../context/ChatNotificationContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Message, RootStackParamList } from '../../types';
import { Document, getUserDocuments } from '../../services/documentsService';

import {
  subscribeToMessages,
  subscribeToConversations,
  markConversationAsRead,
  sendMessage,
  deleteMessage,
  reportMessage,
  sendSavedDocument,
  sendImage,
  sendDocument,
  getOrCreateConversation,
} from '../../services/chatService';
// ...existing imports...

export function ChatListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const editModeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Animated.timing(editModeAnim, {
      toValue: isEditMode ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isEditMode]);

  const handleConversationPress = (item: any) => {
    if (isEditMode) {
      setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
      return;
    }
    navigation.navigate('ChatRoom', { conversationId: item.id, recipientName: item.participantDetails?.find((p:any)=>p.id!==user?.uid)?.displayName || 'ผู้ใช้', jobTitle: item.jobTitle });
  };

  const handleHideConversation = async (item: any) => {
    if (!user?.uid) return;
    try { await hideConversation(item.id, user.uid); setConversations(prev => prev.map(c => c.id === item.id ? { ...c, hiddenBy: [...(c.hiddenBy||[]), user.uid] } : c)); } catch(e){console.error(e);} 
  };

  const handleDeletePress = async (item: any) => { setConversationToDelete(item); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (isEditMode && selectedIds.length > 0) {
        for (const id of selectedIds) { await deleteConversation(id); }
        setSelectedIds([]);
        setIsEditMode(false);
      } else if (conversationToDelete) {
        await deleteConversation(conversationToDelete.id);
        setConversationToDelete(null);
      }
      setShowDeleteModal(false);
    } catch (error) { console.error('Error deleting conversation:', error); }
    finally { setIsDeleting(false); }
  };

  // Subscribe to user's conversations
  useEffect(() => {
    if (!user?.uid) return;
    setIsLoading(true);
    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Pull-to-refresh logic
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    if (!user?.uid) return;
    setIsRefreshing(true);
    // Force reload by unsubscribing and resubscribing
    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setIsRefreshing(false);
    });
    setTimeout(() => {
      unsubscribe();
      if (isRefreshing) setIsRefreshing(false);
    }, 2000); // fallback timeout
  };

  const renderConversation = ({ item }: { item: any }) => {
    const otherParticipant = item.participantDetails?.find((p: any) => p.id !== user?.uid);
    const unreadCount = item.unreadBy?.[user?.uid || ''] ?? item.unreadCount ?? 0;
    const isUnread = unreadCount > 0;
    const isMobile = Platform.OS !== 'web';
    const translateX = editModeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 44] });
    const conversationContent = (
      <Animated.View style={{ transform: [{ translateX }], width: '100%' }}>
        <TouchableOpacity style={[styles.conversationItem, isUnread ? styles.conversationUnread : undefined]} onPress={()=>handleConversationPress(item)} onLongPress={()=>{ setIsEditMode(true); setSelectedIds(prev => prev.includes(item.id) ? prev : [...prev, item.id]); }} activeOpacity={0.8}>
          <Avatar uri={otherParticipant?.photoURL} name={otherParticipant?.displayName || otherParticipant?.name || 'User'} size={56} />
          <Animated.View style={[styles.selectCheckbox, { transform: [{ scale: editModeAnim }], opacity: editModeAnim }]} pointerEvents={isEditMode ? 'auto' : 'none'}>
            <TouchableOpacity onPress={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter((id:any)=>id!==item.id) : [...prev, item.id])}>
              {selectedIds.includes(item.id) ? <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} /> : <Ionicons name="ellipse-outline" size={22} color={COLORS.textSecondary} />}
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}><Text style={[styles.conversationName, isUnread ? styles.textBold : undefined]}>{otherParticipant?.displayName || otherParticipant?.name || 'ผู้ใช้'}</Text><Text style={styles.conversationTime}>{item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : ''}</Text></View>
            {item.jobTitle && <Text style={styles.conversationJob} numberOfLines={1}>📋 {item.jobTitle}</Text>}
            <View style={styles.conversationFooter}><Text style={[styles.conversationMessage, isUnread ? styles.textBold : undefined]} numberOfLines={1}>{item.lastMessage || 'เริ่มต้นการสนทนา'}</Text>{isUnread && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unreadCount>9?'9+':unreadCount}</Text></View>}</View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
    if (!isMobile) return (
      <View style={styles.conversationRow}>
        {typeof conversationContent === 'string' ? <Text>{conversationContent}</Text> : conversationContent}
        <View style={styles.conversationActions}>
          <TouchableOpacity style={[styles.actionButton, styles.hideButton]} onPress={()=>handleHideConversation(item)}>
            <Ionicons name="eye-off-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={()=>handleDeletePress(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
    return (
      <View style={styles.conversationRow}>
        {typeof conversationContent === 'string' ? <Text>{conversationContent}</Text> : conversationContent}
        <View style={styles.swipeHint}>
          <TouchableOpacity style={[styles.actionButton, styles.hideButton]} onPress={()=>handleHideConversation(item)}>
            <Ionicons name="eye-off-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={()=>handleDeletePress(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: COLORS.primary, borderBottomColor: COLORS.primary }]}>
        <Text style={styles.headerTitle}>ข้อความ</Text>
      </View>
      {isLoading ? <Loading text="กำลังโหลดข้อความ..." /> : <FlatList data={conversations.filter(c => !c.hiddenBy?.includes(user?.uid || ''))} renderItem={renderConversation} keyExtractor={i=>i.id} ListEmptyComponent={<EmptyState icon="💬" title="ยังไม่มีข้อความ" description="เมื่อคุณติดต่อกับโรงพยาบาล ข้อความจะแสดงที่นี่" />} contentContainerStyle={conversations.filter(c => !c.hiddenBy?.includes(user?.uid || '')).length===0?{flex:1}:undefined} refreshing={isRefreshing} onRefresh={handleRefresh} />}

      <Modal visible={showMenu} transparent animationType="fade"><TouchableOpacity style={styles.popupModalOverlay} onPress={()=>setShowMenu(false)} /><View style={[styles.menuContainer, { backgroundColor: COLORS.surface }]}><TouchableOpacity style={styles.popupMenuItem} onPress={()=>{ setShowMenu(false); setIsEditMode(true); }}><Text style={{ color: COLORS.text }}>แก้ไข/เลือกหลายรายการ</Text></TouchableOpacity><TouchableOpacity style={styles.popupMenuItem} onPress={()=>{ setShowMenu(false); setShowHiddenModal(true); }}><Text style={{ color: COLORS.text }}>ดูที่ซ่อน</Text></TouchableOpacity><TouchableOpacity style={styles.popupMenuItem} onPress={()=>setShowMenu(false)}><Text style={{ color: COLORS.text }}>ยกเลิก</Text></TouchableOpacity></View></Modal>

      <Modal visible={showHiddenModal} animationType="slide">
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
          <View style={[styles.header, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.headerTitle, { color: COLORS.text }]}>แชทที่ถูกซ่อน</Text>
            <TouchableOpacity onPress={() => setShowHiddenModal(false)} style={{ position: 'absolute', right: SPACING.md, top: SPACING.md }}>
              <Text style={{ color: COLORS.primary }}>ปิด</Text>
            </TouchableOpacity>
          </View>
          <FlatList data={conversations.filter(c=>c.hiddenBy?.includes(user?.uid||''))} renderItem={({item})=>{ const other=item.participantDetails?.find((p:any)=>p.id !== user?.uid); return (<View style={styles.conversationRow}><TouchableOpacity style={styles.conversationItem} onPress={()=> (navigation as any).navigate('ChatRoom', { conversationId: item.id, recipientName: other?.displayName || 'ผู้ใช้', jobTitle: item.jobTitle })}><Avatar uri={other?.photoURL} name={other?.displayName || other?.name || 'User'} size={56} /><View style={styles.conversationContent}><View style={styles.conversationHeader}><Text style={styles.conversationName}>{other?.displayName || other?.name || 'ผู้ใช้'}</Text><Text style={styles.conversationTime}>{item.lastMessageAt?formatRelativeTime(item.lastMessageAt):''}</Text></View><Text style={styles.conversationMessage}>{item.lastMessage||''}</Text></View></TouchableOpacity><View style={{padding:SPACING.md}}><TouchableOpacity onPress={async()=>{ try{ await (await import('../../services/chatService')).unhideConversation(item.id, user?.uid||''); } catch(e){console.error(e);} }}><Text style={{color:COLORS.primary}}>นำกลับ</Text></TouchableOpacity></View></View>); }} keyExtractor={i=>i.id} ListEmptyComponent={<EmptyState icon="🙈" title="ยังไม่มีแชทที่ถูกซ่อน" />} />
        </SafeAreaView>
      </Modal>

      <ConfirmModal visible={showDeleteModal} title="ลบการสนทนา" message={`คุณต้องการลบการสนทนากับ "${conversationToDelete?.participantDetails?.find((p:any)=>p.id !== user?.uid)?.displayName || 'ผู้ใช้'}" หรือไม่? ข้อความทั้งหมดจะถูกลบอย่างถาวร`} confirmText={isDeleting?"กำลังลบ...":"ลบ"} cancelText="ยกเลิก" onConfirm={confirmDelete} onCancel={()=>{ setShowDeleteModal(false); setConversationToDelete(null); }} type="danger" />
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
  const { colors, isDark } = useTheme();
  const { setActiveConversationId } = useChatNotification();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState<Document[]>([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // Set active conversation to prevent global toast
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      
      // Mark as read every time messages update (while in this chat)
      if (user?.uid) {
        markConversationAsRead(conversationId, user.uid);
      }
    });

    // Initial mark as read
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
      setReplyTo(null);
    }
  };

  // Handle message long press - show menu
  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  // Copy message
  const handleCopyMessage = async () => {
    if (selectedMessage) {
      try {
        if ((navigator as any)?.clipboard?.writeText) {
          await (navigator as any).clipboard.writeText(selectedMessage.text || '');
        }
      } catch (e) {
        // ignore if clipboard not available
      }
    }
    setShowMessageMenu(false);
  };

  // Delete message (only own messages)
  const handleDeleteMessage = async () => {
    if (!selectedMessage || !user?.uid) return;
    
    try {
      await deleteMessage(conversationId, selectedMessage.id, user.uid);
    } catch (error: any) {
      console.error('Error:', error);
    }
    setShowMessageMenu(false);
  };

  // Reply to message
  const handleReply = () => {
    setReplyTo(selectedMessage);
    setShowMessageMenu(false);
  };

  // Report message
  const handleReportMessage = () => {
    setShowMessageMenu(false);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!selectedMessage || !user?.uid || !reportReason.trim()) return;
    
    try {
      await reportMessage(
        conversationId,
        selectedMessage.id,
        user.uid,
        user.displayName || 'ผู้ใช้',
        reportReason.trim()
      );
      setShowReportModal(false);
      setReportReason('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  // Load saved documents
  const handleOpenSavedDocuments = async () => {
    setShowAttachModal(false);
    if (!user?.uid) return;
    
    try {
      const docs = await getUserDocuments(user.uid);
      setSavedDocuments(docs);
      setShowDocumentsModal(true);
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('ไม่สามารถโหลดเอกสารได้');
    }
  };

  // Send saved document
  const handleSendSavedDocument = async (doc: Document) => {
    if (!user?.uid) return;
    setShowDocumentsModal(false);
    setIsSendingFile(true);
    
    try {
      await sendSavedDocument(
        conversationId,
        user.uid,
        user.displayName || 'ผู้ใช้',
        doc.fileUrl,
        doc.name,
        doc.type
      );
    } catch (error: any) {
      alert(error.message || 'ไม่สามารถส่งเอกสารได้');
    } finally {
      setIsSendingFile(false);
    }
  };

  // Pick and send image
  const handlePickImage = async () => {
    setShowAttachModal(false);
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('กรุณาอนุญาตการเข้าถึงรูปภาพ');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0] && user?.uid) {
        const image = result.assets[0];
        setIsSendingFile(true);
        
        try {
          const fileName = `image_${Date.now()}.jpg`;
          await sendImage(
            conversationId,
            user.uid,
            user.displayName || 'ผู้ใช้',
            image.uri,
            fileName
          );
        } catch (error: any) {
          alert(error.message || 'ไม่สามารถส่งรูปภาพได้');
        } finally {
          setIsSendingFile(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('เกิดข้อผิดพลาดในการเลือกรูปภาพ');
    }
  };

  // Pick and send file
  const handlePickFile = async () => {
    setShowAttachModal(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0] && user?.uid) {
        const file = result.assets[0];
        
        // Check file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          alert('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
          return;
        }
        
        setIsSendingFile(true);
        
        try {
          await sendDocument(
            conversationId,
            user.uid,
            user.displayName || 'ผู้ใช้',
            file.uri,
            file.name,
            file.size || 0,
            file.mimeType || 'application/octet-stream'
          );
        } catch (error: any) {
          alert(error.message || 'ไม่สามารถส่งไฟล์ได้');
        } finally {
          setIsSendingFile(false);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      alert('เกิดข้อผิดพลาดในการเลือกไฟล์');
    }
  };

  // Render message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.uid;
    const isDeleted = item.isDeleted;
    const isImage = (item as any).type === 'image';
    const isDocument = (item as any).type === 'document' || (item as any).type === 'saved_document';
    
    // Show date header for first message of the day (index 0 is oldest now)
    const showDate = index === 0 || 
      new Date(messages[index - 1]?.createdAt).toDateString() !== new Date(item.createdAt).toDateString();

    const openFile = (url: string) => {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        // For native, use Linking
        import('react-native').then(({ Linking }) => {
          Linking.openURL(url);
        });
      }
    };

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
        <TouchableOpacity
          onLongPress={() => !isDeleted && handleMessageLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          {/* Reply preview */}
          {item.replyTo && (
            <View style={[styles.replyPreview, isOwn && styles.replyPreviewOwn]}>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                ตอบกลับ: {item.replyTo.text}
              </Text>
            </View>
          )}
          <View style={[
            styles.messageBubble, 
            isOwn ? styles.ownMessage : styles.otherMessage,
            isDeleted && styles.deletedMessage
          ]}>
            {/* Image Message */}
            {isImage && (item as any).imageUrl && (
              <TouchableOpacity onPress={() => openFile((item as any).imageUrl)}>
                <View style={styles.imageContainer}>
                  <Ionicons name="image" size={48} color={isOwn ? 'rgba(255,255,255,0.8)' : colors.primary} />
                  <Text style={[styles.imageText, isOwn && { color: 'rgba(255,255,255,0.9)' }]}>
                    แตะเพื่อดูรูปภาพ
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Document Message */}
            {isDocument && (item as any).fileUrl && (
              <TouchableOpacity onPress={() => openFile((item as any).fileUrl)}>
                <View style={styles.documentContainer}>
                  <Ionicons name="document-attach" size={32} color={isOwn ? 'rgba(255,255,255,0.9)' : colors.primary} />
                  <View style={styles.documentDetails}>
                    <Text style={[styles.documentFileName, isOwn && { color: colors.white }]} numberOfLines={1}>
                      {(item as any).fileName || 'เอกสาร'}
                    </Text>
                    <Text style={[styles.documentFileInfo, isOwn && { color: 'rgba(255,255,255,0.7)' }]}>
                      แตะเพื่อเปิด
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Text Message */}
            {!isImage && !isDocument && (
              <Text style={[
                styles.messageText, 
                isOwn && styles.ownMessageText,
                isDeleted && styles.deletedMessageText
              ]}>
                {item.text}
              </Text>
            )}
            
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {isOwn && item.isRead && ' ✓✓'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.chatHeader, { backgroundColor: colors.primary, borderBottomColor: colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: '#fff' }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderContent}>
          <Text style={[styles.chatHeaderName, { color: '#fff' }]}>{recipientName}</Text>
          {jobTitle && (
            <Text style={[styles.chatHeaderJob, { color: '#fff' }]} numberOfLines={1}>
              📋 {jobTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContent}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>เริ่มการสนทนา</Text>
              </View>
            }
          />
        )}

        {/* Reply Preview */}
        {replyTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyInfo}>
              <Text style={styles.replyLabel}>ตอบกลับ:</Text>
              <Text style={styles.replyText} numberOfLines={1}>{replyTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachModal(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="พิมพ์ข้อความ..."
            placeholderTextColor={colors.textMuted}
            multiline={true}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={Boolean(!inputText.trim() || isSending)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Attach Document Modal */}
      <Modal
        visible={showAttachModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachModal(false)}
        >
          <View style={styles.attachModalContainer}>
            <Text style={styles.attachTitle}>แนบไฟล์</Text>
            
            <TouchableOpacity style={styles.attachOption} onPress={handleOpenSavedDocuments}>
              <View style={[styles.attachIcon, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="document-text" size={24} color="#0284c7" />
              </View>
              <View style={styles.attachInfo}>
                <Text style={styles.attachOptionTitle}>เอกสารที่บันทึกไว้</Text>
                <Text style={styles.attachOptionDesc}>ส่งเอกสารจากโปรไฟล์ของคุณ</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachOption} onPress={handlePickImage}>
              <View style={[styles.attachIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="image" size={24} color="#16a34a" />
              </View>
              <View style={styles.attachInfo}>
                <Text style={styles.attachOptionTitle}>รูปภาพ</Text>
                <Text style={styles.attachOptionDesc}>ส่งรูปภาพจากแกลเลอรี่</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachOption} onPress={handlePickFile}>
              <View style={[styles.attachIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="folder" size={24} color="#d97706" />
              </View>
              <View style={styles.attachInfo}>
                <Text style={styles.attachOptionTitle}>ไฟล์</Text>
                <Text style={styles.attachOptionDesc}>ส่งไฟล์จากอุปกรณ์</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Message Menu Modal */}
      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageMenu(false)}
        >
          <View style={styles.messageMenuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyMessage}>
              <Ionicons name="copy-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>คัดลอก</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleReply}>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>ตอบกลับ</Text>
            </TouchableOpacity>
            
            {selectedMessage?.senderId === user?.uid && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteMessage}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>ลบข้อความ</Text>
              </TouchableOpacity>
            )}
            
            {selectedMessage?.senderId !== user?.uid && (
              <TouchableOpacity style={styles.menuItem} onPress={handleReportMessage}>
                <Ionicons name="flag-outline" size={20} color={colors.warning} />
                <Text style={[styles.menuItemText, { color: colors.warning }]}>รายงาน</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContainer}>
            <Text style={styles.reportTitle}>รายงานข้อความ</Text>
            <Text style={styles.reportSubtitle}>กรุณาระบุเหตุผลในการรายงาน</Text>
            
            <TextInput
              style={[styles.reportInput, { color: colors.text, backgroundColor: colors.backgroundSecondary }]}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="เหตุผลในการรายงาน..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.reportButtons}>
              <TouchableOpacity 
                style={[styles.reportButton, styles.reportCancelButton]}
                onPress={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
              >
                <Text style={styles.reportCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.reportButton, styles.reportSubmitButton]}
                onPress={submitReport}
              >
                <Text style={styles.reportSubmitText}>ส่งรายงาน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Documents Modal */}
      <Modal
        visible={showDocumentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocumentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.documentsModalContainer}>
            <View style={styles.documentsHeader}>
              <Text style={styles.documentsTitle}>เอกสารของคุณ</Text>
              <TouchableOpacity onPress={() => setShowDocumentsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {savedDocuments.length === 0 ? (
              <View style={styles.emptyDocuments}>
                <Ionicons name="document-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyDocumentsText}>ไม่มีเอกสาร</Text>
                <Text style={styles.emptyDocumentsSubtext}>คุณยังไม่มีเอกสารที่บันทึกไว้</Text>
              </View>
            ) : (
              <FlatList
                data={savedDocuments}
                keyExtractor={(item) => item.id}
                style={styles.documentsList}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.documentItem}
                    onPress={() => handleSendSavedDocument(item)}
                  >
                    <View style={styles.documentItemIcon}>
                      <Ionicons 
                        name={item.type === 'license' ? 'ribbon' : item.type === 'resume' ? 'document-text' : 'document'} 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.documentItemInfo}>
                      <Text style={styles.documentItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.documentItemType}>{item.type}</Text>
                    </View>
                    <Ionicons name="send" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Sending File Overlay */}
      {isSendingFile && (
        <View style={styles.sendingOverlay}>
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.sendingText}>กำลังส่งไฟล์...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Named exports are declared on their function declarations above.

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  editHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectCheckbox: {
    position: 'absolute',
    left: -8,
    top: 18,
    zIndex: 10,
  },

  

  menuContainer: {
    position: 'absolute',
    right: 12,
    top: 60,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    width: 220,
    ...SHADOWS.sm,
  },

  popupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },

  popupMenuItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
  },
  guestDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Conversation Item
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  conversationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  conversationUnread: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  deleteConversationButton: {
    padding: SPACING.md,
    paddingLeft: 0,
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
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  unreadText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // Conversation Actions (Web/PC)
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.sm,
    gap: SPACING.xs,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.sm,
    gap: SPACING.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideButton: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
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
    padding: SPACING.sm,
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
    marginVertical: SPACING.sm,
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
  deletedMessage: {
    opacity: 0.6,
    backgroundColor: COLORS.backgroundSecondary,
  },
  deletedMessageText: {
    fontStyle: 'italic',
    color: COLORS.textMuted,
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

  // Reply
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  replyInfo: {
    flex: 1,
  },
  replyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  replyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  replyPreview: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 2,
    marginLeft: 60,
    marginRight: SPACING.md,
  },
  replyPreviewOwn: {
    marginLeft: SPACING.md,
    marginRight: 60,
  },
  replyPreviewText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // Toast Notification
  toastContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 10,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  toastSender: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  toastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Message Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    minWidth: 200,
    ...SHADOWS.large,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },

  // Report Modal
  reportModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  reportTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  reportSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  reportInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  reportButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  reportButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  reportCancelButton: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  reportCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  reportSubmitButton: {
    backgroundColor: COLORS.warning,
  },
  reportSubmitText: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    paddingBottom: Platform.OS === 'android' ? SPACING.md : SPACING.sm,
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
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },

  // Attach Modal
  attachModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  attachTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  attachIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  attachOptionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  attachOptionDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Documents Modal
  documentsModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    ...SHADOWS.large,
  },
  documentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  documentsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  documentsList: {
    padding: SPACING.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  documentItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  documentItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  documentItemType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyDocuments: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocumentsText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyDocumentsSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // Sending Overlay
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  sendingContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  sendingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.md,
  },

  // Image & Document in Message
  imageContainer: {
    alignItems: 'center',
    padding: SPACING.md,
    minWidth: 150,
  },
  imageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    minWidth: 200,
  },
  documentDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  documentFileName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  documentFileInfo: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
}); 


interface ToastNotificationProps {
  visible: boolean;
  senderName: string;
  message: string;
  onHide: () => void;
}

function ToastNotification({ visible, senderName, message, onHide }: ToastNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.toastContainer,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastSender} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.toastMessage} numberOfLines={2}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ChatListScreen and ChatRoomScreen are named exports via their declarations.

