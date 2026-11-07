/**
 * Medication Schedule & Reminder Management Component
 * Features:
 * - View active daily/weekly medicine reminder schedules
 * - Add new medication schedule with custom dosage, times, meal instructions, and days
 * - Mark doses as taken
 * - Interactive timeline for today's medication routine
 * - Fully bilingual (English & Telugu)
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Bell,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import {
  MedicationSchedule,
  DoseAlert,
  getUpcomingDoses,
  formatTime12H,
  saveMedicationSchedule,
  updateMedicationSchedule,
  deleteMedicationSchedule,
  markDoseTaken
} from '../lib/scheduleStorage';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../lib/translations';

interface MedicationScheduleProps {
  schedules: MedicationSchedule[];
  onRefreshSchedules: () => void;
  language: SupportedLanguage;
  onOpenScan?: () => void;
}

const COMMON_DAYS = [
  { day: 0, labelEn: 'Sun', labelTe: 'ఆది' },
  { day: 1, labelEn: 'Mon', labelTe: 'సోమ' },
  { day: 2, labelEn: 'Tue', labelTe: 'మంగళ' },
  { day: 3, labelEn: 'Wed', labelTe: 'బుధ' },
  { day: 4, labelEn: 'Thu', labelTe: 'గురు' },
  { day: 5, labelEn: 'Fri', labelTe: 'శుక్ర' },
  { day: 6, labelEn: 'Sat', labelTe: 'శని' }
];

export const MedicationScheduleView: React.FC<MedicationScheduleProps> = ({
  schedules,
  onRefreshSchedules,
  language,
  onOpenScan
}) => {
  const { user } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet (500 mg)');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'as_needed'>('daily');
  const [times, setTimes] = useState<string[]>(['08:00', '20:00']);
  const [customTimeInput, setCustomTimeInput] = useState('14:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default for weekly
  const [mealTiming, setMealTiming] = useState<'before_food' | 'after_food' | 'with_food' | 'anytime'>('after_food');
  const [instructions, setInstructions] = useState('');

  const todayDoses = getUpcomingDoses(schedules);

  const handleApplyPreset = (type: 'once' | 'twice' | 'thrice' | 'bedtime') => {
    if (type === 'once') setTimes(['08:00']);
    if (type === 'twice') setTimes(['08:00', '20:00']);
    if (type === 'thrice') setTimes(['08:00', '14:00', '20:00']);
    if (type === 'bedtime') setTimes(['22:00']);
  };

  const handleAddTime = () => {
    if (customTimeInput && !times.includes(customTimeInput)) {
      setTimes([...times, customTimeInput].sort());
    }
  };

  const handleRemoveTime = (t: string) => {
    if (times.length > 1) {
      setTimes(times.filter((item) => item !== t));
    }
  };

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    setSubmitting(true);
    try {
      await saveMedicationSchedule(user?.uid || 'guest-user', {
        medicineName,
        dosage,
        frequency,
        times,
        daysOfWeek: frequency === 'weekly' ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
        mealTiming,
        instructions
      });

      setShowAddModal(false);
      setMedicineName('');
      setInstructions('');
      setSuccessToast(
        language === 'te'
          ? `${medicineName} మందు షెడ్యూల్ విజయవంతంగా భద్రపరచబడింది!`
          : `Schedule reminder for ${medicineName} successfully saved!`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      onRefreshSchedules();
    } catch (err) {
      console.error('Failed to create schedule:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkTaken = async (scheduleId: string, name: string) => {
    await markDoseTaken(user?.uid || 'guest-user', scheduleId);
    setSuccessToast(
      language === 'te'
        ? `${name} మోతాదు తీసుకున్నట్లు నమోదు చేయబడింది!`
        : `Dose of ${name} recorded as taken!`
    );
    setTimeout(() => setSuccessToast(null), 3000);
    onRefreshSchedules();
  };

  const handleToggleActive = async (schedule: MedicationSchedule) => {
    await updateMedicationSchedule(user?.uid || 'guest-user', schedule.id, {
      isActive: !schedule.isActive
    });
    onRefreshSchedules();
  };

  const handleDelete = async (scheduleId: string) => {
    await deleteMedicationSchedule(user?.uid || 'guest-user', scheduleId);
    onRefreshSchedules();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 text-xs font-semibold text-teal-200 border border-teal-600/50">
            <Clock className="w-3.5 h-3.5 text-teal-300" />
            {language === 'te' ? 'మందుల షెడ్యూల్ & అలర్ట్స్' : 'Medication Schedule & Dose Alerts'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'te' ? 'మీ రోజువారీ మందుల సమయాలు' : 'Never Miss a Scheduled Dose'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-normal">
            {language === 'te'
              ? 'స్కాన్ చేసిన మందుల లేబుల్స్ ఆధారంగా రోజువారీ లేదా వారపు రిమైండర్‌లను సెట్ చేయండి. సమయానికి మందులు వేసుకోవడం ద్వారా ఆరోగ్యాన్ని కాపాడుకోండి.'
              : 'Set daily or weekly reminders for your medicine intake based on identified labels. Track intake times and receive proactive dose alerts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            {language === 'te' ? 'కొత్త షెడ్యూల్ సెట్ చేయండి' : 'Set New Reminder'}
          </button>
          {onOpenScan && (
            <button
              onClick={onOpenScan}
              className="px-4 py-2.5 rounded-xl bg-teal-700/60 hover:bg-teal-700 border border-teal-500/50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              {language === 'te' ? 'లేబుల్ నుండి స్కాన్ చేయండి' : 'Scan From Label'}
            </button>
          )}
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Today's Dose Routine Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'te' ? 'నేటి మందుల రొటీన్ (Today\'s Medication Routine)' : 'Today\'s Dose Routine & Timeline'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'నేడు మీరు తీసుకోవలసిన మందుల క్రమం'
                  : 'Real-time schedule of your prescribed medication doses for today'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {todayDoses.filter((d) => d.isTakenToday).length} / {todayDoses.length} {language === 'te' ? 'పూర్తయ్యాయి' : 'Completed'}
          </span>
        </div>

        {todayDoses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-3">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p>
              {language === 'te'
                ? 'నేటికి ఎలాంటి మందుల షెడ్యూల్ లేదు. పైన ఉన్న "కొత్త షెడ్యూల్ సెట్ చేయండి" క్లిక్ చేసి రిమైండర్ జోడించండి.'
                : 'No medication reminders due today. Click "Set New Reminder" to schedule daily or weekly intake times.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayDoses.map((dose, idx) => (
              <div
                key={`${dose.scheduleId}-${dose.scheduledTime}-${idx}`}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  dose.isTakenToday
                    ? 'bg-slate-50/60 border-slate-200 opacity-75'
                    : dose.isOverdue
                    ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                    : dose.isDueSoon
                    ? 'bg-amber-50/70 border-amber-300 shadow-2xs animate-pulse'
                    : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800">
                      {dose.timeFormatted}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dose.isTakenToday
                          ? 'bg-emerald-100 text-emerald-800'
                          : dose.isOverdue
                          ? 'bg-rose-100 text-rose-800'
                          : dose.isDueSoon
                          ? 'bg-amber-100 text-amber-900 font-extrabold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dose.isTakenToday
                        ? '✓ Taken'
                        : dose.isOverdue
                        ? 'Past Due'
                        : dose.isDueSoon
                        ? 'Due Soon'
                        : 'Upcoming'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-1">{dose.medicineName}</h3>
                  <p className="text-xs text-slate-600">{dose.dosage}</p>

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
                    <Utensils className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {dose.mealTiming === 'after_food'
                        ? language === 'te'
                          ? 'భోజనం తర్వాత'
                          : 'After food'
                        : dose.mealTiming === 'before_food'
                        ? language === 'te'
                          ? 'భోజనానికి ముందు'
                          : 'Before food'
                        : dose.mealTiming === 'with_food'
                        ? language === 'te'
                          ? 'భోజనంతో పాటు'
                          : 'With meal'
                        : language === 'te'
                        ? 'ఎప్పుడైనా'
                        : 'Anytime'}
                    </span>
                  </div>

                  {dose.instructions && (
                    <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded">
                      "{dose.instructions}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {dose.isTakenToday
                      ? `Taken today`
                      : dose.minutesDiff > 0
                      ? `In ${Math.round(dose.minutesDiff)} mins`
                      : `${Math.abs(Math.round(dose.minutesDiff))} mins ago`}
                  </span>

                  {!dose.isTakenToday ? (
                    <button
                      onClick={() => handleMarkTaken(dose.scheduleId, dose.medicineName)}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {language === 'te' ? 'తీసుకున్నాను' : 'Mark Taken'}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Complete
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Prescribed Schedules List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'te' ? 'సేవ్ చేసిన మందుల షెడ్యూల్‌లు' : 'Active Medication Schedules'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'మీ అన్ని రోజువారీ మరియు వారపు మందుల వివరాలు'
                  : 'Manage ongoing medicine courses, dosage rules, and reminder alerts'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {schedules.length} {language === 'te' ? 'షెడ్యూల్‌లు' : 'Schedules'}
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 space-y-3">
            <p>
              {language === 'te'
                ? 'ప్రస్తుతం ఎలాంటి షెడ్యూల్స్ లేవు. మందును స్కాన్ చేసిన తర్వాత లేదా పైన ఉన్న బటన్ ద్వారా కొత్త షెడ్యూల్ సెట్ చేయండి.'
                : 'No medication schedules created yet. Add reminders based on your scanned medicine labels.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-teal-700"
            >
              Add First Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((sched) => (
              <div
                key={sched.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  sched.isActive ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{sched.medicineName}</h3>
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {sched.dosage}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sched.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {sched.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">
                        {sched.frequency === 'daily'
                          ? language === 'te'
                            ? 'ప్రతిరోజు'
                            : 'Daily'
                          : sched.frequency === 'weekly'
                          ? language === 'te'
                            ? 'వారానికి ఒకసారి'
                            : 'Weekly'
                          : 'As needed'}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sched.times.map((t) => formatTime12H(t)).join(', ')}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {sched.mealTiming === 'after_food'
                            ? 'After Food'
                            : sched.mealTiming === 'before_food'
                            ? 'Before Food'
                            : sched.mealTiming === 'with_food'
                            ? 'With Food'
                            : 'Anytime'}
                        </span>
                      </div>
                    </div>

                    {sched.frequency === 'weekly' && sched.daysOfWeek && (
                      <div className="flex items-center gap-1 pt-1">
                        {COMMON_DAYS.map((d) => (
                          <span
                            key={d.day}
                            className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ${
                              sched.daysOfWeek?.includes(d.day)
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {language === 'te' ? d.labelTe : d.labelEn.charAt(0)}
                          </span>
                        ))}
                      </div>
                    )}

                    {sched.instructions && (
                      <p className="text-xs text-slate-500 italic mt-1">"{sched.instructions}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleToggleActive(sched)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      {sched.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(sched.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'te' ? 'మందుల షెడ్యూల్ సెట్ చేయండి' : 'Create Medication Schedule'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'te' ? 'మోతాదు సమయాలు & సూచనలు నమోదు చేయండి' : 'Configure dose times, meal rules, and frequency'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
              {/* Medicine Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'te' ? 'మందు పేరు (Medicine Name)' : 'Medicine Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g., Paracetamol, Metformin, Amoxicillin"
                  className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'te' ? 'మోతాదు (Dosage & Formulation)' : 'Dosage & Formulation'} *
                </label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g., 500 mg, 1 Tablet, 10 ml"
                  className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {language === 'te' ? 'తరచుదనం (Frequency)' : 'Frequency'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'daily', labelEn: 'Daily', labelTe: 'ప్రతిరోజు' },
                    { id: 'weekly', labelEn: 'Weekly', labelTe: 'వారానికి' },
                    { id: 'as_needed', labelEn: 'As Needed', labelTe: 'అవసరమైనప్పుడు' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrequency(f.id as any)}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                        frequency === f.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'te' ? f.labelTe : f.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Day Selector */}
              {frequency === 'weekly' && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">
                    {language === 'te' ? 'వారంలోని రోజులు ఎంచుకోండి' : 'Select Days of Week'}
                  </label>
                  <div className="flex items-center justify-between gap-1">
                    {COMMON_DAYS.map((d) => (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => handleToggleDay(d.day)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                          selectedDays.includes(d.day)
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {language === 'te' ? d.labelTe : d.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dose Times & Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    {language === 'te' ? 'మోతాదు సమయాలు (Intake Times)' : 'Intake Times'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('once')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                    >
                      Once
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('twice')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                    >
                      Twice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('thrice')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                    >
                      Thrice
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-bold"
                    >
                      {formatTime12H(t)}
                      {times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(t)}
                          className="text-teal-500 hover:text-rose-600 font-bold ml-0.5"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="time"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    + Add Time
                  </button>
                </div>
              </div>

              {/* Meal Timing */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  {language === 'te' ? 'ఆహార సమయం (Meal Instruction)' : 'Meal Instructions'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'after_food', labelEn: 'After Food', labelTe: 'భోజనం తర్వాత' },
                    { id: 'before_food', labelEn: 'Before Food', labelTe: 'భోజనానికి ముందు' },
                    { id: 'with_food', labelEn: 'With Food', labelTe: 'భోజనంతో' },
                    { id: 'anytime', labelEn: 'Anytime', labelTe: 'ఎప్పుడైనా' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMealTiming(m.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold border transition-all ${
                        mealTiming === m.id
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'te' ? m.labelTe : m.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'te' ? 'డాక్టర్ సూచనలు (Optional Notes)' : 'Doctor Instructions / Notes'}
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Take with a full glass of water. Do not crush."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-600 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !medicineName.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 text-xs transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
