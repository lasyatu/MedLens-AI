import React, { useState } from 'react';
import {
  ScanLine,
  FileText,
  MessageSquare,
  HeartPulse,
  Utensils,
  Mic,
  History,
  BookOpen,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Clock,
  ShieldAlert,
  GitCompare,
  Scan
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'scan'
  | 'scan-report'
  | 'analyse-report'
  | 'comparison'
  | 'interactions'
  | 'dhanvi'
  | 'reports'
  | 'chat'
  | 'guidance'
  | 'diet'
  | 'schedule'
  | 'voice'
  | 'results'
  | 'history'
  | 'library'
  | 'settings';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onOpenAuth }) => {
  const { user, profile, signOutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Med<span className="text-teal-600">Lens</span>
                </span>
                <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 hidden sm:block">
                Bilingual Medicine & Health Intelligence
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => handleNav(user ? 'dashboard' : 'landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'dashboard' || currentView === 'landing'
                  ? 'bg-teal-50 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {user ? 'Dashboard' : 'Home'}
            </button>

            <button
              onClick={() => handleNav('scan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'scan'
                  ? 'bg-teal-600 text-white font-bold shadow-2xs'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              Scan Medicine
            </button>

            <button
              onClick={() => handleNav('dhanvi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'dhanvi'
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-bold'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              DHANVI AI
            </button>

            <button
              onClick={() => handleNav('scan-report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'scan-report'
                  ? 'bg-teal-50 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-teal-600" />
              Scan Report
            </button>

            <button
              onClick={() => handleNav('analyse-report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'analyse-report' || currentView === 'reports'
                  ? 'bg-teal-50 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Analyse Report
            </button>

            <button
              onClick={() => handleNav('interactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'interactions'
                  ? 'bg-rose-50 text-rose-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Interactions
            </button>

            <button
              onClick={() => handleNav('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentView === 'comparison'
                  ? 'bg-teal-50 text-teal-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
              Compare
            </button>

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1"
              >
                More <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <button
                    onClick={() => handleNav('dhanvi')}
                    className="w-full text-left px-4 py-2 text-xs text-indigo-800 font-semibold hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" /> DHANVI AI Chat & Voice
                  </button>
                  <button
                    onClick={() => handleNav('interactions')}
                    className="w-full text-left px-4 py-2 text-xs text-rose-800 font-semibold hover:bg-rose-50 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Interaction Checker (Safety List)
                  </button>
                  <button
                    onClick={() => handleNav('scan-report')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4 text-teal-600" /> Scan Report (Multi-Page & Camera)
                  </button>
                  <button
                    onClick={() => handleNav('analyse-report')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-teal-600" /> Analyse Report (Medical & General)
                  </button>
                  <button
                    onClick={() => handleNav('comparison')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <GitCompare className="w-4 h-4 text-indigo-600" /> Report Comparison (Lab & Papers)
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => handleNav('schedule')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-teal-600" /> Medication Schedule & Doses
                  </button>
                  <button
                    onClick={() => handleNav('diet')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <Utensils className="w-4 h-4 text-emerald-600" /> Indian Dietary Suggestions
                  </button>
                  <button
                    onClick={() => handleNav('history')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <History className="w-4 h-4 text-slate-500" /> Scan History
                  </button>
                  <button
                    onClick={() => handleNav('library')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Offline Health Library
                  </button>
                  <button
                    onClick={() => handleNav('settings')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-slate-500" /> Settings & Privacy
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action / Auth */}
          <div className="hidden xl:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                    {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                      {profile?.displayName || user.email?.split('@')[0]}
                    </p>
                  </div>
                </div>

                <button
                  onClick={signOutUser}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl">
          <button
            onClick={() => handleNav(user ? 'dashboard' : 'landing')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              currentView === 'dashboard' || currentView === 'landing' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            {user ? 'Dashboard' : 'Home'}
          </button>
          <button
            onClick={() => handleNav('dhanvi')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'dhanvi' ? 'bg-indigo-600 text-white' : 'text-indigo-700 bg-indigo-50/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" /> DHANVI AI Chatbot & Voice
          </button>
          <button
            onClick={() => handleNav('scan-report')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'scan-report' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <Scan className="w-4 h-4 text-teal-600" /> Scan Report (Multi-Page & Camera)
          </button>
          <button
            onClick={() => handleNav('analyse-report')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'analyse-report' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-600" /> Analyse Report (Medical & General)
          </button>
          <button
            onClick={() => handleNav('interactions')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'interactions' ? 'bg-rose-50 text-rose-700' : 'text-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" /> Interaction Checker (Safety List)
          </button>
          <button
            onClick={() => handleNav('comparison')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'comparison' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <GitCompare className="w-4 h-4 text-indigo-600" /> Report Comparison
          </button>
          <button
            onClick={() => handleNav('scan')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'scan' ? 'bg-teal-600 text-white' : 'text-teal-700 bg-teal-50/60'
            }`}
          >
            <ScanLine className="w-4 h-4" /> Scan Medicine
          </button>
          <button
            onClick={() => handleNav('voice')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'voice' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <Mic className="w-4 h-4 text-teal-600" /> తెలుగు Voice Assistant
          </button>
          <button
            onClick={() => handleNav('guidance')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'guidance' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-600" /> Health & 112
          </button>
          <button
            onClick={() => handleNav('diet')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'diet' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-600" /> Indian Dietary Suggestions
          </button>
          <button
            onClick={() => handleNav('schedule')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'schedule' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" /> Medication Schedule & Reminders
          </button>
          <button
            onClick={() => handleNav('history')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'history' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" /> Scan History & Compare
          </button>
          <button
            onClick={() => handleNav('library')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'library' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" /> Offline Library
          </button>
          <button
            onClick={() => handleNav('settings')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              currentView === 'settings' ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" /> Settings & Privacy
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <button
                onClick={signOutUser}
                className="w-full py-2 text-center text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-teal-600 rounded-lg"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
