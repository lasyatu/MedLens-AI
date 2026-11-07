/**
 * Firestore Scan Storage Service
 * Persists scans under /users/{uid}/scans/{scanId} with error handling
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
import { db, handleFirestoreError, OperationType } from './firebase';
import { SourceCitation } from './authoritativeData';
import { RetrievalResult } from './ragEngine';

export interface SavedScanRecord {
  id: string;
  userId: string;
  medicineName: string;
  genericName?: string;
  brandName?: string;
  dosage?: string;
  jurisdiction?: string;
  extractedText: string;
  summary?: string;
  uses?: string[];
  warnings?: string[];
  precautions?: string[];
  boxedWarning?: string;
  sources?: SourceCitation[];
  ragEvidence?: {
    sectionTitle: string;
    content: string;
    similarityScore: number;
    sourceTitle: string;
    sourceUrl: string;
  }[];
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'medlens_local_scans_';

/**
 * Save scan to Firestore under authenticated user path
 */
export async function saveScanRecord(userId: string, scanData: Omit<SavedScanRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SavedScanRecord> {
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: SavedScanRecord = {
    ...scanData,
    id: scanId,
    userId,
    createdAt: now,
    updatedAt: now
  };

  const path = `users/${userId}/scans/${scanId}`;
  try {
    const scanDocRef = doc(db, 'users', userId, 'scans', scanId);
    await setDoc(scanDocRef, record);
  } catch (error) {
    console.warn('Firestore write warning, backing up locally:', error);
    // Store in localStorage backup
    try {
      const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
      const existing: SavedScanRecord[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      existing.unshift(record);
      localStorage.setItem(localKey, JSON.stringify(existing));
    } catch (e) {
      // ignore local storage error
    }
    // Still trigger handleFirestoreError for security logging
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  return record;
}

/**
 * Fetch all scans belonging to user from Firestore
 */
export async function getUserScans(userId: string): Promise<SavedScanRecord[]> {
  const path = `users/${userId}/scans`;
  try {
    const scansColRef = collection(db, 'users', userId, 'scans');
    const q = query(scansColRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const records: SavedScanRecord[] = [];
    snapshot.forEach((d) => {
      records.push(d.data() as SavedScanRecord);
    });

    // Also merge any local offline backups if present
    const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    try {
      const local: SavedScanRecord[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      for (const loc of local) {
        if (!records.some(r => r.id === loc.id)) {
          records.push(loc);
        }
      }
    } catch (e) {}

    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Firestore fetch warning, reading local storage:', error);
    const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    try {
      const local: SavedScanRecord[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      return local;
    } catch (e) {
      return [];
    }
  }
}

/**
 * Delete a specific scan
 */
export async function deleteUserScan(userId: string, scanId: string): Promise<void> {
  const path = `users/${userId}/scans/${scanId}`;
  try {
    const scanDocRef = doc(db, 'users', userId, 'scans', scanId);
    await deleteDoc(scanDocRef);
  } catch (error) {
    console.warn('Firestore delete error:', error);
  }

  // Also remove from local backup
  const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  try {
    const existing: SavedScanRecord[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    const filtered = existing.filter(s => s.id !== scanId);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  } catch (e) {}
}

/**
 * Delete all scans for account privacy / data deletion
 */
export async function deleteAllUserScans(userId: string): Promise<number> {
  const scans = await getUserScans(userId);
  let deletedCount = 0;
  for (const scan of scans) {
    await deleteUserScan(userId, scan.id);
    deletedCount++;
  }
  return deletedCount;
}
