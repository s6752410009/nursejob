# 🏥 NurseGo - แพลตฟอร์มหางานพยาบาล

แอปพลิเคชันสำหรับพยาบาลในการประกาศหาคนแทนงานกะ และรับงานแทนกันในพื้นที่กรุงเทพฯ และปริมณฑล

![React Native](https://img.shields.io/badge/React_Native-0.79.2-blue)
![Expo](https://img.shields.io/badge/Expo-SDK_54-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange)

## 📱 Screenshots

| หน้าหลัก | รายละเอียดงาน | ประกาศหาคนแทน |
|:---:|:---:|:---:|
| หน้าแสดงรายการงาน | แสดงรายละเอียดและติดต่อ | ฟอร์มลงประกาศ |

## ✨ Features

### สำหรับผู้ต้องการหาคนแทน
- 📝 ลงประกาศหาคนแทนงานกะ
- 💰 กำหนดค่าตอบแทน (ต่อชั่วโมง/วัน/กะ)
- 📅 ระบุวันที่และช่วงเวลา (กะเช้า/บ่าย/ดึก)
- 👥 ดูรายชื่อผู้สนใจและติดต่อกลับ

### สำหรับผู้ต้องการรับงาน
- 🔍 ค้นหางานตามพื้นที่และแผนก
- 🔔 กรองงานด่วน หรือตามช่วงเวลา
- 💾 บันทึกงานที่สนใจ
- 📞 ติดต่อผู้ประกาศโดยตรง (โทร/LINE)

### ฟีเจอร์ทั่วไป
- 🔐 ระบบสมาชิก (Email/Password)
- 👤 โปรไฟล์พยาบาล
- 💬 ระบบแชท
- 🔔 แจ้งเตือน
- ⚙️ ตั้งค่าต่างๆ

## 🗺️ พื้นที่ให้บริการ

- กรุงเทพมหานคร
- นนทบุรี
- ปทุมธานี
- สมุทรปราการ
- สมุทรสาคร
- นครปฐม

## 🛠️ Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **Navigation:** React Navigation 7
- **Backend:** Firebase (Auth, Firestore, Storage)
- **State Management:** React Context
- **UI Components:** Custom components

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Button, Input, Avatar, etc.
│   └── job/            # JobCard component
├── config/             # Firebase configuration
├── context/            # React Context (Auth)
├── navigation/         # App Navigator
├── screens/            # All screens
│   ├── auth/           # Login, Register, ForgotPassword
│   ├── home/           # Home screen with job list
│   ├── job/            # PostJob, JobDetail
│   ├── chat/           # Chat screens
│   ├── profile/        # User profile
│   ├── favorites/      # Saved jobs
│   ├── applicants/     # Manage interested users
│   ├── settings/       # App settings
│   ├── notifications/  # Notifications
│   ├── documents/      # Document management
│   ├── reviews/        # Reviews
│   ├── help/           # Help & FAQ
│   └── legal/          # Terms & Privacy
├── services/           # API & Firebase services
├── theme/              # Colors, spacing, fonts
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Expo Go app (for mobile testing)

### Installation

1. Clone the repository
```bash
git clone https://github.com/s6752410009/nursejob.git
cd nursejob
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npx expo start
```

4. Run on device/emulator
- **Mobile:** Scan QR code with Expo Go
- **Web:** Press `w` or open http://localhost:8081
- **Android Emulator:** Press `a`
- **iOS Simulator:** Press `i`

### Environment Setup

Create Firebase project and update `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 📦 Dependencies

### Main Dependencies
- `expo` - Development platform
- `react-native` - Mobile framework
- `@react-navigation/native` - Navigation
- `firebase` - Backend services
- `react-native-safe-area-context` - Safe area handling
- `@expo/vector-icons` - Icons

### Dev Dependencies
- `typescript` - Type checking
- `@types/react` - React types

## 🔧 Scripts

```bash
# Start development server
npm start

# Start with cache cleared
npx expo start --clear

# Start with tunnel (for remote testing)
npx expo start --tunnel

# Type check
npx tsc --noEmit

# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios
```

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

- **Student ID:** s6752410009
- **GitHub:** [@s6752410009](https://github.com/s6752410009)

---

⭐ ถ้าชอบโปรเจคนี้ อย่าลืมกด Star ให้ด้วยนะครับ!