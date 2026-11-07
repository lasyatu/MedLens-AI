/**
 * Medication Schedule & Reminder Notifications Service
 * Persists schedules under /users/{userId}/schedules/{scheduleId} in Firestore
 * with robust local storage caching & offline resilience.
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

export interface MedicationSchedule {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  dosageForm?: string; // Tablet, Capsule, Syrup, etc.
  frequency: 'daily' | 'weekly' | 'as_needed';
  times: string[]; // e.g. ["08:00", "14:00", "20:00"]
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  mealTiming?: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  startDate?: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
  lastTakenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoseAlert {
  scheduleId: string;
  medicineName: string;
  dosage: string;
  mealTiming: string;
  scheduledTime: string; // "14:00"
  timeFormatted: string; // "2:00 PM"
  isToday: boolean;
  isOverdue: boolean;
  isDueSoon: boolean; // within 60 mins
  minutesDiff: number; // minutes from now (negative = past due)
  instructions?: string;
  lastTakenAt?: string;
  isTakenToday: boolean;
}

const LOCAL_SCHEDULES_KEY = 'medlens_offline_medication_schedules';
const inMemorySchedules: MedicationSchedule[] = [];

function getStoredSchedules(): MedicationSchedule[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LOCAL_SCHEDULES_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  } catch {}
  return [...inMemorySchedules];
}

function saveStoredSchedules(list: MedicationSchedule[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_SCHEDULES_KEY, JSON.stringify(list));
    }
  } catch {}
  inMemorySchedules.length = 0;
  inMemorySchedules.push(...list);
}

/**
 * Format 24-hr time (HH:MM) to readable 12-hr time (e.g. "8:00 AM", "2:30 PM")
 */
export function formatTime12H(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const minutes = mStr.padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

/**
 * Save a new medication schedule
 */
export async function saveMedicationSchedule(
  userId: string,
  scheduleData: {
    medicineName: string;
    dosage: string;
    dosageForm?: string;
    frequency: 'daily' | 'weekly' | 'as_needed';
    times: string[];
    daysOfWeek?: number[];
    mealTiming?: 'before_food' | 'after_food' | 'with_food' | 'anytime';
    startDate?: string;
    endDate?: string;
    instructions?: string;
    isActive?: boolean;
  }
): Promise<MedicationSchedule> {
  const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  const record: MedicationSchedule = {
    id: scheduleId,
    userId,
    medicineName: scheduleData.medicineName.trim(),
    dosage: scheduleData.dosage.trim(),
    dosageForm: scheduleData.dosageForm?.trim() || undefined,
    frequency: scheduleData.frequency,
    times: scheduleData.times.length > 0 ? scheduleData.times : ['08:00'],
    daysOfWeek: scheduleData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    mealTiming: scheduleData.mealTiming || 'after_food',
    startDate: scheduleData.startDate || todayStr,
    endDate: scheduleData.endDate || '',
    instructions: scheduleData.instructions?.trim() || '',
    isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
    lastTakenAt: '',
    createdAt: now,
    updatedAt: now
  };

  // 1. Local / In-memory backup
  try {
    const existing = getStoredSchedules();
    existing.unshift(record);
    saveStoredSchedules(existing);
  } catch (e) {
    console.warn('Local storage write warning for schedule:', e);
  }

  // 2. Firestore write under users/{userId}/schedules/{scheduleId}
  if (db && userId) {
    const path = `users/${userId}/schedules/${scheduleId}`;
    try {
      const docRef = doc(db, 'users', userId, 'schedules', scheduleId);
      await setDoc(docRef, record);
    } catch (err) {
      console.warn('Firestore schedule write warning (local backup preserved):', err);
      if (typeof window !== 'undefined') {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  }

  return record;
}

/**
 * Fetch all medication schedules for user
 */
export async function getUserSchedules(userId: string): Promise<MedicationSchedule[]> {
  const localList = getStoredSchedules();

  if (!db || !userId) {
    return localList;
  }

  try {
    const schedulesCol = collection(db, 'users', userId, 'schedules');
    const q = query(schedulesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const remoteList: MedicationSchedule[] = [];
    snap.forEach((d) => {
      remoteList.push(d.data() as MedicationSchedule);
    });

    if (remoteList.length > 0) {
      // Sync local cache
      saveStoredSchedules(remoteList);
      return remoteList;
    }
  } catch (err) {
    console.warn('Firestore schedules read error, falling back to local storage:', err);
  }

  return localList;
}

/**
 * Update an existing medication schedule
 */
export async function updateMedicationSchedule(
  userId: string,
  scheduleId: string,
  updates: Partial<MedicationSchedule>
): Promise<void> {
  const now = new Date().toISOString();

  // Update local storage
  try {
    const existing = getStoredSchedules();
    const index = existing.findIndex((s) => s.id === scheduleId);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates, updatedAt: now };
      saveStoredSchedules(existing);
    }
  } catch (e) {}

  // Update Firestore
  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'schedules', scheduleId);
      await setDoc(
        docRef,
        {
          ...updates,
          updatedAt: now
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore schedule update error:', err);
    }
  }
}

/**
 * Delete a medication schedule
 */
export async function deleteMedicationSchedule(userId: string, scheduleId: string): Promise<void> {
  // Delete from local storage
  try {
    const existing = getStoredSchedules();
    const filtered = existing.filter((s) => s.id !== scheduleId);
    saveStoredSchedules(filtered);
  } catch (e) {}

  // Delete from Firestore
  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'schedules', scheduleId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore schedule delete error:', err);
    }
  }
}

/**
 * Mark a dose as taken right now
 */
export async function markDoseTaken(userId: string, scheduleId: string): Promise<void> {
  const now = new Date().toISOString();
  await updateMedicationSchedule(userId, scheduleId, { lastTakenAt: now });
}

/**
 * Calculate upcoming doses for a given reference date (defaults to current time)
 * Sorts with overdue and imminent doses at the top.
 */
export function getUpcomingDoses(
  schedules: MedicationSchedule[],
  referenceDate: Date = new Date()
): DoseAlert[] {
  const activeSchedules = schedules.filter((s) => s.isActive);
  const currentDayOfWeek = referenceDate.getDay();
  const currentHours = referenceDate.getHours();
  const currentMinutes = referenceDate.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const todayDateString = referenceDate.toISOString().split('T')[0];

  const alerts: DoseAlert[] = [];

  for (const sched of activeSchedules) {
    // Check if schedule applies to today
    const appliesToday =
      sched.frequency === 'daily' ||
      (sched.frequency === 'weekly' && sched.daysOfWeek?.includes(currentDayOfWeek));

    if (!appliesToday) continue;

    // Check if taken today (lastTakenAt within today)
    const isTakenToday = Boolean(
      sched.lastTakenAt && sched.lastTakenAt.startsWith(todayDateString)
    );

    for (const time24 of sched.times) {
      const [hStr, mStr] = time24.split(':');
      const doseHours = parseInt(hStr, 10);
      const doseMinutes = parseInt(mStr || '0', 10);
      const doseTotalMinutes = doseHours * 60 + doseMinutes;

      const diff = doseTotalMinutes - currentTotalMinutes; // positive: in future, negative: past
      const isOverdue = diff < -15 && !isTakenToday;
      const isDueSoon = diff >= -15 && diff <= 60;

      alerts.push({
        scheduleId: sched.id,
        medicineName: sched.medicineName,
        dosage: sched.dosage,
        mealTiming: sched.mealTiming || 'after_food',
        scheduledTime: time24,
        timeFormatted: formatTime12H(time24),
        isToday: true,
        isOverdue,
        isDueSoon,
        minutesDiff: diff,
        instructions: sched.instructions,
        lastTakenAt: sched.lastTakenAt,
        isTakenToday
      });
    }
  }

  // Sort: untaken doses closest to now first (due soon -> overdue -> upcoming later -> taken)
  return alerts.sort((a, b) => {
    if (a.isTakenToday !== b.isTakenToday) {
      return a.isTakenToday ? 1 : -1;
    }
    if (a.isDueSoon !== b.isDueSoon) {
      return a.isDueSoon ? -1 : 1;
    }
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }
    return Math.abs(a.minutesDiff) - Math.abs(b.minutesDiff);
  });
}

/**
 * Get the single most immediate next upcoming dose alert
 */
export function getNextImmediateDose(
  schedules: MedicationSchedule[],
  referenceDate: Date = new Date()
): DoseAlert | null {
  const alerts = getUpcomingDoses(schedules, referenceDate);
  const untaken = alerts.filter((a) => !a.isTakenToday);
  return untaken.length > 0 ? untaken[0] : (alerts[0] || null);
}
