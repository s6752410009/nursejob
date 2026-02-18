import { Timestamp } from 'firebase/firestore';

// ============================================
// TYPE DEFINITIONS - Production Ready
// ============================================

// ============================================
// SUBSCRIPTION TYPES
// ============================================
export type SubscriptionPlan = 'free' | 'premium';

export interface Subscription {
  plan: SubscriptionPlan;
  expiresAt?: Date | Timestamp | null; // null = never expires (for premium)
  startedAt?: Date;
  // Limits for free plan
  postsToday?: number;
  lastPostDate?: string; // YYYY-MM-DD format
  // Free urgent usage (1 free per account)
  freeUrgentUsed?: boolean;
}

// Pricing Constants (in THB)
export const PRICING = {
  subscription: 89,       // Premium subscription per month
  extendPost: 19,         // Extend post 1 day
  extraPost: 19,          // Additional post beyond daily limit
  urgentPost: 49,         // Make post urgent
} as const;

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'ฟรี',
    price: 0,
    postExpiryDays: 3,      // โพสต์หมดอายุใน 3 วัน
    maxPostsPerDay: 2,      // โพสต์ได้ 2 ครั้งต่อวัน
    features: [
      'โพสต์ได้ 2 ครั้ง/วัน',
      'โพสต์อยู่ 3 วัน',
      'ปุ่มด่วน ฿49/ครั้ง',
    ],
  },
  premium: {
    name: 'Premium',
    price: 89,              // ลดจาก 199 เป็น 89 บาท/เดือน
    postExpiryDays: 30,     // โพสต์อยู่ 30 วัน
    maxPostsPerDay: null,   // ไม่จำกัด
    features: [
      'โพสต์ได้ไม่จำกัด',
      'โพสต์อยู่ 30 วัน',
      '🎁 แถมปุ่มด่วนฟรี 1 ครั้ง',
      'ไม่มีโฆษณา',
    ],
  },
} as const;

// User Types
export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  role: 'nurse' | 'hospital' | 'admin';
  licenseNumber?: string;
  licenseVerified?: boolean;
  experience?: number;
  skills?: string[];
  education?: string[];
  certifications?: string[];
  bio?: string;
  location?: {
    province: string;
    district: string;
  };
  availability?: {
    isAvailable: boolean;
    preferredShifts: ('morning' | 'afternoon' | 'night')[];
    preferredDays: string[];
  };
  ratings?: {
    average: number;
    count: number;
  };
  completedJobs?: number;
  isVerified?: boolean;
  isActive?: boolean;
  settings?: {
    notifications: boolean;
    emailNotifications: boolean;
    jobAlerts: boolean;
  };
  // Subscription
  subscription?: Subscription;
  createdAt: Date | admin.firestore.Timestamp;
  updatedAt?: Date | admin.firestore.Timestamp;
  lastActiveAt?: Date;
  fcmToken?: string; // For push notifications
}

// Job Types - บอร์ดหาคนแทน
export interface JobPost {
  id: string;
  
  // Post type (Supabase)
  postType?: 'shift' | 'job' | 'homecare';
  
  title: string;
  posterName: string;
  posterId: string;
  posterPhoto?: string;
  
  // ประเภทบุคลากรที่ต้องการ
  staffType?: 'RN' | 'PN' | 'NA' | 'CG' | 'SITTER' | 'OTHER' | string;
  staffTypeOther?: string; // ถ้าเลือก OTHER
  
  department: string;
  description?: string;
  requirements?: string[];
  
  // ค่าตอบแทน
  shiftRate: number;
  salary?: number;
  rateType: 'hour' | 'day' | 'shift' | 'month' | 'per_shift' | 'per_day' | 'per_month' | 'negotiable';
  salaryType?: string;
  paymentType?: 'NET' | 'DEDUCT_PERCENT' | 'NEGOTIABLE' | 'CASH' | 'TRANSFER' | 'DEDUCT';
  deductPercent?: number; // เช่น 3, 5, 10
  
  // วันเวลาที่ต้องการ
  shiftDate: Date;
  shiftDateEnd?: Date; // สำหรับงานหลายวัน
  shiftTime: string; // เช่น "08:00-16:00", "16:00-00:00"
  startTime?: string;
  endTime?: string;
  duration?: string; // ระยะเวลา เช่น "1week", "1month"
  
  // สถานที่
  locationType?: 'HOSPITAL' | 'CLINIC' | 'HOME' | 'NURSING_HOME' | 'OTHER';
  province?: string;
  district?: string;
  hospital?: string;
  address?: string;
  location?: {
    province: string;
    district?: string;
    hospital?: string; // ชื่อ รพ./คลินิก/สถานที่
    address?: string; // ที่อยู่เต็ม (สำหรับ Home care)
    landmark?: string; // จุดสังเกต
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // ข้อมูลติดต่อ
  contactName?: string;
  contactPhone?: string;
  contactLine?: string;
  
  // Metadata
  createdAt: Date | admin.firestore.Timestamp;
  updatedAt?: Date | admin.firestore.Timestamp;
  expiresAt?: Date | admin.firestore.Timestamp | null;
  status: 'active' | 'closed' | 'urgent' | 'expired' | 'deleted';
  isUrgent?: boolean;
  viewsCount?: number;
  applicationCount?: number;
  applicantsCount?: number;
  tags?: string[];
  posterVerified?: boolean; // ผู้โพสต์ได้รับการยืนยันตัวตนแล้ว
}

// การติดต่อแสดงความสนใจ
export interface ShiftContact {
  id: string;
  jobId: string;
  job?: JobPost;
  interestedUserId: string;
  interestedUserName?: string;
  interestedUserPhone?: string;
  message?: string;
  status: 'interested' | 'confirmed' | 'cancelled';
  contactedAt: Date;
  notes?: string;
}

// Chat Types
export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: {
    id: string;
    name?: string;
    displayName?: string;
    photoURL?: string;
  }[];
  jobId?: string;
  jobTitle?: string;
  hospitalName?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  createdAt: Date;
  unreadCount?: number;
  unreadBy?: { [userId: string]: number }; // Track unread per user
  isArchived?: boolean;
  isPinned?: boolean;
  hiddenBy?: string[]; // รายการ userId ที่ซ่อนแชทนี้
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
  type?: 'text' | 'image' | 'file' | 'location' | 'system';
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: Date;
  isRead?: boolean;
  readBy?: string[];
  deliveredTo?: string[];
  isDeleted?: boolean;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
}

// Notification Types
export interface AppNotification {
  id: string;
  userId: string;
  type: 'job_match' | 'application_update' | 'new_message' | 'job_reminder' | 'system' | 'promotion';
  title: string;
  body: string;
  data?: {
    jobId?: string;
    applicationId?: string;
    conversationId?: string;
    url?: string;
  };
  read: boolean;
  createdAt: Date;
}

// Review Types
export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto?: string;
  revieweeId: string;
  jobId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: Date;
  response?: {
    text: string;
    createdAt: Date;
  };
}

// Filter Types
// Filter Types - สำหรับบอร์ดหาคนแทน
export interface JobFilters {
  query?: string;
  province?: string;
  region?: string; // ภาค
  district?: string;
  department?: string;
  staffType?: 'RN' | 'PN' | 'NA' | 'CG' | 'SITTER' | 'OTHER' | string; // ประเภทบุคลากร
  locationType?: 'HOSPITAL' | 'CLINIC' | 'HOME' | 'NURSING_HOME' | 'OTHER'; // ประเภทสถานที่
  postType?: 'shift' | 'job' | 'homecare'; // ประเภทโพสต์
  urgentOnly?: boolean;
  verifiedOnly?: boolean; // กรองเฉพาะงานจากพยาบาลยืนยันแล้ว
  homeCareOnly?: boolean; // งาน Home Care เท่านั้น
  sortBy?: 'latest' | 'night' | 'morning' | 'nearest' | 'highestPay';
  minRate?: number;
  maxRate?: number;
  paymentType?: 'NET' | 'DEDUCT_PERCENT' | 'NEGOTIABLE';
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  JobDetail: { job: JobPost };
  ChatRoom: { 
    conversationId: string; 
    recipientName?: string;
    jobTitle?: string;
  };
  EditProfile: undefined;
  Applications: undefined;
  Settings: undefined;
  Notifications: undefined;
  Favorites: undefined;
  MyPosts: undefined;
  Shop: undefined; // ร้านค้า / ซื้อบริการ
  ThemeSelection: undefined; // เลือกโทนสี
  Documents: undefined;
  Applicants: undefined;
  Reviews: { hospitalId: string; hospitalName: string };
  Help: undefined;
  Terms: undefined;
  Privacy: undefined;
  Verification: undefined; // ยืนยันตัวตนพยาบาล
  UserProfile: { userId: string; userName?: string; userPhoto?: string }; // ดูโปรไฟล์คนอื่น
  AdminDashboard: undefined; // Admin Dashboard Screen
  AdminVerification: undefined; // Admin Verification Screen - ตรวจใบอนุญาต
  AdminReports: undefined; // Admin Reports Screen - ดูรายงาน
  AdminFeedback: undefined; // Admin Feedback Screen - ดู feedback
  Feedback: undefined; // User Feedback Screen
  Payment: {
    type?: string;
    amount?: number;
    title?: string;
    description?: string;
    formData?: any;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PhoneLogin: undefined;
  EmailVerification: { email: string };
  OTPVerification: { 
    phone: string; 
    registrationData?: {
      email?: string;
      password?: string;
      displayName?: string;
    };
  };
  ChooseRole: { phone: string; registrationData?: any };
  CompleteRegistration: { 
    phone: string; 
    phoneVerified: boolean;
    role?: 'user' | 'nurse' | 'hospital';
    registrationData?: any;
  };
  Terms: undefined;
  Privacy: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search?: undefined;
  PostJob: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phone?: string;
  role: 'nurse' | 'hospital';
  acceptTerms: boolean;
}

export interface PostJobForm {
  title: string;
  department: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salaryMin: string;
  salaryMax: string;
  employmentType: string;
  province: string;
  district: string;
  address: string;
  contactPhone: string;
  contactLine: string;
  contactEmail: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Export StaffType for external usage
export type StaffType = 'RN' | 'PN' | 'NA' | 'CG' | 'SITTER' | 'OTHER';
