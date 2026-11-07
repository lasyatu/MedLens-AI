import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReportHtml } from '../lib/pdfGenerator';
import { submitScanFeedback, updateFeedbackReview, getUserFeedbackList } from '../lib/feedbackStorage';
import { AUTHORITATIVE_MEDICINES } from '../lib/authoritativeData';
import { LabTestMetric } from '../lib/reportParser';

test('generateReportHtml includes laboratory parameters, out-of-range badges, and safety disclaimers', () => {
  const sampleMetrics: LabTestMetric[] = [
    {
      id: 'm1',
      testName: 'Fasting Blood Glucose',
      category: 'Metabolic',
      value: 142,
      numericValue: 142,
      unit: 'mg/dL',
      referenceRange: '70 - 99',
      lowNormal: 70,
      highNormal: 99,
      flag: 'HIGH',
      plainExplanation: 'Elevated fasting blood sugar.',
      clinicalContext: 'Indicates hyperglycemia. Repeat testing recommended.'
    },
    {
      id: 'm2',
      testName: 'Hemoglobin',
      category: 'Hematology',
      value: 13.5,
      numericValue: 13.5,
      unit: 'g/dL',
      referenceRange: '12.0 - 15.5',
      lowNormal: 12.0,
      highNormal: 15.5,
      flag: 'NORMAL',
      plainExplanation: 'Normal red blood cell oxygen carrier.',
      clinicalContext: 'Normal oxygen delivery biomarker.'
    }
  ];

  const html = generateReportHtml({
    reportTitle: 'Comprehensive Metabolic Panel',
    reportDate: '2026-11-07',
    metrics: sampleMetrics,
    summary: '1 of 2 parameters out of range.',
    abnormalCount: 1
  });

  assert.ok(html.includes('Comprehensive Metabolic Panel'), 'Title should appear in HTML');
  assert.ok(html.includes('Fasting Blood Glucose'), 'High parameter should be present');
  assert.ok(html.includes('HIGH'), 'Flag badge should be rendered');
  assert.ok(html.includes('142'), 'Value should be rendered');
  assert.ok(html.includes('Medical Safety Notice'), 'Safety notice must be included');
  assert.ok(html.includes('Recommended Questions to Ask Your Prescribing Physician'), 'Doctor questions should be included');
});

test('submitScanFeedback records feedback and clamps star ratings between 1 and 5', async () => {
  const record = await submitScanFeedback('test-user-123', 'patient@example.com', {
    medicineName: 'Paracetamol',
    accuracyRating: 6, // Should clamp to 5
    helpfulnessRating: 0, // Should clamp to 1
    feedbackCategory: 'ocr_accuracy',
    comment: 'OCR misread 650mg as 500mg'
  });

  assert.strictEqual(record.accuracyRating, 5, 'Accuracy should be clamped to 5');
  assert.strictEqual(record.helpfulnessRating, 1, 'Helpfulness should be clamped to 1');
  assert.strictEqual(record.feedbackCategory, 'ocr_accuracy');
  assert.strictEqual(record.status, 'new');
  assert.strictEqual(record.comment, 'OCR misread 650mg as 500mg');
  assert.ok(record.id.startsWith('fb_'), 'Feedback ID should start with fb_');
});

test('updateFeedbackReview updates status to reviewed or resolved with developer notes', async () => {
  const record = await submitScanFeedback('test-user-dev', 'dev@example.com', {
    medicineName: 'Amoxicillin',
    accuracyRating: 4,
    helpfulnessRating: 5,
    feedbackCategory: 'explanation_clarity',
    comment: 'Telugu explanation is very clear'
  });

  await updateFeedbackReview('test-user-dev', record.id, 'reviewed', 'Triage: Verified Telugu grammar');
  const userList = await getUserFeedbackList('test-user-dev');
  const updated = userList.find((f) => f.id === record.id);

  assert.ok(updated, 'Record should exist in user feedback list');
  assert.strictEqual(updated?.status, 'reviewed');
  assert.strictEqual(updated?.developerNotes, 'Triage: Verified Telugu grammar');
});

test('AUTHORITATIVE_MEDICINES citations contain verifiable statutory metadata and URLs', () => {
  for (const med of AUTHORITATIVE_MEDICINES) {
    assert.ok(med.sources && med.sources.length > 0, `${med.medicineName} must have source citations`);
    for (const src of med.sources) {
      assert.ok(src.title, 'Source citation must have title');
      assert.ok(src.publisher, 'Source citation must have publisher');
      assert.ok(src.jurisdiction, 'Source citation must have jurisdiction');
      assert.ok(src.url && src.url.startsWith('http'), 'Source citation must have valid http URL');
      assert.ok(src.documentId, 'Source citation must have document ID for regulatory verification');
    }
  }
});
