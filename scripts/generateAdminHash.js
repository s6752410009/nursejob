// ============================================
// เครื่องมือสร้าง Password Hash สำหรับ Admin
// ============================================
// วิธีใช้: node scripts/generateAdminHash.js <password>
// ตัวอย่าง: node scripts/generateAdminHash.js MySecretPassword123
//
// จากนั้น copy hash ที่ได้ไปใส่ใน authService.ts > ADMIN_CREDENTIALS > passwordHash

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.log('❌ กรุณาใส่ password ที่ต้องการ hash');
  console.log('');
  console.log('วิธีใช้: node scripts/generateAdminHash.js <password>');
  console.log('ตัวอย่าง: node scripts/generateAdminHash.js MySecretPassword123');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('');
console.log('🔐 Admin Password Hash Generator');
console.log('================================');
console.log(`Password: ${password}`);
console.log(`SHA-256 Hash: ${hash}`);
console.log('');
console.log('📋 Copy hash นี้ไปใส่ใน src/services/authService.ts:');
console.log(`   passwordHash: '${hash}',`);
console.log('');
