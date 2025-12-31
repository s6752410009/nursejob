// ============================================
// SHIFT CONTACTS SERVICE - For Posters
// ============================================

import {
  collection,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShiftContact, JobPost } from '../types';
import { getUserProfile } from './authService';

const CONTACTS_COLLECTION = 'shift_contacts';
const SHIFTS_COLLECTION = 'shifts';

export type ContactStatus = 'interested' | 'confirmed' | 'cancelled';

export interface ApplicantDetails {
  id: string;
  jobId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  message?: string;
  status: ContactStatus;
  contactedAt: Date;
  job?: JobPost;
  userProfile?: {
    id: string;
    displayName: string;
    email: string;
    phone?: string;
    photoURL?: string;
    licenseNumber?: string;
    experience?: number;
    skills?: string[];
    bio?: string;
  };
}

// Get all contacts for user's posted shifts
export async function getHospitalApplications(posterId: string): Promise<ApplicantDetails[]> {
  try {
    // First get all shifts posted by this user
    const shiftsQuery = query(
      collection(db, SHIFTS_COLLECTION),
      where('posterId', '==', posterId)
    );
    const shiftsSnapshot = await getDocs(shiftsQuery);
    const shiftIds = shiftsSnapshot.docs.map(doc => doc.id);
    
    if (shiftIds.length === 0) return [];

    // Get all contacts for these shifts
    const contacts: ApplicantDetails[] = [];
    
    for (const shiftId of shiftIds) {
      const contactsQuery = query(
        collection(db, CONTACTS_COLLECTION),
        where('jobId', '==', shiftId),
        orderBy('contactedAt', 'desc')
      );
      const contactsSnapshot = await getDocs(contactsQuery);
      
      const shiftDoc = shiftsSnapshot.docs.find(d => d.id === shiftId);
      const shiftData = shiftDoc?.data();
      
      for (const contactDoc of contactsSnapshot.docs) {
        const contactData = contactDoc.data();
        const userProfile = await getUserProfile(contactData.interestedUserId);
        
        contacts.push({
          id: contactDoc.id,
          jobId: contactData.jobId,
          userId: contactData.interestedUserId,
          userName: contactData.interestedUserName,
          userPhone: contactData.interestedUserPhone,
          message: contactData.message,
          status: contactData.status || 'interested',
          contactedAt: (contactData.contactedAt as Timestamp)?.toDate() || new Date(),
          job: shiftData ? {
            id: shiftId,
            title: shiftData.title,
            posterName: shiftData.posterName,
            posterId: shiftData.posterId,
            department: shiftData.department,
            shiftRate: shiftData.shiftRate,
            rateType: shiftData.rateType,
            shiftDate: shiftData.shiftDate?.toDate() || new Date(),
            shiftTime: shiftData.shiftTime,
            status: shiftData.status,
            createdAt: shiftData.createdAt?.toDate() || new Date(),
          } as JobPost : undefined,
          userProfile: userProfile ? {
            id: userProfile.id,
            displayName: userProfile.displayName,
            email: userProfile.email,
            phone: userProfile.phone,
            photoURL: userProfile.photoURL || undefined,
            licenseNumber: userProfile.licenseNumber,
            experience: userProfile.experience,
            skills: userProfile.skills,
            bio: userProfile.bio,
          } : undefined,
        });
      }
    }
    
    return contacts.sort((a, b) => b.contactedAt.getTime() - a.contactedAt.getTime());
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
}

// Get contacts for specific shift
export async function getJobApplications(shiftId: string): Promise<ApplicantDetails[]> {
  try {
    const q = query(
      collection(db, CONTACTS_COLLECTION),
      where('jobId', '==', shiftId),
      orderBy('contactedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const contacts: ApplicantDetails[] = [];
    
    for (const contactDoc of snapshot.docs) {
      const contactData = contactDoc.data();
      const userProfile = await getUserProfile(contactData.interestedUserId);
      
      contacts.push({
        id: contactDoc.id,
        jobId: contactData.jobId,
        userId: contactData.interestedUserId,
        userName: contactData.interestedUserName,
        userPhone: contactData.interestedUserPhone,
        message: contactData.message,
        status: contactData.status || 'interested',
        contactedAt: (contactData.contactedAt as Timestamp)?.toDate() || new Date(),
        userProfile: userProfile ? {
          id: userProfile.id,
          displayName: userProfile.displayName,
          email: userProfile.email,
          phone: userProfile.phone,
          photoURL: userProfile.photoURL || undefined,
          licenseNumber: userProfile.licenseNumber,
          experience: userProfile.experience,
          skills: userProfile.skills,
          bio: userProfile.bio,
        } : undefined,
      });
    }
    
    return contacts;
  } catch (error) {
    console.error('Error getting shift contacts:', error);
    return [];
  }
}

// Update contact status
export async function updateApplicationStatus(
  contactId: string, 
  status: ContactStatus, 
  updatedBy?: string
): Promise<void> {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(docRef, { 
      status,
      updatedAt: serverTimestamp(),
      updatedBy,
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    throw error;
  }
}

// Get statistics for poster's shifts
export async function getApplicationStats(posterId: string): Promise<{
  interested: number;
  confirmed: number;
  cancelled: number;
  total: number;
}> {
  try {
    const contacts = await getHospitalApplications(posterId);
    
    return {
      interested: contacts.filter(c => c.status === 'interested').length,
      confirmed: contacts.filter(c => c.status === 'confirmed').length,
      cancelled: contacts.filter(c => c.status === 'cancelled').length,
      total: contacts.length,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { interested: 0, confirmed: 0, cancelled: 0, total: 0 };
  }
}
