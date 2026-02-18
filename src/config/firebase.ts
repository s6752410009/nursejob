import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - NurseGo project (nurse-go-th)
const firebaseConfig = {
  apiKey: "AIzaSyCePlG5nmTJfOGa_P-j0Xm8c0GVF5xZ3zg",
  authDomain: "nurse-go-th.firebaseapp.com",
  projectId: "nurse-go-th",
  storageBucket: "nurse-go-th.firebasestorage.app",
  messagingSenderId: "427547114323",
  appId: "1:427547114323:android:a89c6f0e5659ae8a19bfa6",
  measurementId: "G-E5NBXHTMLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - ใช้ persistence ที่แตกต่างกันสำหรับ Web และ Native
let auth: Auth;
if (Platform.OS === 'web') {
  // สำหรับ Web ใช้ getAuth ปกติ
  auth = getAuth(app);
} else {
  // สำหรับ React Native ใช้ AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
