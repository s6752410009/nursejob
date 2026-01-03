// ============================================
// NURSEJOB APP - Production Ready Entry Point
// ============================================
// This is the main entry file for the NurseJob application
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

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#4A90D9' }}>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <StatusBar style="light" backgroundColor="#4A90D9" />
                <AppNavigator />
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
