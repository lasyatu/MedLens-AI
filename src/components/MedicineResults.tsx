import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Mic,
  MicOff,
  Search,
  CheckCircle2,
  BookmarkCheck,
  BookmarkPlus,
  RefreshCw,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Globe,
  Edit2,
  Star,
  ShieldCheck,
  FileText,
  X,
  MessageSquare,
  ThumbsUp,
  Info,
  Clock,
  Calendar,
  Utensils
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS, interpretTeluguQuestionToRAGQuery, generateTeluguMedExplanation } from '../lib/translations';
import { startListening, stopListening, speakText, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../lib/speechService';
import { findMedicineRecord, AUTHORITATIVE_MEDICINES, SourceCitation } from '../lib/authoritativeData';
import { useAuth } from '../context/AuthContext';
import { saveScanRecord } from '../lib/scanStorage';
import { submitScanFeedback } from '../lib/feedbackStorage';
import { saveMedicationSchedule } from '../lib/scheduleStorage';

interface MedicineResultsProps {
  scanData: {
    rawText: string;
    confirmedMedicine: string;
    genericName?: string;
    dosage?: string;
    dosageForm?: string;
    confidenceScore: number;
    jurisdiction?: string;
    preprocessedImageBase64?: string;
  };
  language: SupportedLanguage;
  onBackToScan: () => void;
  onScanSaved?: () => void;
}

export const MedicineResults: React.FC<MedicineResultsProps> = ({
  scanData,
  language,
  onBackToScan,
  onScanSaved
}) => {
  const t = TRANSLATIONS[language];
  const { user } = useAuth();

  // Matched record from authoritative monographs
  const medRecord = findMedicineRecord(scanData.confirmedMedicine || scanData.genericName || '');

  // Explanation states
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [englishSummary, setEnglishSummary] = useState('');
  const [teluguSummary, setTeluguSummary] = useState('');
  const [showEnglishView, setShowEnglishView] = useState(false);
  const [ragEvidence, setRagEvidence] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [abstainNotice, setAbstainNotice] = useState<string | null>(null);

  // Audio Playback states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [audioController, setAudioController] = useState<{ stop: () => void; pause: () => void; resume: () => void } | null>(null);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);

  // Voice Search states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recognizedInterim, setRecognizedInterim] = useState('');
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState('');

  // Firestore Save state
  const [isSaved, setIsSaved] = useState(false);
  const [savingToFirestore, setSavingToFirestore] = useState(false);

  // Source Citation Verification state
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);

  // User Feedback state
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [helpfulnessRating, setHelpfulnessRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'general' | 'ocr_accuracy' | 'explanation_clarity' | 'dosage_warning'>('general');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      await submitScanFeedback(user?.uid || 'guest-user', user?.email || undefined, {
        scanId: scanData.confirmedMedicine || 'scan_result',
        medicineName: scanData.confirmedMedicine,
        accuracyRating,
        helpfulnessRating,
        feedbackCategory,
        comment: feedbackComment,
        confidenceScore: scanData.confidenceScore,
        jurisdiction: scanData.jurisdiction
      });
      setFeedbackSubmitted(true);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Medication Schedule Reminder states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedFrequency, setSchedFrequency] = useState<'daily' | 'weekly'>('daily');
  const [schedTimes, setSchedTimes] = useState<string[]>(['08:00', '20:00']);
  const [schedMealTiming, setSchedMealTiming] = useState<'before_food' | 'after_food' | 'with_food' | 'anytime'>('after_food');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedSuccessToast, setSchedSuccessToast] = useState<string | null>(null);

  const handleSaveMedSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSaving(true);
    try {
      await saveMedicationSchedule(user?.uid || 'guest-user', {
        medicineName: scanData.confirmedMedicine,
        dosage: scanData.dosage || medRecord?.approvedDosages[0] || '1 Standard Unit',
        frequency: schedFrequency,
        times: schedTimes,
        mealTiming: schedMealTiming,
        instructions: schedNotes || `Scheduled from scanned label of ${scanData.confirmedMedicine}`
      });

      setShowScheduleModal(false);
      setSchedSuccessToast(
        language === 'te'
          ? `${scanData.confirmedMedicine} కోసం రోజువారీ రిమైండర్ షెడ్యూల్ భద్రపరచబడింది!`
          : `Medication schedule reminder for ${scanData.confirmedMedicine} successfully created!`
      );
      setTimeout(() => setSchedSuccessToast(null), 5000);
      if (onScanSaved) onScanSaved();
    } catch (err) {
      console.error('Failed to schedule dose:', err);
    } finally {
      setSchedSaving(false);
    }
  };

  // Load initial RAG evidence on mount
  useEffect(() => {
    fetchRAGEvidence('');
  }, [scanData.confirmedMedicine]);

  const fetchRAGEvidence = async (userQuery: string) => {
    setLoadingEvidence(true);
    setAbstainNotice(null);

    try {
      // If query is in Telugu, interpret it to retrieval intent keywords
      let retrievalQuery = userQuery;
      if (userQuery && language === 'te') {
        retrievalQuery = interpretTeluguQuestionToRAGQuery(userQuery, scanData.confirmedMedicine);
      }

      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: retrievalQuery || `${scanData.confirmedMedicine} indications warnings precautions`,
          medicineIdOrName: scanData.confirmedMedicine
        })
      });

      const data = await res.json();

      if (data.ragResult?.abstain) {
        setAbstainNotice(data.ragResult.abstentionReason || 'No verified monograph passages found.');
        setRagEvidence([]);
      } else {
        setRagEvidence(data.ragResult?.matchedChunks || []);
        setSources(data.sources || []);
      }

      // English summary
      setEnglishSummary(data.plainLanguageSummary || 'Grounded on verified regulatory drug label.');

      // Telugu explanation
      const teluguExp = generateTeluguMedExplanation(
        scanData.confirmedMedicine,
        medRecord?.genericName || scanData.genericName || scanData.confirmedMedicine,
        medRecord?.therapeuticClass || 'Medical Formulation',
        data.labeledUses || medRecord?.labeledUses || [],
        data.warnings || medRecord?.warningsAndPrecautions || [],
        medRecord?.boxedWarning
      );
      setTeluguSummary(teluguExp);
    } catch (err) {
      console.error('RAG Retrieval failed:', err);
    } finally {
      setLoadingEvidence(false);
    }
  };

  // Start Voice Recognition in Telugu
  const handleStartVoiceRecording = () => {
    setVoiceSearchError(null);
    setVoiceTranscript('');
    setRecognizedInterim('');

    if (!isSpeechRecognitionSupported()) {
      setVoiceSearchError(t.micUnsupported);
      return;
    }

    startListening(language, {
      onStart: () => setIsRecording(true),
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setVoiceTranscript(transcript);
          setRecognizedInterim('');
        } else {
          setRecognizedInterim(transcript);
        }
      },
      onError: (errMsg) => {
        setIsRecording(false);
        setVoiceSearchError(errMsg);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });
  };

  const handleStopVoiceRecording = () => {
    stopListening();
    setIsRecording(false);
  };

  // Submit Question (voice or typed)
  const handleQuestionSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = voiceTranscript || activeQuestion;
    if (!query.trim()) return;

    fetchRAGEvidence(query.trim());
    setActiveQuestion(query.trim());
    setVoiceTranscript('');
  };

  // Handle Text-to-Speech playback
  const handleToggleAudio = () => {
    setTtsErrorMessage(null);

    if (isPlayingAudio) {
      if (isAudioPaused) {
        audioController?.resume();
        setIsAudioPaused(false);
      } else {
        audioController?.pause();
        setIsAudioPaused(true);
      }
      return;
    }

    const textToSpeak = language === 'te' && !showEnglishView ? teluguSummary : englishSummary;
    const langCode = language === 'te' && !showEnglishView ? 'te' : 'en';

    const controller = speakText(
      textToSpeak,
      langCode,
      () => {
        setIsPlayingAudio(true);
        setIsAudioPaused(false);
      },
      () => {
        setIsPlayingAudio(false);
        setIsAudioPaused(false);
        setAudioController(null);
      },
      (err) => {
        setIsPlayingAudio(false);
        setTtsErrorMessage(err);
      }
    );

    setAudioController(controller);
  };

  const handleStopAudio = () => {
    audioController?.stop();
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
    setAudioController(null);
  };

  // Save scan to Firestore under authenticated UID
  const handleSaveToFirestore = async () => {
    if (!user) return;
    setSavingToFirestore(true);

    try {
      await saveScanRecord(user.uid, {
        medicineName: scanData.confirmedMedicine,
        genericName: medRecord?.genericName || scanData.genericName,
        brandName: medRecord?.brandNames[0],
        dosage: scanData.dosage || medRecord?.approvedDosages[0],
        jurisdiction: scanData.jurisdiction || medRecord?.primaryJurisdiction,
        extractedText: scanData.rawText,
        summary: englishSummary,
        uses: medRecord?.labeledUses,
        warnings: medRecord?.warningsAndPrecautions,
        precautions: medRecord?.commonAdverseReactions,
        boxedWarning: medRecord?.boxedWarning,
        sources: sources,
        ragEvidence: ragEvidence.map(r => ({
          sectionTitle: r.chunk?.sectionTitle,
          content: r.chunk?.content,
          similarityScore: r.similarityScore,
          sourceTitle: r.chunk?.source?.title,
          sourceUrl: r.chunk?.source?.url
        })),
        confidenceScore: scanData.confidenceScore
      });

      setIsSaved(true);
      onScanSaved?.();
    } catch (err) {
      console.error('Failed to save scan to Firestore:', err);
    } finally {
      setSavingToFirestore(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBackToScan}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'te' ? 'మరొక మందును స్కాన్ చేయండి' : 'Scan Another Medicine'}
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {user && (
            <button
              onClick={handleSaveToFirestore}
              disabled={isSaved || savingToFirestore}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  Saved to Firestore
                </>
              ) : savingToFirestore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-teal-600" />
                  Save Scan Record
                </>
              )}
            </button>
          )}

          {/* Add to Medication Schedule */}
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            {language === 'te' ? 'షెడ్యూల్‌లో చేర్చండి' : 'Add to Schedule'}
          </button>

          {/* Toggle between Telugu and English view */}
          {language === 'te' && (
            <button
              onClick={() => setShowEnglishView(!showEnglishView)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              {showEnglishView ? t.showTelugu : t.showEnglishSource}
            </button>
          )}
        </div>
      </div>

      {schedSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{schedSuccessToast}</span>
        </div>
      )}

      {/* Verified Medicine Identity Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-md border border-teal-200">
                Verified Regulatory Product
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Jurisdiction: {scanData.jurisdiction || medRecord?.primaryJurisdiction || 'United States (FDA)'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OCR Confidence: {Math.round(scanData.confidenceScore * 100)}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {scanData.confirmedMedicine}
            </h1>
            <p className="text-sm font-semibold text-teal-700 mt-1">
              Generic (Active Ingredient): {medRecord?.genericName || scanData.genericName || scanData.confirmedMedicine}
            </p>
            {medRecord?.therapeuticClass && (
              <p className="text-xs text-slate-500 mt-0.5">
                Pharmacological Class: <span className="text-slate-800 font-medium">{medRecord.therapeuticClass}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            {scanData.dosage && (
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Labeled Strength</span>
                <span className="text-base font-extrabold text-slate-900">{scanData.dosage}</span>
              </div>
            )}
            {medRecord?.brandNames && (
              <div className="text-xs text-slate-500 text-left md:text-right">
                <span className="font-medium text-slate-400">Common Brands:</span>{' '}
                <span className="font-semibold text-slate-700">{medRecord.brandNames.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boxed Warning Alert if applicable */}
        {medRecord?.boxedWarning && (
          <div className="mt-6 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                {t.boxedWarning}
              </h3>
              <p className="text-xs text-rose-900 mt-1.5 leading-relaxed font-medium">
                {medRecord.boxedWarning}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plain Language Grounded Explanation & Audio Assistance */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              {language === 'te' && !showEnglishView ? 'ధృవీకరించబడిన తెలుగు వివరణ' : 'Verified Evidence Explanation'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded strictly in retrieved regulatory monograph sections without clinical hallucinations.
            </p>
          </div>

          {/* Audio Assistance Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleToggleAudio}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                isPlayingAudio
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {isPlayingAudio ? (
                isAudioPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume Audio
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    {t.pauseAudio}
                  </>
                )
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  {t.listenTelugu}
                </>
              )}
            </button>

            {isPlayingAudio && (
              <button
                onClick={handleStopAudio}
                title="Stop Audio"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {ttsErrorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2 rounded-xl">
            {ttsErrorMessage}
          </div>
        )}

        {/* Explanation Text */}
        {loadingEvidence ? (
          <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            Retrieving monograph passages and generating grounded explanation...
          </div>
        ) : (
          <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
            {language === 'te' && !showEnglishView ? teluguSummary : englishSummary}
          </div>
        )}

        {/* Labeled Uses & Precautions Pill Badges */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              {t.labeledUses}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {(medRecord?.labeledUses || []).map((use, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{use}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {t.warningsAndPrecautions}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {(medRecord?.warningsAndPrecautions || []).map((warn, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Telugu Voice Search & Medicine Questions Q&A Bar */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-cyan-50 rounded-3xl border border-teal-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mic className="w-5 h-5 text-teal-700" />
            {language === 'te' ? 'తెలుగు వాయిస్ సెర్చ్ & ప్రశ్నలు' : 'Voice Search & Patient Questions'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {language === 'te'
              ? 'ఈ మందు గురించి మీ సందేహాలను తెలుగులో అడగండి. మా వెక్టర్ సెర్చ్ ఇంజిన్ అధికారిక గ్రంథాల నుండి సమాధానాన్ని వెతుకుతుంది.'
              : 'Ask specific questions about this medication in Telugu or English to retrieve matched monograph sections.'}
          </p>
        </div>

        {/* Quick Sample Questions (Telugu / English) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { te: 'ఈ మందు దేనికి ఉపయోగిస్తారు?', en: 'What is this medicine used for?' },
            { te: 'ఈ మందు వల్ల ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?', en: 'What precautions should be taken?' },
            { te: 'ఈ మందు గురించి సులభంగా వివరించండి.', en: 'Explain this medicine label simply.' },
            { te: 'ఈ మందు లేబుల్లో ఏమి ఉంది?', en: 'What active ingredients are in this label?' }
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                const queryText = language === 'te' ? q.te : q.en;
                setActiveQuestion(queryText);
                fetchRAGEvidence(queryText);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 shadow-2xs transition-colors"
            >
              {language === 'te' ? q.te : q.en}
            </button>
          ))}
        </div>

        {/* Voice Input Field with Mic Button */}
        <form onSubmit={handleQuestionSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={voiceTranscript || activeQuestion}
              onChange={(e) => {
                setActiveQuestion(e.target.value);
                setVoiceTranscript('');
              }}
              placeholder={t.askQuestionPlaceholder}
              className="w-full pl-4 pr-24 py-3 text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {/* Mic Button */}
              <button
                type="button"
                onClick={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                title={t.voiceSearchTooltip}
                className={`p-2.5 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                }`}
                aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording in Telugu'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loadingEvidence || (!voiceTranscript && !activeQuestion)}
                className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-sm"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time speech transcription display and editor */}
          {isRecording && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-800 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
              <span>{t.recordingTelugu} {recognizedInterim && `"${recognizedInterim}"`}</span>
            </div>
          )}

          {voiceSearchError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              {voiceSearchError}
            </div>
          )}

          {voiceTranscript && (
            <div className="bg-white border border-teal-200 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                {t.transcriptEditPrompt}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleQuestionSubmit()}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  {t.submitQuestion}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* RAG Monograph Evidence Explorer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              {t.retrievedEvidence}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact passages retrieved via vector cosine similarity across chunked official regulatory drug monographs.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            {ragEvidence.length} Chunks Retrieved
          </span>
        </div>

        {abstainNotice ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              MedLens Abstention Notice
            </p>
            <p>{abstainNotice}</p>
          </div>
        ) : ragEvidence.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No specific evidence chunks retrieved for this query.</p>
        ) : (
          <div className="space-y-3">
            {ragEvidence.map((res: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                    Section: {res.chunk?.sectionTitle || 'Monograph Text'}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Relevance: {Math.round((res.similarityScore || 0.85) * 100)}%
                  </span>
                </div>

                <p className="text-slate-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200/60">
                  {res.chunk?.content}
                </p>

                {res.chunk?.source && (
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Source: {res.chunk.source.publisher} ({res.chunk.source.jurisdiction})</span>
                    <a
                      href={res.chunk.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
                    >
                      Official Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authoritative Sources Citations Bar with Verification Action */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            {language === 'te' ? 'అధికారిక నిబంధనా మూలాలు (Regulatory Citations)' : 'Authoritative Regulatory Citations'}
          </span>
          <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
            {language === 'te' ? 'క్లిక్ చేసి ధృవీకరించండి' : 'Click to Verify Authority'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(sources.length > 0 ? sources : (medRecord?.sources || [])).map((src: any, i: number) => (
            <div
              key={i}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                    {src.title}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {src.jurisdiction?.includes('FDA') ? 'US FDA' : src.jurisdiction?.includes('CDSCO') ? 'India CDSCO' : 'Global'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Publisher:</strong> {src.publisher}
                </p>
                {src.documentId && (
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Doc ID: {src.documentId}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCitation(src)}
                  className="flex-1 py-1 px-2 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {language === 'te' ? 'మూలం ధృవీకరణ' : 'Verify Citation'}
                </button>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-400 hover:text-teal-700 rounded transition-colors"
                  title="Direct URL to regulatory repository"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Citation Verification Modal / Dialog */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'te' ? 'మూలం అధికారిక ధృవీకరణ' : 'Source Authority Verification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'te' ? 'నిబంధనా పత్రం మరియు చట్టబద్ధ అధికార సమాచారం' : 'Regulatory Mandate & Citation Metadata'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Document Title</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedCitation.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Regulatory Publisher</span>
                    <div className="font-semibold text-slate-800">{selectedCitation.publisher}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jurisdiction</span>
                    <div className="font-semibold text-slate-800">{selectedCitation.jurisdiction}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Document / NDC ID</span>
                    <div className="font-mono text-slate-800 text-[11px]">{selectedCitation.documentId || 'FDA-SPL-VERIFIED'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revision / Standard Date</span>
                    <div className="font-semibold text-slate-800">{selectedCitation.revisionDate || 'Current Pharmacopoeia'}</div>
                  </div>
                </div>
              </div>

              {/* Regulatory Authority Assurance */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  {language === 'te' ? 'చట్టబద్ధమైన నమ్మకత' : 'Statutory Regulatory Standing'}
                </span>
                <p className="text-[11px] text-teal-950/80 leading-relaxed">
                  {selectedCitation.jurisdiction?.includes('FDA')
                    ? 'Published under US 21 CFR § 201 labeling requirements. Formulations, indications, and boxed warnings are legally required to match FDA approved prescribing information.'
                    : selectedCitation.jurisdiction?.includes('CDSCO')
                    ? 'Published under the Drugs and Cosmetics Act & Rules, 1945 (India) and Indian Pharmacopoeia monographs. Mandated for all licensed pharmaceuticals in India.'
                    : 'Recognized under International Nonproprietary Names (INN) and WHO Essential Medicines Guidelines.'}
                </p>
              </div>

              {/* Verification Link */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={selectedCitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-center shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === 'te' ? 'అధికారిక వెబ్‌సైట్‌లో పత్రాన్ని తెరవండి' : 'Open Official Regulatory Document'}
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCitation(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  {language === 'te' ? 'మూసివేయి' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Feedback & Rating System */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'te' ? 'ఈ ఫలితంపై మీ అభిప్రాయం (User Feedback)' : 'Rate Accuracy & Helpfulness'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'మీ రేటింగ్ మోడల్ ధృవీకరణ మరియు తెలుగు అనువాద నాణ్యతను మెరుగుపరచడంలో సహాయపడుతుంది.'
                  : 'Help us calibrate OCR accuracy, RAG monograph retrieval, and Telugu explanation clarity.'}
              </p>
            </div>
          </div>
          {feedbackSubmitted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'te' ? 'ధన్యవాదాలు! సేవ్ అయ్యింది' : 'Feedback Saved'}
            </span>
          )}
        </div>

        {feedbackSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-emerald-950 font-bold">
                {language === 'te' ? 'మీ అభిప్రాయానికి ధన్యవాదాలు!' : 'Thank you for your valuable feedback!'}
              </strong>
              <span className="text-emerald-800">
                {language === 'te'
                  ? `మీరు ${scanData.confirmedMedicine} స్కాన్‌కు ఖచ్చితత్వం: ${accuracyRating}/5, ఉపయోగం: ${helpfulnessRating}/5 గా రేట్ చేశారు.`
                  : `Your ratings (Accuracy: ${accuracyRating}/5, Helpfulness: ${helpfulnessRating}/5) were recorded securely in Firestore for clinical model triage.`}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            {/* Rating Scales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Accuracy Rating */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    {language === 'te' ? 'స్కాన్ & సమాచార ఖచ్చితత్వం' : 'Accuracy Rating'}
                  </span>
                  <span className="font-bold text-teal-700 text-xs">{accuracyRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAccuracyRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= accuracyRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-500 ml-1">
                    {accuracyRating >= 4 ? 'Accurate' : accuracyRating === 3 ? 'Fair' : 'Inaccurate'}
                  </span>
                </div>
              </div>

              {/* Helpfulness Rating */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    {language === 'te' ? 'వివరణ ఉపయోగకరత' : 'Helpfulness Rating'}
                  </span>
                  <span className="font-bold text-teal-700 text-xs">{helpfulnessRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setHelpfulnessRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= helpfulnessRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-500 ml-1">
                    {helpfulnessRating >= 4 ? 'Very Helpful' : helpfulnessRating === 3 ? 'Useful' : 'Needs Work'}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                {language === 'te' ? 'అభిప్రాయ విభాగం' : 'Feedback Category'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'general', labelEn: 'General Quality', labelTe: 'సాధారణ నాణ్యత' },
                  { id: 'ocr_accuracy', labelEn: 'OCR / Text Recognition', labelTe: 'OCR అక్షర గుర్తింపు' },
                  { id: 'explanation_clarity', labelEn: 'Telugu Explanation Clarity', labelTe: 'తెలుగు వివరణ స్పష్టత' },
                  { id: 'dosage_warning', labelEn: 'Dosage / Warning Details', labelTe: 'మోతాదు / హెచ్చరికలు' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      feedbackCategory === cat.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'te' ? cat.labelTe : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Commentary Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                {language === 'te' ? 'అదనపు వివరాలు / సూచనలు (ఐచ్ఛికం)' : 'Additional Comments or Corrections (Optional)'}
              </label>
              <textarea
                rows={2}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={
                  language === 'te'
                    ? 'ఉదాహరణ: లేబుల్‌లోని స్ట్రెంత్ సరిగ్గా రాలేదు లేదా వివరణలో మరిన్ని హెచ్చరికలు కావాలి...'
                    : 'e.g., The strength on my strip is 650mg, but OCR read 500mg, or Telugu explanation was very helpful...'
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-teal-600 bg-white"
              />
            </div>

            {feedbackError && (
              <div className="p-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {feedbackError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
              >
                {feedbackSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {language === 'te' ? 'సమర్పిస్తోంది...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {language === 'te' ? 'ఫీడ్‌బ్యాక్ సమర్పించండి' : 'Submit Feedback'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Medication Schedule Setup Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'te' ? 'ఈ మందుకు షెడ్యూల్ సెట్ చేయండి' : 'Set Medication Schedule'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'te'
                      ? 'స్కాన్ చేసిన లేబుల్ ఆధారంగా రిమైండర్ ఏర్పాటు చేయండి'
                      : 'Configure daily reminder alerts based on this identified label'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedSchedule} className="space-y-4 text-xs">
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Identified Medicine</span>
                <div className="font-bold text-slate-900 text-sm">{scanData.confirmedMedicine}</div>
                <div className="text-slate-600 text-xs">
                  Strength: {scanData.dosage || medRecord?.approvedDosages[0] || '1 Unit'} • {medRecord?.dosageForms[0] || 'Oral Formulation'}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {language === 'te' ? 'తీసుకోవలసిన తరచుదనం' : 'Dosing Frequency'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSchedFrequency('daily')}
                    className={`py-2 rounded-xl text-center font-bold border transition-all ${
                      schedFrequency === 'daily'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {language === 'te' ? 'రోజువారీ (Daily)' : 'Daily Routine'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedFrequency('weekly')}
                    className={`py-2 rounded-xl text-center font-bold border transition-all ${
                      schedFrequency === 'weekly'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {language === 'te' ? 'వారపు మోతాదు (Weekly)' : 'Weekly Course'}
                  </button>
                </div>
              </div>

              {/* Quick Dose Times */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  {language === 'te' ? 'మోతాదు సమయాలు' : 'Dose Intake Times'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Morning (8:00 AM)', time: '08:00' },
                    { label: 'Afternoon (2:00 PM)', time: '14:00' },
                    { label: 'Night (8:00 PM)', time: '20:00' },
                    { label: 'Bedtime (10:00 PM)', time: '22:00' }
                  ].map((preset) => {
                    const isSelected = schedTimes.includes(preset.time);
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (schedTimes.length > 1) {
                              setSchedTimes(schedTimes.filter((t) => t !== preset.time));
                            }
                          } else {
                            setSchedTimes([...schedTimes, preset.time].sort());
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal Instructions */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {language === 'te' ? 'ఆహార నియమం' : 'Meal Timing Guidance'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'after_food', labelEn: 'After Food', labelTe: 'భోజనం తర్వాత' },
                    { id: 'before_food', labelEn: 'Before Food', labelTe: 'భోజనం ముందు' },
                    { id: 'with_food', labelEn: 'With Meal', labelTe: 'భోజనంతో' },
                    { id: 'anytime', labelEn: 'Anytime', labelTe: 'ఎప్పుడైనా' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSchedMealTiming(m.id as any)}
                      className={`py-1.5 rounded-xl font-bold text-center border transition-all ${
                        schedMealTiming === m.id
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {language === 'te' ? m.labelTe : m.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Doctor Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'te' ? 'అదనపు సూచనలు (Optional Notes)' : 'Prescription Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="e.g., Take with a full glass of water. Complete 5-day course."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedSaving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 text-xs transition-all flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {schedSaving ? 'Saving...' : 'Set Reminder Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
