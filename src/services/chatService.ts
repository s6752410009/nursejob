import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message, Conversation } from '../types';

// Create or get existing conversation
export const getOrCreateConversation = async (
  userId: string,
  userName: string,
  otherUserId: string,
  otherUserName: string,
  jobId?: string,
  jobTitle?: string,
  hospitalName?: string
): Promise<string> => {
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    
    // Find existing conversation with both participants (and same job if specified)
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        if (jobId && data.jobId === jobId) {
          return doc.id;
        } else if (!jobId && !data.jobId) {
          return doc.id;
        }
      }
    }
    
    // Create new conversation
    const newConversation = {
      participants: [userId, otherUserId],
      participantDetails: [
        { id: userId, name: userName },
        { id: otherUserId, name: otherUserName },
      ],
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      hospitalName: hospitalName || null,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      unreadCount: 0,
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    await addDoc(messagesRef, {
      senderId,
      senderName,
      text,
      createdAt: serverTimestamp(),
      isRead: false,
    });
    
    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      const data = conversationDoc.data();
      
      await updateDoc(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadCount: (data.unreadCount || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map(doc => ({
      id: doc.id,
      conversationId,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as Message[];
    
    callback(messages);
  });
};

// Subscribe to user's conversations
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessageAt: (doc.data().lastMessageAt as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as Conversation[];
    
    callback(conversations);
  });
};

// Mark messages as read
export const markConversationAsRead = async (
  conversationId: string,
  _userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};

// Get unread count for user
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    let total = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      total += data.unreadCount || 0;
    });
    
    return total;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
