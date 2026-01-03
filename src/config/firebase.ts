import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - nursejob-th project
const firebaseConfig = {
  apiKey: "AIzaSyAf5tAn8bQe36WPmnlDAXbWYTjmjo-T0mA",
  authDomain: "nursejob-th.firebaseapp.com",
  projectId: "nursejob-th",
  storageBucket: "nursejob-th.firebasestorage.app",
  messagingSenderId: "740905779838",
  appId: "1:740905779838:web:637d5a5b0a7a46980ace2f",
  measurementId: "G-WPD2T47VTK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
