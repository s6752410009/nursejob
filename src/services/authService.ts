import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  role: 'nurse' | 'hospital' | 'admin';
  licenseNumber?: string; // เลขใบประกอบวิชาชีพ
  experience?: number;
  bio?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

const USERS_COLLECTION = 'users';

// ==========================================
// Authentication Functions
// ==========================================

// Register new user
export async function registerUser(
  email: string, 
  password: string, 
  displayName: string,
  role: 'nurse' | 'hospital' = 'nurse'
): Promise<UserProfile> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'id'> = {
      uid: user.uid,
      email,
      displayName,
      role,
      createdAt: new Date(),
    };

    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
    });

    return {
      id: user.uid,
      ...userProfile,
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Translate Firebase errors to Thai
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    }
    throw error;
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }

    return userProfile;
  } catch (error: any) {
    console.error('Error logging in:', error);
    
    // Translate Firebase errors to Thai
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่');
    }
    throw error;
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

// Get user profile from Firestore
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uid: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Update Firebase Auth profile if displayName or photoURL changed
    const currentUser = auth.currentUser;
    if (currentUser && (updates.displayName || updates.photoURL)) {
      await updateProfile(currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Subscribe to auth state changes
export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('ไม่พบบัญชีที่ใช้อีเมลนี้');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    }
    throw error;
  }
}
