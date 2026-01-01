import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
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
  isAdmin: boolean; // Admin flag
  licenseNumber?: string; // เลขใบประกอบวิชาชีพ
  experience?: number;
  bio?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

// ==========================================
// Admin Configuration
// ==========================================
// รายชื่อ email ที่เป็น admin (คุณสามารถเพิ่มได้)
const ADMIN_EMAILS = [
  'admin@nurseshift.com',
  'admin@nursejob.com',
  // เพิ่ม email ของคุณที่นี่:
  // 'your-email@gmail.com',
];

// ==========================================
// Admin Credentials (Username/Password)
// ==========================================
// สำหรับเข้าสู่ระบบ Admin โดยตรง (ไม่ต้องสมัครสมาชิก)
interface AdminCredential {
  username: string;
  password: string;
  displayName: string;
  email: string;
}

const ADMIN_CREDENTIALS: AdminCredential[] = [
  {
    username: 'adminmark',
    password: 'Markms2429',
    displayName: 'Admin Mark',
    email: 'adminmark@nurseshift.admin',
  },
  // เพิ่ม admin account อื่นๆ ได้ที่นี่
];

// ตรวจสอบ admin credentials
export function validateAdminCredentials(username: string, password: string): AdminCredential | null {
  const admin = ADMIN_CREDENTIALS.find(
    (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
  );
  return admin || null;
}

// ตรวจสอบว่าเป็น admin หรือไม่
export function isAdminEmail(email: string): boolean {
  // Check email list
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true;
  }
  // Check admin credentials email
  if (ADMIN_CREDENTIALS.some(a => a.email.toLowerCase() === email.toLowerCase())) {
    return true;
  }
  return false;
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

    // Check if admin
    const isAdmin = isAdminEmail(email);
    const finalRole = isAdmin ? 'admin' : role;

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'id'> = {
      uid: user.uid,
      email,
      displayName,
      role: finalRole,
      isAdmin,
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
    let userProfile = await getUserProfile(user.uid);
    
    // If profile doesn't exist, create one (for existing Firebase Auth users)
    if (!userProfile) {
      const isAdmin = isAdminEmail(email);
      userProfile = {
        id: user.uid,
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        role: isAdmin ? 'admin' : 'nurse',
        isAdmin,
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, USERS_COLLECTION, user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
      });
    }

    // Update isAdmin flag if needed
    if (isAdminEmail(email) && !userProfile.isAdmin) {
      await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
        isAdmin: true,
        role: 'admin',
      });
      userProfile.isAdmin = true;
      userProfile.role = 'admin';
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
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    throw error;
  }
}

// Login with Google ID Token
export async function loginWithGoogle(idToken: string): Promise<UserProfile> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Get or create user profile
    let userProfile = await getUserProfile(user.uid);
    
    if (!userProfile) {
      const isAdmin = isAdminEmail(user.email || '');
      userProfile = {
        id: user.uid,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'ผู้ใช้',
        photoURL: user.photoURL,
        role: isAdmin ? 'admin' : 'nurse',
        isAdmin,
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, USERS_COLLECTION, user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
      });
    } else {
      // Update photo URL from Google if changed
      if (user.photoURL && user.photoURL !== userProfile.photoURL) {
        await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
          photoURL: user.photoURL,
        });
        userProfile.photoURL = user.photoURL;
      }
    }

    return userProfile;
  } catch (error: any) {
    console.error('Error logging in with Google:', error);
    throw new Error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
  }
}

// Login as Admin with username/password (ไม่ต้องผ่าน Firebase Auth)
export async function loginAsAdmin(username: string, password: string): Promise<UserProfile> {
  const adminCredential = validateAdminCredentials(username, password);
  
  if (!adminCredential) {
    throw new Error('Username หรือ Password ไม่ถูกต้อง');
  }

  // สร้าง admin profile (ไม่บันทึกใน Firestore เพื่อความปลอดภัย)
  const adminProfile: UserProfile = {
    id: `admin_${adminCredential.username}`,
    uid: `admin_${adminCredential.username}`,
    email: adminCredential.email,
    displayName: adminCredential.displayName,
    role: 'admin',
    isAdmin: true,
    createdAt: new Date(),
  };

  return adminProfile;
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
        isAdmin: data.isAdmin || isAdminEmail(data.email || ''),
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
