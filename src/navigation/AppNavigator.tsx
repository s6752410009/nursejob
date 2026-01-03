// ============================================
// APP NAVIGATOR - Production Ready
// ============================================

import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Context
import { useAuth } from '../context/AuthContext';
import { ChatNotificationProvider, useChatNotification } from '../context/ChatNotificationContext';

// Types
import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import CompleteRegistrationScreen from '../screens/auth/CompleteRegistrationScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import JobDetailScreen from '../screens/job/JobDetailScreen';
import PostJobScreen from '../screens/job/PostJobScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { ChatListScreen, ChatRoomScreen } from '../screens/chat/ChatScreens';

// New Feature Screens
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import MyPostsScreen from '../screens/myposts/MyPostsScreen';
import ApplicantsScreen from '../screens/applicants/ApplicantsScreen';
import ReviewsScreen from '../screens/reviews/ReviewsScreen';
import HelpScreen from '../screens/help/HelpScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';
import VerificationScreen from '../screens/verification/VerificationScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVerificationScreen from '../screens/admin/AdminVerificationScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminFeedbackScreen from '../screens/admin/AdminFeedbackScreen';

// Feature Screens
import FeedbackScreen from '../screens/feedback/FeedbackScreen';

// Theme
import { COLORS, SPACING, FONT_SIZES } from '../theme';

// ============================================
// Stack Navigators
// ============================================
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================
// AUTH NAVIGATOR
// ============================================
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="CompleteRegistration" component={CompleteRegistrationScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} />
      <AuthStack.Screen name="Privacy" component={PrivacyScreen} />
    </AuthStack.Navigator>
  );
}

// ============================================
// TAB ICON COMPONENT
// ============================================
interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badgeCount?: number;
}

function TabIcon({ focused, iconName, label, badgeCount }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View>
        <Ionicons
          name={iconName}
          size={24}
          color={focused ? COLORS.primary : COLORS.textMuted}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

// ============================================
// MAIN TAB NAVIGATOR
// ============================================
function MainTabNavigator() {
  const { unreadCount } = useChatNotification();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName={focused ? 'home' : 'home-outline'} label="หน้าแรก" />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName={focused ? 'chatbubbles' : 'chatbubbles-outline'} label="ข้อความ" badgeCount={unreadCount} />
          ),
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName={focused ? 'add-circle' : 'add-circle-outline'} label="ลงประกาศ" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName={focused ? 'person' : 'person-outline'} label="โปรไฟล์" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// ROOT NAVIGATOR
// ============================================
function RootNavigator() {
  const { isAuthenticated, showLoginModal, setShowLoginModal, isAdmin } = useAuth();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main App */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />
      
      {/* Job Detail - Full Screen Modal */}
      <RootStack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      
      {/* Chat Room */}
      <RootStack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Favorites */}
      <RootStack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Settings */}
      <RootStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Verification - ยืนยันตัวตน */}
      <RootStack.Screen 
        name="Verification" 
        component={VerificationScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Notifications */}
      <RootStack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Documents */}
      <RootStack.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* My Posts - ประกาศของฉัน */}
      <RootStack.Screen 
        name="MyPosts" 
        component={MyPostsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Applicants (Hospital only) */}
      <RootStack.Screen 
        name="Applicants" 
        component={ApplicantsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Reviews */}
      <RootStack.Screen 
        name="Reviews" 
        component={ReviewsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Help / FAQ */}
      <RootStack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Terms of Service */}
      <RootStack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Privacy Policy */}
      <RootStack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Admin Dashboard (Admin only) */}
      <RootStack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Admin Verification (Admin only) */}
      <RootStack.Screen 
        name="AdminVerification" 
        component={AdminVerificationScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Admin Reports (Admin only) */}
      <RootStack.Screen 
        name="AdminReports" 
        component={AdminReportsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Admin Feedback (Admin only) */}
      <RootStack.Screen 
        name="AdminFeedback" 
        component={AdminFeedbackScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* User Feedback */}
      <RootStack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Auth Screens - Modal */}
      <RootStack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  );
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
    </View>
  );
}

// ============================================
// APP NAVIGATOR (Main Export)
// ============================================
export default function AppNavigator() {
  const { isInitialized } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <ChatNotificationProvider navigation={navigationRef.current}>
        <RootNavigator />
      </ChatNotificationProvider>
    </NavigationContainer>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  // Tab Bar
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'android' ? 90 : 85,
    paddingBottom: Platform.OS === 'android' ? 30 : 25,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
