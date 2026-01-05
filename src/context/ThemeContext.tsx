// ============================================
// THEME CONTEXT - ระบบธีม (ขาว/ดำ/ตามระบบ)
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBackground: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  
  // Special colors
  urgent: string;
  verified: string;
  premium: string;
  online: string;
  offline: string;
  
  // Social colors
  google: string;
  facebook: string;
  line: string;
  
  // Other
  white: string;
  black: string;
  overlay: string;
  overlayLight: string;
  
  // Secondary
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  
  // Accent
  accent: string;
  accentDark: string;
  accentLight: string;
  
  // Additional
  backgroundSecondary: string;
  divider: string;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

// ============================================
// Light Theme Colors
// ============================================
export const lightColors: ThemeColors = {
  primary: '#4A90D9',
  primaryLight: '#7EB3F1',
  primaryDark: '#2E6BB0',
  primaryBackground: '#E8F4FF',
  
  background: '#F5F7FA',
  backgroundSecondary: '#F0F2F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F3F4F6',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Special
  urgent: '#FF4757',
  verified: '#2ED573',
  premium: '#FFD700',
  online: '#22C55E',
  offline: '#9CA3AF',
  
  // Social
  google: '#DB4437',
  facebook: '#4267B2',
  line: '#00B900',
  
  // Secondary
  secondary: '#5BC0BE',
  secondaryDark: '#3A9997',
  secondaryLight: '#8DD4D2',
  
  // Accent
  accent: '#FF6B6B',
  accentDark: '#E55555',
  accentLight: '#FF9999',
  
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// ============================================
// Dark Theme Colors
// ============================================
export const darkColors: ThemeColors = {
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',
  primaryBackground: '#1E3A5F',
  
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  card: '#334155',
  
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  textInverse: '#0F172A',
  
  border: '#475569',
  borderLight: '#334155',
  divider: '#334155',
  
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  
  // Special
  urgent: '#FF6B6B',
  verified: '#4ADE80',
  premium: '#FCD34D',
  online: '#4ADE80',
  offline: '#64748B',
  
  // Social
  google: '#EA4335',
  facebook: '#1877F2',
  line: '#06C755',
  
  // Secondary
  secondary: '#67E8F9',
  secondaryDark: '#22D3EE',
  secondaryLight: '#A5F3FC',
  
  // Accent
  accent: '#FB7185',
  accentDark: '#F43F5E',
  accentLight: '#FDA4AF',
  
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// ============================================
// Global Theme State (สำหรับเข้าถึงจากทุกที่)
// ============================================
let currentColors: ThemeColors = lightColors;
let currentIsDark: boolean = false;
let themeListeners: Array<() => void> = [];

export function getCurrentColors(): ThemeColors {
  return currentColors;
}

export function getIsDark(): boolean {
  return currentIsDark;
}

export function subscribeToTheme(listener: () => void): () => void {
  themeListeners.push(listener);
  return () => {
    themeListeners = themeListeners.filter(l => l !== listener);
  };
}

function notifyThemeListeners() {
  themeListeners.forEach(listener => listener());
}

// ============================================
// Context
// ============================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

// ============================================
// Provider
// ============================================
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Get current colors
  const colors = isDark ? darkColors : lightColors;
  
  // Update global state
  useEffect(() => {
    currentColors = colors;
    currentIsDark = isDark;
    notifyThemeListeners();
  }, [isDark, colors]);

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    isDark,
    colors,
  };

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook สำหรับ re-render เมื่อ theme เปลี่ยน
export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

export default ThemeContext;
