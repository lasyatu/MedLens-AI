import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime12H,
  getUpcomingDoses,
  getNextImmediateDose,
  saveMedicationSchedule,
  markDoseTaken,
  MedicationSchedule
} from '../lib/scheduleStorage';

test('formatTime12H converts 24h string to 12h AM/PM representation correctly', () => {
  assert.equal(formatTime12H('08:00'), '8:00 AM');
  assert.equal(formatTime12H('13:30'), '1:30 PM');
  assert.equal(formatTime12H('00:00'), '12:00 AM');
  assert.equal(formatTime12H('12:00'), '12:00 PM');
  assert.equal(formatTime12H('20:45'), '8:45 PM');
  assert.equal(formatTime12H(''), '');
});

test('getUpcomingDoses returns alerts for active daily schedules', () => {
  const dummySchedule: MedicationSchedule = {
    id: 'sched-1',
    userId: 'user-123',
    medicineName: 'Metformin',
    dosage: '500 mg',
    dosageForm: 'Tablet',
    frequency: 'daily',
    times: ['09:00', '21:00'],
    mealTiming: 'after_food',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const doses = getUpcomingDoses([dummySchedule]);
  assert.equal(doses.length, 2);
  assert.equal(doses[0].medicineName, 'Metformin');
  assert.ok(doses.some(d => d.scheduledTime === '09:00'));
  assert.ok(doses.some(d => d.scheduledTime === '21:00'));
  assert.equal(doses[0].dosage, '500 mg');
  assert.equal(doses[0].mealTiming, 'after_food');
});

test('getUpcomingDoses ignores inactive schedules', () => {
  const inactiveSchedule: MedicationSchedule = {
    id: 'sched-inactive',
    userId: 'user-123',
    medicineName: 'Amoxicillin',
    dosage: '250 mg',
    frequency: 'daily',
    times: ['08:00'],
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const doses = getUpcomingDoses([inactiveSchedule]);
  assert.equal(doses.length, 0);
});

test('getUpcomingDoses respects weekly day filters', () => {
  const today = new Date().getDay(); // 0-6
  const otherDay = (today + 1) % 7;

  const matchingSchedule: MedicationSchedule = {
    id: 'sched-today',
    userId: 'user-123',
    medicineName: 'Vitamin D3',
    dosage: '60000 IU',
    frequency: 'weekly',
    daysOfWeek: [today],
    times: ['10:00'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const nonMatchingSchedule: MedicationSchedule = {
    id: 'sched-other',
    userId: 'user-123',
    medicineName: 'Methotrexate',
    dosage: '10 mg',
    frequency: 'weekly',
    daysOfWeek: [otherDay],
    times: ['10:00'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const doses = getUpcomingDoses([matchingSchedule, nonMatchingSchedule]);
  assert.equal(doses.length, 1);
  assert.equal(doses[0].medicineName, 'Vitamin D3');
});

test('getUpcomingDoses correctly marks dose as completed if taken today', () => {
  const now = new Date().toISOString();
  const schedule: MedicationSchedule = {
    id: 'sched-taken',
    userId: 'user-123',
    medicineName: 'Paracetamol',
    dosage: '650 mg',
    frequency: 'daily',
    times: ['08:00'],
    isActive: true,
    lastTakenAt: now,
    createdAt: now,
    updatedAt: now
  };

  const doses = getUpcomingDoses([schedule]);
  assert.equal(doses.length, 1);
  assert.equal(doses[0].isTakenToday, true);
});

test('getNextImmediateDose selects the earliest pending or overdue dose', () => {
  const schedule: MedicationSchedule = {
    id: 'sched-next',
    userId: 'user-123',
    medicineName: 'Amlodipine',
    dosage: '5 mg',
    frequency: 'daily',
    times: ['23:59'], // late in the day
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const nextDose = getNextImmediateDose([schedule]);
  assert.ok(nextDose);
  assert.equal(nextDose?.medicineName, 'Amlodipine');
  assert.equal(nextDose?.scheduledTime, '23:59');
});

test('saveMedicationSchedule creates a validated schedule in storage', async () => {
  const saved = await saveMedicationSchedule('test-user-id', {
    medicineName: 'Pantoprazole',
    dosage: '40 mg',
    dosageForm: 'Tablet',
    frequency: 'daily',
    times: ['07:30'],
    mealTiming: 'before_food',
    instructions: 'Take 30 minutes before breakfast'
  });

  assert.ok(saved.id);
  assert.equal(saved.medicineName, 'Pantoprazole');
  assert.equal(saved.dosage, '40 mg');
  assert.equal(saved.isActive, true);
  assert.equal(saved.userId, 'test-user-id');
  assert.ok(saved.createdAt);
  assert.ok(saved.updatedAt);
});
