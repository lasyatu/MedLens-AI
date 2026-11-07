import React from 'react';
import {
  ScanLine,
  History,
  FileText,
  MessageSquare,
  HeartPulse,
  Utensils,
  Mic,
  BookOpen,
  Settings,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  Bell,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SavedScanRecord } from '../lib/scanStorage';
import { AppView } from './Navbar';
import { SupportedLanguage } from '../lib/translations';
import { MedicationSchedule, getUpcomingDoses, getNextImmediateDose, markDoseTaken } from '../lib/scheduleStorage';

interface DashboardProps {
  scans: SavedScanRecord[];
  schedules?: MedicationSchedule[];
  onRefreshSchedules?: () => void;
  onNavigate: (view: AppView) => void;
  onViewScan: (scan: SavedScanRecord) => void;
  onTryPreset: (presetKey: string) => void;
  language: SupportedLanguage;
}

export const Dashboard: React.FC<DashboardProps> = ({
  scans,
  schedules = [],
  onRefreshSchedules,
  onNavigate,
  onViewScan,
  onTryPreset,
  language
}) => {
  const { user, profile } = useAuth();
  const recentScans = scans.slice(0, 4);

  const nextDose = getNextImmediateDose(schedules);
  const todayDoses = getUpcomingDoses(schedules);

  const handleQuickMarkTaken = async (scheduleId: string) => {
    await markDoseTaken(user?.uid || 'guest-user', scheduleId);
    if (onRefreshSchedules) onRefreshSchedules();
  };

  const modules = [
    {
      id: 'dhanvi' as AppView,
      title: language === 'te' ? 'ధన్వి AI అసిస్టెంట్' : 'DHANVI AI',
      subtitle: language === 'te' ? 'వాయిస్ & టెక్స్ట్‌తో ఇంగ్లీష్/తెలుగు AI సంభాషణ' : 'Conversational AI with English/Telugu voice & report understanding',
      icon: Sparkles,
      color: 'from-indigo-600 to-purple-700',
      tag: 'Voice + Intelligence'
    },
    {
      id: 'scan-report' as AppView,
      title: language === 'te' ? 'స్కాన్ రిపోర్ట్' : 'SCAN REPORT',
      subtitle: language === 'te' ? 'మల్టీ-పేజీ PDF లేదా కెమెరా ద్వారా స్కాన్ చేయండి' : 'Multi-page camera & PDF document scanner with OCR',
      icon: ScanLine,
      color: 'from-teal-600 to-cyan-700',
      tag: 'Multi-Page OCR'
    },
    {
      id: 'analyse-report' as AppView,
      title: language === 'te' ? 'ఎనలైజ్ రిపోర్ట్' : 'ANALYSE REPORT',
      subtitle: language === 'te' ? 'ల్యాబ్ రిపోర్టులు & 11-విభాగాల జనరల్ విశ్లేషణ' : 'Medical laboratory panels & 11-section general document analysis',
      icon: FileText,
      color: 'from-blue-600 to-teal-700',
      tag: 'Dual Category'
    },
    {
      id: 'comparison' as AppView,
      title: language === 'te' ? 'రిపోర్ట్ పోలిక' : 'REPORT COMPARISON',
      subtitle: language === 'te' ? 'రెండు రిపోర్టులను పక్కపక్కన పోల్చండి' : 'Side-by-side medical biomarker deltas & academic document comparison',
      icon: Layers,
      color: 'from-slate-800 to-indigo-900',
      tag: 'Differential Diff'
    },
    {
      id: 'interactions' as AppView,
      title: language === 'te' ? 'ఇంటరాక్షన్ చెకర్' : 'INTERACTION CHECKER',
      subtitle: language === 'te' ? 'మందుల మధ్య పరస్పర చర్యలు & భద్రతా జాబితా' : 'Multi-drug pharmacological interaction analysis & prioritized safety list',
      icon: ShieldAlert,
      color: 'from-rose-600 to-amber-700',
      tag: 'Safety Engine'
    },
    {
      id: 'scan' as AppView,
      title: language === 'te' ? 'మందుల స్కానర్' : 'Medicine Scanner',
      subtitle: language === 'te' ? 'ఫోటో తీసి మందుల వివరాలు సరిచూడండి' : 'Extract label text, dosage & verify FDA/CDSCO monographs',
      icon: ScanLine,
      color: 'from-teal-600 to-cyan-600',
      tag: 'OCR + RAG'
    },
    {
      id: 'schedule' as AppView,
      title: language === 'te' ? 'మందుల షెడ్యూల్ & అలర్ట్స్' : 'Medication Schedule',
      subtitle: language === 'te' ? 'రోజువారీ రిమైండర్‌లు & మోతాదు సమయాలు' : 'Daily & weekly dose reminders, meal timings & proactive alerts',
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
      tag: `${schedules.length} Reminders`
    },
    {
      id: 'guidance' as AppView,
      title: language === 'te' ? 'ఆరోగ్య మార్గదర్శకత్వం' : 'Health & Prevention',
      subtitle: language === 'te' ? 'అత్యవసర 112 సంకేతాలు & డాక్టర్ ప్రశ్నలు' : 'Emergency 112 triage, risk awareness & doctor checklists',
      icon: HeartPulse,
      color: 'from-rose-600 to-pink-700',
      tag: 'Emergency 112'
    },
    {
      id: 'diet' as AppView,
      title: language === 'te' ? 'భారతీయ ఆహార సూచనలు' : 'Dietary Suggestions',
      subtitle: language === 'te' ? 'రాగులు, చిరుధాన్యాలు & పోషకాహార గైడ్' : 'ICMR-NIN evidence, millets, glycemic index & hydration',
      icon: Utensils,
      color: 'from-emerald-600 to-teal-700',
      tag: 'ICMR Guidelines'
    },
    {
      id: 'history' as AppView,
      title: language === 'te' ? 'స్కాన్ & రిపోర్ట్ హిస్టరీ' : 'Scan History & Compare',
      subtitle: language === 'te' ? 'సేవ్ చేసిన మందుల వివరాలు & పోలిక' : 'UID-isolated Firestore vault & multi-medicine comparison',
      icon: History,
      color: 'from-slate-700 to-slate-900',
      tag: `${scans.length} Saved`
    },
    {
      id: 'library' as AppView,
      title: language === 'te' ? 'ఆఫ్‌లైన్ హెల్త్ లైబ్రరీ' : 'Offline Health Library',
      subtitle: language === 'te' ? 'ఇంటర్నెట్ లేకుండా చదవగలిగే సమాచారం' : '100% locally cached medical guides & safe storage tips',
      icon: BookOpen,
      color: 'from-indigo-600 to-slate-800',
      tag: '100% Offline'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <ScanLine className="w-96 h-96 -mr-20 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MedLens AI • Complete Health Intelligence Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'te' ? 'నమస్తే' : 'Welcome back'}, {profile?.displayName || user?.email?.split('@')[0] || 'Health Seeker'}
          </h1>
          <p className="mt-2 text-sm text-teal-100/90 leading-relaxed font-normal">
            {language === 'te'
              ? 'మందుల లేబుల్స్ స్కాన్ చేయండి, ల్యాబ్ రిపోర్టుల విశ్లేషణ పొందండి, తెలుగులో వాయిస్ ద్వారా ప్రశ్నలు అడగండి మరియు మీ ఆరోగ్యాన్ని జాగ్రత్తగా కాపాడుకోండి.'
              : 'Scan medicine packaging, analyze clinical laboratory reports, consult our bilingual assistant in Telugu or English, and explore evidence-based nutrition.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('dhanvi')}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {language === 'te' ? 'ధన్వి AI తో మాట్లాడండి' : 'Chat with DHANVI AI'}
            </button>
            <button
              onClick={() => onNavigate('scan-report')}
              className="px-4 py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-800 border border-teal-500/50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <ScanLine className="w-4 h-4 text-teal-300" />
              {language === 'te' ? 'స్కాన్ రిపోర్ట్' : 'Scan Report'}
            </button>
            <button
              onClick={() => onNavigate('analyse-report')}
              className="px-4 py-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-900/90 border border-teal-600/50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-teal-300" />
              {language === 'te' ? 'ఎనలైజ్ రిపోర్ట్' : 'Analyse Report'}
            </button>
            <button
              onClick={() => onNavigate('interactions')}
              className="px-4 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-900/90 border border-rose-600/50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-rose-300" />
              {language === 'te' ? 'ఇంటరాక్షన్ చెకర్' : 'Interaction Checker'}
            </button>
            <button
              onClick={() => onNavigate('schedule')}
              className="px-4 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 border border-amber-400/50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-100" />
              {language === 'te' ? 'మందుల షెడ్యూల్' : 'Dose Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Medication Dose Alert Widget */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              nextDose?.isDueSoon || nextDose?.isOverdue
                ? 'bg-amber-100 text-amber-700 animate-pulse'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {language === 'te' ? 'రాబోయే మందుల సమయం (Upcoming Dose Alert)' : 'Upcoming Medication Dose Alert'}
                </h2>
                {nextDose && !nextDose.isTakenToday && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    nextDose.isOverdue
                      ? 'bg-rose-100 text-rose-800'
                      : nextDose.isDueSoon
                      ? 'bg-amber-100 text-amber-900 font-extrabold animate-bounce'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {nextDose.isOverdue ? 'Overdue' : nextDose.isDueSoon ? 'Due Soon' : 'Next Dose'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'మీరు తీసుకునే మందుల సమయాలు మరియు రోజువారీ హెచ్చరికలు'
                  : 'Proactive reminders and scheduled times based on your identified medicine labels'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('schedule')}
            className="self-start sm:self-auto text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            {language === 'te' ? 'పూర్తి షెడ్యూల్ చూడండి' : 'View Full Schedule'} ({schedules.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nextDose ? (
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            nextDose.isTakenToday
              ? 'bg-emerald-50/50 border-emerald-200'
              : nextDose.isOverdue
              ? 'bg-rose-50/60 border-rose-300'
              : nextDose.isDueSoon
              ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
              : 'bg-teal-50/40 border-teal-200'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 shadow-2xs">
                  {nextDose.timeFormatted}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {nextDose.isTakenToday
                    ? 'Taken today'
                    : nextDose.minutesDiff > 0
                    ? `Due in ${Math.round(nextDose.minutesDiff)} minutes`
                    : `${Math.abs(Math.round(nextDose.minutesDiff))} minutes past due`}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <h3 className="text-base font-bold text-slate-900">{nextDose.medicineName}</h3>
                <span className="text-xs font-semibold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                  {nextDose.dosage}
                </span>
              </div>

              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <span>Rule: <strong>{nextDose.mealTiming.replace('_', ' ').toUpperCase()}</strong></span>
                {nextDose.instructions && <span>• "{nextDose.instructions}"</span>}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              {!nextDose.isTakenToday ? (
                <button
                  onClick={() => handleQuickMarkTaken(nextDose.scheduleId)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {language === 'te' ? 'తీసుకున్నాను (Mark Taken)' : 'Mark as Taken'}
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {language === 'te' ? 'నేటి మోతాదు పూర్తయింది' : 'Taken for Today'}
                </span>
              )}
              <button
                onClick={() => onNavigate('schedule')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
              >
                {language === 'te' ? 'మార్చండి' : 'Manage'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <strong className="text-slate-800 block font-bold">
                {language === 'te' ? 'మందుల రిమైండర్ షెడ్యూల్ సెట్ చేయండి' : 'No Active Medication Reminders Set'}
              </strong>
              <p className="text-slate-500">
                {language === 'te'
                  ? 'మందుల లేబుల్స్ స్కాన్ చేసిన తర్వాత రోజువారీ తీసుకోవలసిన మోతాదు సమయాలను ఇక్కడ భద్రపరచవచ్చు.'
                  : 'Track your daily pill intake and receive timely dose notifications based on your scanned medicine packages.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('schedule')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shrink-0 shadow-2xs transition-all"
            >
              {language === 'te' ? 'రిమైండర్ సెట్ చేయండి' : 'Set Dose Reminder'}
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'te' ? 'ఆరోగ్య మాడ్యూల్స్ (Health Modules)' : 'Platform Healthcare Modules'}
          </h2>
          <span className="text-xs text-slate-500">All 10 Sections Operational</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onNavigate(m.id)}
                className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${m.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {m.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{m.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                  <span>{language === 'te' ? 'ప్రారంభించండి' : 'Launch'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'te' ? 'ఇటీవలి సేవ్ చేసిన స్కాన్‌లు' : 'Recent Medicine Scans'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              {language === 'te' ? 'అన్నీ చూడండి' : 'View All'} ({scans.length})
            </button>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'ఇంకా స్కాన్‌లు సేవ్ చేయలేదు. కెమెరా లేదా నమూనా ద్వారా ప్రారంభించండి.'
                  : 'No saved scans yet. Use the scanner or try a preset below.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onViewScan(scan)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{scan.medicineName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {scan.genericName} • {scan.dosage || 'Standard dose'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {language === 'te' ? 'త్వరిత పరీక్షా నమూనాలు' : 'One-Click Medicine Samples'}
          </h3>
          <p className="text-xs text-slate-500 leading-snug">
            {language === 'te'
              ? 'నిజమైన మందు లేబుల్ ఫోటోలు లేకుండానే వెంటనే తనిఖీ చేయండి.'
              : 'Inspect authentic packaging samples with preprocessed filters.'}
          </p>

          <div className="space-y-2 pt-1">
            {[
              { id: 'paracetamol', label: 'Paracetamol 500mg (IP)', desc: 'Analgesic & Antipyretic' },
              { id: 'amoxicillin', label: 'Amoxicillin 250mg', desc: 'Broad-spectrum Antibiotic' },
              { id: 'metformin', label: 'Metformin 500mg', desc: 'Type 2 Diabetes Glycemic Agent' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onTryPreset(p.id)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-xs text-slate-900">{p.label}</div>
                <div className="text-[11px] text-slate-500">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
