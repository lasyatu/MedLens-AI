import React, { useState } from 'react';
import {
  History,
  Trash2,
  Eye,
  Scale,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { SavedScanRecord, deleteUserScan, deleteAllUserScans } from '../lib/scanStorage';
import { useAuth } from '../context/AuthContext';
import { ComparisonModal } from './ComparisonModal';
import { compareMedicationScans } from '../lib/comparison';
import { SupportedLanguage, TRANSLATIONS } from '../lib/translations';

interface ScanHistoryProps {
  scans: SavedScanRecord[];
  onSelectScan: (scan: SavedScanRecord) => void;
  onRefreshScans: () => void;
  onStartNewScan: () => void;
  language: SupportedLanguage;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  scans,
  onSelectScan,
  onRefreshScans,
  onStartNewScan,
  language
}) => {
  const t = TRANSLATIONS[language];
  const { user } = useAuth();

  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonReport, setComparisonReport] = useState<any>(null);

  // Filter scans
  const filteredScans = scans.filter(s =>
    s.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.genericName && s.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.dosage && s.dosage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle selection for comparison
  const handleToggleSelect = (id: string) => {
    setSelectedScanIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Launch comparison
  const handleLaunchComparison = () => {
    if (selectedScanIds.length < 2) return;
    const selectedItems = scans.filter(s => selectedScanIds.includes(s.id));
    const report = compareMedicationScans(selectedItems);
    setComparisonReport(report);
    setShowComparisonModal(true);
  };

  // Delete single scan
  const handleDeleteScan = async (scanId: string) => {
    if (!user) return;
    setIsDeleting(scanId);
    try {
      await deleteUserScan(user.uid, scanId);
      setSelectedScanIds(prev => prev.filter(id => id !== scanId));
      onRefreshScans();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Compare Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <History className="w-7 h-7 text-teal-600" />
            {t.navHistory}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'te'
              ? 'మీ వ్యక్తిగత ఫైర్‌స్టోర్ డేటాబేస్‌లో సేవ్ చేయబడిన స్కాన్లు.'
              : 'Records saved under your authenticated UID in Firestore with strict access control.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Compare Button */}
          <button
            onClick={handleLaunchComparison}
            disabled={selectedScanIds.length < 2}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              selectedScanIds.length >= 2
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Scale className="w-4 h-4" />
            {t.compareSelected} ({selectedScanIds.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'te' ? 'స్కాన్ చరిత్రలో వెతకండి...' : 'Filter saved scans by name or dosage...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
          <span>{filteredScans.length} records</span>
          {selectedScanIds.length > 0 && (
            <button
              onClick={() => setSelectedScanIds([])}
              className="text-teal-600 hover:underline font-semibold"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Scans List */}
      {filteredScans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {scans.length === 0 ? 'No scans saved yet' : 'No matching scans found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {scans.length === 0
              ? 'Scan medicine labels to build your personal verified prescription archive.'
              : 'Try clearing your search query to see all your saved scans.'}
          </p>
          {scans.length === 0 && (
            <button
              onClick={onStartNewScan}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Scan Medicine Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredScans.map((scan) => {
            const isSelected = selectedScanIds.includes(scan.id);
            return (
              <div
                key={scan.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isSelected ? 'bg-teal-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Comparison Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(scan.id)}
                    className="w-4 h-4 mt-1 accent-teal-600 rounded cursor-pointer"
                    title={t.selectForCompare}
                    aria-label={`Select ${scan.medicineName} for comparison`}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {scan.medicineName}
                      </h3>
                      {scan.dosage && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {scan.dosage}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {scan.jurisdiction || 'US / India'}
                      </span>
                    </div>

                    {scan.genericName && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Active Ingredient: <span className="font-medium text-slate-700">{scan.genericName}</span>
                      </p>
                    )}

                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 max-w-2xl leading-relaxed">
                      {scan.summary || scan.extractedText}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(scan.createdAt).toLocaleDateString()} at{' '}
                      {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onSelectScan(scan)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  <button
                    onClick={() => handleDeleteScan(scan.id)}
                    disabled={isDeleting === scan.id}
                    title="Delete record"
                    aria-label={`Delete ${scan.medicineName} record`}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    {isDeleting === scan.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      {comparisonReport && (
        <ComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          report={comparisonReport}
          language={language}
        />
      )}
    </div>
  );
};
