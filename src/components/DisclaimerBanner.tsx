import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="font-medium">
            <span className="font-semibold text-amber-950">Medical Information Disclaimer:</span>{' '}
            MedLens AI provides educational information extracted from verified regulatory drug labels only. It does not provide medical diagnoses or treatment recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-amber-800 hover:text-amber-950 font-semibold underline underline-offset-2"
          >
            {expanded ? 'Less info' : 'Safety details'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-amber-800">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
            <p><strong>Regulatory Grounded:</strong> Explanations are strictly grounded in official US FDA & Indian Pharmacopoeia monographs.</p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
            <p><strong>Never Alter Prescriptions:</strong> Always consult your licensed physician or pharmacist before changing any medication schedule.</p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
            <p><strong>Emergency Notice:</strong> If you suspect an adverse drug reaction or overdose, contact emergency services or poison control immediately.</p>
          </div>
        </div>
      )}
    </div>
  );
};
