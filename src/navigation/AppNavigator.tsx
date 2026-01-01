// ============================================
// APP NAVIGATOR - Production Ready
// ============================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

// Context
import { useAuth } from '../context/AuthContext';

// Types
import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

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
import ApplicantsScreen from '../screens/applicants/ApplicantsScreen';
import ReviewsScreen from '../screens/reviews/ReviewsScreen';
import HelpScreen from '../screens/help/HelpScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

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
      <AuthStack.Screen name="AdminLogin" component={AdminLoginScreen} />
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
  icon: string;
  label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icon}
      </Text>
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
            <TabIcon focused={focused} icon="🏠" label="หน้าแรก" />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💬" label="ข้อความ" />
          ),
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📝" label="ลงประกาศ" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="โปรไฟล์" />
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

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
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
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
