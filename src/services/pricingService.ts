// ============================================
// PRICING SERVICE - ระบบจ่ายเงินและ Premium
// ============================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// Types
// ============================================
export type PlanType = 'free' | 'premium';
export type PurchaseType = 'subscription' | 'single_post' | 'extend_post' | 'urgent_post';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface UserPlan {
  id?: string;
  userId: string;
  planType: PlanType;
  
  // Subscription info
  subscriptionStart?: Date | Timestamp;
  subscriptionEnd?: Date | Timestamp;
  isActive: boolean;
  
  // Usage limits
  dailyPostLimit: number; // 2 for free, unlimited for premium
  postsToday: number;
  lastPostDate?: Date | Timestamp;
  
  // Extra posts purchased
  extraPosts: number;
  
  // Stats
  totalSpent: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Purchase {
  id?: string;
  userId: string;
  userName: string;
  
  // Purchase details
  type: PurchaseType;
  amount: number; // in THB
  
  // For extend_post
  jobId?: string;
  extendDays?: number;
  
  // Payment
  paymentMethod?: string;
  paymentRef?: string;
  status: PaymentStatus;
  
  createdAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
}

// ============================================
// Constants
// ============================================
const USER_PLANS_COLLECTION = 'userPlans';
const PURCHASES_COLLECTION = 'purchases';

// Pricing (THB)
export const PRICING = {
  SUBSCRIPTION_MONTHLY: 99,
  SINGLE_POST: 19,
  EXTEND_POST_PER_DAY: 19,
  URGENT_POST: 49,
  
  FREE_DAILY_LIMIT: 2,
  PREMIUM_DAILY_LIMIT: 999, // Unlimited
  
  POST_EXPIRE_DAYS: 2,
};

// ============================================
// Get or Create User Plan
// ============================================
export async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    const q = query(
      collection(db, USER_PLANS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        ...data,
        subscriptionStart: data.subscriptionStart?.toDate(),
        subscriptionEnd: data.subscriptionEnd?.toDate(),
        lastPostDate: data.lastPostDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserPlan;
    }
    
    // Create default free plan
    const newPlan: Omit<UserPlan, 'id'> = {
      userId,
      planType: 'free',
      isActive: true,
      dailyPostLimit: PRICING.FREE_DAILY_LIMIT,
      postsToday: 0,
      extraPosts: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, USER_PLANS_COLLECTION), {
      ...newPlan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...newPlan };
  } catch (error) {
    console.error('Error getting user plan:', error);
    throw new Error('ไม่สามารถโหลดข้อมูลแพลนได้');
  }
}

// ============================================
// Check if User Can Post
// ============================================
export interface PostCheckResult {
  canPost: boolean;
  reason?: string;
  remainingPosts: number;
  isPremium: boolean;
  extraPosts: number;
  needsPayment: boolean;
  paymentOptions: {
    type: PurchaseType;
    price: number;
    description: string;
  }[];
}

export async function checkCanPost(userId: string): Promise<PostCheckResult> {
  try {
    const plan = await getUserPlan(userId);
    
    // Check if premium subscription is active
    const isPremium: boolean = plan.planType === 'premium' && 
      !!plan.subscriptionEnd && 
      new Date(plan.subscriptionEnd as Date) > new Date();
    
    // Check if it's a new day (reset posts)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPost = plan.lastPostDate ? new Date(plan.lastPostDate as Date) : new Date(0);
    lastPost.setHours(0, 0, 0, 0);
    
    const isNewDay = today > lastPost;
    const currentPostsToday = isNewDay ? 0 : plan.postsToday;
    
    const limit = isPremium ? PRICING.PREMIUM_DAILY_LIMIT : PRICING.FREE_DAILY_LIMIT;
    const remainingPosts = Math.max(0, limit - currentPostsToday) + plan.extraPosts;
    
    const paymentOptions = [
      {
        type: 'single_post' as PurchaseType,
        price: PRICING.SINGLE_POST,
        description: 'โพสต์เพิ่ม 1 โพสต์',
      },
      {
        type: 'subscription' as PurchaseType,
        price: PRICING.SUBSCRIPTION_MONTHLY,
        description: 'Premium รายเดือน (ไม่จำกัดโพสต์)',
      },
    ];
    
    if (remainingPosts > 0) {
      return {
        canPost: true,
        remainingPosts,
        isPremium,
        extraPosts: plan.extraPosts,
        needsPayment: false,
        paymentOptions,
      };
    }
    
    return {
      canPost: false,
      reason: isPremium 
        ? 'เกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแล'
        : `คุณโพสต์ครบ ${PRICING.FREE_DAILY_LIMIT} โพสต์แล้ววันนี้`,
      remainingPosts: 0,
      isPremium,
      extraPosts: plan.extraPosts,
      needsPayment: true,
      paymentOptions,
    };
  } catch (error) {
    console.error('Error checking post limit:', error);
    return {
      canPost: false,
      reason: 'ไม่สามารถตรวจสอบได้',
      remainingPosts: 0,
      isPremium: false,
      extraPosts: 0,
      needsPayment: false,
      paymentOptions: [],
    };
  }
}

// ============================================
// Use a Post (Decrement limit)
// ============================================
export async function usePost(userId: string): Promise<void> {
  try {
    const plan = await getUserPlan(userId);
    if (!plan.id) throw new Error('Plan not found');
    
    const docRef = doc(db, USER_PLANS_COLLECTION, plan.id);
    
    // Check if we should use extra post or daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPost = plan.lastPostDate ? new Date(plan.lastPostDate as Date) : new Date(0);
    lastPost.setHours(0, 0, 0, 0);
    
    const isNewDay = today > lastPost;
    const currentPostsToday = isNewDay ? 0 : plan.postsToday;
    const limit = plan.planType === 'premium' ? PRICING.PREMIUM_DAILY_LIMIT : PRICING.FREE_DAILY_LIMIT;
    
    if (currentPostsToday < limit) {
      // Use daily limit
      await updateDoc(docRef, {
        postsToday: isNewDay ? 1 : increment(1),
        lastPostDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (plan.extraPosts > 0) {
      // Use extra post
      await updateDoc(docRef, {
        extraPosts: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } else {
      throw new Error('ไม่มีโควต้าโพสต์เหลือ');
    }
  } catch (error) {
    console.error('Error using post:', error);
    throw error;
  }
}

// ============================================
// Purchase Single Post
// ============================================
export async function purchaseSinglePost(
  userId: string,
  userName: string
): Promise<Purchase> {
  try {
    // Create purchase record
    const purchase: Omit<Purchase, 'id'> = {
      userId,
      userName,
      type: 'single_post',
      amount: PRICING.SINGLE_POST,
      status: 'pending',
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, PURCHASES_COLLECTION), {
      ...purchase,
      createdAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...purchase };
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw new Error('ไม่สามารถสร้างรายการซื้อได้');
  }
}

// ============================================
// Complete Purchase (After payment verified)
// ============================================
export async function completePurchase(
  purchaseId: string,
  userId: string
): Promise<void> {
  try {
    // Get purchase
    const purchaseDoc = await getDoc(doc(db, PURCHASES_COLLECTION, purchaseId));
    if (!purchaseDoc.exists()) throw new Error('Purchase not found');
    
    const purchase = purchaseDoc.data() as Purchase;
    
    // Update purchase status
    await updateDoc(doc(db, PURCHASES_COLLECTION, purchaseId), {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    
    // Update user plan based on purchase type
    const plan = await getUserPlan(userId);
    if (!plan.id) throw new Error('Plan not found');
    
    const planRef = doc(db, USER_PLANS_COLLECTION, plan.id);
    
    switch (purchase.type) {
      case 'single_post':
        await updateDoc(planRef, {
          extraPosts: increment(1),
          totalSpent: increment(purchase.amount),
          updatedAt: serverTimestamp(),
        });
        break;
        
      case 'subscription':
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        await updateDoc(planRef, {
          planType: 'premium',
          subscriptionStart: serverTimestamp(),
          subscriptionEnd: endDate,
          dailyPostLimit: PRICING.PREMIUM_DAILY_LIMIT,
          totalSpent: increment(purchase.amount),
          updatedAt: serverTimestamp(),
        });
        break;
        
      case 'extend_post':
        // Handle in separate function
        break;
    }
  } catch (error) {
    console.error('Error completing purchase:', error);
    throw error;
  }
}

// ============================================
// Purchase Subscription
// ============================================
export async function purchaseSubscription(
  userId: string,
  userName: string
): Promise<Purchase> {
  try {
    const purchase: Omit<Purchase, 'id'> = {
      userId,
      userName,
      type: 'subscription',
      amount: PRICING.SUBSCRIPTION_MONTHLY,
      status: 'pending',
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, PURCHASES_COLLECTION), {
      ...purchase,
      createdAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...purchase };
  } catch (error) {
    console.error('Error creating subscription purchase:', error);
    throw new Error('ไม่สามารถสร้างรายการซื้อได้');
  }
}

// ============================================
// Extend Post Expiry
// ============================================
export async function purchaseExtendPost(
  userId: string,
  userName: string,
  jobId: string,
  days: number = 1
): Promise<Purchase> {
  try {
    const purchase: Omit<Purchase, 'id'> = {
      userId,
      userName,
      type: 'extend_post',
      amount: PRICING.EXTEND_POST_PER_DAY * days,
      jobId,
      extendDays: days,
      status: 'pending',
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, PURCHASES_COLLECTION), {
      ...purchase,
      createdAt: serverTimestamp(),
    });
    
    return { id: docRef.id, ...purchase };
  } catch (error) {
    console.error('Error creating extend purchase:', error);
    throw new Error('ไม่สามารถสร้างรายการซื้อได้');
  }
}

// ============================================
// Get User Purchases
// ============================================
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
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
        completedAt: data.completedAt?.toDate(),
      } as Purchase;
    });
  } catch (error) {
    console.error('Error getting purchases:', error);
    return [];
  }
}

// ============================================
// Get All Purchases (Admin)
// ============================================
export async function getAllPurchases(maxLimit = 100): Promise<Purchase[]> {
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
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
        completedAt: data.completedAt?.toDate(),
      } as Purchase;
    });
  } catch (error) {
    console.error('Error getting all purchases:', error);
    return [];
  }
}

// ============================================
// Get Revenue Stats (Admin)
// ============================================
export interface RevenueStats {
  totalRevenue: number;
  thisMonth: number;
  subscriptions: number;
  singlePosts: number;
  extendPosts: number;
  byDay: { date: string; amount: number }[];
}

export async function getRevenueStats(): Promise<RevenueStats> {
  try {
    const purchases = await getAllPurchases(500);
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats: RevenueStats = {
      totalRevenue: 0,
      thisMonth: 0,
      subscriptions: 0,
      singlePosts: 0,
      extendPosts: 0,
      byDay: [],
    };
    
    const dayMap = new Map<string, number>();
    
    completedPurchases.forEach(p => {
      stats.totalRevenue += p.amount;
      
      const purchaseDate = new Date(p.createdAt as Date);
      if (purchaseDate >= thisMonthStart) {
        stats.thisMonth += p.amount;
      }
      
      switch (p.type) {
        case 'subscription':
          stats.subscriptions += p.amount;
          break;
        case 'single_post':
          stats.singlePosts += p.amount;
          break;
        case 'extend_post':
          stats.extendPosts += p.amount;
          break;
      }
      
      const dayKey = purchaseDate.toISOString().split('T')[0];
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + p.amount);
    });
    
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      stats.byDay.push({
        date: key,
        amount: dayMap.get(key) || 0,
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    return {
      totalRevenue: 0,
      thisMonth: 0,
      subscriptions: 0,
      singlePosts: 0,
      extendPosts: 0,
      byDay: [],
    };
  }
}
