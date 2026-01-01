// ============================================
// AUTH CONTEXT - Production Ready
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  isAdminEmail,
  findEmailByUsername,
  validateAdminCredentials,
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
  register: (email: string, password: string, displayName: string, role?: 'nurse' | 'hospital', username?: string, phone?: string) => Promise<void>;
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
      setUser(profile);
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

  // Login with Google
  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithGoogleService(idToken);
      setUser(profile);
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

  // Register
  const register = async (
    email: string, 
    password: string, 
    displayName: string,
    role: 'nurse' | 'hospital' = 'nurse',
    username?: string,
    phone?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await registerUser(email, password, displayName, role, username, phone);
      setUser(profile);
      setShowLoginModal(false);
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

  // Logout
  const logout = async () => {
    setIsLoading(true);
    try {
      // Check if admin session (admin login doesn't use Firebase Auth)
      const isAdminSession = await AsyncStorage.getItem('isAdminSession');
      if (!isAdminSession) {
        await logoutUser();
      }
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('isAdminSession');
    } catch (err: any) {
      console.error('Logout error:', err);
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
      setPendingAction(() => action);
      setShowLoginModal(true);
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
