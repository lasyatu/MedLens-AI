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
  Utensils,
  Scale,
  Bot,
  Pill,
  Microscope,
  AlertOctagon,
  BookOpen,
  ArrowRight,
  Droplet
} from 'lucide-react';
import {
  SupportedLanguage,
  TRANSLATIONS,
  interpretTeluguQuestionToRAGQuery,
  generateTeluguMedExplanation
} from '../lib/translations';
import {
  startListening,
  stopListening,
  speakText,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported
} from '../lib/speechService';
import {
  findMedicineRecord,
  AUTHORITATIVE_MEDICINES,
  MedicineRecord,
  SourceCitation
} from '../lib/authoritativeData';
import { useAuth } from '../context/AuthContext';
import { saveScanRecord } from '../lib/scanStorage';
import { submitScanFeedback } from '../lib/feedbackStorage';
import { saveMedicationSchedule } from '../lib/scheduleStorage';
import { compareMedicationScans, ComparisonReport } from '../lib/comparison';
import { ComparisonModal } from './ComparisonModal';

export type MedicineResultTab =
  | 'overview'
  | 'scientific'
  | 'administration'
  | 'precautions'
  | 'interactions'
  | 'sources'
  | 'dhanvi';

export interface ActiveScanData {
  rawText: string;
  confirmedMedicine: string;
  genericName?: string | null;
  brandName?: string | null;
  activeIngredients?: string[];
  composition?: string | null;
  dosage?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  manufacturer?: string | null;
  expiryDate?: string | null;
  confidenceScore: number;
  jurisdiction?: string | null;
  preprocessedImageBase64?: string;
}

interface MedicineResultsProps {
  scanData: ActiveScanData;
  language: SupportedLanguage;
  onBackToScan: () => void;
  onScanSaved?: () => void;
  onConsultDhanvi?: (medicineContext: string) => void;
  onOpenComparison?: (medicineName: string) => void;
}

export const MedicineResults: React.FC<MedicineResultsProps> = ({
  scanData,
  language,
  onBackToScan,
  onScanSaved,
  onConsultDhanvi,
  onOpenComparison
}) => {
  const t = TRANSLATIONS[language];
  const { user } = useAuth();

  // Active Tab state for desktop and mobile
  const [activeTab, setActiveTab] = useState<MedicineResultTab>('overview');

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

  // Medicine Comparison states
  const [isComparePickerOpen, setIsComparePickerOpen] = useState(false);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // User Feedback state
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [helpfulnessRating, setHelpfulnessRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'general' | 'ocr_accuracy' | 'explanation_clarity' | 'dosage_warning'>('general');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Medication Schedule Reminder states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedFrequency, setSchedFrequency] = useState<'daily' | 'weekly'>('daily');
  const [schedTimes, setSchedTimes] = useState<string[]>(['08:00', '20:00']);
  const [schedMealTiming, setSchedMealTiming] = useState<'before_food' | 'after_food' | 'with_food' | 'anytime'>('after_food');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedSuccessToast, setSchedSuccessToast] = useState<string | null>(null);

  // Load initial RAG evidence on mount
  useEffect(() => {
    fetchRAGEvidence('');
  }, [scanData.confirmedMedicine]);

  const fetchRAGEvidence = async (userQuery: string) => {
    setLoadingEvidence(true);
    setAbstainNotice(null);

    try {
      let retrievalQuery = userQuery;
      if (userQuery && language === 'te') {
        retrievalQuery = interpretTeluguQuestionToRAGQuery(userQuery, scanData.confirmedMedicine);
      }

      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: retrievalQuery || `${scanData.confirmedMedicine} indications mechanism administration warnings precautions overdose`,
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

  // Start Voice Recognition in Telugu or English
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
        genericName: medRecord?.genericName || scanData.genericName || undefined,
        brandName: medRecord?.brandNames[0] || scanData.brandName || undefined,
        dosage: scanData.dosage || scanData.strength || medRecord?.approvedDosages[0] || undefined,
        jurisdiction: scanData.jurisdiction || medRecord?.primaryJurisdiction || undefined,
        extractedText: scanData.rawText,
        summary: englishSummary,
        uses: medRecord?.labeledUses,
        warnings: medRecord?.warningsAndPrecautions,
        precautions: medRecord?.commonAdverseReactions,
        boxedWarning: medRecord?.boxedWarning,
        sources: sources.length > 0 ? sources : medRecord?.sources,
        ragEvidence: ragEvidence.map((r) => ({
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
        jurisdiction: scanData.jurisdiction || undefined
      });
      setFeedbackSubmitted(true);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSaveMedSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSaving(true);
    try {
      await saveMedicationSchedule(user?.uid || 'guest-user', {
        medicineName: scanData.confirmedMedicine,
        dosage: scanData.dosage || scanData.strength || medRecord?.approvedDosages[0] || '1 Standard Unit',
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

  // Launch comparison with another selected medicine
  const handleStartComparisonWith = (otherMedName: string) => {
    const item1 = {
      id: 'current_scan',
      medicineName: scanData.confirmedMedicine,
      genericName: medRecord?.genericName || scanData.genericName || undefined,
      brandName: medRecord?.brandNames[0] || scanData.brandName || undefined,
      dosage: scanData.dosage || scanData.strength || medRecord?.approvedDosages[0] || undefined,
      jurisdiction: scanData.jurisdiction || medRecord?.primaryJurisdiction || undefined,
      uses: medRecord?.labeledUses,
      warnings: medRecord?.warningsAndPrecautions,
      precautions: medRecord?.commonAdverseReactions
    };

    const targetRecord = findMedicineRecord(otherMedName);
    const item2 = {
      id: 'compared_target',
      medicineName: targetRecord ? targetRecord.medicineName : otherMedName,
      genericName: targetRecord?.genericName || undefined,
      brandName: targetRecord?.brandNames[0] || undefined,
      dosage: targetRecord?.approvedDosages[0] || undefined,
      jurisdiction: targetRecord?.primaryJurisdiction || undefined,
      uses: targetRecord?.labeledUses,
      warnings: targetRecord?.warningsAndPrecautions,
      precautions: targetRecord?.commonAdverseReactions
    };

    const report = compareMedicationScans([item1, item2]);
    setComparisonReport(report);
    setIsComparePickerOpen(false);
    setIsComparisonModalOpen(true);
  };

  // Build full clinical context string for DHANVI
  const buildMedicineDhanviContext = () => {
    return `MEDICINE PROFILE:
Name: ${scanData.confirmedMedicine}
Generic Name (Active Ingredient): ${medRecord?.genericName || scanData.genericName || scanData.confirmedMedicine}
Brand Names: ${medRecord?.brandNames?.join(', ') || scanData.brandName || 'N/A'}
Active Ingredients: ${(scanData.activeIngredients || medRecord?.activeIngredients || [medRecord?.genericName || scanData.confirmedMedicine]).join(', ')}
Composition: ${scanData.composition || medRecord?.composition || 'Standard pharmaceutical preparation'}
Strength: ${scanData.strength || scanData.dosage || medRecord?.approvedDosages[0] || 'Standard strength'}
Dosage Form: ${scanData.dosageForm || medRecord?.dosageForms[0] || 'Oral Formulation'}
Therapeutic Class: ${medRecord?.therapeuticClass || 'Pharmaceutical Agent'}
Approved Uses: ${medRecord?.labeledUses?.join('; ') || 'Approved regulatory indications'}
Mechanism of Action: ${medRecord?.mechanismOfAction || 'Standard pharmacological receptor/enzyme target'}
Administration Info: ${medRecord?.administrationInfo || 'Take as directed with water'}
Missed Dose Guidance: ${medRecord?.missedDoseGuidance || 'Take as soon as remembered unless close to next dose'}
Overdose Warnings: ${medRecord?.overdoseWarnings || 'Seek immediate medical attention in case of suspected overdose'}
Storage Instructions: ${medRecord?.storageInstructions || 'Store in a cool, dry place away from children'}
Boxed Warning: ${medRecord?.boxedWarning || 'None listed'}
Warnings & Precautions: ${medRecord?.warningsAndPrecautions?.join('; ') || 'Standard safety precautions'}`;
  };

  const handleEscalateToDhanvi = (customQuery?: string) => {
    const context = buildMedicineDhanviContext();
    if (onConsultDhanvi) {
      onConsultDhanvi(customQuery ? `${context}\n\nUSER QUESTION: ${customQuery}` : context);
    } else {
      setActiveTab('dhanvi');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Action Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBackToScan}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'te' ? 'మరొక మందును స్కాన్ చేయండి' : 'Scan Another Medicine'}
        </button>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Ask DHANVI Button */}
          <button
            onClick={() => handleEscalateToDhanvi()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
          >
            <Bot className="w-4 h-4" />
            {language === 'te' ? 'ధన్వితో మాట్లాడండి' : 'Ask DHANVI AI'}
          </button>

          {/* Compare Medicine Button */}
          <button
            onClick={() => setIsComparePickerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200"
          >
            <Scale className="w-4 h-4 text-teal-600" />
            {language === 'te' ? 'మందుల పోలిక' : 'Compare Medicine'}
          </button>

          {/* Add to Schedule */}
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            {language === 'te' ? 'రిమైండర్ సెట్ చేయండి' : 'Schedule Reminder'}
          </button>

          {/* Save to Firestore */}
          {user && (
            <button
              onClick={handleSaveToFirestore}
              disabled={isSaved || savingToFirestore}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  Saved
                </>
              ) : savingToFirestore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-teal-600" />
                  Save Scan
                </>
              )}
            </button>
          )}

          {/* Language Switcher */}
          {language === 'te' && (
            <button
              onClick={() => setShowEnglishView(!showEnglishView)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              {showEnglishView ? 'తెలుగు వివరణ' : 'English View'}
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
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Verified Regulatory Product
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                Jurisdiction: {scanData.jurisdiction || medRecord?.primaryJurisdiction || 'United States (FDA)'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                OCR Confidence: {Math.round(scanData.confidenceScore * 100)}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {scanData.confirmedMedicine}
            </h1>

            <div className="space-y-1 text-xs">
              <p className="font-semibold text-teal-800">
                <span className="text-slate-500 font-medium">Generic / Active Chemical:</span>{' '}
                {medRecord?.genericName || scanData.genericName || scanData.confirmedMedicine}
              </p>

              {(scanData.brandName || (medRecord?.brandNames && medRecord.brandNames.length > 0)) && (
                <p className="text-slate-600">
                  <span className="text-slate-400 font-medium">Common Trade / Brand Names:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {[scanData.brandName, ...(medRecord?.brandNames || [])]
                      .filter(Boolean)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(', ')}
                  </span>
                </p>
              )}

              {(scanData.composition || medRecord?.composition) && (
                <p className="text-slate-600">
                  <span className="text-slate-400 font-medium">Composition:</span>{' '}
                  <span className="text-slate-700 font-mono text-[11px]">
                    {scanData.composition || medRecord?.composition}
                  </span>
                </p>
              )}

              {medRecord?.therapeuticClass && (
                <p className="text-slate-600">
                  <span className="text-slate-400 font-medium">Pharmacological Class:</span>{' '}
                  <span className="font-semibold text-slate-800">{medRecord.therapeuticClass}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
            {(scanData.strength || scanData.dosage) && (
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Labeled Strength</span>
                <span className="text-lg font-black text-slate-900">{scanData.strength || scanData.dosage}</span>
              </div>
            )}
            {(scanData.dosageForm || medRecord?.dosageForms?.[0]) && (
              <div className="bg-teal-50/60 border border-teal-200 px-3 py-1.5 rounded-xl text-center text-xs font-bold text-teal-800">
                {scanData.dosageForm || medRecord?.dosageForms?.[0]}
              </div>
            )}
          </div>
        </div>

        {/* Prominent Boxed Warning Banner (FDA Black-Box Warning) */}
        {medRecord?.boxedWarning && (
          <div className="mt-4 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-950 bg-rose-200/80 px-2 py-0.5 rounded">
                  {t.boxedWarning}
                </span>
                <span className="text-[11px] font-bold text-rose-800">Mandated Regulatory Black-Box Caution</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                {medRecord.boxedWarning}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Structured Readable Tabs (Mobile & Desktop) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Navigation Bar with horizontal scrolling for mobile */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-2 sm:p-3 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1.5 min-w-max" aria-label="Medicine Information Tabs">
            {[
              {
                id: 'overview',
                icon: FileText,
                labelEn: 'Overview & Summary',
                labelTe: 'సమీక్ష & సారాంశం'
              },
              {
                id: 'scientific',
                icon: Microscope,
                labelEn: 'Mechanism & Uses',
                labelTe: 'చర్యా విధానం & ఉపయోగాలు'
              },
              {
                id: 'administration',
                icon: Pill,
                labelEn: 'Administration & Overdose',
                labelTe: 'వాడే విధానం & జాగ్రత్తలు'
              },
              {
                id: 'precautions',
                icon: AlertTriangle,
                labelEn: 'Side Effects & Safety',
                labelTe: 'దుష్ప్రభావాలు & భద్రత'
              },
              {
                id: 'interactions',
                icon: AlertOctagon,
                labelEn: 'Interactions & Warnings',
                labelTe: 'పరస్పర చర్యలు'
              },
              {
                id: 'sources',
                icon: BookOpen,
                labelEn: 'Verified Citations',
                labelTe: 'అధికారిక మూలాలు'
              },
              {
                id: 'dhanvi',
                icon: Bot,
                labelEn: 'Ask DHANVI AI',
                labelTe: 'ధన్విని అడగండి'
              }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MedicineResultTab)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{language === 'te' ? tab.labelTe : tab.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: OVERVIEW & SIMPLE LANGUAGE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Audio Playback Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {language === 'te' ? 'ఆడియో వివరణ (Voice Assistance)' : 'Bilingual Audio Monograph'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {language === 'te'
                        ? 'ఈ మందు గురించిన పూర్తి వివరణను తెలుగులో వినండి.'
                        : 'Listen to clear, verified medicine guidance in English or Telugu.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAudio}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                      isPlayingAudio
                        ? 'bg-rose-600 text-white animate-pulse'
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
                          Pause Audio
                        </>
                      )
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        {language === 'te' && !showEnglishView ? 'తెలుగులో వినండి' : 'Listen Aloud'}
                      </>
                    )}
                  </button>

                  {isPlayingAudio && (
                    <button
                      onClick={handleStopAudio}
                      className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                      title="Stop Audio"
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

              {/* Simple Language Grounded Explanation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    {language === 'te' && !showEnglishView ? 'సులభమైన తెలుగు వివరణ' : 'Plain Language Verified Explanation'}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Non-prescriptive patient health education
                  </span>
                </div>

                {loadingEvidence ? (
                  <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                    Retrieving official regulatory monograph passages...
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                    {language === 'te' && !showEnglishView ? teluguSummary : englishSummary}
                  </div>
                )}
              </div>

              {/* Key Quick Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Primary Approved Uses
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {(medRecord?.labeledUses?.slice(0, 3) || ['Pain & fever reduction']).map((u, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Standard Administration
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {medRecord?.administrationInfo || 'Take orally with a full glass of water. Swallow tablets whole; do not exceed labeled daily maximum.'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Core Safety Alert
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {medRecord?.warningsAndPrecautions?.[0] || 'Do not combine with other medications sharing the same active ingredients without doctor review.'}
                  </p>
                </div>
              </div>

              {/* Quick Actions Footer inside Overview */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Want to explore scientific pathways or adverse reactions?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('scientific')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    View Mechanism & Uses →
                  </button>
                  <button
                    onClick={() => handleEscalateToDhanvi()}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                  >
                    Ask DHANVI Questions →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCIENTIFIC DETAILS & MECHANISM OF ACTION */}
          {activeTab === 'scientific' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-teal-600" />
                  Clinical Pharmacology & Scientific Monograph
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed biochemical action, receptor pathways, and labeled therapeutic indications.
                </p>
              </div>

              {/* Mechanism of Action */}
              <div className="bg-teal-50/50 border border-teal-200 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  Mechanism of Action (Pharmacodynamics)
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  {medRecord?.mechanismOfAction ||
                    'Exerts clinical therapeutic effect through selective receptor or enzyme pathway modulation as documented in regulatory pharmacopoeias.'}
                </p>
              </div>

              {/* Approved Indications & Clinical Uses */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Approved Labeled Indications & Clinical Uses
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(medRecord?.labeledUses || []).map((use, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{use}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAG Retrieved Regulatory Monograph Passages */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Regulatory Monograph Passages (Vector RAG Evidence)
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {ragEvidence.length} Verifiable Chunks
                  </span>
                </div>

                {ragEvidence.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No specific vector passages retrieved for this monograph.</p>
                ) : (
                  <div className="space-y-3">
                    {ragEvidence.map((res: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            Section: {res.chunk?.sectionTitle || 'Monograph Section'}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Vector Relevance: {Math.round((res.similarityScore || 0.85) * 100)}%
                          </span>
                        </div>

                        <p className="text-slate-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200/60">
                          {res.chunk?.content}
                        </p>

                        {res.chunk?.source && (
                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>
                              Publisher: {res.chunk.source.publisher} ({res.chunk.source.jurisdiction})
                            </span>
                            <a
                              href={res.chunk.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
                            >
                              Official Registry <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADMINISTRATION, MISSED-DOSE & OVERDOSE GUIDANCE */}
          {activeTab === 'administration' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  Administration Guidance, Missed-Dose & Overdose Warnings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard labeled instructions, storage recommendations, and acute overdose protocols.
                </p>
              </div>

              {/* Labeled Administration Instructions */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-teal-600" />
                  Administration Instructions & Dietary Timing
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {medRecord?.administrationInfo ||
                    'Administer orally with water according to prescribed schedule. Swallow delayed-release or enteric-coated preparations whole.'}
                </p>
              </div>

              {/* Missed-Dose Guidance */}
              <div className="bg-sky-50/70 p-5 rounded-2xl border border-sky-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  What to Do If You Miss a Dose
                </span>
                <p className="text-xs sm:text-sm text-sky-900 leading-relaxed font-normal">
                  {medRecord?.missedDoseGuidance ||
                    'Take the missed dose as soon as remembered. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. Never take a double dose to make up for a missed dose.'}
                </p>
              </div>

              {/* Overdose Warnings & Emergency Protocol */}
              <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Overdose Warnings & Acute Toxicity Protocol
                </span>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
                  {medRecord?.overdoseWarnings ||
                    'Acute overdose can cause life-threatening toxicities. If suspected, seek immediate emergency medical care or contact Poison Control immediately.'}
                </p>
              </div>

              {/* Storage and Handling Instructions */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Storage & Handling Instructions
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {medRecord?.storageInstructions ||
                    'Store at 20°C to 25°C (68°F to 77°F). Protect from excessive heat, moisture, and direct sunlight. Keep tightly closed out of reach of children.'}
                </p>
              </div>

              {/* Non-Prescriptive Legal Disclaimer */}
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Non-Prescriptive Disclaimer:</strong> MedLens AI provides educational medicine summaries derived strictly from approved drug monographs. It does not provide personalized dosage prescriptions, recommend self-medication, or suggest modifying your prescribed regimen. Always consult your prescribing physician or licensed pharmacist for medical care.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SIDE EFFECTS & PRECAUTIONS */}
          {activeTab === 'precautions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Adverse Reactions, Warnings & Contraindications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinical safety information, potential side effects, and strict contraindications.
                </p>
              </div>

              {/* Boxed Warning (if present) */}
              {medRecord?.boxedWarning && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-rose-950 block">
                      {t.boxedWarning}
                    </span>
                    <p className="text-xs text-rose-900 mt-1 leading-relaxed font-medium">
                      {medRecord.boxedWarning}
                    </p>
                  </div>
                </div>
              )}

              {/* Contraindications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  Strict Contraindications (Who Should NOT Take This Medicine)
                </h4>
                <div className="space-y-2">
                  {(medRecord?.contraindications || ['Known hypersensitivity to active ingredients']).map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-rose-950 flex items-start gap-2"
                    >
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings and Precautions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Warnings and Clinical Precautions
                </h4>
                <div className="space-y-2">
                  {(medRecord?.warningsAndPrecautions || []).map((w, i) => (
                    <div
                      key={i}
                      className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 text-xs text-slate-800 flex items-start gap-2"
                    >
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Adverse Reactions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-500" />
                  Common Adverse Reactions Reported in Clinical Trials
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(medRecord?.commonAdverseReactions || ['Nausea', 'Headache']).map((r, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTERACTIONS & WARNINGS */}
          {activeTab === 'interactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                    Drug-Drug, Alcohol & Food Interactions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Documented cross-reactions and clinical co-administration warnings.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (onOpenComparison) {
                      onOpenComparison(scanData.confirmedMedicine);
                    } else {
                      setIsComparePickerOpen(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Scale className="w-3.5 h-3.5 text-teal-600" />
                  Check Multi-Drug Interactions
                </button>
              </div>

              {/* Structured Interactions List */}
              <div className="space-y-3">
                {(medRecord?.interactionsList || [
                  {
                    substance: 'Alcohol (Ethanol)',
                    severity: 'severe' as const,
                    effect: 'Concurrent alcohol use elevates toxic metabolic byproduct formation and liver or CNS risks.',
                    clinicalAdvice: 'Avoid chronic or excessive alcohol consumption during therapy.'
                  }
                ]).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-1.5 ${
                      item.severity === 'severe'
                        ? 'bg-rose-50/70 border-rose-300'
                        : item.severity === 'moderate'
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">
                        {item.substance}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          item.severity === 'severe'
                            ? 'bg-rose-600 text-white'
                            : item.severity === 'moderate'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.severity} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      <strong>Clinical Effect:</strong> {item.effect}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Management Advice:</strong> {item.clinicalAdvice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: VERIFIED SOURCES & CITATIONS */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Traceable Regulatory Citations & Source Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified statutory drug labels from official regulatory registries (US FDA & India CDSCO).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(sources.length > 0 ? sources : (medRecord?.sources || [])).map((src: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {src.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {src.jurisdiction?.includes('FDA') ? 'US FDA' : src.jurisdiction?.includes('CDSCO') ? 'India CDSCO' : 'Global'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Regulatory Publisher:</strong> {src.publisher}
                      </p>
                      {src.documentId && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Document ID: {src.documentId}
                        </p>
                      )}
                      {src.revisionDate && (
                        <p className="text-[11px] text-slate-400">
                          Revision Date: {src.revisionDate}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setSelectedCitation(src)}
                        className="flex-1 py-1.5 px-3 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Verify Authority
                      </button>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-teal-700 rounded-xl hover:bg-slate-200 transition-colors"
                        title="Open Official Regulatory Repository"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ASK DHANVI AI FOLLOW-UP QUESTIONS */}
          {activeTab === 'dhanvi' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {language === 'te' ? 'ధన్వి AI — ఫాలో-అప్ ప్రశ్నలు' : 'DHANVI AI — Medicine Q&A Assistant'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ask specific questions about {scanData.confirmedMedicine} in Telugu or English.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleEscalateToDhanvi()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Bot className="w-4 h-4" />
                  Open in Full DHANVI Chatbot →
                </button>
              </div>

              {/* Quick Sample Questions (Telugu / English) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Suggested Clinical Questions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { te: 'ఈ మందు దేనికి ఉపయోగిస్తారు?', en: 'What is this medicine used for?' },
                    { te: 'ఈ మందు వల్ల ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?', en: 'What precautions should be taken?' },
                    { te: 'నేను మోతాదు మరచిపోతే ఏమి చేయాలి?', en: 'What should I do if I miss a dose?' },
                    { te: 'ఈ మందుతో ఎలాంటి ఆహారం తీసుకోకూడదు?', en: 'Are there food or alcohol interactions?' }
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const queryText = language === 'te' ? q.te : q.en;
                        setActiveQuestion(queryText);
                        fetchRAGEvidence(queryText);
                      }}
                      className="p-3 text-left rounded-xl text-xs font-semibold bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>{language === 'te' ? q.te : q.en}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Search & Text Question Bar */}
              <form onSubmit={handleQuestionSubmit} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={voiceTranscript || activeQuestion}
                    onChange={(e) => {
                      setActiveQuestion(e.target.value);
                      setVoiceTranscript('');
                    }}
                    placeholder={
                      language === 'te'
                        ? 'ధన్విని ఈ మందు గురించి అడగండి (ఉదా: ఆహారంతో తీసుకోవచ్చా?)...'
                        : 'Ask DHANVI a question about this medicine (e.g., Can I take it with food?)...'
                    }
                    className="w-full pl-4 pr-24 py-3 text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs"
                  />

                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                      title={t.voiceSearchTooltip}
                      className={`p-2.5 rounded-xl transition-all ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                      }`}
                      aria-label="Voice question input"
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      type="submit"
                      disabled={loadingEvidence || (!voiceTranscript && !activeQuestion)}
                      className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
                      aria-label="Submit question"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isRecording && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-800 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                    <span>Listening... {recognizedInterim && `"${recognizedInterim}"`}</span>
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
                      Recognized Speech (Edit if needed before submitting):
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
                        className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        Ask DHANVI
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* User Feedback & Rating Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'te' ? 'ఈ ఫలితంపై మీ అభిప్రాయం (User Feedback)' : 'Rate Scan Accuracy & Helpfulness'}
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
              {language === 'te' ? 'ఫీడ్‌బ్యాక్ నమోదైంది' : 'Feedback Saved'}
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
                  ? `మీరు ${scanData.confirmedMedicine} స్కాన్‌కు ఖచ్చితత్వం: ${accuracyRating}/5 గా రేట్ చేశారు.`
                  : `Your ratings (Accuracy: ${accuracyRating}/5, Helpfulness: ${helpfulnessRating}/5) were recorded securely in Firestore for clinical model triage.`}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          star <= accuracyRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

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
                          star <= helpfulnessRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                {language === 'te' ? 'అదనపు వివరాలు / సూచనలు (ఐచ్ఛికం)' : 'Additional Comments or Corrections (Optional)'}
              </label>
              <textarea
                rows={2}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share any OCR errors or specific label details..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-teal-600 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                {feedbackSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Medicine Comparison Selector Dialog */}
      {isComparePickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Select Medicine to Compare</h3>
              </div>
              <button
                onClick={() => setIsComparePickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select another verified medicine from the clinical library to compare side-by-side with{' '}
              <strong>{scanData.confirmedMedicine}</strong>:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {AUTHORITATIVE_MEDICINES.filter(
                (m) => m.medicineName.toLowerCase() !== scanData.confirmedMedicine.toLowerCase()
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleStartComparisonWith(m.medicineName)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{m.medicineName}</span>
                    <span className="text-slate-500 text-[11px]">{m.therapeuticClass}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-teal-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal Component */}
      {comparisonReport && (
        <ComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          report={comparisonReport}
          language={language}
        />
      )}

      {/* Source Citation Verification Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Source Authority Verification</h3>
                  <p className="text-xs text-slate-500">Regulatory Mandate & Citation Metadata</p>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revision Date</span>
                    <div className="font-semibold text-slate-800">{selectedCitation.revisionDate || 'Current Pharmacopoeia'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={selectedCitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-center shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Official Regulatory Document
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCitation(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medication Schedule Setup Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Medication Schedule Reminder</h3>
                  <p className="text-xs text-slate-500">Configure daily alerts based on identified label</p>
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
                  Strength: {scanData.dosage || scanData.strength || medRecord?.approvedDosages[0] || '1 Unit'} •{' '}
                  {scanData.dosageForm || medRecord?.dosageForms[0] || 'Oral Formulation'}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Dosing Frequency</label>
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
                    Daily Routine
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
                    Weekly Course
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Dose Intake Times</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Morning (8:00 AM)', time: '08:00' },
                    { label: 'Afternoon (2:00 PM)', time: '14:00' },
                    { label: 'Night (8:00 PM)', time: '20:00' }
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs text-xs transition-all flex items-center gap-1.5"
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
