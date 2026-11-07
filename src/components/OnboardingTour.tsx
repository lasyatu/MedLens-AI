import React from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ScanLine,
  Sliders,
  Layers,
  Mic,
  Scale,
  Sparkles
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../lib/translations';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, language }) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: language === 'te' ? 'మెడ్‌లెన్స్ AI కి స్వాగతం' : 'Welcome to MedLens AI',
      subtitle: language === 'te' ? 'ధృవీకరించబడిన ఔషధ లేబుల్ విశ్లేషణ ప్లాట్‌ఫారమ్' : 'Verified Medicine Label Intelligence Platform',
      icon: <Sparkles className="w-6 h-6 text-teal-600" />,
      description: language === 'te'
        ? 'మందు ప్యాకెట్ల లేబుల్స్‌ను సులభంగా అర్థం చేసుకోవడానికి మెడ్‌లెన్స్ AI సహాయపడుతుంది. ఇది నిజమైన ఆధారాలు, ఓపెన్ ఎఫ్‌డిఎ (openFDA) మరియు భారతీయ ఫార్మకోపియా వివరాలను మాత్రమే అందిస్తుంది.'
        : 'MedLens AI decodes medicine packaging labels to help ordinary patients understand their prescriptions using verified regulatory drug monographs from openFDA and Indian Pharmacopoeia.',
      highlight: language === 'te'
        ? '⚠️ ముఖ్యమైన నిరాకరణ: ఇది వైద్య సమాచారం మాత్రమే, డాక్టర్ సలహాకు ప్రత్యామ్నాయం కాదు.'
        : '⚠️ Safety First: Educational information only; never change prescription dosage without speaking to your doctor or pharmacist.'
    },
    {
      title: language === 'te' ? 'ఫోటో అప్‌లోడ్ & ఇమేజ్ ప్రీప్రాసెసింగ్' : 'Upload & Image Preprocessing',
      subtitle: language === 'te' ? 'అక్షరాల గుర్తింపును (OCR) మెరుగుపరచండి' : 'Optimize Label Clarity for High OCR Accuracy',
      icon: <Sliders className="w-6 h-6 text-teal-600" />,
      description: language === 'te'
        ? 'మందు ప్యాకెట్ ఫోటోను అప్‌లోడ్ చేయండి. కాంట్రాస్ట్, వెలుతురు (Brightness) పెంచడానికి, నలుపు-తెలుపు బైనరైజేషన్ చేయడానికి ప్రత్యేక నియంత్రణలను ఉపయోగించండి.'
        : 'Upload any medicine box, blister pack, or bottle label. Use real-time canvas sliders to adjust contrast, brightness, noise reduction, and binarization to maximize OCR accuracy.',
      highlight: language === 'te'
        ? 'సాధారణ పదాలు (ఉదా: Tablets, Exp Date) స్వయంచాలకంగా ఫిల్టర్ చేయబడతాయి.'
        : 'Generic words (e.g. "Tablets IP", "Keep out of reach") are strictly rejected to prevent identity hallucinations.'
    },
    {
      title: language === 'te' ? 'నిజమైన RAG ఆధారాలు & సిటేషన్లు' : 'Real Monograph RAG & Evidence',
      subtitle: language === 'te' ? 'శాస్త్రీయ ఆధారాలతో కూడిన సమాధానాలు' : 'Direct Passages from US FDA & CDSCO Monograph Sections',
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      description: language === 'te'
        ? 'మందు పేరు ధృవీకరించబడిన తర్వాత, మా వెక్టర్ సెర్చ్ ఇంజిన్ అధికారిక గ్రంథాల నుండి సంబంధిత విభాగాలను వెలికితీస్తుంది. ప్రతి సమాధానం పక్కన అసలు ఆధారం మరియు లింక్ ఉంటాయి.'
        : 'Once the medicine is verified, our vector index searches chunked regulatory monographs with sliding overlap to retrieve exact sections for indications, warnings, and boxed alerts.',
      highlight: language === 'te'
        ? 'ఆధారాలు సరిపోకపోతే సిస్టమ్ ఊహించకుండా స్పష్టంగా తెలియజేస్తుంది.'
        : 'Explicit Abstention State: MedLens never guesses or hallucinates missing medical claims.'
    },
    {
      title: language === 'te' ? 'తెలుగు వాయిస్ సెర్చ్ & ఆడియో అసిస్టెంట్' : 'Telugu Voice Search & Audio Assistance',
      subtitle: language === 'te' ? 'మీ మాతృభాషలో సులభంగా మాట్లాడి వినండి' : 'Speak in Telugu & Listen to Verified Explanations Aloud',
      icon: <Mic className="w-6 h-6 text-rose-600" />,
      description: language === 'te'
        ? 'మైక్రోఫోన్ బటన్ నొక్కి తెలుగులో ప్రశ్నలు అడగవచ్చు. రికార్డ్ అయిన మాటలను చూసి సరిదిద్దవచ్చు. అలాగే స్పీకర్ బటన్ నొక్కి వివరణను తెలుగులో వినవచ్చు.'
        : 'Tap the microphone icon to ask questions directly in Telugu. Review and edit the recognized transcript before submitting, and use the speaker button to listen to answers read aloud.',
      highlight: language === 'te'
        ? 'ఇంగ్లీష్ మరియు తెలుగు వివరణలను పక్కపక్కనే చూసే సదుపాయం ఉంది.'
        : 'Toggle between Telugu and original English regulatory text seamlessly at any time.'
    },
    {
      title: language === 'te' ? 'మందుల పోలిక & సురక్షిత ఫైర్‌స్టోర్ డేటా' : 'Multi-Scan Comparison & Privacy',
      subtitle: language === 'te' ? 'రెండు లేదా అంతకంటే ఎక్కువ మందుల వ్యత్యాసాలు' : 'Side-by-Side Analysis of Indications, Warnings & Risks',
      icon: <Scale className="w-6 h-6 text-purple-600" />,
      description: language === 'te'
        ? 'మీ స్కాన్ హిస్టరీ నుండి 2 లేదా అంతకంటే ఎక్కువ మందులను ఎంచుకుని, వాటి ఉపయోగాలు, కాలేయం/కిడ్నీ/కడుపు పై పడే ప్రభావాలను సరిపోల్చి చూడవచ్చు.'
        : 'Select multiple past scans from your history to view a side-by-side comparative matrix highlighting key differences in therapeutic class, organ risks (hepatic, renal, GI), and drug interactions.',
      highlight: language === 'te'
        ? 'మీ డేటా కేవలం మీ ప్రామాణిక UID కింద మాత్రమే భద్రపరచబడుతుంది.'
        : 'Zero tracking: Scans are isolated in Firestore under your authenticated UID with strict Security Rules.'
    }
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded border border-teal-200">
                Step {currentStep + 1} of {steps.length}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1 leading-tight">{step.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-teal-700">{step.subtitle}</p>
          <p className="text-sm text-slate-700 leading-relaxed">{step.description}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-medium">
            {step.highlight}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-teal-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2"
          >
            {language === 'te' ? 'టూర్ దాటవేయండి (Skip)' : 'Skip Tour'}
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {language === 'te' ? 'వెనుకకు' : 'Back'}
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                {language === 'te' ? 'తదుపరి' : 'Next'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {language === 'te' ? 'ప్రారంభించండి' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
