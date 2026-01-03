// ============================================
// FEEDBACK SERVICE - ระบบรีวิวและ Feedback แอพ
// ============================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// Types
// ============================================
export type FeedbackType = 'app_review' | 'bug_report' | 'feature_request' | 'complaint' | 'other';
export type FeedbackStatus = 'pending' | 'read' | 'responded' | 'resolved';

export interface AppFeedback {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  
  // Rating 1-5 stars
  rating: number;
  
  // Feedback content
  type: FeedbackType;
  title: string;
  message: string;
  
  // App info
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  
  // Status
  status: FeedbackStatus;
  createdAt: Date | Timestamp;
  
  // Admin response
  adminResponse?: string;
  respondedAt?: Date | Timestamp;
  respondedBy?: string;
}

// ============================================
// Constants
// ============================================
const FEEDBACK_COLLECTION = 'feedback';

export const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'app_review', label: 'รีวิวแอพ', icon: 'star' },
  { value: 'bug_report', label: 'แจ้งบัค', icon: 'bug' },
  { value: 'feature_request', label: 'แนะนำฟีเจอร์', icon: 'bulb' },
  { value: 'complaint', label: 'ร้องเรียน', icon: 'warning' },
  { value: 'other', label: 'อื่นๆ', icon: 'chatbox' },
];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: 'รอตรวจสอบ',
  read: 'อ่านแล้ว',
  responded: 'ตอบกลับแล้ว',
  resolved: 'แก้ไขแล้ว',
};

// ============================================
// Create Feedback
// ============================================
export async function createFeedback(
  feedback: Omit<AppFeedback, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      ...feedback,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw new Error('ไม่สามารถส่ง feedback ได้');
  }
}

// ============================================
// Get All Feedback (Admin)
// ============================================
export async function getAllFeedback(maxLimit = 100): Promise<AppFeedback[]> {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxLimit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        respondedAt: data.respondedAt?.toDate(),
      } as AppFeedback;
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return [];
  }
}

// ============================================
// Get Feedback By Status (Admin)
// ============================================
export async function getFeedbackByStatus(status: FeedbackStatus): Promise<AppFeedback[]> {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        respondedAt: data.respondedAt?.toDate(),
      } as AppFeedback;
    });
  } catch (error) {
    console.error('Error getting feedback by status:', error);
    return [];
  }
}

// ============================================
// Get User's Feedback
// ============================================
export async function getUserFeedback(userId: string): Promise<AppFeedback[]> {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        respondedAt: data.respondedAt?.toDate(),
      } as AppFeedback;
    });
  } catch (error) {
    console.error('Error getting user feedback:', error);
    return [];
  }
}

// ============================================
// Update Feedback Status (Admin)
// ============================================
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus
): Promise<void> {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    throw new Error('ไม่สามารถอัปเดตสถานะได้');
  }
}

// ============================================
// Respond to Feedback (Admin)
// ============================================
export async function respondToFeedback(
  feedbackId: string,
  adminId: string,
  response: string
): Promise<void> {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await updateDoc(docRef, {
      adminResponse: response,
      respondedAt: serverTimestamp(),
      respondedBy: adminId,
      status: 'responded',
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    throw new Error('ไม่สามารถตอบกลับได้');
  }
}

// ============================================
// Get Feedback Stats (Admin)
// ============================================
export interface FeedbackStats {
  total: number;
  pending: number;
  avgRating: number;
  byType: Record<FeedbackType, number>;
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    const allFeedback = await getAllFeedback(500);
    
    const stats: FeedbackStats = {
      total: allFeedback.length,
      pending: allFeedback.filter(f => f.status === 'pending').length,
      avgRating: 0,
      byType: {
        app_review: 0,
        bug_report: 0,
        feature_request: 0,
        complaint: 0,
        other: 0,
      },
    };
    
    if (allFeedback.length > 0) {
      const totalRating = allFeedback.reduce((sum, f) => sum + f.rating, 0);
      stats.avgRating = totalRating / allFeedback.length;
      
      allFeedback.forEach(f => {
        stats.byType[f.type]++;
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return {
      total: 0,
      pending: 0,
      avgRating: 0,
      byType: {
        app_review: 0,
        bug_report: 0,
        feature_request: 0,
        complaint: 0,
        other: 0,
      },
    };
  }
}

// ============================================
// Check if user can leave feedback (1 per day)
// ============================================
export async function canUserLeaveFeedback(userId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return true;
    
    const lastFeedback = snapshot.docs[0].data();
    const lastDate = lastFeedback.createdAt?.toDate() || new Date(0);
    
    return lastDate < today;
  } catch (error) {
    console.error('Error checking feedback limit:', error);
    return true;
  }
}
