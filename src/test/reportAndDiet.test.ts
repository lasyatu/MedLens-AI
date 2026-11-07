import { test } from 'node:test';
import assert from 'node:assert';
import {
  determineFlag,
  parseLabReportText,
  SAMPLE_REPORTS
} from '../lib/reportParser';
import {
  getHydrationRecommendation,
  INDIAN_NUTRITIONAL_ITEMS
} from '../lib/dietaryGuidelines';

test('determineFlag returns accurate clinical thresholds', () => {
  assert.strictEqual(determineFlag(95, 70, 99), 'NORMAL');
  assert.strictEqual(determineFlag(135, 70, 99), 'HIGH');
  assert.strictEqual(determineFlag(55, 70, 99), 'LOW');
  assert.strictEqual(determineFlag(undefined, 70, 99), 'INDETERMINATE');
  assert.strictEqual(determineFlag(NaN, 70, 99), 'INDETERMINATE');
});

test('parseLabReportText parses diabetic metabolic sample and flags high glucose and hba1c', () => {
  const result = parseLabReportText(SAMPLE_REPORTS.metabolic_diabetes.rawText, 'Metabolic Panel');
  assert.ok(result.metrics.length >= 3, 'Should extract at least 3 parameters');

  const fbs = result.metrics.find((m) => m.testName.toLowerCase().includes('fasting'));
  assert.ok(fbs, 'Fasting blood sugar must be detected');
  assert.strictEqual(fbs.flag, 'HIGH', 'FBS of 138 must be flagged HIGH');

  const hba1c = result.metrics.find((m) => m.testName.toLowerCase().includes('hba1c'));
  assert.ok(hba1c, 'HbA1c must be detected');
  assert.strictEqual(hba1c.flag, 'HIGH', 'HbA1c of 7.1% must be flagged HIGH');

  assert.ok(result.abnormalCount >= 2, 'Should identify abnormal parameters');
  assert.ok(result.sources.length > 0, 'Must include ICMR or clinical sources');
});

test('parseLabReportText parses CBC anemia sample and flags low hemoglobin', () => {
  const result = parseLabReportText(SAMPLE_REPORTS.cbc_anemia.rawText, 'CBC Test');
  const hb = result.metrics.find((m) => m.testName.toLowerCase().includes('hemoglobin'));
  assert.ok(hb, 'Hemoglobin must be detected');
  assert.strictEqual(hb.flag, 'LOW', 'Hemoglobin of 10.2 must be flagged LOW');
});

test('getHydrationRecommendation calculates sensible daily liters in tropical climate', () => {
  const plan60 = getHydrationRecommendation(60);
  assert.ok(plan60.dailyTargetLiters >= 2.2 && plan60.dailyTargetLiters <= 3.0);
  assert.ok(plan60.tips.length >= 3);
  assert.ok(plan60.signsOfDehydration.length >= 3);
});

test('INDIAN_NUTRITIONAL_ITEMS contains authentic millets and greens with Telugu names', () => {
  const ragi = INDIAN_NUTRITIONAL_ITEMS.find((f) => f.id === 'ragi_finger_millet');
  assert.ok(ragi, 'Ragi must exist');
  assert.ok(ragi.teluguName?.includes('రాగులు'));
  assert.strictEqual(ragi.glycemicIndex, 'Low');

  const majjiga = INDIAN_NUTRITIONAL_ITEMS.find((f) => f.id === 'curd_buttermilk');
  assert.ok(majjiga, 'Majjiga must exist');
  assert.ok(majjiga.teluguName?.includes('మజ్జిగ'));
});
