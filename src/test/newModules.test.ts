import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeInteractionsOffline, checkDrugInteractions } from '../lib/interactionChecker';
import { generateRuleBasedAnalysis, SAMPLE_GENERAL_DOCUMENTS } from '../lib/generalReportAnalyzer';
import { compareMedicalReports, compareGeneralDocuments } from '../lib/reportComparison';
import { SAMPLE_REPORTS } from '../lib/reportParser';

// --- Interaction Checker Tests ---

test('analyzeInteractionsOffline detects severe risk between Aspirin and Ibuprofen', () => {
  const result = analyzeInteractionsOffline(['Aspirin 75mg', 'Ibuprofen 400mg']);
  assert.equal(result.overallRiskLevel, 'high');
  assert.ok(result.interactions.length >= 1);
  const severePair = result.interactions.find((p) => p.severity === 'severe');
  assert.ok(severePair);
  assert.ok(severePair.clinicalEffect.includes('bleeding') || severePair.clinicalEffect.includes('ulceration'));
  assert.ok(severePair.timingAdvice.length > 0);
  assert.ok(result.foodAndLifestyleWarnings.length > 0);
});

test('analyzeInteractionsOffline confirms compatible safety profile for Paracetamol and Amoxicillin', () => {
  const result = analyzeInteractionsOffline(['Paracetamol 650mg', 'Amoxicillin 500mg']);
  assert.equal(result.overallRiskLevel, 'safe');
  assert.ok(result.interactions.some((p) => p.severity === 'safe'));
});

test('analyzeInteractionsOffline prioritizes severe interactions before safe pairs', () => {
  const result = analyzeInteractionsOffline(['Aspirin 75mg', 'Ibuprofen 400mg', 'Paracetamol 650mg']);
  assert.ok(result.interactions.length >= 2);
  // First item must be severe
  assert.equal(result.interactions[0].severity, 'severe');
});

// --- General Report Analyzer Tests (11 Required Sections) ---

test('generateRuleBasedAnalysis generates all 11 required analytical sections', () => {
  const sample = SAMPLE_GENERAL_DOCUMENTS.ai_capstone;
  const analysis = generateRuleBasedAnalysis(sample.rawText, sample.title, sample.type);

  assert.ok(analysis.documentTitle);
  assert.ok(analysis.section1_summary.length > 20);
  assert.ok(analysis.section2_objectives.length >= 2);
  assert.ok(analysis.section3_findings.length >= 2);
  assert.ok(analysis.section4_observations.length >= 2);
  assert.ok(analysis.section5_numericalData.length > 0);
  assert.ok(analysis.section6_strengthsAndWeaknesses.strengths.length > 0);
  assert.ok(analysis.section6_strengthsAndWeaknesses.weaknesses.length > 0);
  assert.ok(analysis.section7_missingInfo.length > 0);
  assert.ok(analysis.section8_errorsAndInconsistencies.length > 0);
  assert.ok(analysis.section9_suggestionsForImprovement.length > 0);
  assert.ok(analysis.section10_detailedExplanations.length > 20);
  assert.ok(analysis.section11_finalConclusion.length > 20);
  assert.ok(analysis.summaryTelugu && analysis.summaryTelugu.length > 10);
  assert.ok(analysis.vivaQuestions.length >= 3);
  assert.ok(analysis.presentationPoints.length >= 3);
});

// --- Report Comparison Tests ---

test('compareMedicalReports calculates parameter delta and tracks improvements', () => {
  const reportA = SAMPLE_REPORTS.metabolic_diabetes.rawText;
  const reportB = `DIAGNOSTIC LABORATORY SERVICES
PATIENT REPORT: Follow-up Metabolic Panel
DATE: 2026-04-18

TEST NAME                     RESULT     UNITS      REFERENCE INTERVAL
Fasting Blood Glucose          110        mg/dL      70 - 99 (HIGH)
HbA1c Glycated Hemoglobin      6.5        %          4.0 - 5.6 (HIGH)
Total Serum Cholesterol        190        mg/dL      125 - 200 (NORMAL)`;

  const comp = compareMedicalReports(reportA, reportB, 'Baseline Jan', 'Followup Apr');
  assert.ok(comp.totalMetricsCompared >= 3);
  const fastingDiff = comp.metricDiffs.find((d) => d.testName.toLowerCase().includes('fasting'));
  assert.ok(fastingDiff);
  assert.ok(fastingDiff.deltaValue !== undefined);
  assert.ok(fastingDiff.deltaValue < 0); // Reduced from 138 to 110
  assert.equal(fastingDiff.trend, 'improved');
  assert.ok(comp.improvedCount >= 1);
});

test('compareGeneralDocuments identifies common sections and generates summary', () => {
  const docA = SAMPLE_GENERAL_DOCUMENTS.ai_capstone.rawText;
  const docB = SAMPLE_GENERAL_DOCUMENTS.business_quarterly.rawText;

  const comp = compareGeneralDocuments(docA, docB, 'AI Capstone', 'Business Report');
  assert.ok(comp.similarityScorePercent >= 0);
  assert.ok(comp.matchingSections.length > 0);
  assert.ok(comp.overallComparisonSummary.length > 30);
  assert.ok(comp.overallComparisonSummaryTelugu && comp.overallComparisonSummaryTelugu.length > 10);
});
