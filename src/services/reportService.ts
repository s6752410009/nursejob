// ============================================
// REPORT SERVICE - ระบบรายงาน
// ============================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// Types
// ============================================
export type ReportType = 'job' | 'user' | 'message';
export type ReportReason = 
  | 'spam'
  | 'inappropriate'
  | 'fake'
  | 'harassment'
  | 'scam'
  | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id?: string;
  type: ReportType;
  reason: ReportReason;
  reasonText?: string; // รายละเอียดเพิ่มเติม
  
  // ผู้รายงาน
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  
  // เป้าหมายที่ถูกรายงาน
  targetId: string;
  targetType: ReportType;
  targetName?: string; // ชื่อ job/user/message
  targetDescription?: string;
  
  // สถานะ
  status: ReportStatus;
  createdAt: Date | Timestamp;
  
  // Admin review
  reviewedAt?: Date | Timestamp;
  reviewedBy?: string;
  reviewNote?: string;
  actionTaken?: string;
}

// ============================================
// Constants
// ============================================
const REPORTS_COLLECTION = 'reports';

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'สแปม', description: 'ข้อความหรือประกาศที่ส่งซ้ำๆ' },
  { value: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม', description: 'เนื้อหาหยาบคาย รุนแรง หรือลามก' },
  { value: 'fake', label: 'ข้อมูลเท็จ', description: 'ข้อมูลไม่ตรงกับความจริง หลอกลวง' },
  { value: 'harassment', label: 'คุกคาม', description: 'ก่อกวน ข่มขู่ หรือคุกคาม' },
  { value: 'scam', label: 'หลอกลวง', description: 'พยายามหลอกลวงเงินหรือข้อมูล' },
  { value: 'other', label: 'อื่นๆ', description: 'เหตุผลอื่นที่ไม่อยู่ในรายการ' },
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'รอตรวจสอบ',
  reviewed: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
  dismissed: 'ยกเลิก',
};

// ============================================
// Create Report
// ============================================
export async function createReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...report,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating report:', error);
    throw new Error('ไม่สามารถส่งรายงานได้');
  }
}

// ============================================
// Get All Reports (Admin)
// ============================================
export async function getAllReports(maxLimit = 50): Promise<Report[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxLimit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as Report;
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
}

// ============================================
// Get Pending Reports (Admin)
// ============================================
export async function getPendingReports(): Promise<Report[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Report;
    });
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
}

// ============================================
// Update Report Status (Admin)
// ============================================
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewedBy: string,
  reviewNote?: string,
  actionTaken?: string
): Promise<void> {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, reportId);
    
    await updateDoc(docRef, {
      status,
      reviewedBy,
      reviewedAt: serverTimestamp(),
      ...(reviewNote && { reviewNote }),
      ...(actionTaken && { actionTaken }),
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw new Error('ไม่สามารถอัปเดตสถานะได้');
  }
}

// ============================================
// Get Reports By Target
// ============================================
export async function getReportsByTarget(targetId: string, targetType: ReportType): Promise<Report[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as Report;
    });
  } catch (error) {
    console.error('Error getting reports by target:', error);
    return [];
  }
}

// ============================================
// Get Reports Count By Target
// ============================================
export async function getReportCountByTarget(targetId: string, targetType: ReportType): Promise<number> {
  try {
    const reports = await getReportsByTarget(targetId, targetType);
    return reports.length;
  } catch (error) {
    console.error('Error getting report count:', error);
    return 0;
  }
}

// ============================================
// Check If User Already Reported
// ============================================
export async function hasUserReported(reporterId: string, targetId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('reporterId', '==', reporterId),
      where('targetId', '==', targetId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if user reported:', error);
    return false;
  }
}
