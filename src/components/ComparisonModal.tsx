import React from 'react';
import {
  X,
  Scale,
  ShieldAlert,
  AlertTriangle,
  Heart,
  Activity,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ComparisonReport } from '../lib/comparison';
import { SupportedLanguage } from '../lib/translations';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ComparisonReport;
  language: SupportedLanguage;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  report,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'te' ? 'బహుళ ఔషధాల పోలిక (Medication Comparison)' : 'Comparative Medication Analysis'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Side-by-side evaluation of {report.items.length} past medicine scans highlighting clinical differences.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Safety Notice Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong>Medical Disclaimer:</strong> {report.safetySummary}
            </p>
          </div>

          {/* Cross-Medication Interaction Warnings (if detected) */}
          {report.potentialInteractionNotes.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
              <span className="font-bold flex items-center gap-1.5 uppercase text-[11px] text-rose-950">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Potential Co-Administration & Cross-Interaction Alerts:
              </span>
              <ul className="space-y-1.5 list-disc list-inside">
                {report.potentialInteractionNotes.map((note, i) => (
                  <li key={i} className="leading-relaxed">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Medicines Grid Overview Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(report.items.length, 3)} gap-4`}>
            {report.items.map((item) => (
              <div
                key={item.scanId}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                    {item.jurisdiction}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-2">{item.medicineName}</h3>
                  <p className="text-xs font-semibold text-teal-700">{item.genericName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Class: {item.therapeuticClass}</p>
                </div>

                {item.boxedWarning && (
                  <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-2.5 text-[11px] text-rose-900 leading-tight">
                    <span className="font-bold block text-rose-950">Boxed Warning:</span>
                    {item.boxedWarning}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Differences Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Key Regulatory Differences Matrix
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {report.keyDifferences.map((diff, idx) => (
                <div key={idx} className="p-4 sm:p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{diff.category}</h4>
                    <p className="text-[11px] text-slate-500">{diff.description}</p>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-${Math.min(report.items.length, 3)} gap-3 pt-2`}>
                    {report.items.map((item) => (
                      <div
                        key={item.scanId}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700"
                      >
                        <span className="font-bold text-slate-900 block text-[11px] mb-1">
                          {item.medicineName}:
                        </span>
                        <p className="leading-relaxed">
                          {diff.detailsByMedicine[item.medicineName] || 'Not specified in monograph.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organ Systems Sensitivity Comparison */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600" />
              Target Organ Sensitivity Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.items.map((item) => (
                <div key={item.scanId} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                    {item.medicineName} Organ Profile
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {item.organRisks.map((risk, rIdx) => (
                      <div key={rIdx} className="flex items-start justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-800">{risk.system}</span>
                          <p className="text-[11px] text-slate-500">{risk.explanation}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                          risk.severity === 'High'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : risk.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {risk.severity} Risk
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
