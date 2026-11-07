/**
 * Medical Report persistence via Firebase Firestore and local storage backup
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { LabTestMetric } from './reportParser';

export interface SavedReportRecord {
  id: string;
  userId: string;
  reportTitle: string;
  reportDate: string;
  extractedText: string;
  testResults: LabTestMetric[];
  summary: string;
  consentToStore: boolean;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_REPORTS_KEY = 'medlens_offline_reports';

export async function saveUserReport(
  userId: string,
  report: Omit<SavedReportRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SavedReportRecord> {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: SavedReportRecord = {
    ...report,
    id: reportId,
    userId,
    createdAt: now,
    updatedAt: now
  };

  try {
    const existing = getLocalReports(userId);
    localStorage.setItem(
      `${LOCAL_STORAGE_REPORTS_KEY}_${userId}`,
      JSON.stringify([record, ...existing])
    );
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }

  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'reports', reportId);
      await setDoc(docRef, record);
    } catch (firebaseErr) {
      console.warn('Firestore report save note (local fallback active):', firebaseErr);
    }
  }

  return record;
}

export async function getUserReports(userId: string): Promise<SavedReportRecord[]> {
  const local = getLocalReports(userId);

  if (!db || !userId) {
    return local;
  }

  try {
    const q = query(
      collection(db, 'users', userId, 'reports'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const firestoreRecords: SavedReportRecord[] = [];
    snap.forEach((d) => {
      firestoreRecords.push(d.data() as SavedReportRecord);
    });

    if (firestoreRecords.length > 0) {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_REPORTS_KEY}_${userId}`,
          JSON.stringify(firestoreRecords)
        );
      } catch (e) {
        // ignore
      }
      return firestoreRecords;
    }
  } catch (err) {
    console.warn('Firestore fetch reports note (using local cache):', err);
  }

  return local;
}

export async function deleteUserReport(userId: string, reportId: string): Promise<void> {
  const local = getLocalReports(userId);
  const filtered = local.filter((r) => r.id !== reportId);
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_REPORTS_KEY}_${userId}`,
      JSON.stringify(filtered)
    );
  } catch (e) {
    // ignore
  }

  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'reports', reportId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete report warning:', err);
    }
  }
}

function getLocalReports(userId: string): SavedReportRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_REPORTS_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return [];
}
