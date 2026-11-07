/**
 * MedLens AI - Complete Responsive Medicine Label Understanding & Health Assistance Platform
 * Built for web (desktop and mobile responsive)
 * Features:
 * - Feature 1: Real Medicine OCR & Verified openFDA/CDSCO RAG monographs
 * - Feature 2: Medical Report Analyzer with Editable Table & Abnormal Flagging
 * - Feature 3: Health Guidance, Risk Awareness, Doctor Visit Checklists & India 112 Escalation
 * - Feature 4: Personalized Indian Dietary Suggestions (ICMR-NIN, Millets, Hydration)
 * - Feature 5: Friendly Bilingual Medical AI Chatbot ("Ask MedLens AI") with context attachment
 * - Feature 6: Telugu Voice Input & Spoken Answers with transcript preview & audio playback
 * - Feature 7: Real Vector RAG with confidence scoring, evidence citations, and abstention
 * - Feature 8: Structured 6-part patient response format
 * - Feature 9: Firebase Authentication & UID-isolated Firestore data vaults
 * - Feature 10: Offline Mode with local storage caching & static offline health library
 * - Feature 11: 10 Operational Platform Modules accessible from responsive Navbar & Dashboard
 * - Feature 12: Clear medical safety disclaimers & non-prescriptive ethics
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, AppView } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { MedicineScanner } from './components/MedicineScanner';
import { MedicineResults } from './components/MedicineResults';
import { ReportAnalyzer } from './components/ReportAnalyzer';
import { AIChatbot } from './components/AIChatbot';
import { HealthGuidance } from './components/HealthGuidance';
import { DietarySuggestions } from './components/DietarySuggestions';
import { TeluguVoiceAssistant } from './components/TeluguVoiceAssistant';
import { ScanHistory } from './components/ScanHistory';
import { OfflineLibrary } from './components/OfflineLibrary';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingTour } from './components/OnboardingTour';
import { MedicationScheduleView } from './components/MedicationSchedule';
import { InteractionChecker } from './components/InteractionChecker';
import { ScanReport, ScannedDocumentPackage } from './components/ScanReport';
import { AnalyseReportView } from './components/AnalyseReportView';
import { ReportComparisonView } from './components/ReportComparisonView';
import { DhanviChatbot } from './components/DhanviChatbot';
import { SavedScanRecord, getUserScans } from './lib/scanStorage';
import { SavedReportRecord, getUserReports } from './lib/reportStorage';
import { MedicationSchedule, getUserSchedules } from './lib/scheduleStorage';
import { SupportedLanguage } from './lib/translations';

function MainApp() {
  const { user, loading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Scans history, reports history & medication schedules
  const [userScans, setUserScans] = useState<SavedScanRecord[]>([]);
  const [userReports, setUserReports] = useState<SavedReportRecord[]>([]);
  const [userSchedules, setUserSchedules] = useState<MedicationSchedule[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Active scan result for display
  const [activeScanData, setActiveScanData] = useState<{
    rawText: string;
    confirmedMedicine: string;
    genericName?: string;
    dosage?: string;
    dosageForm?: string;
    confidenceScore: number;
    jurisdiction?: string;
    preprocessedImageBase64?: string;
  } | null>(null);

  // Chat context forwarding
  const [chatAttachedScan, setChatAttachedScan] = useState<string | undefined>(undefined);
  const [chatAttachedReport, setChatAttachedReport] = useState<string | undefined>(undefined);

  // Scanned Document Package from Scan Report module (Workflow A)
  const [scannedDocPkg, setScannedDocPkg] = useState<ScannedDocumentPackage | null>(null);

  // DHANVI AI dynamic context
  const [dhanviContext, setDhanviContext] = useState<string | undefined>(undefined);
  const [dhanviIsGeneral, setDhanviIsGeneral] = useState<boolean>(false);

  // Initial preset to pass to scanner if triggered from landing page
  const [initialPreset, setInitialPreset] = useState<string | undefined>(undefined);

  // If user is logged in and on landing page, transition to dashboard
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  // Load user schedules separately for rapid updates
  const loadUserSchedules = async () => {
    if (!user) {
      setUserSchedules([]);
      return;
    }
    try {
      const schedules = await getUserSchedules(user.uid);
      setUserSchedules(schedules);
    } catch (e) {
      console.warn('Failed to load user schedules:', e);
    }
  };

  // Load user scans, reports, and schedules from Firestore when user is authenticated
  const loadUserRecords = async () => {
    if (!user) {
      setUserScans([]);
      setUserReports([]);
      setUserSchedules([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const [scans, reports, schedules] = await Promise.all([
        getUserScans(user.uid),
        getUserReports(user.uid),
        getUserSchedules(user.uid)
      ]);
      setUserScans(scans);
      setUserReports(reports);
      setUserSchedules(schedules);
    } catch (e) {
      console.warn('Failed to load user records:', e);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadUserRecords();
  }, [user]);

  const handleCloseTour = () => {
    setIsOnboardingOpen(false);
  };

  // Handle preset click from landing / dashboard
  const handleTryPreset = (presetKey: string) => {
    setInitialPreset(presetKey);
    setCurrentView('scan');
  };

  // Handle completed scan from scanner
  const handleScanComplete = (scanResult: {
    rawText: string;
    confirmedMedicine: string;
    genericName?: string;
    dosage?: string;
    dosageForm?: string;
    confidenceScore: number;
    jurisdiction?: string;
    preprocessedImageBase64?: string;
  }) => {
    setActiveScanData(scanResult);
    setCurrentView('results');
  };

  // View specific scan from history
  const handleSelectScanFromHistory = (scan: SavedScanRecord) => {
    setActiveScanData({
      rawText: scan.extractedText,
      confirmedMedicine: scan.medicineName,
      genericName: scan.genericName,
      dosage: scan.dosage,
      confidenceScore: scan.confidenceScore || 0.95,
      jurisdiction: scan.jurisdiction
    });
    setCurrentView('results');
  };

  // Chat forwarding helper
  const handleOpenChatWithRecord = (type: 'scan' | 'report', summary: string) => {
    if (type === 'scan') {
      setChatAttachedScan(summary);
      setChatAttachedReport(undefined);
    } else {
      setChatAttachedReport(summary);
      setChatAttachedScan(undefined);
    }
    setCurrentView('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Medical Safety Disclaimer Top Banner */}
      <DisclaimerBanner />

      {/* Offline Status Bar */}
      <OfflineIndicator language={language} />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(v) => {
          setCurrentView(v);
          setInitialPreset(undefined);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Language Toggle Quick Bar */}
      <div className="bg-slate-100/80 border-b border-slate-200 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-800">Language / భాష:</span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-0.5 rounded-md font-semibold text-xs transition-colors ${
                  language === 'en'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-2.5 py-0.5 rounded-md font-semibold text-xs transition-colors ${
                  language === 'te'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="text-[11px] font-medium text-teal-700 hover:text-teal-900 hover:underline"
            >
              {language === 'te' ? 'గైడెడ్ టూర్ చూడండి (Tour)' : 'How it works (Tour)'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (user) {
                setCurrentView('scan');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            onTrySample={handleTryPreset}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            scans={userScans}
            schedules={userSchedules}
            onRefreshSchedules={loadUserSchedules}
            onNavigate={(v) => setCurrentView(v)}
            onViewScan={handleSelectScanFromHistory}
            onTryPreset={handleTryPreset}
            language={language}
          />
        )}

        {currentView === 'scan' && (
          <MedicineScanner
            onScanComplete={handleScanComplete}
            language={language}
            initialPreset={initialPreset}
          />
        )}

        {currentView === 'results' && activeScanData && (
          <MedicineResults
            scanData={activeScanData}
            language={language}
            onBackToScan={() => setCurrentView('scan')}
            onScanSaved={loadUserRecords}
          />
        )}

        {/* Workflow A: Scan Report */}
        {currentView === 'scan-report' && (
          <ScanReport
            language={language}
            onProceedToAnalyse={(pkg) => {
              setScannedDocPkg(pkg);
              setCurrentView('analyse-report');
            }}
          />
        )}

        {/* Workflow A & B: Analyse Report (Medical & General) */}
        {(currentView === 'analyse-report' || currentView === 'reports') && (
          <AnalyseReportView
            language={language}
            savedReports={userReports}
            onReportSaved={loadUserRecords}
            incomingScannedDoc={scannedDocPkg}
            onConsultDhanviWithReport={(context, isGen) => {
              setDhanviContext(context);
              setDhanviIsGeneral(isGen);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {/* Workflow D: Report Comparison */}
        {currentView === 'comparison' && (
          <ReportComparisonView
            language={language}
            savedReports={userReports}
            onConsultDhanvi={(context) => {
              setDhanviContext(context);
              setDhanviIsGeneral(true);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {/* Drug-Drug Interaction Checker with Prioritized Safety List */}
        {currentView === 'interactions' && (
          <InteractionChecker
            scans={userScans}
            language={language}
            onNavigateToScan={() => setCurrentView('scan')}
            onConsultDhanvi={(context) => {
              setDhanviContext(context);
              setDhanviIsGeneral(false);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {/* Workflow C: DHANVI AI Chatbot & Voice Assistant */}
        {(currentView === 'dhanvi' || currentView === 'chat') && (
          <DhanviChatbot
            language={language}
            savedReports={userReports}
            initialAttachedContext={dhanviContext || chatAttachedScan || chatAttachedReport}
            isGeneralDocument={dhanviIsGeneral}
          />
        )}

        {currentView === 'guidance' && (
          <HealthGuidance
            language={language}
            onOpenChatWithTopic={(topic) => {
              setDhanviContext(topic);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {currentView === 'diet' && (
          <DietarySuggestions
            language={language}
            onOpenChatWithTopic={(topic) => {
              setDhanviContext(topic);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {currentView === 'schedule' && (
          <MedicationScheduleView
            schedules={userSchedules}
            onRefreshSchedules={loadUserSchedules}
            language={language}
            onOpenScan={() => setCurrentView('scan')}
          />
        )}

        {currentView === 'voice' && (
          <TeluguVoiceAssistant
            language={language}
            onForwardToChat={(query) => {
              setDhanviContext(query);
              setCurrentView('dhanvi');
            }}
          />
        )}

        {currentView === 'history' && (
          <ScanHistory
            scans={userScans}
            onSelectScan={handleSelectScanFromHistory}
            onRefreshScans={loadUserRecords}
            onStartNewScan={() => setCurrentView('scan')}
            language={language}
          />
        )}

        {currentView === 'library' && <OfflineLibrary language={language} />}

        {currentView === 'settings' && (
          <SettingsPage
            language={language}
            setLanguage={setLanguage}
            onRestartTour={() => setIsOnboardingOpen(true)}
            onScansDeleted={loadUserRecords}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">
          MedLens AI • Verified Medicine Label Intelligence & Bilingual Health Literacy
        </p>
        <p className="max-w-xl mx-auto text-slate-400 text-[11px]">
          Medical Information Notice: MedLens AI is an educational technology demonstration. It does not provide medical diagnoses, treatment prescriptions, or individualized clinical advice. Always consult your healthcare provider. For life-threatening emergencies in India, dial 112.
        </p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
      />

      {/* Interactive Onboarding Tour */}
      <OnboardingTour
        isOpen={isOnboardingOpen}
        onClose={handleCloseTour}
        language={language}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
