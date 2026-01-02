import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JobPost, ShiftContact, JobFilters } from '../types';

// Re-export types for backward compatibility
export type { JobPost, ShiftContact };

const JOBS_COLLECTION = 'shifts';
const CONTACTS_COLLECTION = 'shift_contacts';

// ==========================================
// Shifts Service - บอร์ดหาคนแทน
// ==========================================

// Subscribe to real-time jobs updates
export function subscribeToJobs(callback: (jobs: JobPost[]) => void): () => void {
  const jobsQuery = query(
    collection(db, JOBS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(jobsQuery, (snapshot) => {
    const now = new Date();
    let jobs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.title || 'หาคนแทน',
        posterName: data.posterName || 'ไม่ระบุชื่อ',
        posterId: data.posterId || '',
        posterPhoto: data.posterPhoto,
        department: data.department || 'ทั่วไป',
        shiftRate: data.shiftRate || 1500,
        rateType: data.rateType || 'shift',
        shiftDate: data.shiftDate?.toDate?.() || new Date(),
        shiftTime: data.shiftTime || '08:00-16:00',
        location: {
          province: data.location?.province || 'กรุงเทพมหานคร',
          district: data.location?.district || '',
          hospital: data.location?.hospital || '',
        },
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        expiresAt: data.expiresAt?.toDate?.() || null,
        status: data.status || 'active',
        description: data.description || '',
        contactPhone: data.contactPhone || '',
        contactLine: data.contactLine || '',
        viewsCount: data.viewsCount || 0,
      } as JobPost;
    });
    
    // Filter out expired and inactive posts
    jobs = jobs.filter(job => {
      if (job.status !== 'active' && job.status !== 'urgent') return false;
      if (job.expiresAt && job.expiresAt < now) return false;
      return true;
    });
    
    callback(jobs);
  }, (error) => {
    console.error('Error subscribing to jobs:', error);
  });
}

// Get all active shifts with optional filters
export async function getJobs(filters?: JobFilters): Promise<JobPost[]> {
  try {
    // Use simpler query to avoid index issues
    let jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(jobsQuery);
    let jobs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.title || 'หาคนแทน',
        posterName: data.posterName || 'ไม่ระบุชื่อ',
        posterId: data.posterId || '',
        posterPhoto: data.posterPhoto,
        department: data.department || 'ทั่วไป',
        shiftRate: data.shiftRate || 1500,
        rateType: data.rateType || 'shift',
        shiftDate: data.shiftDate?.toDate?.() || new Date(),
        shiftTime: data.shiftTime || '08:00-16:00',
        location: {
          province: data.location?.province || 'กรุงเทพมหานคร',
          district: data.location?.district || '',
          hospital: data.location?.hospital || '',
        },
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        status: data.status || 'active',
        description: data.description || '',
        contactPhone: data.contactPhone || '',
        contactLine: data.contactLine || '',
        viewsCount: data.viewsCount || 0,
      } as JobPost;
    });

    // Apply client-side filters (including status filter)
    // Filter active/urgent status first
    jobs = jobs.filter(job => job.status === 'active' || job.status === 'urgent');
    
    // Filter out expired posts
    const now = new Date();
    jobs = jobs.filter(job => {
      if (!job.expiresAt) return true; // No expiry = always show
      const expiresAt = job.expiresAt instanceof Date ? job.expiresAt : new Date(job.expiresAt);
      return expiresAt > now;
    });
    
    if (filters) {
      if (filters.province) {
        jobs = jobs.filter(job => job.location?.province === filters.province);
      }
      if (filters.district) {
        jobs = jobs.filter(job => job.location?.district === filters.district);
      }
      if (filters.department) {
        jobs = jobs.filter(job => job.department === filters.department);
      }
      if (filters.urgentOnly) {
        jobs = jobs.filter(job => job.status === 'urgent');
      }
      if (filters.minRate) {
        jobs = jobs.filter(job => job.shiftRate >= filters.minRate!);
      }
      if (filters.maxRate) {
        jobs = jobs.filter(job => job.shiftRate <= filters.maxRate!);
      }
      if (filters.sortBy === 'night') {
        jobs = jobs.filter(job => job.shiftTime?.includes('00:00-08:00') || job.shiftTime?.includes('ดึก'));
      } else if (filters.sortBy === 'morning') {
        jobs = jobs.filter(job => job.shiftTime?.includes('08:00-16:00') || job.shiftTime?.includes('เช้า'));
      } else if (filters.sortBy === 'highestPay') {
        jobs = jobs.sort((a, b) => (b.shiftRate || 0) - (a.shiftRate || 0));
      }
    }

    // If no jobs found, return mock data for demo
    if (jobs.length === 0) {
      console.log('No jobs found, returning mock data');
      return getMockJobs();
    }

    return jobs;
  } catch (error) {
    console.error('Error fetching shifts:', error);
    // Return mock data if Firebase fails
    return getMockJobs();
  }
}

// Get single job by ID
export async function getJobById(jobId: string): Promise<JobPost | null> {
  try {
    const docRef = doc(db, JOBS_COLLECTION, jobId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        posterName: data.posterName || '',
        posterId: data.posterId || '',
        posterPhoto: data.posterPhoto,
        department: data.department || '',
        shiftRate: data.shiftRate || 0,
        rateType: data.rateType || 'shift',
        shiftDate: data.shiftDate?.toDate() || new Date(),
        shiftTime: data.shiftTime || '',
        location: data.location || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        status: data.status || 'active',
        ...data,
      } as JobPost;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shift:', error);
    throw error;
  }
}

// Search shifts
export async function searchJobs(searchText: string): Promise<JobPost[]> {
  try {
    const allJobs = await getJobs();
    const searchLower = searchText.toLowerCase();
    
    return allJobs.filter(job => 
      job.posterName?.toLowerCase().includes(searchLower) ||
      job.title.toLowerCase().includes(searchLower) ||
      job.department.toLowerCase().includes(searchLower) ||
      job.location?.district?.toLowerCase().includes(searchLower) ||
      job.location?.province?.toLowerCase().includes(searchLower) ||
      job.location?.hospital?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching shifts:', error);
    throw error;
  }
}

// Create new job post
export async function createJob(jobData: Partial<JobPost>): Promise<string> {
  try {
    // Clean undefined values - Firestore doesn't accept undefined
    const cleanData: Record<string, any> = {};
    Object.entries(jobData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    const docRef = await addDoc(collection(db, JOBS_COLLECTION), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      applicationCount: 0,
      viewsCount: 0,
      status: cleanData.status || 'active',
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

// Update job
export async function updateJob(jobId: string, updates: Partial<JobPost>): Promise<void> {
  try {
    const docRef = doc(db, JOBS_COLLECTION, jobId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}

// Delete job
export async function deleteJob(jobId: string): Promise<void> {
  try {
    const docRef = doc(db, JOBS_COLLECTION, jobId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

// Get jobs by user ID (ประกาศของฉัน)
export async function getUserPosts(userId: string): Promise<JobPost[]> {
  try {
    const jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('posterId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(jobsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.title || 'หาคนแทน',
        posterName: data.posterName || 'ไม่ระบุชื่อ',
        posterId: data.posterId || '',
        posterPhoto: data.posterPhoto,
        department: data.department || 'ทั่วไป',
        shiftRate: data.shiftRate || 1500,
        rateType: data.rateType || 'shift',
        shiftDate: data.shiftDate?.toDate?.() || new Date(),
        shiftTime: data.shiftTime || '08:00-16:00',
        location: {
          province: data.location?.province || 'กรุงเทพมหานคร',
          district: data.location?.district || '',
          hospital: data.location?.hospital || '',
        },
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        status: data.status || 'active',
        description: data.description || '',
        viewsCount: data.viewsCount || 0,
      } as JobPost;
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

// Subscribe to user's posts in real-time
export function subscribeToUserPosts(userId: string, callback: (posts: JobPost[]) => void): () => void {
  const postsQuery = query(
    collection(db, JOBS_COLLECTION),
    where('posterId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(postsQuery, (snapshot) => {
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.title || 'หาคนแทน',
        posterName: data.posterName || 'ไม่ระบุชื่อ',
        posterId: data.posterId || '',
        posterPhoto: data.posterPhoto,
        department: data.department || 'ทั่วไป',
        shiftRate: data.shiftRate || 1500,
        rateType: data.rateType || 'shift',
        shiftDate: data.shiftDate?.toDate?.() || new Date(),
        shiftTime: data.shiftTime || '08:00-16:00',
        location: {
          province: data.location?.province || 'กรุงเทพมหานคร',
          district: data.location?.district || '',
          hospital: data.location?.hospital || '',
        },
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        status: data.status || 'active',
        description: data.description || '',
        viewsCount: data.viewsCount || 0,
      } as JobPost;
    });
    callback(posts);
  }, (error) => {
    console.error('Error subscribing to user posts:', error);
  });
}

// Update job status
export async function updateJobStatus(jobId: string, status: 'active' | 'urgent' | 'closed'): Promise<void> {
  try {
    const docRef = doc(db, JOBS_COLLECTION, jobId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

// ==========================================
// Shift Contact Service - การแสดงความสนใจ
// ==========================================

// แสดงความสนใจ
export async function contactForShift(
  jobId: string, 
  userId: string, 
  userName: string,
  userPhone: string,
  message?: string
): Promise<string> {
  try {
    // Check if already contacted
    const existingQuery = query(
      collection(db, CONTACTS_COLLECTION),
      where('jobId', '==', jobId),
      where('interestedUserId', '==', userId)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      throw new Error('คุณได้ติดต่อเรื่องงานนี้แล้ว');
    }

    // Create contact record
    const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
      jobId,
      interestedUserId: userId,
      interestedUserName: userName,
      interestedUserPhone: userPhone,
      message: message || '',
      status: 'interested',
      contactedAt: serverTimestamp(),
    });

    // Update views count
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    const jobDoc = await getDoc(jobRef);
    if (jobDoc.exists()) {
      const currentCount = jobDoc.data().viewsCount || 0;
      await updateDoc(jobRef, {
        viewsCount: currentCount + 1
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error contacting for shift:', error);
    throw error;
  }
}

// Get user's interested shifts
export async function getUserShiftContacts(userId: string): Promise<ShiftContact[]> {
  try {
    // Use simpler query without orderBy to avoid index requirement
    const contactsQuery = query(
      collection(db, CONTACTS_COLLECTION),
      where('interestedUserId', '==', userId)
    );
    
    const snapshot = await getDocs(contactsQuery);
    const contacts = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Fetch job details
        let jobData: JobPost | undefined;
        try {
          const jobDoc = await getDoc(doc(db, JOBS_COLLECTION, data.jobId));
          if (jobDoc.exists()) {
            const job = jobDoc.data();
            jobData = {
              id: jobDoc.id,
              title: job.title || 'เวร',
              posterName: job.posterName || 'ไม่ระบุ',
              ...job,
            } as JobPost;
          }
        } catch (e) {
          console.error('Error fetching job:', e);
        }

        return {
          id: docSnap.id,
          ...data,
          contactedAt: data.contactedAt?.toDate() || new Date(),
          job: jobData,
        } as ShiftContact;
      })
    );

    // Sort client-side
    contacts.sort((a, b) => {
      const dateA = a.contactedAt instanceof Date ? a.contactedAt.getTime() : 0;
      const dateB = b.contactedAt instanceof Date ? b.contactedAt.getTime() : 0;
      return dateB - dateA;
    });

    return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

// Get contacts for a shift (for poster)
export async function getShiftContacts(jobId: string): Promise<ShiftContact[]> {
  try {
    // Use simpler query without orderBy to avoid index requirement
    const contactsQuery = query(
      collection(db, CONTACTS_COLLECTION),
      where('jobId', '==', jobId)
    );
    
    const snapshot = await getDocs(contactsQuery);
    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      contactedAt: doc.data().contactedAt?.toDate() || new Date(),
    } as ShiftContact));
    
    // Sort client-side
    contacts.sort((a, b) => {
      const dateA = a.contactedAt instanceof Date ? a.contactedAt.getTime() : 0;
      const dateB = b.contactedAt instanceof Date ? b.contactedAt.getTime() : 0;
      return dateB - dateA;
    });
    
    return contacts;
  } catch (error) {
    console.error('Error fetching shift contacts:', error);
    return []; // Return empty instead of throwing
  }
}

// Update contact status
export async function updateShiftContactStatus(
  contactId: string, 
  status: 'interested' | 'confirmed' | 'cancelled'
): Promise<void> {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

// ==========================================
// Mock Data (Fallback when Firebase unavailable)
// ==========================================
function getMockJobs(): JobPost[] {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const nextWeek = new Date(today.getTime() + 604800000);
  
  return [
    {
      id: '1',
      title: '🔥 หาคนแทนเวรดึก ICU ด่วนมาก!',
      posterName: 'พี่หมิว RN',
      posterId: 'u1',
      posterPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
      department: 'ICU',
      description: 'ติดธุระกะทันหัน หาคนแทนด่วนค่ะ ผู้ป่วย 6 เตียง มี NA ช่วย',
      shiftRate: 2000,
      rateType: 'shift',
      shiftDate: tomorrow,
      shiftTime: '00:00-08:00',
      location: {
        province: 'กรุงเทพมหานคร',
        district: 'วัฒนา',
        hospital: 'รพ.บำรุงราษฎร์',
      },
      contactPhone: '089-123-4567',
      contactLine: '@mew_nurse',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'urgent',
      viewsCount: 45,
      tags: ['ด่วน', 'ICU', 'เวรดึก'],
    },
    {
      id: '2',
      title: 'รับสมัครงาน OR หัวหิน',
      posterName: 'นุ่น พยาบาล',
      posterId: 'u2',
      posterPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
      department: 'OR',
      description: 'ไปทำ Part time ที่หัวหิน ค่าตอบแทนดี รับหลายวันได้',
      shiftRate: 350,
      rateType: 'hour',
      shiftDate: nextWeek,
      shiftTime: '08:00-20:00',
      location: {
        province: 'ประจวบคีรีขันธ์',
        district: 'หัวหิน',
        hospital: 'รพ.หัวหิน',
      },
      contactPhone: '081-234-5678',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(),
      status: 'active',
      viewsCount: 28,
    },
    {
      id: '3',
      title: 'หาคนแทนเวรเช้า ER',
      posterName: 'อาร์ม RN',
      posterId: 'u3',
      posterPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
      department: 'ER',
      description: 'ติดสอบ หาคนแทนเวรเช้าครับ ER busy มาก',
      shiftRate: 1800,
      rateType: 'shift',
      shiftDate: tomorrow,
      shiftTime: '08:00-16:00',
      location: {
        province: 'กรุงเทพมหานคร',
        district: 'ห้วยขวาง',
        hospital: 'รพ.กรุงเทพ',
      },
      contactPhone: '082-345-6789',
      contactLine: 'arm_nurse',
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(),
      status: 'active',
      viewsCount: 15,
    },
    {
      id: '4',
      title: 'รับงาน Part time วอร์ด Med',
      posterName: 'เจน พยาบาล',
      posterId: 'u4',
      posterPhoto: 'https://randomuser.me/api/portraits/women/22.jpg',
      department: 'Med',
      description: 'วอร์ดอายุรกรรม ผู้ป่วยไม่หนัก รับได้หลายวัน',
      shiftRate: 1500,
      rateType: 'shift',
      shiftDate: nextWeek,
      shiftTime: '16:00-00:00',
      location: {
        province: 'นนทบุรี',
        district: 'เมืองนนทบุรี',
        hospital: 'รพ.นนทเวช',
      },
      contactPhone: '083-456-7890',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(),
      status: 'active',
      viewsCount: 32,
    },
    {
      id: '5',
      title: '🔥 ด่วน! หาคนแทนเวรบ่าย Pedia',
      posterName: 'มิ้นท์ RN',
      posterId: 'u5',
      posterPhoto: 'https://randomuser.me/api/portraits/women/55.jpg',
      department: 'Pediatric',
      description: 'วอร์ดเด็ก ผู้ป่วย 10 เตียง มี NA 2 คน ช่วยงาน',
      shiftRate: 1700,
      rateType: 'shift',
      shiftDate: today,
      shiftTime: '16:00-00:00',
      location: {
        province: 'กรุงเทพมหานคร',
        district: 'บางกะปิ',
        hospital: 'รพ.เปาโล เมโมเรียล',
      },
      contactPhone: '084-567-8901',
      contactLine: '@mint_pedia',
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(),
      status: 'urgent',
      viewsCount: 67,
      tags: ['ด่วน', 'เด็ก', 'เวรบ่าย'],
    },
    {
      id: '6',
      title: 'รับสมัครเวรดึก OPD คลินิก',
      posterName: 'ก้อย พยาบาล',
      posterId: 'u6',
      posterPhoto: 'https://randomuser.me/api/portraits/women/33.jpg',
      department: 'OPD',
      description: 'คลินิกเปิด 24 ชม. งานไม่หนัก มีหมอ 1 คน',
      shiftRate: 250,
      rateType: 'hour',
      shiftDate: tomorrow,
      shiftTime: '00:00-08:00',
      location: {
        province: 'สมุทรปราการ',
        district: 'บางพลี',
        hospital: 'คลินิกสุขภาพ 24 ชม.',
      },
      contactPhone: '085-678-9012',
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(),
      status: 'active',
      viewsCount: 18,
    },
  ];
}
