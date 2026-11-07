/**
 * Health Guidance, Risk Awareness & Prevention Component
 * Evidence-based health education, doctor preparation checklists, and emergency triage warnings
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  ClipboardList,
  ShieldAlert,
  PhoneCall,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SupportedLanguage } from '../lib/translations';

interface HealthGuidanceProps {
  language: SupportedLanguage;
  onOpenChatWithTopic?: (topic: string) => void;
}

export const HealthGuidance: React.FC<HealthGuidanceProps> = ({ language, onOpenChatWithTopic }) => {
  const [expandedSection, setExpandedSection] = useState<string>('red-flags');

  const doctorQuestions = [
    {
      category: language === 'te' ? 'మందుల గురించిన ప్రశ్నలు' : 'Medication Safety Questions',
      items: [
        language === 'te'
          ? 'ఈ మందును భోజనానికి ముందు లేదా తర్వాత తీసుకోవాలా?'
          : 'Should this medication be taken with food, on an empty stomach, or at bedtime?',
        language === 'te'
          ? 'నేను తీసుకునే ఇతర మందులు లేదా విటమిన్లతో ఇది సంకర్షణ చెందుతుందా?'
          : 'Does this medication interact with my existing prescriptions, vitamins, or herbal supplements?',
        language === 'te'
          ? 'ఒకవేళ మోతాదు మర్చిపోతే ఏమి చేయాలి?'
          : 'What should I do if I miss a scheduled dose?',
        language === 'te'
          ? 'నేను గమనించాల్సిన సాధారణ దుష్ప్రభావాలు ఏమిటి?'
          : 'What common side effects should I expect, and which symptoms require calling your office?'
      ]
    },
    {
      category: language === 'te' ? 'ల్యాబ్ టెస్టుల గురించిన ప్రశ్నలు' : 'Laboratory & Diagnostic Questions',
      items: [
        language === 'te'
          ? 'ఈ ఫలితాలు నా వయస్సు మరియు జీవనశైలికి సాధారణమేనా?'
          : 'Are these specific lab values typical for my demographic and health history?',
        language === 'te'
          ? 'ఈ పరీక్షను మళ్లీ ఎప్పుడు పునరావృతం చేయాలి?'
          : 'When should we schedule repeat testing to confirm trends?',
        language === 'te'
          ? 'ఆహారం లేదా వ్యాయామం ద్వారా ఈ సంఖ్యలను మెరుగుపరచవచ్చా?'
          : 'Can lifestyle and nutritional modifications improve these metrics before starting medication?'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {language === 'te'
                ? 'ఆరోగ్య మార్గదర్శకత్వం & ప్రమాద అవగాహన'
                : 'Health Guidance, Risk Awareness & Prevention'}
            </h1>
            <p className="text-sm text-slate-600">
              {language === 'te'
                ? 'వైద్య అత్యవసర సంకేతాలు, ల్యాబ్ ఫలితాల వ్యత్యాసాలు మరియు డాక్టర్‌ను అడగవలసిన ప్రశ్నల సమగ్ర సమాచారం.'
                : 'Recognizing emergency red flags, understanding risk factors vs diagnoses, and preparing for doctor consultations.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-rose-950">
                {language === 'te'
                  ? 'అత్యవసర రెడ్ ఫ్లాగ్ సంకేతాలు (Call 112 Immediately)'
                  : 'Critical Red Flag Symptoms (Call 112 Immediately)'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-900">
                <PhoneCall className="w-3.5 h-3.5" /> India Helpline: 112
              </span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              {language === 'te'
                ? 'ఈ క్రింది లక్షణాలు ప్రాణాంతక వైద్య అత్యవసర పరిస్థితులను సూచిస్తాయి. ఆన్‌లైన్ శోధనలు లేదా ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ కోసం వేచి చూడకండి.'
                : 'The following warning signs demand immediate emergency room care. Never delay in seeking in-person hospital care if you or a family member experience:'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {[
                {
                  title: language === 'te' ? 'ఛాతీ నొప్పి / గుండెపోటు' : 'Crushing Chest Pain',
                  desc:
                    language === 'te'
                      ? 'ఛాతీలో తీవ్రమైన ఒత్తిడి, ఎడమ చేయి లేదా దవడ వైపు వ్యాపించే నొప్పి.'
                      : 'Severe chest tightness, pressure, or radiating pain to jaw, neck, back, or left arm.'
                },
                {
                  title: language === 'te' ? 'పక్షవాతం సంకేతాలు (FAST)' : 'Stroke Warning Signs (FAST)',
                  desc:
                    language === 'te'
                      ? 'ముఖం ఒకవైపు వాలడం, ఒక చేయి బలహీనపడటం లేదా మాట తడబడటం.'
                      : 'Facial drooping, arm weakness, or sudden slurring/inability to speak.'
                },
                {
                  title: language === 'te' ? 'తీవ్రమైన శ్వాస సమస్య' : 'Acute Respiratory Distress',
                  desc:
                    language === 'te'
                      ? 'శ్వాస అందకపోవడం లేదా పెదవులు నీలం రంగులోకి మారడం.'
                      : 'Severe sudden shortness of breath, gasping, or bluish discoloration of lips.'
                },
                {
                  title: language === 'te' ? 'తీవ్రమైన అలర్జీ (Anaphylaxis)' : 'Severe Anaphylactic Shock',
                  desc:
                    language === 'te'
                      ? 'మందు లేదా ఆహారం తీసుకున్న వెంటనే పెదవులు, నాలుక వాపు మరియు గొంతు బిగుసుకోవడం.'
                      : 'Rapid swelling of lips, tongue, throat, accompanied by dizziness or hives.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-white/90 rounded-xl border border-rose-200">
                  <span className="font-bold text-xs text-rose-950 block">{item.title}</span>
                  <span className="text-xs text-slate-700 mt-1 block">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          {language === 'te'
            ? 'వైద్య విశ్లేషణ: ల్యాబ్ తేడాలు vs ప్రమాద కారకాలు vs వ్యాధి నిర్ధారణ'
            : 'Key Medical Concept: Test Abnormalities vs. Risk Factors vs. Clinical Diagnoses'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
              1. Laboratory Abnormality
            </span>
            <p className="text-xs text-slate-700">
              A specific test number (e.g. Fasting Glucose 118 mg/dL or SGPT 65 U/L) that falls outside standard reference population statistics. It is an objective observation, NOT a disease verdict.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-1">
              2. Health Risk Factor
            </span>
            <p className="text-xs text-slate-700">
              A biological or behavioral trait (e.g., elevated LDL cholesterol, physical inactivity, smoking) that statistically raises the probability of a future condition, but is treatable or reversible.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1">
              3. Confirmed Medical Diagnosis
            </span>
            <p className="text-xs text-slate-700">
              A clinical determination rendered exclusively by a qualified physician combining repeated laboratory tests, physical examination, symptom chronology, and patient medical history.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-teal-600" />
          {language === 'te'
            ? 'డాక్టర్ అపాయింట్‌మెంట్‌కు సిద్ధమవడం (Questions Checklist)'
            : 'Preparing for Your Doctor Consultation (Questions Checklist)'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctorQuestions.map((qGroup, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-teal-800">
                {qGroup.category}
              </h4>
              <ul className="space-y-2">
                {qGroup.items.map((item, qIdx) => (
                  <li key={qIdx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
