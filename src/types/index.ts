// ============================================
// TYPE DEFINITIONS - Production Ready
// ============================================

// ============================================
// SUBSCRIPTION TYPES
// ============================================
export type SubscriptionPlan = 'free' | 'premium';

export interface Subscription {
  plan: SubscriptionPlan;
  expiresAt?: Date; // null = never expires (for premium)
  startedAt?: Date;
  // Limits for free plan
  postsToday?: number;
  lastPostDate?: string; // YYYY-MM-DD format
}

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'ฟรี',
    price: 0,
    postExpiryDays: 2,      // โพสต์หมดอายุใน 2 วัน
    maxPostsPerDay: 2,      // โพสต์ได้ 2 ครั้งต่อวัน
    features: ['โพสต์ได้ 2 ครั้ง/วัน', 'โพสต์อยู่ 2 วัน'],
  },
  premium: {
    name: 'Premium',
    price: 199,
    postExpiryDays: 30,     // โพสต์อยู่ 30 วัน
    maxPostsPerDay: null,   // ไม่จำกัด
    features: ['โพสต์ได้ไม่จำกัด', 'โพสต์อยู่ 30 วัน', 'ไม่มีโฆษณา'],
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
  createdAt: Date;
  updatedAt?: Date;
  lastActiveAt?: Date;
  fcmToken?: string; // For push notifications
}

// Job Types - บอร์ดหาคนแทน
export interface JobPost {
  id: string;
  title: string;
  posterName: string;
  posterId: string;
  posterPhoto?: string;
  department: string;
  description?: string;
  requirements?: string[];
  // ค่าตอบแทน (ไม่ใช่เงินเดือน)
  shiftRate: number;
  rateType: 'hour' | 'day' | 'shift';
  // วันเวลาที่ต้องการ
  shiftDate: Date;
  shiftTime: string; // เช่น "08:00-16:00", "16:00-00:00"
  location?: {
    province: string;
    district?: string;
    hospital?: string;
    address?: string;
  };
  contactPhone?: string;
  contactLine?: string;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'closed' | 'urgent';
  viewsCount?: number;
  tags?: string[];
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
  district?: string;
  department?: string;
  urgentOnly?: boolean;
  sortBy?: 'latest' | 'night' | 'morning' | 'nearest' | 'highestPay';
  minRate?: number;
  maxRate?: number;
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
  Documents: undefined;
  Applicants: undefined;
  Reviews: { hospitalId: string; hospitalName: string };
  Help: undefined;
  Terms: undefined;
  Privacy: undefined;
  AdminDashboard: undefined; // Admin Dashboard Screen
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
  OTPVerification: { 
    phone: string; 
    registrationData?: {
      email?: string;
      password?: string;
      displayName?: string;
    };
  };
  CompleteRegistration: { 
    phone: string; 
    phoneVerified: boolean;
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
