// ============================================
// NURSELINK APP - Production Ready Entry Point
// ============================================
// This is the main entry file for the NurseLink application
// A platform for nurses to find healthcare job opportunities in Thailand
// ============================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context Providers
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ToastProvider } from './src/context/ToastContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// ============================================
// APP CONTENT WITH THEME
// ============================================
function AppContent() {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <StatusBar style={isDark ? 'light' : 'light'} backgroundColor={colors.primary} />
            <AppNavigator />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
