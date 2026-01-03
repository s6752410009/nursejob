// ============================================
// AUTH CONTEXT - Production Ready
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  subscribeToAuthChanges,
  getUserProfile,
  updateUserProfile as updateProfile,
  resetPassword,
  loginWithGoogle as loginWithGoogleService,
  loginAsAdmin as loginAsAdminService,
  loginWithPhoneOTP,
  isAdminEmail,
  findEmailByUsername,
  validateAdminCredentials,
  isEmailVerified,
  sendVerificationEmail,
  UserProfile,
} from '../services/authService';
import { getErrorMessage } from '../utils/helpers';

// ============================================
// Types
// ============================================
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextType extends AuthState {
  // Actions
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginAsAdmin: (username: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: 'user' | 'nurse' | 'hospital', username?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Admin
  isAdmin: boolean;
  
  // Guest mode
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  pendingAction: (() => void) | null;
  requireAuth: (action: () => void) => void;
  executePendingAction: () => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// ============================================
// Context
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      // Check if this is an admin session (don't override with Firebase state)
      const isAdminSession = await AsyncStorage.getItem('isAdminSession');
      
      if (isAdminSession === 'true') {
        // Admin session - don't change user state from Firebase listener
        setIsInitialized(true);
        return;
      }
      
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
          // Cache user data
          if (profile) {
            await AsyncStorage.setItem('user', JSON.stringify(profile));
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setIsInitialized(true);
    });

    // Try to restore cached user on app start
    loadCachedUser();

    return () => unsubscribe();
  }, []);

  // Load cached user for faster startup
  const loadCachedUser = async () => {
    try {
      const cached = await AsyncStorage.getItem('user');
      if (cached) {
        const cachedUser = JSON.parse(cached);
        // Only use cache if still loading
        if (!isInitialized) {
          setUser(cachedUser);
        }
      }
    } catch (err) {
      console.error('Error loading cached user:', err);
    }
  };

  // Login (supports both email and username)
  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let email = emailOrUsername;
      
      // Check if it's admin credentials first
      const adminCredential = validateAdminCredentials(emailOrUsername, password);
      if (adminCredential) {
        // Login as admin
        const profile = await loginAsAdminService(emailOrUsername, password);
        await AsyncStorage.setItem('user', JSON.stringify(profile));
        await AsyncStorage.setItem('isAdminSession', 'true');
        setUser(profile);
        setIsInitialized(true);
        setShowLoginModal(false);
        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
            setPendingAction(null);
          }, 100);
        }
        return;
      }
      
      // Check if it's a username (doesn't contain @)
      if (!emailOrUsername.includes('@')) {
        const foundEmail = await findEmailByUsername(emailOrUsername);
        if (foundEmail) {
          email = foundEmail;
        } else {
          throw new Error('ไม่พบ Username นี้ในระบบ');
        }
      }
      
      const profile = await loginUser(email, password);
      
      // Note: Email verification is optional - user can verify later
      // We allow login without verification but show reminder in profile
      
      // Save to AsyncStorage first
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      // Then update state - this will trigger re-render and navigation
      setUser(profile);
      setIsInitialized(true);
      setShowLoginModal(false);
      // Execute pending action after login
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (err: any) {
      // If error message is already in Thai (from authService), use it directly
      const isThai = /[\u0E00-\u0E7F]/.test(err.message || '');
      const errorMessage = isThai ? err.message : getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithGoogleService(idToken);
      // Save to AsyncStorage first
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      // Then update state
      setUser(profile);
      setIsInitialized(true);
      setShowLoginModal(false);
      // Execute pending action after login
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login as Admin with username/password
  const loginAsAdmin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginAsAdminService(username, password);
      // Save to AsyncStorage first
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      await AsyncStorage.setItem('isAdminSession', 'true');
      // Then update state - this will trigger re-render and navigation
      setUser(profile);
      setIsInitialized(true);
      setShowLoginModal(false);
      // Execute pending action after login
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Phone (after OTP verification)
  const loginWithPhone = async (phone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithPhoneOTP(phone);
      // Save to AsyncStorage first
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      await AsyncStorage.setItem('isPhoneSession', 'true');
      // Then update state - this will trigger re-render and navigation
      setUser(profile);
      setIsInitialized(true);
      setShowLoginModal(false);
      // Execute pending action after login
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (err: any) {
      // Use error message directly if it's in Thai
      const isThai = /[\u0E00-\u0E7F]/.test(err.message || '');
      const errorMessage = isThai ? err.message : getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (
    email: string, 
    password: string, 
    displayName: string,
    role: 'user' | 'nurse' | 'hospital' = 'user', // Default = ผู้ใช้ทั่วไป
    username?: string,
    phone?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await registerUser(email, password, displayName, role, username, phone);
      // Save to AsyncStorage first
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      // Then update state - this will trigger re-render and navigation
      setUser(profile);
      setIsInitialized(true);
      setShowLoginModal(false);
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    } catch (err: any) {
      // authService already translates errors to Thai, so use err.message directly
      // Only use getErrorMessage if it's a raw Firebase error
      const errorMessage = err.code ? getErrorMessage(err) : (err.message || getErrorMessage(err));
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    try {
      // Check if admin session or phone session (these don't use Firebase Auth)
      const isAdminSession = await AsyncStorage.getItem('isAdminSession');
      const isPhoneSession = await AsyncStorage.getItem('isPhoneSession');
      if (!isAdminSession && !isPhoneSession) {
        await logoutUser();
      }
      // Clear AsyncStorage first
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('isAdminSession');
      await AsyncStorage.removeItem('isPhoneSession');
      // Then update state
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      // Still clear state even if error
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('isAdminSession');
      await AsyncStorage.removeItem('isPhoneSession');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user?.uid) throw new Error('ไม่ได้เข้าสู่ระบบ');
    
    setIsLoading(true);
    try {
      // Filter out undefined values and prepare for Firestore
      const cleanUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      
      await updateProfile(user.uid, cleanUpdates as Partial<UserProfile>);
      const updatedProfile = { ...user, ...updates };
      setUser(updatedProfile);
      await AsyncStorage.setItem('user', JSON.stringify(updatedProfile));
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!user?.uid) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUser(profile);
        await AsyncStorage.setItem('user', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  // Require authentication (for guest mode)
  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      // Show alert first, then open login modal
      Alert.alert(
        '🔐 กรุณาเข้าสู่ระบบ',
        'คุณต้องเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้',
        [
          { 
            text: 'ยกเลิก', 
            style: 'cancel' 
          },
          { 
            text: 'เข้าสู่ระบบ', 
            onPress: () => {
              setPendingAction(() => action);
              setShowLoginModal(true);
            }
          }
        ]
      );
    }
  };

  // Execute pending action
  const executePendingAction = () => {
    if (pendingAction && user) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Check if user is admin
  const isAdmin = user?.isAdmin || isAdminEmail(user?.email || '');

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    login,
    loginWithGoogle,
    loginAsAdmin,
    loginWithPhone,
    register,
    logout,
    updateUser,
    forgotPassword,
    refreshUser,
    isAdmin,
    showLoginModal,
    setShowLoginModal,
    pendingAction,
    requireAuth,
    executePendingAction,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
