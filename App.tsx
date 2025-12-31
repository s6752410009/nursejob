import React, { useState, createContext, useContext, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// TYPES
// ============================================
interface JobPost {
  id: string;
  hospitalName: string;
  hospitalLogo?: string;
  position: string;
  department: string;
  location: string;
  district: string;
  province: string;
  salary: {
    min: number;
    max: number;
    unit: 'hour' | 'day' | 'month';
  };
  workDate: string;
  workTime: {
    start: string;
    end: string;
  };
  requirements: string[];
  benefits: string[];
  description: string;
  contactPhone?: string;
  contactLine?: string;
  postedAt: Date;
  isUrgent: boolean;
  applicantsCount: number;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'nurse' | 'hospital' | 'admin';
  createdAt: Date;
}

// ============================================
// THEME & CONSTANTS
// ============================================
const COLORS = {
  primary: '#4A90D9',
  primaryDark: '#2E6CB5',
  primaryLight: '#7AB5E8',
  secondary: '#5BC0BE',
  accent: '#FF6B6B',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  urgent: '#FF4757',
  verified: '#2ED573',
};

const { width } = Dimensions.get('window');

// ============================================
// AUTH CONTEXT
// ============================================
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    setUser({
      id: '1',
      email,
      displayName: email.split('@')[0],
      role: 'nurse',
      createdAt: new Date(),
    });
  };

  const loginWithGoogle = () => {
    setUser({
      id: '1',
      email: 'user@gmail.com',
      displayName: 'Google User',
      photoURL: 'https://via.placeholder.com/100',
      role: 'nurse',
      createdAt: new Date(),
    });
  };

  const logout = () => setUser(null);

  const register = (email: string, password: string, displayName: string) => {
    setUser({
      id: '1',
      email,
      displayName,
      role: 'nurse',
      createdAt: new Date(),
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// ============================================
// MOCK DATA
// ============================================
const MOCK_JOBS: JobPost[] = [
  {
    id: '1',
    hospitalName: 'โรงพยาบาลกรุงเทพ',
    position: 'พยาบาลวิชาชีพ',
    department: 'แผนก ICU',
    location: 'ซอยศูนย์วิจัย',
    district: 'ห้วยขวาง',
    province: 'กรุงเทพมหานคร',
    salary: { min: 800, max: 1200, unit: 'hour' },
    workDate: '5 ม.ค. 2568',
    workTime: { start: '07:00', end: '15:00' },
    requirements: ['มีใบประกอบวิชาชีพ', 'ประสบการณ์ 2 ปีขึ้นไป'],
    benefits: ['ค่าเดินทาง', 'อาหารกลางวัน'],
    description: 'ต้องการพยาบาลดูแลผู้ป่วยหนักในแผนก ICU',
    contactPhone: '02-xxx-xxxx',
    contactLine: '@hospital',
    postedAt: new Date(),
    isUrgent: true,
    applicantsCount: 5,
  },
  {
    id: '2',
    hospitalName: 'โรงพยาบาลพญาไท',
    position: 'พยาบาลทั่วไป',
    department: 'แผนกผู้ป่วยใน',
    location: 'ถนนพญาไท',
    district: 'ราชเทวี',
    province: 'กรุงเทพมหานคร',
    salary: { min: 600, max: 800, unit: 'hour' },
    workDate: '6-7 ม.ค. 2568',
    workTime: { start: '15:00', end: '23:00' },
    requirements: ['มีใบประกอบวิชาชีพ'],
    benefits: ['ค่าเดินทาง'],
    description: 'ดูแลผู้ป่วยทั่วไปในวอร์ด',
    contactPhone: '02-xxx-xxxx',
    postedAt: new Date(),
    isUrgent: false,
    applicantsCount: 12,
  },
  {
    id: '3',
    hospitalName: 'คลินิกสุขภาพดี',
    position: 'พยาบาลประจำคลินิก',
    department: 'คลินิกทั่วไป',
    location: 'ซอยสุขุมวิท 55',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    salary: { min: 15000, max: 20000, unit: 'month' },
    workDate: 'จ-ศ',
    workTime: { start: '09:00', end: '17:00' },
    requirements: ['มีใบประกอบวิชาชีพ', 'สื่อสารภาษาอังกฤษได้'],
    benefits: ['ประกันสังคม', 'โบนัส'],
    description: 'งานประจำดูแลคลินิก ตรวจสุขภาพเบื้องต้น',
    contactLine: '@clinic',
    postedAt: new Date(),
    isUrgent: false,
    applicantsCount: 8,
  },
  {
    id: '4',
    hospitalName: 'โรงพยาบาลรามา',
    position: 'พยาบาลห้องผ่าตัด',
    department: 'ห้องผ่าตัด',
    location: 'ถนนพระราม 6',
    district: 'ราชเทวี',
    province: 'กรุงเทพมหานคร',
    salary: { min: 1000, max: 1500, unit: 'hour' },
    workDate: '8 ม.ค. 2568',
    workTime: { start: '08:00', end: '16:00' },
    requirements: ['มีใบประกอบวิชาชีพ', 'ประสบการณ์ห้องผ่าตัด 3 ปี'],
    benefits: ['ค่าเดินทาง', 'อาหาร', 'ค่าเสี่ยงภัย'],
    description: 'ช่วยผ่าตัดศัลยกรรมทั่วไป',
    contactPhone: '02-xxx-xxxx',
    postedAt: new Date(),
    isUrgent: true,
    applicantsCount: 3,
  },
];

// ============================================
// COMPONENTS
// ============================================

// Job Card Component
function JobCard({ job, onPress }: { job: JobPost; onPress: () => void }) {
  const formatSalary = () => {
    const { min, max, unit } = job.salary;
    const unitText = unit === 'hour' ? 'ชม.' : unit === 'day' ? 'วัน' : 'เดือน';
    return `${min.toLocaleString()}-${max.toLocaleString()} บาท/${unitText}`;
  };

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.7}>
      {job.isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>ด่วน!</Text>
        </View>
      )}
      
      <View style={styles.jobCardHeader}>
        <View style={styles.hospitalLogo}>
          <Ionicons name="business" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.jobCardHeaderText}>
          <Text style={styles.hospitalName}>{job.hospitalName}</Text>
          <Text style={styles.jobPosition}>{job.position}</Text>
        </View>
      </View>

      <View style={styles.jobCardBody}>
        <View style={styles.jobInfoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.jobInfoText}>{job.district}, {job.province}</Text>
        </View>
        <View style={styles.jobInfoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.jobInfoText}>{job.workDate} | {job.workTime.start}-{job.workTime.end}</Text>
        </View>
        <View style={styles.jobInfoRow}>
          <Ionicons name="cash-outline" size={16} color={COLORS.success} />
          <Text style={[styles.jobInfoText, { color: COLORS.success, fontWeight: '600' }]}>{formatSalary()}</Text>
        </View>
      </View>

      <View style={styles.jobCardFooter}>
        <Text style={styles.applicantsText}>
          <Ionicons name="people-outline" size={14} /> {job.applicantsCount} คนสมัครแล้ว
        </Text>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyButtonText}>สมัครเลย</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// SCREENS
// ============================================

// Login Screen
function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView contentContainerStyle={styles.authContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="medical" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.appTitle}>NurseJob</Text>
          <Text style={styles.appSubtitle}>แอพหางาน Part-time สำหรับพยาบาล</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>อีเมล</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>รหัสผ่าน</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>ลืมรหัสผ่าน?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={() => login(email, password)}>
            <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>หรือ</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={loginWithGoogle}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>เข้าสู่ระบบด้วย Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Home Screen
function HomeScreen({ onJobPress, onTabChange }: { onJobPress: (job: JobPost) => void; onTabChange: (tab: string) => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>สวัสดี, {user?.displayName || 'คุณพยาบาล'} 👋</Text>
          <Text style={styles.subGreeting}>หางานที่ใช่สำหรับคุณวันนี้</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => onTabChange('notifications')}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหางาน, โรงพยาบาล..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
        {['ทั้งหมด', 'ด่วน', 'ใกล้ฉัน', 'ICU', 'ห้องผ่าตัด', 'ผู้ป่วยใน'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, index === 0 && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, index === 0 && styles.filterChipTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Job List */}
      <FlatList
        data={MOCK_JOBS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} onPress={() => onJobPress(item)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.jobList}
      />
    </View>
  );
}

// Job Detail Screen
function JobDetailScreen({ job, onBack }: { job: JobPost; onBack: () => void }) {
  const formatSalary = () => {
    const { min, max, unit } = job.salary;
    const unitText = unit === 'hour' ? 'ชม.' : unit === 'day' ? 'วัน' : 'เดือน';
    return `${min.toLocaleString()}-${max.toLocaleString()} บาท/${unitText}`;
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>รายละเอียดงาน</Text>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailContent}>
        <View style={styles.detailCard}>
          <View style={styles.detailHospitalHeader}>
            <View style={styles.hospitalLogoLarge}>
              <Ionicons name="business" size={40} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.detailHospitalName}>{job.hospitalName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />
                <Text style={styles.verifiedText}>ยืนยันแล้ว</Text>
              </View>
            </View>
          </View>

          {job.isUrgent && (
            <View style={styles.urgentBanner}>
              <Ionicons name="flash" size={16} color={COLORS.textInverse} />
              <Text style={styles.urgentBannerText}>ต้องการด่วน!</Text>
            </View>
          )}

          <Text style={styles.detailPosition}>{job.position}</Text>
          <Text style={styles.detailDepartment}>{job.department}</Text>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>ข้อมูลงาน</Text>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.detailRowText}>{job.location}, {job.district}, {job.province}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.detailRowText}>{job.workDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.detailRowText}>{job.workTime.start} - {job.workTime.end}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={18} color={COLORS.success} />
              <Text style={[styles.detailRowText, { color: COLORS.success, fontWeight: 'bold' }]}>{formatSalary()}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>รายละเอียด</Text>
            <Text style={styles.detailDescription}>{job.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>คุณสมบัติ</Text>
            {job.requirements.map((req, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{req}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>สวัสดิการ</Text>
            {job.benefits.map((benefit, index) => (
              <View key={index} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.bulletText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>ช่องทางติดต่อ</Text>
            {job.contactPhone && (
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                <Text style={styles.contactButtonText}>{job.contactPhone}</Text>
              </TouchableOpacity>
            )}
            {job.contactLine && (
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#00B900" />
                <Text style={styles.contactButtonText}>LINE: {job.contactLine}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.detailFooter}>
        <TouchableOpacity style={styles.applyFullButton}>
          <Text style={styles.applyFullButtonText}>สมัครงานนี้</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Search Screen
function SearchScreen() {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>ค้นหางาน</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.searchInput} placeholder="ค้นหางาน, โรงพยาบาล, สถานที่..." />
        </View>
      </View>
      <View style={styles.emptyState}>
        <Ionicons name="search" size={60} color={COLORS.textLight} />
        <Text style={styles.emptyStateText}>ค้นหางานที่คุณต้องการ</Text>
      </View>
    </View>
  );
}

// Notifications Screen
function NotificationsScreen() {
  const notifications = [
    { id: '1', title: 'งานใหม่ที่ตรงกับคุณ!', message: 'โรงพยาบาลกรุงเทพ ต้องการพยาบาล ICU', time: '5 นาทีที่แล้ว', read: false },
    { id: '2', title: 'สมัครงานสำเร็จ', message: 'คุณสมัครงานที่โรงพยาบาลพญาไทเรียบร้อย', time: '1 ชั่วโมงที่แล้ว', read: false },
    { id: '3', title: 'อัพเดทโปรไฟล์', message: 'อย่าลืมเพิ่มใบประกอบวิชาชีพของคุณ', time: '1 วันที่แล้ว', read: true },
  ];

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>การแจ้งเตือน</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.notificationItem, !item.read && styles.notificationUnread]}>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Profile Screen
function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.screenContainer}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>โปรไฟล์</Text>
      </View>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color={COLORS.textSecondary} />
            )}
          </View>
          <Text style={styles.profileName}>{user?.displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          {[
            { icon: 'document-text-outline', label: 'ประวัติการสมัครงาน' },
            { icon: 'bookmark-outline', label: 'งานที่บันทึกไว้' },
            { icon: 'card-outline', label: 'ใบประกอบวิชาชีพ' },
            { icon: 'settings-outline', label: 'ตั้งค่า' },
            { icon: 'help-circle-outline', label: 'ช่วยเหลือ' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Ionicons name={item.icon as any} size={24} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Tab Navigation
function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { key: 'home', icon: 'home', label: 'หน้าแรก' },
    { key: 'search', icon: 'search', label: 'ค้นหา' },
    { key: 'notifications', icon: 'notifications', label: 'แจ้งเตือน' },
    { key: 'profile', icon: 'person', label: 'โปรไฟล์' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          onPress={() => onTabChange(tab.key)}
        >
          <Ionicons
            name={(activeTab === tab.key ? tab.icon : `${tab.icon}-outline`) as any}
            size={24}
            color={activeTab === tab.key ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Main App Navigator
function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);

  if (selectedJob) {
    return <JobDetailScreen job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {activeTab === 'home' && <HomeScreen onJobPress={setSelectedJob} onTabChange={setActiveTab} />}
      {activeTab === 'search' && <SearchScreen />}
      {activeTab === 'notifications' && <NotificationsScreen />}
      {activeTab === 'profile' && <ProfileScreen />}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainApp /> : <LoginScreen />;
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Auth Styles
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  authContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  forgotPassword: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'right',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  
  // Home Header
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filterButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Quick Filters
  quickFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  
  // Job List
  jobList: {
    padding: 16,
  },
  
  // Job Card
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.urgent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hospitalLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobCardHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  jobPosition: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  jobCardBody: {
    marginBottom: 12,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 12,
  },
  applicantsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Screen Header
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  
  // Detail Screen
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 4,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  detailHospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalLogoLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailHospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.verified,
    marginLeft: 4,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.urgent,
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  urgentBannerText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailPosition: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailDepartment: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRowText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  detailFooter: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyFullButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFullButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  
  // Notifications
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  notificationUnread: {
    backgroundColor: COLORS.primaryLight + '15',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  
  // Profile
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  editProfileButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editProfileButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
  },
  logoutButtonText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 8,
    fontWeight: '600',
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
