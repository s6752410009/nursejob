# 📋 การวิเคราะห์ระบบ NurseShift - บอร์ดหาคนแทนสำหรับพยาบาล

> **เอกสารสรุประบบฉบับสมบูรณ์** - อัปเดตล่าสุด: 3 มกราคม 2026

---

## 📱 ภาพรวมของระบบ

**NurseShift** คือแอปพลิเคชันมือถือสำหรับพยาบาลในการประกาศหาคนแทนงานกะ และรับงานแทนกันในพื้นที่กรุงเทพฯ และปริมณฑล

### 🎯 วัตถุประสงค์หลัก
- ช่วยให้พยาบาลที่ต้องการหาคนแทนงานกะสามารถโพสต์ประกาศได้ง่ายและรวดเร็ว
- ช่วยให้พยาบาลที่ต้องการรับงานเสริมสามารถค้นหางานได้สะดวก
- เชื่อมต่อพยาบาลกับโรงพยาบาล/หน่วยงานที่ต้องการกำลังคนเพิ่มเติม

### 🌍 พื้นที่ให้บริการ
- กรุงเทพมหานคร
- นนทบุรี
- ปทุมธานี
- สมุทรปราการ
- สมุทรสาคร
- นครปฐม

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture)

### Technology Stack

#### Frontend
- **Framework**: React Native 0.81.5 + Expo SDK 54
- **Language**: TypeScript 5.8
- **UI Library**: Custom React Native components
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
- **State Management**: React Context API
- **Icons**: @expo/vector-icons

#### Backend
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Storage**: Firebase Cloud Storage
- **Cloud Functions**: Firebase Cloud Functions (Node.js 18+)
- **Push Notifications**: Firebase Cloud Messaging (FCM)

#### Development Tools
- **Package Manager**: npm
- **Build System**: Expo
- **Type Checking**: TypeScript
- **Version Control**: Git/GitHub

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```
nursejob/
├── App.tsx                          # Entry point ของแอป
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Common components
│   │   │   ├── BackButton.tsx
│   │   │   ├── CalendarPicker.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── CustomAlert.tsx
│   │   │   ├── PlaceAutocomplete.tsx
│   │   │   ├── TermsConsentModal.tsx
│   │   │   └── index.tsx
│   │   ├── job/
│   │   │   └── JobCard.tsx          # แสดงการ์ดงาน
│   │   └── report/
│   │       └── ReportModal.tsx      # Modal รายงานปัญหา
│   │
│   ├── config/                      # Firebase configuration
│   │
│   ├── context/                     # React Context providers
│   │   ├── AuthContext.tsx          # การจัดการ Authentication
│   │   ├── NotificationContext.tsx  # การจัดการ Notifications
│   │   ├── ToastContext.tsx         # Toast messages
│   │   └── ChatNotificationContext.tsx
│   │
│   ├── navigation/                  # App navigation
│   │   └── AppNavigator.tsx         # Root navigator
│   │
│   ├── screens/                     # All screen components
│   │   ├── admin/                   # Admin screens (4 screens)
│   │   │   ├── AdminDashboardScreen.tsx
│   │   │   ├── AdminFeedbackScreen.tsx
│   │   │   ├── AdminReportsScreen.tsx
│   │   │   └── AdminVerificationScreen.tsx
│   │   ├── applicants/
│   │   │   └── ApplicantsScreen.tsx
│   │   ├── auth/                    # Authentication screens (7 screens)
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── PhoneLoginScreen.tsx
│   │   │   ├── EmailVerificationScreen.tsx
│   │   │   ├── OTPVerificationScreen.tsx
│   │   │   └── CompleteRegistrationScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatScreens.tsx      # Chat + ChatRoom
│   │   ├── documents/
│   │   │   └── DocumentsScreen.tsx
│   │   ├── favorites/
│   │   │   └── FavoritesScreen.tsx
│   │   ├── feedback/
│   │   │   └── FeedbackScreen.tsx
│   │   ├── help/
│   │   │   └── HelpScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx       # หน้าหลักแสดงรายการงาน
│   │   ├── job/
│   │   │   ├── JobDetailScreen.tsx
│   │   │   └── PostJobScreen.tsx
│   │   ├── legal/
│   │   │   ├── PrivacyScreen.tsx
│   │   │   └── TermsScreen.tsx
│   │   ├── myposts/
│   │   │   └── MyPostsScreen.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   ├── reviews/
│   │   │   └── ReviewsScreen.tsx
│   │   ├── settings/
│   │   │   └── SettingsScreen.tsx
│   │   ├── shop/
│   │   │   └── ShopScreen.tsx       # ร้านค้า/ซื้อบริการ
│   │   └── verification/
│   │       └── VerificationScreen.tsx
│   │
│   ├── services/                    # API & Firebase services (19 files)
│   │   ├── adminService.ts
│   │   ├── applicantsService.ts
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── documentsService.ts
│   │   ├── favoritesService.ts
│   │   ├── feedbackService.ts
│   │   ├── jobService.ts
│   │   ├── notificationService.ts
│   │   ├── notificationsService.ts
│   │   ├── otpService.ts
│   │   ├── placesService.ts
│   │   ├── pricingService.ts
│   │   ├── reportService.ts
│   │   ├── reviewsService.ts
│   │   ├── storageService.ts
│   │   ├── subscriptionService.ts
│   │   ├── verificationService.ts
│   │   └── index.ts
│   │
│   ├── theme/                       # Design tokens
│   │   └── index.ts                 # Colors, spacing, fonts
│   │
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── utils/                       # Helper functions
│       └── helpers.ts
│
├── functions/                       # Firebase Cloud Functions
│   ├── index.js                     # 10 Cloud Functions
│   └── package.json
│
├── assets/                          # Images and static files
├── firebase.json                    # Firebase configuration
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore indexes
├── storage.rules                    # Storage security rules
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript configuration
```

**สถิติโค้ด:**
- TypeScript files: 67 ไฟล์
- Screens: 32+ หน้าจอ
- Services: 19 ไฟล์
- Context Providers: 4 providers
- Cloud Functions: 10 functions

---

## 🎨 ฟีเจอร์หลักของระบบ (Main Features)

### 1. 👤 ระบบสมาชิก (Authentication & User Management)

#### การสมัครสมาชิก/เข้าสู่ระบบ
- **Email/Password**: ลงทะเบียนและเข้าสู่ระบบด้วยอีเมล
- **Phone Login**: เข้าสู่ระบบด้วยเบอร์โทรศัพท์
- **OTP Verification**: ยืนยันเบอร์โทรด้วย OTP
- **Email Verification**: ยืนยันอีเมลก่อนใช้งาน
- **Forgot Password**: รีเซ็ตรหัสผ่าน

#### ประเภทผู้ใช้
- **Nurse (พยาบาล)**: สามารถโพสต์หาคนแทนและรับงานแทน
- **Hospital (โรงพยาบาล)**: สามารถโพสต์หาพยาบาล
- **Admin**: จัดการระบบทั้งหมด

#### โปรไฟล์ผู้ใช้
- ข้อมูลส่วนตัว (ชื่อ, อีเมล, เบอร์โทร, รูปภาพ)
- หมายเลขใบอนุญาตพยาบาล
- ประสบการณ์, ทักษะ, การศึกษา, ใบรับรอง
- ที่อยู่ (จังหวัด, เขต)
- ความพร้อมในการทำงาน (กะที่สะดวก, วันที่สะดวก)
- คะแนนรีวิว
- สถานะการยืนยันตัวตน

### 2. 💼 ระบบหางาน/หาคนแทน (Job/Shift Posting & Search)

#### การโพสต์หาคนแทน
- **ชื่องาน**: หัวข้อของงาน
- **แผนก**: แผนกที่ต้องการพยาบาล
- **รายละเอียด**: คำอธิบายงาน
- **ค่าตอบแทน**: ระบุอัตราค่าแรง (ต่อชั่วโมง/วัน/กะ)
- **วันที่และเวลา**: วันที่ต้องการและช่วงเวลากะ
- **สถานที่**: จังหวัด, เขต, โรงพยาบาล, ที่อยู่
- **ติดต่อ**: เบอร์โทร, LINE ID
- **สถานะ**: active, closed, urgent
- **ปุ่มด่วน**: ไฮไลท์งานด่วน (มีค่าใช้จ่าย)

#### การค้นหางาน
- ค้นหาตามคำค้น
- กรองตามจังหวัด, เขต, แผนก
- กรองงานด่วนเท่านั้น
- เรียงตาม: ล่าสุด, กะดึก, กะเช้า, ใกล้ที่สุด, ค่าตอบแทนสูงสุด
- กรองตามช่วงค่าตอบแทน

#### การจัดการงานของตัวเอง (My Posts)
- ดูงานที่โพสต์ทั้งหมด
- แก้ไข/ลบงาน
- ปิดรับสมัคร
- ขยายเวลาโพสต์
- ดูผู้สนใจ (Applicants)

### 3. 💬 ระบบแชท (Chat System)

#### รายการแชท (Conversations)
- แสดงรายการสนทนาทั้งหมด
- แสดงข้อความล่าสุด
- นับจำนวนข้อความที่ยังไม่อ่าน
- ปักหมุดสนทนา (Pinned)
- เก็บถาวร (Archive)
- ซ่อนการสนทนา

#### ห้องแชท (Chat Room)
- ส่งข้อความแบบ real-time
- แนบไฟล์, รูปภาพ
- ตอบกลับข้อความ (Reply)
- แสดงสถานะอ่านแล้ว/ส่งแล้ว
- โหลดข้อความย้อนหลัง

### 4. 🔔 ระบบแจ้งเตือน (Notification System)

#### ประเภทการแจ้งเตือน
- **job_match**: งานที่เหมาะสม
- **application_update**: อัปเดตการสมัคร
- **new_message**: ข้อความใหม่
- **job_reminder**: เตือนเกี่ยวกับงาน
- **system**: แจ้งเตือนระบบ
- **promotion**: โปรโมชัน

#### Push Notifications
- Firebase Cloud Messaging (FCM)
- แจ้งเตือนแบบ real-time
- แจ้งเตือนแม้แอปปิดอยู่

### 5. ⭐ ระบบรีวิว (Review System)

- ให้คะแนนผู้ใช้งาน (1-5 ดาว)
- เขียนความคิดเห็น
- แท็กข้อความ
- ตอบกลับรีวิว

### 6. 📄 ระบบเอกสาร (Document Management)

- อัปโหลดเอกสาร (ใบอนุญาต, ใบรับรอง)
- จัดการเอกสารส่วนตัว
- Admin สามารถตรวจสอบเอกสาร

### 7. ✅ ระบบยืนยันตัวตน (Verification System)

#### สำหรับพยาบาล
- อัปโหลดรูปใบอนุญาตพยาบาล
- อัปโหลดบัตรประชาชน
- รอ Admin ตรวจสอบ
- ได้ Badge "Verified" เมื่อผ่านการตรวจสอบ

#### สำหรับ Admin
- ตรวจสอบใบอนุญาต
- อนุมัติ/ปฏิเสธคำขอ
- ดูประวัติการตรวจสอบ

### 8. 💳 ระบบร้านค้า/Subscription (Shop & Subscription)

#### แพ็คเกจสมาชิก

**Free Plan (ฟรี)**
- ค่าใช้จ่าย: ฟรี
- โพสต์ได้: 2 ครั้ง/วัน
- โพสต์อยู่: 3 วัน
- ปุ่มด่วน: ฿49/ครั้ง

**Premium Plan (พรีเมียม)**
- ค่าใช้จ่าย: ฿89/เดือน
- โพสต์ได้: ไม่จำกัด
- โพสต์อยู่: 30 วัน
- ปุ่มด่วน: แถมฟรี 1 ครั้ง
- ไม่มีโฆษณา

#### บริการเสริม
- **ขยายเวลาโพสต์**: ฿19/วัน
- **โพสต์พิเศษ** (เกินโควต้า): ฿19/ครั้ง
- **ปุ่มด่วน**: ฿49/ครั้ง (ทำให้โพสต์โดดเด่น)

### 9. 👨‍💼 ระบบ Admin (Admin Dashboard)

#### Dashboard
- สถิติผู้ใช้งาน
- สถิติงาน
- รายได้
- กราฟต่างๆ

#### การจัดการ
- **ตรวจสอบใบอนุญาต**: อนุมัติ/ปฏิเสธการยืนยันตัวตน
- **รายงาน**: ดูรายงานที่ผู้ใช้แจ้ง
- **Feedback**: ดูความคิดเห็น/คำแนะนำจากผู้ใช้
- **จัดการผู้ใช้**: ดู, แก้ไข, ลบผู้ใช้
- **จัดการงาน**: ดู, ปิด, ลบงาน

### 10. 📱 ฟีเจอร์เสริมอื่นๆ

- **Favorites**: บันทึกงานที่สนใจ
- **Help & FAQ**: คำถามที่พบบ่อย
- **Settings**: ตั้งค่าแอป, การแจ้งเตือน
- **Terms & Privacy**: เงื่อนไขและนโยบาย
- **Feedback**: ส่งความคิดเห็น/รายงานปัญหา
- **Report**: รายงานโพสต์ที่ไม่เหมาะสม

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

### Firestore Collections

#### 1. `users` - ข้อมูลผู้ใช้
```typescript
{
  id: string,
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  phone?: string,
  role: 'nurse' | 'hospital' | 'admin',
  licenseNumber?: string,
  licenseVerified?: boolean,
  experience?: number,
  skills?: string[],
  education?: string[],
  certifications?: string[],
  bio?: string,
  location?: {
    province: string,
    district: string
  },
  availability?: {
    isAvailable: boolean,
    preferredShifts: string[],
    preferredDays: string[]
  },
  ratings?: {
    average: number,
    count: number
  },
  completedJobs?: number,
  isVerified?: boolean,
  isActive?: boolean,
  isAdmin?: boolean,
  settings?: {
    notifications: boolean,
    emailNotifications: boolean,
    jobAlerts: boolean
  },
  subscription?: {
    plan: 'free' | 'premium',
    expiresAt?: Date,
    startedAt?: Date,
    postsToday?: number,
    lastPostDate?: string,
    freeUrgentUsed?: boolean
  },
  fcmToken?: string,
  createdAt: Date,
  updatedAt?: Date,
  lastActiveAt?: Date
}
```

#### 2. `shifts` - งาน/กะ (โพสต์หาคนแทน)
```typescript
{
  id: string,
  title: string,
  posterName: string,
  posterId: string,
  posterPhoto?: string,
  posterVerified?: boolean,
  department: string,
  description?: string,
  requirements?: string[],
  shiftRate: number,
  rateType: 'hour' | 'day' | 'shift',
  shiftDate: Date,
  shiftTime: string,
  location?: {
    province: string,
    district?: string,
    hospital?: string,
    address?: string
  },
  contactPhone?: string,
  contactLine?: string,
  status: 'active' | 'closed' | 'urgent',
  viewsCount?: number,
  tags?: string[],
  createdAt: Date,
  updatedAt?: Date,
  expiresAt?: Date
}
```

#### 3. `shift_contacts` - การแสดงความสนใจงาน
```typescript
{
  id: string,
  jobId: string,
  interestedUserId: string,
  interestedUserName?: string,
  interestedUserPhone?: string,
  posterId: string,
  message?: string,
  status: 'interested' | 'confirmed' | 'cancelled',
  contactedAt: Date,
  notes?: string
}
```

#### 4. `conversations` - การสนทนา
```typescript
{
  id: string,
  participants: string[],
  participantDetails?: {
    id: string,
    name?: string,
    displayName?: string,
    photoURL?: string
  }[],
  jobId?: string,
  jobTitle?: string,
  hospitalName?: string,
  lastMessage?: string,
  lastMessageAt?: Date,
  lastMessageSenderId?: string,
  unreadBy?: { [userId: string]: number },
  isArchived?: boolean,
  isPinned?: boolean,
  hiddenBy?: string[],
  createdAt: Date
}
```

#### 5. `messages` - ข้อความ
```typescript
{
  id: string,
  conversationId: string,
  senderId: string,
  senderName?: string,
  senderPhoto?: string,
  text: string,
  type?: 'text' | 'image' | 'file' | 'location' | 'system',
  attachmentUrl?: string,
  attachmentName?: string,
  isRead?: boolean,
  readBy?: string[],
  deliveredTo?: string[],
  isDeleted?: boolean,
  replyTo?: {
    messageId: string,
    text: string,
    senderName: string
  },
  createdAt: Date
}
```

#### 6. `favorites` - งานที่บันทึก
```typescript
{
  id: string,
  userId: string,
  jobId: string,
  job?: JobPost,
  createdAt: Date
}
```

#### 7. `notifications` - การแจ้งเตือน
```typescript
{
  id: string,
  userId: string,
  type: 'job_match' | 'application_update' | 'new_message' | 'job_reminder' | 'system' | 'promotion',
  title: string,
  body: string,
  data?: {
    jobId?: string,
    applicationId?: string,
    conversationId?: string,
    url?: string
  },
  read: boolean,
  createdAt: Date
}
```

#### 8. `documents` - เอกสาร
```typescript
{
  id: string,
  userId: string,
  type: string,
  name: string,
  url: string,
  status: 'pending' | 'approved' | 'rejected',
  uploadedAt: Date,
  verifiedAt?: Date,
  verifiedBy?: string
}
```

#### 9. `reviews` - รีวิว
```typescript
{
  id: string,
  reviewerId: string,
  reviewerName: string,
  reviewerPhoto?: string,
  revieweeId: string,
  jobId: string,
  rating: number,
  comment?: string,
  tags?: string[],
  response?: {
    text: string,
    createdAt: Date
  },
  createdAt: Date
}
```

#### 10. `hospitals` - โรงพยาบาล (ข้อมูลสาธารณะ)
```typescript
{
  id: string,
  name: string,
  province: string,
  district: string,
  address: string,
  phone?: string,
  website?: string
}
```

#### 11. `userPlans` - แพ็คเกจผู้ใช้
```typescript
{
  id: string,
  userId: string,
  planType: 'free' | 'premium',
  isActive: boolean,
  dailyPostLimit: number,
  postsToday: number,
  extraPosts: number,
  totalSpent: number,
  subscriptionEnd?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 12. `purchases` - ประวัติการซื้อ
```typescript
{
  id: string,
  userId: string,
  type: 'subscription' | 'extend_post' | 'extra_post' | 'urgent_post',
  amount: number,
  status: 'pending' | 'completed' | 'cancelled',
  createdAt: Date
}
```

#### 13. `reports` - รายงานต่างๆ
```typescript
{
  id: string,
  reporterId: string,
  type: 'user' | 'job' | 'system',
  targetId: string,
  reason: string,
  description?: string,
  status: 'pending' | 'reviewed' | 'resolved',
  createdAt: Date
}
```

#### 14. `feedbacks` - ข้อเสนอแนะ
```typescript
{
  id: string,
  userId: string,
  type: 'bug' | 'feature' | 'improvement' | 'other',
  message: string,
  status: 'new' | 'reviewing' | 'done',
  createdAt: Date
}
```

---

## ⚡ Firebase Cloud Functions (Automation)

### 10 Cloud Functions ที่มีในระบบ

#### 1. `expireOldJobs` - ทำงานทุก 6 ชั่วโมง
- ปิดงานที่หมดอายุอัตโนมัติ
- ตรวจสอบงานที่สร้างเกิน 48 ชั่วโมง
- ข้ามงานที่ขยายเวลาแล้ว

#### 2. `onNewApplication` - Trigger เมื่อมีคนสนใจงาน
- ส่ง push notification ให้เจ้าของโพสต์
- สร้าง in-app notification

#### 3. `resetDailyLimits` - ทำงานเที่ยงคืนทุกวัน
- รีเซ็ตโควต้าโพสต์ประจำวัน
- อัปเดตข้อมูลใน userPlans

#### 4. `onNewMessage` - Trigger เมื่อมีข้อความใหม่
- ส่ง push notification ให้ผู้รับ
- สร้าง in-app notification

#### 5. `checkSubscriptionExpiry` - ทำงานทุก 6 ชั่วโมง
- ตรวจสอบ Premium ที่หมดอายุ
- ลด plan เป็น Free อัตโนมัติ
- แจ้งเตือนผู้ใช้

#### 6. `autoCloseFilledJobs` - ทำงานทุก 12 ชั่วโมง
- ปิดงานที่ได้คนครบแล้วอัตโนมัติ

#### 7. `weeklyStatsReport` - ทำงานทุกวันจันทร์ 9:00 น.
- สร้างรายงานสถิติประจำสัปดาห์
- นับผู้ใช้ใหม่, งานใหม่, รายได้
- แจ้ง Admin

#### 8. `cleanupOldNotifications` - ทำงานทุกวันอาทิตย์ 3:00 น.
- ลบการแจ้งเตือนเก่า (30+ วัน)

#### 9. `onUserCreate` - Trigger เมื่อมีผู้ใช้ใหม่
- ส่งการแจ้งเตือนต้อนรับ
- สร้าง default user plan (Free)

#### 10. `notifyJobExpiringSoon` - ทำงานทุก 3 ชั่วโมง
- แจ้งเตือนก่อนงานหมดอายุ 6 ชั่วโมง
- แนะนำให้ขยายเวลาหรือปิดรับสมัคร

---

## 🔒 ระบบความปลอดภัย (Security)

### Firestore Security Rules

#### Users Collection
- ทุกคนอ่านได้เมื่อเข้าสู่ระบบ
- แก้ไขได้เฉพาะเจ้าของหรือ Admin
- ลบได้เฉพาะ Admin

#### Shifts Collection
- ทุกคนอ่านได้ (public)
- สร้างได้เมื่อเข้าสู่ระบบ
- แก้ไข/ลบได้เฉพาะเจ้าของหรือ Admin

#### Shift Contacts
- อ่านได้เมื่อเข้าสู่ระบบ
- สร้างได้เมื่อเข้าสู่ระบบ
- แก้ไข/ลบได้เฉพาะผู้เกี่ยวข้อง

#### Conversations & Messages
- อ่านได้เฉพาะผู้เข้าร่วมสนทนา
- แก้ไขได้เฉพาะผู้ส่ง

#### Favorites, Notifications, Documents
- อ่าน/แก้ไข/ลบได้เฉพาะเจ้าของ

#### Reviews
- อ่านได้ทุกคน (public)
- สร้างได้เมื่อเข้าสู่ระบบ
- แก้ไข/ลบได้เฉพาะเจ้าของหรือ Admin

#### Hospitals
- อ่านได้ทุกคน (public data)
- เขียนได้เฉพาะ Admin

### Storage Security Rules
- อ่าน/เขียนได้เมื่อเข้าสู่ระบบเท่านั้น

---

## 📲 Navigation Structure

### Auth Stack
- Login
- Register
- ForgotPassword
- PhoneLogin
- EmailVerification
- OTPVerification
- CompleteRegistration
- Terms
- Privacy

### Main Stack (Bottom Tabs)
- **Home**: หน้าหลัก (รายการงาน)
- **PostJob**: โพสต์หาคนแทน
- **Chat**: แชท
- **Profile**: โปรไฟล์

### Other Screens (Stack Navigation)
- JobDetail
- ChatRoom
- EditProfile
- Applications
- Settings
- Notifications
- Favorites
- MyPosts
- Shop
- Documents
- Applicants
- Reviews
- Help
- Terms
- Privacy
- Verification
- AdminDashboard
- AdminVerification
- AdminReports
- AdminFeedback
- Feedback

---

## 🎨 UI/UX Design System

### Theme
- **Primary Color**: #4A90D9 (น้ำเงิน)
- **Typography**: System fonts
- **Components**: Custom React Native components
- **Icons**: @expo/vector-icons

### Common Components
- BackButton
- CalendarPicker
- ConfirmModal
- CustomAlert
- PlaceAutocomplete
- TermsConsentModal
- JobCard
- ReportModal

---

## 📦 Dependencies Summary

### Main Dependencies (17 packages)
- `expo` ~54.0.0
- `react` 19.1.0
- `react-native` 0.81.5
- `firebase` ^12.7.0
- `@react-navigation/native` ^7.1.26
- `@react-navigation/native-stack` ^7.9.0
- `@react-navigation/bottom-tabs` ^7.9.0
- `@expo/vector-icons` ^15.0.3
- `react-native-safe-area-context` ^5.6.2
- `react-native-gesture-handler` ~2.28.0
- `react-native-screens` ~4.16.0
- `@react-native-async-storage/async-storage` ^2.2.0
- `@react-native-community/datetimepicker` ^8.4.4
- `expo-notifications` ^0.32.15
- `expo-image-picker` ~17.0.10
- `expo-document-picker` ~14.0.8
- และอื่นๆ

### Dev Dependencies (3 packages)
- `typescript` ~5.8.0
- `@types/react` ^19.2.7
- `@babel/core` ^7.25.2

---

## 🚀 Scripts & Commands

### Development
```bash
npm start                 # Start Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web
npx expo start --clear   # Start with cache cleared
npx expo start --tunnel  # Start with tunnel (remote testing)
```

### Type Checking
```bash
npx tsc --noEmit         # Type check without emitting
```

### Firebase Functions
```bash
cd functions
npm install
npm run serve            # Run locally
npm run deploy           # Deploy to Firebase
npm run logs             # View logs
```

---

## 💰 Business Model & Monetization

### Subscription Plans
1. **Free Plan**: โพสต์ได้ 2 ครั้ง/วัน, โพสต์อยู่ 3 วัน
2. **Premium Plan**: ฿89/เดือน - โพสต์ไม่จำกัด, โพสต์อยู่ 30 วัน

### Additional Services
- Extend Post: ฿19/วัน
- Extra Post: ฿19/ครั้ง
- Urgent Post: ฿49/ครั้ง

### Revenue Streams
- Monthly subscriptions
- In-app purchases (extend, extra, urgent)
- Potential advertising (for free users)

---

## 🎯 Target Users

### Primary Users
- **พยาบาลที่ต้องการหาคนแทน**: พยาบาลที่มีธุระไม่สามารถมาทำงานได้
- **พยาบาลที่ต้องการรับงานเสริม**: พยาบาลที่ต้องการหารายได้เพิ่มเติม

### Secondary Users
- **โรงพยาบาล/คลินิก**: สถานพยาบาลที่ต้องการหาพยาบาลชั่วคราว
- **Admin**: ผู้ดูแลระบบ

---

## 📊 Key Metrics & Analytics

### User Metrics
- จำนวนผู้ใช้ทั้งหมด
- ผู้ใช้ใหม่ต่อสัปดาห์
- ผู้ใช้ active
- จำนวนผู้ใช้ Premium

### Job Metrics
- งานที่โพสต์ทั้งหมด
- งานใหม่ต่อสัปดาห์
- งานที่ปิดแล้ว
- อัตราการได้งาน (fill rate)

### Revenue Metrics
- รายได้รวม
- รายได้ต่อเดือน
- จำนวน subscription
- จำนวน in-app purchases

### Engagement Metrics
- จำนวนข้อความ
- จำนวนการแสดงความสนใจ
- จำนวนรีวิว
- เวลาเฉลี่ยในแอป

---

## ⚙️ Configuration Files

### `firebase.json`
- Firestore rules and indexes
- Cloud Functions configuration
- Storage rules
- Emulators setup

### `app.json` (Expo)
- App name: NurseJob
- Slug: nurse-job-app
- Version: 1.0.0
- Platform configs (iOS, Android, Web)
- Plugins: expo-web-browser

### `tsconfig.json`
- TypeScript configuration
- Strict mode enabled

### `package.json`
- Project name: nurse-job-app
- Version: 1.0.0
- Scripts: start, android, ios, web

---

## 🌟 Key Features Summary

✅ **User Management**: Authentication, profiles, verification
✅ **Job Posting**: Post shift substitution requests
✅ **Job Search**: Search and filter jobs
✅ **Real-time Chat**: Message between users
✅ **Notifications**: Push and in-app notifications
✅ **Reviews**: Rating and feedback system
✅ **Documents**: Upload and verify documents
✅ **Subscription**: Free and Premium plans
✅ **Shop**: In-app purchases
✅ **Admin**: Complete admin dashboard
✅ **Automation**: 10 Cloud Functions for automation
✅ **Security**: Comprehensive Firestore security rules

---

## 🔮 Future Enhancements (ถ้ามีการพัฒนาเพิ่มเติม)

Potential features that could be added:
- Payment gateway integration
- Advanced analytics dashboard
- Job recommendations (ML-based)
- Video call integration
- Calendar integration
- Multiple language support
- Dark mode
- Job history and statistics
- Referral system
- Badge system
- Training/education content

---

## 📝 Notes

### ข้อมูลสำคัญ
- ระบบนี้ออกแบบมาสำหรับพื้นที่กรุงเทพฯและปริมณฑล
- ใช้ Firebase เป็น Backend แบบ Serverless
- รองรับทั้ง iOS และ Android ผ่าน React Native
- มีระบบ Automation ที่ทำงานอัตโนมัติ
- มี Security rules ที่ครอบคลุม

### การใช้งาน
- ผู้ใช้ต้องยืนยันอีเมลก่อนใช้งาน
- พยาบาลควรยืนยันตัวตนเพื่อเพิ่มความน่าเชื่อถือ
- Free users มีข้อจำกัดในการโพสต์
- Premium users ได้สิทธิพิเศษมากกว่า

### เทคนิค
- ใช้ TypeScript เพื่อความปลอดภัยในการพัฒนา
- ใช้ React Context API แทน Redux
- Cloud Functions ช่วยลดภาระของ Client
- Real-time updates ทำให้ UX ดีขึ้น

---

## 📞 Contact & Support

- **Developer**: s6752410009
- **GitHub**: https://github.com/s6752410009/nursejob
- **Project Purpose**: Educational

---

**สร้างเอกสารนี้เมื่อ**: 3 มกราคม 2026  
**จำนวนหน้า**: สรุประบบฉบับเต็ม  
**สถานะ**: Production Ready

---

เอกสารนี้รวบรวมข้อมูลทั้งหมดของระบบ NurseShift เพื่อให้สามารถนำไปวิเคราะห์และพัฒนาต่อได้ง่ายขึ้น 🚀
