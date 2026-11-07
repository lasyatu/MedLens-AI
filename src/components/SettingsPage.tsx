import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Trash2,
  Globe,
  User,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Lock,
  MessageSquare,
  Star,
  Check,
  Tag,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteAllUserScans } from '../lib/scanStorage';
import { getUserFeedbackList, updateFeedbackReview, ScanFeedback } from '../lib/feedbackStorage';
import { SupportedLanguage, TRANSLATIONS } from '../lib/translations';

interface SettingsPageProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onRestartTour: () => void;
  onScansDeleted: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  language,
  setLanguage,
  onRestartTour,
  onScansDeleted
}) => {
  const t = TRANSLATIONS[language];
  const { user, profile, updateUserJurisdiction, signOutUser } = useAuth();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(
    profile?.preferredJurisdiction || 'United States (FDA)'
  );
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Feedback triage states
  const [feedbackList, setFeedbackList] = useState<ScanFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [editingDevNotesId, setEditingDevNotesId] = useState<string | null>(null);
  const [devNotesText, setDevNotesText] = useState('');

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const records = await getUserFeedbackList(user?.uid || 'guest-user');
      setFeedbackList(records);
    } catch (e) {
      console.warn('Failed to load feedback records:', e);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [user]);

  const handleUpdateStatus = async (
    feedbackId: string,
    newStatus: 'new' | 'reviewed' | 'resolved',
    devNotes?: string
  ) => {
    await updateFeedbackReview(user?.uid || 'guest-user', feedbackId, newStatus, devNotes);
    setFeedbackList((prev) =>
      prev.map((item) =>
        item.id === feedbackId
          ? {
              ...item,
              status: newStatus,
              ...(devNotes !== undefined ? { developerNotes: devNotes } : {}),
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
    setEditingDevNotesId(null);
  };

  const handleJurisdictionChange = async (j: string) => {
    setSelectedJurisdiction(j);
    await updateUserJurisdiction(j);
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    setIsDeletingAll(true);
    setDeleteSuccess(false);

    try {
      await deleteAllUserScans(user.uid);
      setDeleteSuccess(true);
      setShowConfirmDelete(false);
      onScansDeleted();
    } catch (err) {
      console.error('Data deletion error:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-teal-600" />
          {t.navSettings}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your account, language preferences, regulatory jurisdiction, and privacy controls.
        </p>
      </div>

      {deleteSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.dataDeletedSuccess}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-teal-600" />
          Authenticated User Account
        </h2>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Email Address</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user.email || 'Anonymous Session'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Authenticated UID</span>
              <span className="font-mono text-slate-700 text-xs mt-0.5 block truncate" title={user.uid}>
                {user.uid}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Firestore Isolation</span>
              <span className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Enforced by Security Rules
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Active Session</span>
                <span className="font-semibold text-slate-800 text-xs">Signed In</span>
              </div>
              <button
                onClick={signOutUser}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Not signed in. You are exploring in preview mode.</p>
        )}
      </div>

      {/* Language & Regional Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          Language & Regional Translation
        </h2>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Interface & Voice Language:
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => setLanguage('en')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                language === 'en'
                  ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">English</span>
                {language === 'en' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default clinical terminology</p>
            </button>

            <button
              onClick={() => setLanguage('te')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                language === 'te'
                  ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">తెలుగు (Telugu)</span>
                {language === 'te' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">వాయిస్ & ఆడియో అసిస్టెంట్</p>
            </button>
          </div>
        </div>

        {/* Regulatory Jurisdiction Preference */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Preferred Regulatory Monograph Jurisdiction:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'United States (FDA)', label: 'United States (FDA / DailyMed)' },
              { id: 'India (CDSCO / IP)', label: 'India (CDSCO / Indian Pharmacopoeia)' },
              { id: 'Global (WHO / INN)', label: 'Global (WHO / International Nonproprietary)' }
            ].map(j => (
              <button
                key={j.id}
                onClick={() => handleJurisdictionChange(j.id)}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedJurisdiction === j.id
                    ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding Tour Restart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            Interactive Guided Tour
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Walk through the scanning workflow, preprocessing sliders, Telugu voice search, and comparison engine.
          </p>
        </div>
        <button
          onClick={onRestartTour}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl shrink-0 self-start sm:self-auto transition-colors"
        >
          Restart Guided Tour
        </button>
      </div>

      {/* User Scan Feedback & Quality Triage (Developer Review Panel) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'te' ? 'యూజర్ ఫీడ్‌బ్యాక్ & నాణ్యత సమీక్ష (Quality Triage)' : 'User Scan Feedback & Quality Triage'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'te'
                  ? 'స్కాన్ ఖచ్చితత్వం, OCR మరియు వివరణలపై నమోదైన అభిప్రాయాలను సమీక్షించండి.'
                  : 'Review and triage user ratings on OCR accuracy, RAG explanations, and report insights.'}
              </p>
            </div>
          </div>

          <button
            onClick={loadFeedback}
            disabled={loadingFeedback}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingFeedback ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Submissions</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{feedbackList.length}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Avg. Accuracy</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-slate-900">
                {feedbackList.length > 0
                  ? (feedbackList.reduce((acc, f) => acc + (f.accuracyRating || 5), 0) / feedbackList.length).toFixed(1)
                  : '5.0'}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 ml-1" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Avg. Helpfulness</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-slate-900">
                {feedbackList.length > 0
                  ? (feedbackList.reduce((acc, f) => acc + (f.helpfulnessRating || 5), 0) / feedbackList.length).toFixed(1)
                  : '5.0'}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 ml-1" />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['all', 'new', 'reviewed', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFeedbackFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                feedbackFilter === st
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
              <span className="ml-1.5 opacity-80 text-[10px]">
                ({st === 'all' ? feedbackList.length : feedbackList.filter((f) => f.status === st).length})
              </span>
            </button>
          ))}
        </div>

        {/* Feedback List Items */}
        {feedbackList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No feedback entries logged yet. Rate a medicine scan result or report explanation to see records here.
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackList
              .filter((f) => feedbackFilter === 'all' || f.status === feedbackFilter)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.medicineName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                        {item.feedbackCategory.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'reviewed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="flex flex-wrap items-center gap-4 text-slate-700">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Accuracy:</span>
                      <span className="font-bold text-slate-900">{item.accuracyRating}/5</span>
                      <div className="flex text-amber-400">
                        {[...Array(item.accuracyRating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Helpfulness:</span>
                      <span className="font-bold text-slate-900">{item.helpfulnessRating}/5</span>
                      <div className="flex text-amber-400">
                        {[...Array(item.helpfulnessRating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {item.comment && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-slate-800 italic">
                      "{item.comment}"
                    </div>
                  )}

                  {/* Developer Notes & Triage Actions */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      {editingDevNotesId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={devNotesText}
                            onChange={(e) => setDevNotesText(e.target.value)}
                            placeholder="Add developer triage note..."
                            className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            onClick={() => handleUpdateStatus(item.id, item.status, devNotesText)}
                            className="px-2.5 py-1 bg-teal-600 text-white font-bold rounded-lg text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <strong>Dev Notes:</strong> {item.developerNotes || 'No notes added'}
                          <button
                            onClick={() => {
                              setEditingDevNotesId(item.id);
                              setDevNotesText(item.developerNotes || '');
                            }}
                            className="text-teal-600 hover:underline ml-1"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status !== 'reviewed' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'resolved')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Data Retention & Privacy Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" />
          Data Retention & Privacy Architecture
        </h2>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>Image Privacy:</strong> Medicine label photos are processed transiently in browser memory for OCR text extraction and image preprocessing. Uploaded packaging images are <strong>never stored on disk or in Firestore</strong> by default.
          </p>
          <p>
            <strong>Firestore Scans:</strong> Only extracted medicine names, dosage, verified monograph citations, and RAG evidence snippets are saved under your isolated account at <code>users/{'{userId}'}/scans</code>.
          </p>
          <p>
            <strong>Zero AI Telemetry:</strong> User questions and voice searches are never used to train third-party machine learning models.
          </p>
        </div>

        {/* Delete All User Data Action */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-rose-700">Permanent Data Erasure</h3>
            <p className="text-[11px] text-slate-500">
              Permanently delete all your saved scan history records and RAG citations from Firestore.
            </p>
          </div>

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shrink-0 self-start sm:self-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All My History
          </button>
        </div>
      </div>

      {/* Confirm Data Deletion Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Permanently Delete All Scans?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All your scan records, retrieved RAG evidence snippets, and comparison logs will be deleted from your Firestore user directory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Yes, Delete All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
