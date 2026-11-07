/**
 * Drug-Drug Interaction Checker Component
 * Allows users to select multiple saved medicine scan records from Firestore or add custom medicines,
 * analyzes them for potential pharmacological interactions using Gemini, and displays a prioritized safety list.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  X,
  FileText,
  Search,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Pill,
  Volume2
} from 'lucide-react';
import { SavedScanRecord } from '../lib/scanStorage';
import {
  checkDrugInteractions,
  InteractionCheckResult,
  DrugInteractionPair,
  InteractionSeverity
} from '../lib/interactionChecker';
import { SupportedLanguage } from '../lib/translations';
import { AUTHORITATIVE_MEDICINES } from '../lib/authoritativeData';
import { speechService } from '../lib/speechService';

interface InteractionCheckerProps {
  scans: SavedScanRecord[];
  language: SupportedLanguage;
  onNavigateToScan?: () => void;
  onConsultDhanvi?: (context: string) => void;
}

export const InteractionChecker: React.FC<InteractionCheckerProps> = ({
  scans,
  language,
  onNavigateToScan,
  onConsultDhanvi
}) => {
  // Pre-populate with first 2-3 scanned medicines if available, or default samples
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>(() => {
    const fromScans = scans.map((s) => s.medicineName).filter(Boolean);
    if (fromScans.length >= 2) {
      return Array.from(new Set(fromScans)).slice(0, 3);
    }
    return ['Paracetamol 650mg', 'Metformin 500mg', 'Pantoprazole 40mg'];
  });

  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'severe' | 'moderate' | 'minor' | 'safe'>('all');
  const [speaking, setSpeaking] = useState(false);

  // Initial interaction run
  useEffect(() => {
    if (selectedMedicines.length >= 2) {
      handleRunCheck();
    }
  }, []);

  const handleRunCheck = async () => {
    if (selectedMedicines.length < 2) return;
    setLoading(true);
    try {
      const res = await checkDrugInteractions(selectedMedicines);
      setResult(res);
    } catch (err) {
      console.error('Interaction check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = (med: string) => {
    const trimmed = med.trim();
    if (trimmed && !selectedMedicines.includes(trimmed)) {
      setSelectedMedicines([...selectedMedicines, trimmed]);
      setCustomInput('');
    }
  };

  const handleRemoveMedicine = (med: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m !== med));
  };

  const handleSelectFromScan = (scan: SavedScanRecord) => {
    handleAddMedicine(scan.medicineName);
  };

  const handleSpeakSummary = () => {
    if (!result) return;
    if (speaking) {
      speechService.stop();
      setSpeaking(false);
      return;
    }
    const textToSpeak = language === 'te' && result.summaryTelugu ? result.summaryTelugu : result.summary;
    setSpeaking(true);
    speechService.speak(textToSpeak, language, () => setSpeaking(false));
  };

  const filteredInteractions = result?.interactions.filter((p) => {
    if (filterSeverity === 'all') return true;
    return p.severity === filterSeverity;
  }) || [];

  const getSeverityBadge = (sev: InteractionSeverity) => {
    switch (sev) {
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            {language === 'te' ? 'తీవ్రమైన ప్రమాదం (Severe)' : 'Severe / High Risk'}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {language === 'te' ? 'మితమైన జాగ్రత్త (Moderate)' : 'Moderate Caution'}
          </span>
        );
      case 'minor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            {language === 'te' ? 'స్వల్పం (Minor)' : 'Minor / Stagger Dosing'}
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {language === 'te' ? 'సురక్షితం (Compatible)' : 'Safe / Compatible'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold tracking-wide border border-teal-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'te' ? 'మందుల పరస్పర చర్యల తనిఖీ' : 'Prioritized Clinical Drug-Drug Safety Engine'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'te'
              ? 'మల్టీ-మెడిసిన్ ఇంటరాక్షన్ చెకర్'
              : 'Multi-Medicine Interaction Checker'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {language === 'te'
              ? 'మీరు తీసుకుంటున్న వివిధ మందుల మధ్య ఏవైనా హానికరమైన పరస్పర చర్యలు (Drug-Drug Interactions) ఉన్నాయో లేదో ధన్వి & జెమినీ AI ద్వారా విశ్లేషించండి. మోతాదుల సమయాలు మరియు జాగ్రత్తలను తెలుసుకోండి.'
              : 'Cross-reference multiple prescription and over-the-counter medications from your scan history. Analyze pharmacological mechanisms, metabolic competition, staggered intake schedules, and prioritized safety warnings.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Medicine Selection + Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Medicine Pool & Selector */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              {language === 'te' ? 'ఎంచుకున్న మందుల జాబితా' : 'Medications to Check'}
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {selectedMedicines.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'te'
                ? 'తనిఖీ చేయడానికి కనీసం 2 మందులను ఎంచుకోండి.'
                : 'Select or add at least 2 medications to evaluate safety.'}
            </p>
          </div>

          {/* Active Chips */}
          <div className="flex flex-wrap gap-2">
            {selectedMedicines.map((med) => (
              <span
                key={med}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-semibold shadow-2xs"
              >
                <span>{med}</span>
                <button
                  onClick={() => handleRemoveMedicine(med)}
                  className="hover:text-rose-600 transition-colors"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {selectedMedicines.length === 0 && (
              <p className="text-xs text-slate-400 italic">No medicines selected yet.</p>
            )}
          </div>

          {/* Custom Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMedicine(customInput);
                }
              }}
              placeholder={language === 'te' ? 'మందు పేరు టైప్ చేయండి (ఉదా. Dolo 650)' : 'Type medicine name (e.g. Aspirin)...'}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              onClick={() => handleAddMedicine(customInput)}
              disabled={!customInput.trim()}
              className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Add from Scanned History */}
          {scans.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'te' ? 'మీ మునుపటి స్కాన్‌ల నుండి జోడించండి:' : 'Add From Your Scans:'}
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {scans.map((s) => {
                  const alreadySelected = selectedMedicines.includes(s.medicineName);
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectFromScan(s)}
                      disabled={alreadySelected}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                        alreadySelected
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
                          : 'bg-white hover:bg-teal-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold block truncate">{s.medicineName}</span>
                        <span className="text-[10px] text-slate-500">{s.dosage || s.genericName || 'Prescription'}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Preset Combos */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'te' ? 'పరీక్షించడానికి ఉదాహరణలు:' : 'Common Clinical Presets:'}
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => setSelectedMedicines(['Metformin 500mg', 'Pantoprazole 40mg', 'Paracetamol 650mg'])}
                className="text-left p-2 rounded-lg text-[11px] bg-slate-50 hover:bg-teal-50 text-slate-700 border border-slate-200"
              >
                💊 Diabetes + Acidity: Metformin + Pantoprazole + Paracetamol
              </button>
              <button
                onClick={() => setSelectedMedicines(['Aspirin 75mg', 'Ibuprofen 400mg'])}
                className="text-left p-2 rounded-lg text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
              >
                ⚠️ Bleeding Alert: Aspirin + Ibuprofen
              </button>
              <button
                onClick={() => setSelectedMedicines(['Amoxicillin 500mg', 'Paracetamol 650mg'])}
                className="text-left p-2 rounded-lg text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              >
                ✅ Common Infection: Amoxicillin + Paracetamol
              </button>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunCheck}
            disabled={selectedMedicines.length < 2 || loading}
            className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-lg text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {language === 'te' ? 'విశ్లేషిస్తోంది...' : 'Analyzing Clinical Interactions...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {language === 'te' ? 'పరస్పర చర్యలను విశ్లేషించండి' : 'Analyze Interactions'}
              </>
            )}
          </button>
        </div>

        {/* Right Columns (2 spans): Prioritized Safety List & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'te' ? 'డ్రగ్-డ్రగ్ పరస్పర చర్యలను జెమినీ AI విశ్లేషిస్తోంది...' : 'Cross-referencing Pharmacological Databases with Gemini AI...'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Checking cytochrome P450 pathways, renal excretion competition, gastric absorption changes, and clinical contraindications.
              </p>
            </div>
          )}

          {!loading && result && (
            <>
              {/* Executive Safety Summary Box */}
              <div
                className={`rounded-xl p-5 border shadow-sm ${
                  result.overallRiskLevel === 'high'
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                    : result.overallRiskLevel === 'moderate'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                    : 'bg-teal-50/90 border-teal-200 text-teal-950'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-2xs shrink-0">
                      {result.overallRiskLevel === 'high' ? (
                        <ShieldAlert className="w-6 h-6 text-rose-600" />
                      ) : result.overallRiskLevel === 'moderate' ? (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {language === 'te' ? 'మొత్తం భద్రతా స్థితి' : 'Overall Interaction Risk'}:
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-extrabold uppercase bg-white border">
                          {result.overallRiskLevel}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1 leading-relaxed">
                        {language === 'te' && result.summaryTelugu ? result.summaryTelugu : result.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSpeakSummary}
                    title="Listen to summary"
                    className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shrink-0"
                  >
                    <Volume2 className={`w-4 h-4 ${speaking ? 'text-teal-600 animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs for Prioritized Safety List */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="font-bold text-slate-500 mr-2">Filter:</span>
                  <button
                    onClick={() => setFilterSeverity('all')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      filterSeverity === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({result.interactions.length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('severe')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      filterSeverity === 'severe' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Severe ({result.interactions.filter((p) => p.severity === 'severe').length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('moderate')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      filterSeverity === 'moderate' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Moderate ({result.interactions.filter((p) => p.severity === 'moderate').length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('minor')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      filterSeverity === 'minor' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Minor ({result.interactions.filter((p) => p.severity === 'minor').length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('safe')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      filterSeverity === 'safe' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Safe ({result.interactions.filter((p) => p.severity === 'safe').length})
                  </button>
                </div>
              </div>

              {/* Prioritized Interaction Pairs Cards */}
              <div className="space-y-4">
                {filteredInteractions.map((pair, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-teal-300 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{pair.drugA}</span>
                        <span className="text-slate-400 font-bold">↔</span>
                        <span className="font-extrabold text-slate-900 text-sm">{pair.drugB}</span>
                      </div>
                      <div>{getSeverityBadge(pair.severity)}</div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block">Clinical Effect:</span>
                        <p className="text-slate-600 leading-relaxed">{pair.clinicalEffect}</p>
                      </div>

                      {pair.mechanism && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-0.5">Pharmacological Mechanism:</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{pair.mechanism}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                          <span className="font-bold text-teal-900 flex items-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            Timing & Staggering Advice:
                          </span>
                          <p className="text-teal-800 text-[11px] leading-relaxed">{pair.timingAdvice}</p>
                        </div>

                        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                          <span className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Clinical Management:
                          </span>
                          <p className="text-amber-800 text-[11px] leading-relaxed">{pair.management}</p>
                        </div>
                      </div>

                      {pair.foodAlcoholWarning && (
                        <div className="text-[11px] text-rose-700 bg-rose-50/60 p-2 rounded border border-rose-100">
                          <span className="font-bold">Food/Alcohol Note: </span>
                          {pair.foodAlcoholWarning}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredInteractions.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-500 text-xs">
                    No interaction pairs match the selected filter ({filterSeverity}).
                  </div>
                )}
              </div>

              {/* Food, Alcohol & Lifestyle Safety Advice */}
              {result.foodAndLifestyleWarnings && result.foodAndLifestyleWarnings.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    Food & Alcohol Interaction Considerations
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
                    {result.foodAndLifestyleWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions for Doctor */}
              {result.doctorDiscussionPoints && result.doctorDiscussionPoints.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    {language === 'te' ? 'మీ వైద్యుడిని అడగవలసిన ప్రశ్నలు' : 'Questions to Prepare for Your Doctor'}
                  </h3>
                  <div className="space-y-1.5 text-xs text-teal-900">
                    {result.doctorDiscussionPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-bold text-teal-600">•</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  {onConsultDhanvi && (
                    <div className="pt-2">
                      <button
                        onClick={() =>
                          onConsultDhanvi(
                            `Interaction analysis for medicines: ${selectedMedicines.join(', ')}. Risk level: ${
                              result.overallRiskLevel
                            }. Summary: ${result.summary}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {language === 'te' ? 'ధన్వి AI ని మరింత వివరణ అడగండి' : 'Ask DHANVI AI to Explain in Detail'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !result && selectedMedicines.length < 2 && (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 space-y-2">
              <Pill className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Select at least 2 medicines to begin safety analysis.</p>
              <p className="text-xs text-slate-400">Add medicines from your scans or choose a clinical preset from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
