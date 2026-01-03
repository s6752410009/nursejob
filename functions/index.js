// ============================================
// FIREBASE CLOUD FUNCTIONS
// ระบบ Automation อัตโนมัติ
// ============================================
// 
// วิธีใช้งาน:
// 1. cd functions
// 2. npm install
// 3. firebase deploy --only functions
//
// ============================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  POST_EXPIRE_HOURS: 48, // 2 days
  FREE_DAILY_POST_LIMIT: 2,
  CHECK_INTERVAL_HOURS: 6,
};

// ============================================
// 1. AUTO-EXPIRE JOBS - ทุก 6 ชั่วโมง
// ปิดงานที่หมดอายุอัตโนมัติ
// ============================================
exports.expireOldJobs = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🔄 Running expireOldJobs...');
    
    const cutoffDate = new Date(Date.now() - CONFIG.POST_EXPIRE_HOURS * 60 * 60 * 1000);
    
    try {
      // Query jobs that are active and older than cutoff
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .where('createdAt', '<', cutoffDate)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ No jobs to expire');
        return null;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach((doc) => {
        // Check if job has extended expiry
        const data = doc.data();
        const expiresAt = data.expiresAt?.toDate();
        
        if (expiresAt && expiresAt > new Date()) {
          // Job has been extended, skip
          console.log(`⏭️ Skipping extended job: ${doc.id}`);
          return;
        }
        
        batch.update(doc.ref, {
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          autoExpired: true,
        });
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`✅ Expired ${count} jobs`);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error expiring jobs:', error);
      return null;
    }
  });

// ============================================
// 2. AUTO-NOTIFY ON NEW APPLICATION
// ส่ง notification เมื่อมีคนสนใจงาน
// ============================================
exports.onNewApplication = functions.firestore
  .document('applications/{applicationId}')
  .onCreate(async (snap, context) => {
    const application = snap.data();
    console.log('📬 New application:', context.params.applicationId);
    
    try {
      // Get job details
      const jobDoc = await db.collection('jobs').doc(application.jobId).get();
      if (!jobDoc.exists) {
        console.log('❌ Job not found');
        return null;
      }
      
      const job = jobDoc.data();
      
      // Get poster's FCM token
      const posterDoc = await db.collection('users').doc(job.posterId).get();
      if (!posterDoc.exists) {
        console.log('❌ Poster not found');
        return null;
      }
      
      const poster = posterDoc.data();
      const fcmToken = poster.fcmToken;
      
      if (!fcmToken) {
        console.log('⚠️ No FCM token for poster');
        // Create in-app notification instead
        await createInAppNotification(job.posterId, {
          type: 'new_application',
          title: '📩 มีคนสนใจงานของคุณ!',
          body: `${application.applicantName} สนใจงาน "${job.title}"`,
          data: {
            jobId: application.jobId,
            applicationId: context.params.applicationId,
          },
        });
        return null;
      }
      
      // Send FCM push notification
      const message = {
        notification: {
          title: '📩 มีคนสนใจงานของคุณ!',
          body: `${application.applicantName} สนใจงาน "${job.title}"`,
        },
        data: {
          type: 'new_application',
          jobId: application.jobId,
          applicationId: context.params.applicationId,
        },
        token: fcmToken,
      };
      
      await admin.messaging().send(message);
      console.log('✅ Push notification sent');
      
      // Also create in-app notification
      await createInAppNotification(job.posterId, {
        type: 'new_application',
        title: '📩 มีคนสนใจงานของคุณ!',
        body: `${application.applicantName} สนใจงาน "${job.title}"`,
        data: {
          jobId: application.jobId,
          applicationId: context.params.applicationId,
        },
      });
      
      return null;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return null;
    }
  });

// ============================================
// 3. DAILY LIMIT RESET - ทุกวันเที่ยงคืน
// Reset โควต้าโพสต์ประจำวัน
// ============================================
exports.resetDailyLimits = functions.pubsub
  .schedule('0 0 * * *') // Every day at midnight
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🔄 Running resetDailyLimits...');
    
    try {
      // Get all user plans
      const snapshot = await db.collection('userPlans').get();
      
      if (snapshot.empty) {
        console.log('✅ No user plans to reset');
        return null;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          postsToday: 0,
          lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      });
      
      await batch.commit();
      console.log(`✅ Reset daily limits for ${count} users`);
      
      return null;
    } catch (error) {
      console.error('❌ Error resetting limits:', error);
      return null;
    }
  });

// ============================================
// 4. AUTO-NOTIFY ON NEW MESSAGE
// ส่ง notification เมื่อมีข้อความใหม่
// ============================================
exports.onNewMessage = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { conversationId } = context.params;
    
    console.log('💬 New message in:', conversationId);
    
    try {
      // Get conversation
      const convDoc = await db.collection('conversations').doc(conversationId).get();
      if (!convDoc.exists) return null;
      
      const conversation = convDoc.data();
      
      // Find recipient (the other participant)
      const recipientId = conversation.participants.find(
        (p) => p !== message.senderId
      );
      
      if (!recipientId) return null;
      
      // Get recipient's FCM token
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      if (!recipientDoc.exists) return null;
      
      const recipient = recipientDoc.data();
      
      // Create in-app notification
      await createInAppNotification(recipientId, {
        type: 'new_message',
        title: `💬 ${message.senderName}`,
        body: message.text?.substring(0, 100) || 'ส่งข้อความถึงคุณ',
        data: {
          conversationId,
        },
      });
      
      // Send FCM if available
      if (recipient.fcmToken) {
        const fcmMessage = {
          notification: {
            title: `💬 ${message.senderName}`,
            body: message.text?.substring(0, 100) || 'ส่งข้อความถึงคุณ',
          },
          data: {
            type: 'new_message',
            conversationId,
          },
          token: recipient.fcmToken,
        };
        
        await admin.messaging().send(fcmMessage);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error on new message:', error);
      return null;
    }
  });

// ============================================
// 5. SUBSCRIPTION EXPIRY CHECK - ทุก 6 ชั่วโมง
// ตรวจสอบ subscription ที่หมดอายุ
// ============================================
exports.checkSubscriptionExpiry = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🔄 Checking subscription expiry...');
    
    const now = new Date();
    
    try {
      // Find premium users with expired subscriptions
      const snapshot = await db.collection('userPlans')
        .where('planType', '==', 'premium')
        .where('subscriptionEnd', '<', now)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ No expired subscriptions');
        return null;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          planType: 'free',
          dailyPostLimit: CONFIG.FREE_DAILY_POST_LIMIT,
          subscriptionExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Notify user
        createInAppNotification(doc.data().userId, {
          type: 'subscription_expired',
          title: '⚠️ Premium หมดอายุแล้ว',
          body: 'แพ็คเกจ Premium ของคุณหมดอายุแล้ว ต่ออายุเพื่อโพสต์ไม่จำกัด',
          data: {},
        });
        
        count++;
      });
      
      await batch.commit();
      console.log(`✅ Downgraded ${count} expired subscriptions`);
      
      return null;
    } catch (error) {
      console.error('❌ Error checking subscriptions:', error);
      return null;
    }
  });

// ============================================
// 6. AUTO-CLOSE FILLED JOBS
// ปิดงานที่ได้คนครบแล้วอัตโนมัติ
// ============================================
exports.autoCloseFilledJobs = functions.pubsub
  .schedule('every 12 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🔄 Checking for filled jobs...');
    
    try {
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .where('acceptedApplicants', '>=', 1)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ No filled jobs to close');
        return null;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.docs.forEach((doc) => {
        const job = doc.data();
        
        // If accepted applicants >= positions needed, close the job
        if (job.acceptedApplicants >= (job.positions || 1)) {
          batch.update(doc.ref, {
            status: 'closed',
            closedAt: admin.firestore.FieldValue.serverTimestamp(),
            closedReason: 'auto_filled',
          });
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`✅ Auto-closed ${count} filled jobs`);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error closing jobs:', error);
      return null;
    }
  });

// ============================================
// 7. WEEKLY STATS REPORT
// สร้างรายงานสถิติประจำสัปดาห์
// ============================================
exports.weeklyStatsReport = functions.pubsub
  .schedule('0 9 * * 1') // Every Monday at 9 AM
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('📊 Generating weekly stats...');
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      // Count new users
      const newUsersSnapshot = await db.collection('users')
        .where('createdAt', '>=', oneWeekAgo)
        .get();
      
      // Count new jobs
      const newJobsSnapshot = await db.collection('jobs')
        .where('createdAt', '>=', oneWeekAgo)
        .get();
      
      // Count completed purchases
      const purchasesSnapshot = await db.collection('purchases')
        .where('createdAt', '>=', oneWeekAgo)
        .where('status', '==', 'completed')
        .get();
      
      let totalRevenue = 0;
      purchasesSnapshot.docs.forEach((doc) => {
        totalRevenue += doc.data().amount || 0;
      });
      
      // Save weekly report
      await db.collection('reports').add({
        type: 'weekly',
        period: {
          start: oneWeekAgo,
          end: new Date(),
        },
        stats: {
          newUsers: newUsersSnapshot.size,
          newJobs: newJobsSnapshot.size,
          totalPurchases: purchasesSnapshot.size,
          totalRevenue,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`📊 Weekly report: ${newUsersSnapshot.size} users, ${newJobsSnapshot.size} jobs, ฿${totalRevenue} revenue`);
      
      // Notify admin
      const adminsSnapshot = await db.collection('users')
        .where('isAdmin', '==', true)
        .get();
      
      adminsSnapshot.docs.forEach(async (adminDoc) => {
        await createInAppNotification(adminDoc.id, {
          type: 'weekly_report',
          title: '📊 รายงานประจำสัปดาห์',
          body: `ผู้ใช้ใหม่: ${newUsersSnapshot.size} | งานใหม่: ${newJobsSnapshot.size} | รายได้: ฿${totalRevenue}`,
          data: {},
        });
      });
      
      return null;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      return null;
    }
  });

// ============================================
// 8. CLEANUP OLD NOTIFICATIONS - ทุกสัปดาห์
// ลบ notification เก่า
// ============================================
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 3 * * 0') // Every Sunday at 3 AM
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🧹 Cleaning up old notifications...');
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      const snapshot = await db.collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .limit(500)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ No old notifications to cleanup');
        return null;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`🧹 Deleted ${snapshot.size} old notifications`);
      
      return null;
    } catch (error) {
      console.error('❌ Error cleaning up:', error);
      return null;
    }
  });

// ============================================
// HELPER: Create In-App Notification
// ============================================
async function createInAppNotification(userId, notification) {
  try {
    await db.collection('notifications').add({
      userId,
      ...notification,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// ============================================
// 9. ON USER CREATE - Welcome notification
// ============================================
exports.onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const user = snap.data();
    
    console.log('👋 New user:', user.displayName);
    
    try {
      // Create welcome notification
      await createInAppNotification(userId, {
        type: 'welcome',
        title: '🎉 ยินดีต้อนรับสู่ NurseShift!',
        body: 'เริ่มค้นหางานเวรพยาบาลหรือโพสต์หาคนมาเติมเวรได้เลย',
        data: {},
      });
      
      // Create default user plan
      await db.collection('userPlans').add({
        userId,
        planType: 'free',
        isActive: true,
        dailyPostLimit: CONFIG.FREE_DAILY_POST_LIMIT,
        postsToday: 0,
        extraPosts: 0,
        totalSpent: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log('✅ User setup complete');
      return null;
    } catch (error) {
      console.error('❌ Error on user create:', error);
      return null;
    }
  });

// ============================================
// 10. ON JOB ABOUT TO EXPIRE - 6 hours before
// แจ้งเตือนก่อนงานหมดอายุ
// ============================================
exports.notifyJobExpiringSoon = functions.pubsub
  .schedule('every 3 hours')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('⏰ Checking jobs expiring soon...');
    
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const cutoffDate = new Date(now.getTime() - (CONFIG.POST_EXPIRE_HOURS - 6) * 60 * 60 * 1000);
    
    try {
      // Find jobs that will expire in ~6 hours
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'active')
        .where('createdAt', '<=', cutoffDate)
        .where('expiryNotified', '!=', true)
        .get();
      
      if (snapshot.empty) {
        console.log('✅ No jobs expiring soon');
        return null;
      }
      
      let count = 0;
      
      for (const doc of snapshot.docs) {
        const job = doc.data();
        
        // Check if already extended
        if (job.expiresAt && job.expiresAt.toDate() > sixHoursFromNow) {
          continue;
        }
        
        // Notify poster
        await createInAppNotification(job.posterId, {
          type: 'job_expiring',
          title: '⏰ งานของคุณกำลังจะหมดอายุ',
          body: `"${job.title}" จะหมดอายุใน 6 ชั่วโมง ขยายเวลาหรือปิดรับสมัคร?`,
          data: { jobId: doc.id },
        });
        
        // Mark as notified
        await doc.ref.update({ expiryNotified: true });
        count++;
      }
      
      console.log(`⏰ Notified ${count} job posters about expiry`);
      return null;
    } catch (error) {
      console.error('❌ Error notifying expiry:', error);
      return null;
    }
  });
