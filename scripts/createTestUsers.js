// Script สร้างบัญชี Test Users
// รัน: node scripts/createTestUsers.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase Config (จาก src/config/firebase.ts)
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
const auth = getAuth(app);
const db = getFirestore(app);

// Test Users Data
const testUsers = [
  {
    email: 'testuser1@nursego.app',
    password: 'Test@1234',
    displayName: 'ทดสอบ ผู้ใช้หนึ่ง',
    username: 'testuser1',
    phone: '0812345671',
  },
  {
    email: 'testuser2@nursego.app',
    password: 'Test@1234',
    displayName: 'ทดสอบ ผู้ใช้สอง',
    username: 'testuser2',
    phone: '0812345672',
  },
];

async function createTestUser(userData) {
  try {
    console.log(`\nกำลังสร้างบัญชี: ${userData.email}...`);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName: userData.displayName });
    
    // Create Firestore document
    const userProfile = {
      uid: user.uid,
      email: userData.email,
      displayName: userData.displayName,
      username: userData.username,
      phone: userData.phone,
      role: 'user', // ผู้ใช้ทั่วไป (ยังไม่ verified)
      isAdmin: false,
      isVerified: false,
      createdAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log(`✅ สร้างสำเร็จ: ${userData.displayName}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Role: ผู้ใช้งานทั่วไป (user)`);
    
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  บัญชี ${userData.email} มีอยู่แล้ว`);
      return false;
    }
    console.error(`❌ Error creating ${userData.email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('🔧 สร้างบัญชี Test Users สำหรับ NurseGo');
  console.log('========================================');
  
  let successCount = 0;
  
  for (const userData of testUsers) {
    const success = await createTestUser(userData);
    if (success) successCount++;
  }
  
  console.log('\n========================================');
  console.log(`📊 สรุป: สร้างสำเร็จ ${successCount}/${testUsers.length} บัญชี`);
  console.log('========================================\n');
  
  console.log('📋 รายละเอียด Test Accounts:');
  console.log('-----------------------------------');
  console.log('1. Email: testuser1@nursego.app');
  console.log('   Password: Test@1234');
  console.log('   Role: ผู้ใช้งานทั่วไป');
  console.log('');
  console.log('2. Email: testuser2@nursego.app');
  console.log('   Password: Test@1234');
  console.log('   Role: ผู้ใช้งานทั่วไป');
  console.log('-----------------------------------\n');
  
  process.exit(0);
}

main().catch(console.error);
