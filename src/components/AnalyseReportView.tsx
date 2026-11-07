/**
 * Analyse Report View
 * Supports TWO comprehensive analysis categories:
 * Category A: Medical Report Analysis (CBC, Thyroid, Lipid, LFT, KFT, Glucose, Urine, etc. with editable tables and clinical education)
 * Category B: General Report Analysis (Academic Capstones, Research Papers, Business, Resumes, etc. with all 11 structured sections)
 * Seamlessly connects to DHANVI AI for interactive Q&A.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Activity,
  BookOpen,
  Sparkles,
  Upload,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Download,
  Copy,
  Check,
  RefreshCw,
  Search,
  MessageSquare
} from 'lucide-react';
import { ReportAnalyzer } from './ReportAnalyzer';
import {
  GeneralReportAnalysis,
  analyzeGeneralDocument,
  SAMPLE_GENERAL_DOCUMENTS
} from '../lib/generalReportAnalyzer';
import { ScannedDocumentPackage } from './ScanReport';
import { SavedReportRecord } from '../lib/reportStorage';
import { SupportedLanguage } from '../lib/translations';

interface AnalyseReportViewProps {
  language: SupportedLanguage;
  savedReports?: SavedReportRecord[];
  onReportSaved?: () => void;
  incomingScannedDoc?: ScannedDocumentPackage | null;
  onConsultDhanviWithReport?: (context: string, isGeneral: boolean) => void;
}

export const AnalyseReportView: React.FC<AnalyseReportViewProps> = ({
  language,
  savedReports = [],
  onReportSaved,
  incomingScannedDoc,
  onConsultDhanviWithReport
}) => {
  // Category selection: Medical vs General
  const [selectedCategory, setSelectedCategory] = useState<'medical' | 'general'>(() => {
    return incomingScannedDoc?.documentType === 'general' ? 'general' : 'medical';
  });

  // General Document state
  const [generalDocTitle, setGeneralDocTitle] = useState(
    incomingScannedDoc?.documentType === 'general'
      ? incomingScannedDoc.title
      : 'Automated Diagnostic Assistance Using Convolutional Networks & RAG'
  );
  const [generalDocType, setGeneralDocType] = useState('AI Mini-Capstone Project Report');
  const [generalRawText, setGeneralRawText] = useState(
    incomingScannedDoc?.documentType === 'general'
      ? incomingScannedDoc.combinedRawText
      : SAMPLE_GENERAL_DOCUMENTS.ai_capstone.rawText
  );

  const [generalAnalysis, setGeneralAnalysis] = useState<GeneralReportAnalysis | null>(null);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // If incoming doc was passed, set category accordingly
  useEffect(() => {
    if (incomingScannedDoc) {
      if (incomingScannedDoc.documentType === 'general') {
        setSelectedCategory('general');
        setGeneralDocTitle(incomingScannedDoc.title);
        setGeneralRawText(incomingScannedDoc.combinedRawText);
        handleAnalyzeGeneral(incomingScannedDoc.combinedRawText, incomingScannedDoc.categoryLabel, incomingScannedDoc.title);
      } else {
        setSelectedCategory('medical');
      }
    }
  }, [incomingScannedDoc]);

  // Initial load of general analysis sample
  useEffect(() => {
    if (selectedCategory === 'general' && !generalAnalysis) {
      handleAnalyzeGeneral(generalRawText, generalDocType, generalDocTitle);
    }
  }, [selectedCategory]);

  const handleAnalyzeGeneral = async (text: string, type: string, title: string) => {
    setLoadingGeneral(true);
    try {
      const res = await analyzeGeneralDocument(text, type, title);
      setGeneralAnalysis(res);
    } catch (e) {
      console.warn('General report analysis error:', e);
    } finally {
      setLoadingGeneral(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleAskDhanvi = (promptText: string) => {
    if (onConsultDhanviWithReport) {
      const docContext = `Document Title: ${generalDocTitle}\nType: ${generalDocType}\nSummary: ${generalAnalysis?.section1_summary || ''}\nFindings: ${generalAnalysis?.section3_findings.join(', ') || ''}\nFull Text:\n${generalRawText.substring(0, 3000)}`;
      onConsultDhanviWithReport(`${promptText}\n\n[Attached Document Context]:\n${docContext}`, true);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Category Toggle Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {language === 'te' ? 'విశ్లేషణ విభాగం ఎంచుకోండి' : 'Select Analysis Category'}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">
            {selectedCategory === 'medical'
              ? '🏥 Medical Laboratory Report Analysis'
              : '📄 General Academic & Professional Document Analysis'}
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setSelectedCategory('medical')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              selectedCategory === 'medical'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Medical Lab Reports
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              selectedCategory === 'general'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            General Documents
          </button>
        </div>
      </div>

      {/* CATEGORY A: MEDICAL REPORT ANALYSIS */}
      {selectedCategory === 'medical' && (
        <div className="space-y-6">
          <ReportAnalyzer
            language={language}
            savedReports={savedReports}
            onReportSaved={onReportSaved}
            onOpenChatWithReport={(summary) => {
              if (onConsultDhanviWithReport) {
                onConsultDhanviWithReport(summary, false);
              }
            }}
          />
        </div>
      )}

      {/* CATEGORY B: GENERAL REPORT ANALYSIS (11 STRUCTURED SECTIONS) */}
      {selectedCategory === 'general' && (
        <div className="space-y-6">
          {/* General Document Header & Preset Bar */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Category B: General-Purpose Document Analysis
                </span>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Academic Capstones, Research Papers, Business & Technical Reports
                </h3>
              </div>

              {/* Sample Presets */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold mr-1">Load Preset:</span>
                <button
                  onClick={() => {
                    const p = SAMPLE_GENERAL_DOCUMENTS.ai_capstone;
                    setGeneralDocTitle(p.title);
                    setGeneralDocType(p.type);
                    setGeneralRawText(p.rawText);
                    handleAnalyzeGeneral(p.rawText, p.type, p.title);
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
                >
                  AI Capstone
                </button>
                <button
                  onClick={() => {
                    const p = SAMPLE_GENERAL_DOCUMENTS.business_quarterly;
                    setGeneralDocTitle(p.title);
                    setGeneralDocType(p.type);
                    setGeneralRawText(p.rawText);
                    handleAnalyzeGeneral(p.rawText, p.type, p.title);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Business Report
                </button>
                <button
                  onClick={() => {
                    const p = SAMPLE_GENERAL_DOCUMENTS.research_paper;
                    setGeneralDocTitle(p.title);
                    setGeneralDocType(p.type);
                    setGeneralRawText(p.rawText);
                    handleAnalyzeGeneral(p.rawText, p.type, p.title);
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                >
                  Research Paper
                </button>
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={generalDocTitle}
                  onChange={(e) => setGeneralDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                <input
                  type="text"
                  value={generalDocType}
                  onChange={(e) => setGeneralDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Text (Paste from PDF / Word / Code repository)
              </label>
              <textarea
                rows={5}
                value={generalRawText}
                onChange={(e) => setGeneralRawText(e.target.value)}
                placeholder="Paste the abstract, methodology, results, or full report text here..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleAnalyzeGeneral(generalRawText, generalDocType, generalDocTitle)}
              disabled={loadingGeneral || !generalRawText.trim()}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loadingGeneral ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating 11-Section Document Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze General Document with Gemini
                </>
              )}
            </button>
          </div>

          {/* Interactive Q&A Prompts for DHANVI */}
          {generalAnalysis && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Ask DHANVI AI About This Document:
                </span>
                <span className="text-[11px] text-indigo-700 font-medium hidden sm:inline">
                  Click any prompt to open chat with document memory
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => handleAskDhanvi('Summarise this report in 3 clear bullet points.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold shadow-2xs"
                >
                  📝 Summarise this report
                </button>
                <button
                  onClick={() => handleAskDhanvi('Explain the methodology and experimental setup of this report simply.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold shadow-2xs"
                >
                  🔍 Explain this section
                </button>
                <button
                  onClick={() => handleAskDhanvi('Find any potential errors, missing benchmarks, or inconsistencies in this report.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold shadow-2xs"
                >
                  ⚠️ Find errors & gaps
                </button>
                <button
                  onClick={() => handleAskDhanvi('Identify the key numerical findings and statistical significance.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold shadow-2xs"
                >
                  📊 Main numerical findings
                </button>
                <button
                  onClick={() => handleAskDhanvi('ఈ రిపోర్ట్‌ను సరళమైన తెలుగులో వివరించండి (Explain this report in simple Telugu).')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-teal-800 border border-teal-200 font-semibold shadow-2xs"
                >
                  🇮🇳 Explain in Telugu
                </button>
                <button
                  onClick={() => handleAskDhanvi('Generate 5 tough viva questions and model answers based on this report.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-purple-900 border border-purple-200 font-semibold shadow-2xs"
                >
                  🎓 Generate Viva Questions
                </button>
                <button
                  onClick={() => handleAskDhanvi('Prepare a 5-slide presentation outline with bullet points for this report.')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-purple-900 border border-purple-200 font-semibold shadow-2xs"
                >
                  📽️ Presentation Points
                </button>
              </div>
            </div>
          )}

          {/* 11 STRUCTURED SECTIONS DISPLAY */}
          {generalAnalysis && (
            <div className="space-y-5">
              {/* Top Meta info */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                <span>
                  Analyzed <strong>{generalAnalysis.wordCount}</strong> words across ~
                  <strong>{generalAnalysis.pageCount}</strong> estimated pages.
                </span>
                {generalAnalysis.summaryTelugu && (
                  <span className="text-teal-700 font-medium">తెలుగు సారాంశం అందుబాటులో ఉంది</span>
                )}
              </div>

              {/* 1. Document Summary */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      1
                    </span>
                    Document Summary
                  </h4>
                  <button
                    onClick={() => handleCopyText(generalAnalysis.section1_summary, 's1')}
                    className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
                  >
                    {copiedSection === 's1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{generalAnalysis.section1_summary}</p>
                {generalAnalysis.summaryTelugu && (
                  <p className="text-[11px] text-teal-800 bg-teal-50/70 p-2.5 rounded-lg border border-teal-100 leading-relaxed">
                    <strong>తెలుగు సారాంశం: </strong>
                    {generalAnalysis.summaryTelugu}
                  </p>
                )}
              </div>

              {/* 2. Main Objectives & 3. Important Findings (2 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      2
                    </span>
                    Main Objectives
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {generalAnalysis.section2_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      3
                    </span>
                    Important Findings
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {generalAnalysis.section3_findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4. Key Observations & 5. Numerical Data and Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      4
                    </span>
                    Key Observations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {generalAnalysis.section4_observations.map((obs, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-600 font-bold">→</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      5
                    </span>
                    Numerical Data & Statistics
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {generalAnalysis.section5_numericalData.map((item, i) => (
                      <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <span className="font-semibold text-slate-700 truncate max-w-[200px]">{item.label}</span>
                        <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Strengths and Weaknesses */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                    6
                  </span>
                  Strengths & Weaknesses Assessment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900 block mb-1">Identified Strengths:</span>
                    <ul className="space-y-1 text-xs text-emerald-800">
                      {generalAnalysis.section6_strengthsAndWeaknesses.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span>✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block mb-1">Identified Weaknesses / Gaps:</span>
                    <ul className="space-y-1 text-xs text-amber-800">
                      {generalAnalysis.section6_strengthsAndWeaknesses.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7. Missing Information, 8. Errors & Inconsistencies, 9. Suggestions for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-[10px]">
                      7
                    </span>
                    Missing Information
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {generalAnalysis.section7_missingInfo.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-extrabold text-[10px]">
                      8
                    </span>
                    Errors & Inconsistencies
                  </h4>
                  <ul className="space-y-1 text-xs text-rose-700">
                    {generalAnalysis.section8_errorsAndInconsistencies.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                      9
                    </span>
                    Suggestions for Improvement
                  </h4>
                  <ul className="space-y-1 text-xs text-indigo-700">
                    {generalAnalysis.section9_suggestionsForImprovement.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 10. Detailed Explanations */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-[10px]">
                    10
                  </span>
                  Detailed Explanations & Narrative Context
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {generalAnalysis.section10_detailedExplanations}
                </p>
              </div>

              {/* 11. Final Conclusion */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-800 text-white flex items-center justify-center font-extrabold text-[10px]">
                    11
                  </span>
                  Final Conclusion
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">{generalAnalysis.section11_finalConclusion}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
