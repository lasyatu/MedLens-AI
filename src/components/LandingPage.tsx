import React from 'react';
import {
  ScanLine,
  ShieldCheck,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Search,
  Scale,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onTrySample: (sampleKey: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onTrySample }) => {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-12 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Real OCR + Monograph RAG + Regulatory Evidence Verification</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Understand your medicine label with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">verified clinical evidence</span>.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              MedLens AI extracts text from actual packaging photos, filters generic stop-words, retrieves chunk-level evidence from US openFDA and Indian Pharmacopoeia monographs, and explains precautions in clear, non-technical language.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <ScanLine className="w-5 h-5" />
                Scan Medicine Label
              </button>

              <button
                onClick={() => onTrySample('paracetamol')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                Explore Sample Verified Label
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>openFDA DailyMed Monographs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Indian Pharmacopoeia (CDSCO)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Vector Semantic Cosine Search</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Multi-Scan Comparative Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Presets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                Quick Monograph Testing Presets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any genuine medicine to inspect the image preprocessing, OCR extraction, and real RAG evidence citations.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start md:self-auto">
              Ready for Instant Analysis
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 'paracetamol', name: 'Paracetamol', dosage: '500 mg', type: 'Analgesic / Fever', badge: 'US & India' },
              { id: 'amoxicillin', name: 'Amoxicillin', dosage: '500 mg', type: 'Antibacterial', badge: 'US FDA' },
              { id: 'ibuprofen', name: 'Ibuprofen', dosage: '200 mg', type: 'NSAID / Anti-inflam', badge: 'Black Box' },
              { id: 'metformin', name: 'Metformin', dosage: '500 mg', type: 'Antidiabetic', badge: 'Lactic Acidosis' },
              { id: 'omeprazole', name: 'Omeprazole', dosage: '20 mg', type: 'PPI / Antacid', badge: 'US & India' },
              { id: 'cetirizine', name: 'Cetirizine', dosage: '10 mg', type: 'Antihistamine', badge: 'Allergy' }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => onTrySample(preset.id)}
                className="p-3.5 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md bg-slate-50/50 hover:bg-teal-50/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 group-hover:border-teal-300">
                    {preset.badge}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-2 group-hover:text-teal-700">
                    {preset.name}
                  </h3>
                  <p className="text-xs font-semibold text-teal-600">{preset.dosage}</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">{preset.type}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / 5-Step Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Precision & Medical Safety
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every step is designed to eliminate hallucinations and give you source-grounded answers you can verify.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Image Preprocessing & OCR</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Uploaded photos go through binarization, Otsu thresholding, contrast enhancement, and noise reduction on an HTML5 canvas before text extraction to maximize OCR accuracy.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Controls: Contrast, Brightness, Noise Reduction, Invert
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Strict Verification & Anti-Hallucination</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Generic terms like "Tablets IP", "Exp Date", or "Keep out of reach" are strictly rejected. If identity confidence is uncertain, MedLens explicitly prompts confirmation rather than guessing.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Filters: Stop-words, substring traps, dosage confirmation
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. RAG Monograph Vector Search</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Authoritative FDA and CDSCO monographs are chunked with sliding overlap. Cosine similarity vector retrieval matches passages, excludes wrong medicines, and provides source links.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Pipeline: Chunking with overlap, cosine index, abstention
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">4. Multi-Scan Comparative Analysis</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Select 2 or more past scans from your history to generate an instant side-by-side comparative matrix. Compare differences in active ingredients, indications, target organ risks (liver vs kidneys vs stomach), and cross-medication interaction warnings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Feature: Checkbox multi-select, organ sensitivity breakdown
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5. Firebase Authentication & Firestore Security</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Scans are securely saved under your authenticated UID in Firestore. Strict Firestore Security Rules isolate user data so no user can access or view another user's records. Full GDPR/HIPAA-aligned data deletion controls in Settings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Security: Rules Version 2, UID isolation, one-click data clear
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
