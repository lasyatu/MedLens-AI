/**
 * Report Comparison View
 * Allows users to upload or select two documents (Medical lab reports or General academic documents)
 * and generates side-by-side metric deltas, abnormal diffs, missing section detection, and structured comparison summaries.
 */

import React, { useState } from 'react';
import {
  GitCompare,
  Activity,
  BookOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  RefreshCw,
  Sliders,
  Copy,
  Check
} from 'lucide-react';
import {
  compareMedicalReports,
  compareGeneralDocuments,
  MedicalComparisonResult,
  GeneralComparisonResult
} from '../lib/reportComparison';
import { SAMPLE_REPORTS } from '../lib/reportParser';
import { SAMPLE_GENERAL_DOCUMENTS } from '../lib/generalReportAnalyzer';
import { SavedReportRecord } from '../lib/reportStorage';
import { SupportedLanguage } from '../lib/translations';

interface ReportComparisonViewProps {
  language: SupportedLanguage;
  savedReports?: SavedReportRecord[];
  onConsultDhanvi?: (context: string) => void;
}

export const ReportComparisonView: React.FC<ReportComparisonViewProps> = ({
  language,
  savedReports = [],
  onConsultDhanvi
}) => {
  const [compareMode, setCompareMode] = useState<'medical' | 'general'>('medical');

  // Medical state
  const [medicalTitleA, setMedicalTitleA] = useState('Baseline Metabolic Panel (Jan 2026)');
  const [medicalTextA, setMedicalTextA] = useState(SAMPLE_REPORTS.metabolic_diabetes.rawText);

  const [medicalTitleB, setMedicalTitleB] = useState('Follow-up Metabolic Panel (April 2026)');
  const [medicalTextB, setMedicalTextB] = useState(`DIAGNOSTIC LABORATORY SERVICES
PATIENT REPORT: Follow-up Metabolic Panel
DATE: 2026-04-18

TEST NAME                     RESULT     UNITS      REFERENCE INTERVAL
Fasting Blood Glucose          112        mg/dL      70 - 99 (HIGH)
HbA1c Glycated Hemoglobin      6.8        %          4.0 - 5.6 (HIGH)
Total Serum Cholesterol        198        mg/dL      125 - 200 (NORMAL)
Triglycerides                  155        mg/dL      < 150 (HIGH)
HDL Cholesterol                42         mg/dL      > 40 (NORMAL)
Hemoglobin                     14.2       g/dL       13.0 - 17.0 (NORMAL)
Serum Creatinine               0.98       mg/dL      0.70 - 1.30 (NORMAL)
Serum Potassium                4.2        mEq/L      3.5 - 5.0 (NORMAL)`);

  const [medicalResult, setMedicalResult] = useState<MedicalComparisonResult | null>(() => {
    return compareMedicalReports(
      SAMPLE_REPORTS.metabolic_diabetes.rawText,
      medicalTextB,
      'Baseline Metabolic Panel (Jan 2026)',
      'Follow-up Metabolic Panel (April 2026)'
    );
  });

  // General Document state
  const [generalTitleA, setGeneralTitleA] = useState('Version 1: AI Capstone Diagnostic System Draft');
  const [generalTextA, setGeneralTextA] = useState(SAMPLE_GENERAL_DOCUMENTS.ai_capstone.rawText);

  const [generalTitleB, setGeneralTitleB] = useState('Version 2: Optimized Multimodal Health System Final');
  const [generalTextB, setGeneralTextB] = useState(`PROJECT TITLE: Optimized Multimodal Health System Final Defense
DEPARTMENT: Computer Science & Engineering | 2026

1. ABSTRACT & EXECUTIVE SUMMARY:
Enhanced iteration featuring real-time quantized INT8 models deployed on edge servers. Reduced inferencing latency from 642ms to 320ms, achieving 97.4% precision and complete Telugu regional translation.

2. EXPANDED PROJECT OBJECTIVES:
- Primary Objective: Real-time dual-stage OCR and retrieval-augmented pipeline with edge quantization.
- Scalability Objective: Handle 500 concurrent clinic requests with sub-second turnaround.

3. FINAL BENCHMARKS:
- Optical Character Recognition Precision: 97.4% (vs 94.6% in draft)
- Average Processing Time: 320ms (reduced by 50.1%)
- Hallucination Frequency: Under 1.4%
- Telugu Translation Accuracy: 42.1 BLEU score

4. CONCLUSION & PRODUCTION DEPLOYMENT:
System is fully qualified for regional healthcare trials.`);

  const [generalResult, setGeneralResult] = useState<GeneralComparisonResult | null>(() => {
    return compareGeneralDocuments(
      SAMPLE_GENERAL_DOCUMENTS.ai_capstone.rawText,
      generalTextB,
      'Version 1: AI Capstone Draft',
      'Version 2: Optimized Multimodal System Final'
    );
  });

  const handleRunMedicalComparison = () => {
    const res = compareMedicalReports(medicalTextA, medicalTextB, medicalTitleA, medicalTitleB);
    setMedicalResult(res);
  };

  const handleRunGeneralComparison = () => {
    const res = compareGeneralDocuments(generalTextA, generalTextB, generalTitleA, generalTitleB);
    setGeneralResult(res);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold mb-3 border border-white/20">
            <GitCompare className="w-3.5 h-3.5" />
            {language === 'te' ? 'రిపోర్ట్ పోలిక మాడ్యూల్' : 'Comparative Document & Lab Differential Engine'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'te' ? 'రిపోర్ట్ పోలిక (Report Comparison)' : 'Report Comparison'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {language === 'te'
              ? 'రెండు వేర్వేరు సమయాల్లో తీసిన మెడికల్ ల్యాబ్ రిపోర్టులు లేదా ప్రాజెక్ట్ డాక్యుమెంట్లను పోల్చండి. విలువల మార్పులు, అసాధారణతలు మరియు పురోగతిని సులభంగా విశ్లేషించండి.'
              : 'Upload two reports side-by-side. Track biomarker trajectories across dates or audit differences between academic papers, business reports, and drafts.'}
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Comparison Mode:</span>
          <span className="text-sm font-extrabold text-slate-800">
            {compareMode === 'medical' ? '🏥 Medical Laboratory Panels Comparison' : '📄 General Academic & Business Documents Comparison'}
          </span>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setCompareMode('medical')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              compareMode === 'medical' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Medical Labs
          </button>
          <button
            onClick={() => setCompareMode('general')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              compareMode === 'general' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> General Documents
          </button>
        </div>
      </div>

      {/* MEDICAL COMPARISON WORKSPACE */}
      {compareMode === 'medical' && (
        <div className="space-y-6">
          {/* Two Document Input Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Report A */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Document 1: Baseline Report
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Earlier Date</span>
              </div>
              <input
                type="text"
                value={medicalTitleA}
                onChange={(e) => setMedicalTitleA(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <textarea
                rows={5}
                value={medicalTextA}
                onChange={(e) => setMedicalTextA(e.target.value)}
                className="w-full p-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Report B */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Document 2: Follow-up Report
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold">Latest Date</span>
              </div>
              <input
                type="text"
                value={medicalTitleB}
                onChange={(e) => setMedicalTitleB(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <textarea
                rows={5}
                value={medicalTextB}
                onChange={(e) => setMedicalTextB(e.target.value)}
                className="w-full p-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunMedicalComparison}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-compute Medical Differential
            </button>
          </div>

          {/* Medical Comparison Results */}
          {medicalResult && (
            <div className="space-y-6">
              {/* Stat summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Compared</span>
                  <span className="text-xl font-extrabold text-slate-800">{medicalResult.totalMetricsCompared}</span>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase block">Improved</span>
                  <span className="text-xl font-extrabold text-emerald-800">+{medicalResult.improvedCount}</span>
                </div>
                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-center">
                  <span className="text-[11px] font-bold text-rose-700 uppercase block">Worsened</span>
                  <span className="text-xl font-extrabold text-rose-800">{medicalResult.worsenedCount}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block">Stable</span>
                  <span className="text-xl font-extrabold text-slate-700">{medicalResult.stableCount}</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-teal-50/80 rounded-xl p-4 border border-teal-200 text-xs text-teal-950 leading-relaxed">
                <strong>Differential Summary: </strong>
                {language === 'te' && medicalResult.executiveSummaryTelugu
                  ? medicalResult.executiveSummaryTelugu
                  : medicalResult.executiveSummary}
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Side-by-Side Biomarker Differential Table
                  </h3>
                  <span className="text-xs text-slate-500">
                    {medicalResult.reportADate} → {medicalResult.reportBDate}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">{medicalResult.reportATitle}</th>
                        <th className="py-2.5 px-3">{medicalResult.reportBTitle}</th>
                        <th className="py-2.5 px-3">Delta / Change</th>
                        <th className="py-2.5 px-3">Clinical Trajectory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicalResult.metricDiffs.map((diff, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {diff.testName}
                            <span className="text-[10px] text-slate-400 block font-normal">Ref: {diff.refRange} {diff.unit}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono">{diff.reportAValue} {diff.unit}</span>
                            {diff.reportAFlag !== 'NORMAL' && diff.reportAFlag !== 'UNKNOWN' && (
                              <span className="ml-1 text-[10px] font-bold text-rose-600">[{diff.reportAFlag}]</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono">{diff.reportBValue} {diff.unit}</span>
                            {diff.reportBFlag !== 'NORMAL' && diff.reportBFlag !== 'UNKNOWN' && (
                              <span className="ml-1 text-[10px] font-bold text-rose-600">[{diff.reportBFlag}]</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {diff.deltaValue !== undefined ? (
                              <span
                                className={`inline-flex items-center gap-0.5 font-bold ${
                                  diff.trend === 'improved'
                                    ? 'text-emerald-700'
                                    : diff.trend === 'worsened'
                                    ? 'text-rose-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {diff.deltaValue > 0 ? `+${diff.deltaValue}` : diff.deltaValue} {diff.unit}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                diff.trend === 'improved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : diff.trend === 'worsened'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {diff.trend}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{diff.clinicalInterpretation}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consultation Points */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Questions to Discuss with Your Doctor:
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {medicalResult.recommendationsForDoctor.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GENERAL DOCUMENT COMPARISON WORKSPACE */}
      {compareMode === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                Document 1: Draft / Original
              </span>
              <input
                type="text"
                value={generalTitleA}
                onChange={(e) => setGeneralTitleA(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800"
              />
              <textarea
                rows={5}
                value={generalTextA}
                onChange={(e) => setGeneralTextA(e.target.value)}
                className="w-full p-2 text-xs font-mono border border-slate-300 rounded"
              />
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                Document 2: Revision / Final
              </span>
              <input
                type="text"
                value={generalTitleB}
                onChange={(e) => setGeneralTitleB(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800"
              />
              <textarea
                rows={5}
                value={generalTextB}
                onChange={(e) => setGeneralTextB(e.target.value)}
                className="w-full p-2 text-xs font-mono border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunGeneralComparison}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-compare Documents
            </button>
          </div>

          {generalResult && (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div className="bg-indigo-50/80 rounded-xl p-4 border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
                <strong>General Comparative Summary: </strong>
                {language === 'te' && generalResult.overallComparisonSummaryTelugu
                  ? generalResult.overallComparisonSummaryTelugu
                  : generalResult.overallComparisonSummary}
              </div>

              {/* Sections Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Section-by-Section Structural Audit
                </h3>
                <div className="space-y-2">
                  {generalResult.sectionDiffs.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800 block">{s.sectionTitle}</span>
                        <span className="text-[11px] text-slate-500">
                          Doc A: {s.statusInDocA} | Doc B: {s.statusInDocB}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        {s.significantDifferences.join('; ') || 'Equivalent structural representation'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives & Conclusions contrast */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5 text-xs">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                    Objectives Comparison
                  </span>
                  <p className="text-slate-600">{generalResult.objectiveComparison.alignmentSummary}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-1.5 text-xs">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                    Conclusions Comparison
                  </span>
                  <p className="text-slate-600">{generalResult.conclusionComparison.contrastSummary}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
