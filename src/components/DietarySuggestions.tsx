/**
 * Personalized Indian Dietary Suggestions & Nutritional Wellness Component
 * Grounded in ICMR-National Institute of Nutrition (NIN) standards.
 * Non-prescriptive, culturally authentic, and includes clinical caveats for renal & diabetic conditions.
 */

import React, { useState } from 'react';
import {
  Utensils,
  Droplets,
  Filter,
  AlertCircle,
  Sparkles,
  Heart,
  Leaf,
  Check,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  INDIAN_NUTRITIONAL_ITEMS,
  getHydrationRecommendation,
  FoodSuggestion
} from '../lib/dietaryGuidelines';
import { SupportedLanguage } from '../lib/translations';

interface DietarySuggestionsProps {
  language: SupportedLanguage;
  onOpenChatWithTopic?: (topic: string) => void;
}

export const DietarySuggestions: React.FC<DietarySuggestionsProps> = ({
  language,
  onOpenChatWithTopic
}) => {
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [selectedDietType, setSelectedDietType] = useState<string>('all');
  const [userWeight, setUserWeight] = useState<number>(65);

  const hydration = getHydrationRecommendation(userWeight);

  const filteredFoods = INDIAN_NUTRITIONAL_ITEMS.filter((item) => {
    const focusMatch =
      selectedFocus === 'all' || item.healthFocus.includes(selectedFocus as any);
    const dietMatch =
      selectedDietType === 'all' || item.dietType.includes(selectedDietType as any);
    return focusMatch && dietMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {language === 'te'
                  ? 'వ్యక్తిగతీకరించిన భారతీయ ఆహార సూచనలు'
                  : 'Evidence-Based Indian Dietary Suggestions'}
              </h1>
              <p className="text-sm text-slate-600">
                {language === 'te'
                  ? 'ICMR-NIN మార్గదర్శకాల ఆధారంగా చిరుధాన్యాలు, ఆకుకూరలు, మరియు సంప్రదాయ పోషకాహార సమాచారం.'
                  : 'Nutritional guidance grounded in ICMR-National Institute of Nutrition (NIN) benchmarks.'}
              </p>
            </div>
          </div>

          {onOpenChatWithTopic && (
            <button
              onClick={() => onOpenChatWithTopic('Personalized Indian diet suggestions for my lifestyle')}
              className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              {language === 'te' ? 'AI డైట్ కన్సల్టేషన్' : 'Ask AI for Custom Meal Plan'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">
            {language === 'te'
              ? 'ముఖ్యమైన వైద్య హెచ్చరిక (Clinical Disclaimer):'
              : 'Essential Clinical Guidance:'}
          </span>
          <p>
            These recommendations constitute general lifestyle education and do not replace personalized Medical Nutrition Therapy (MNT). Individuals diagnosed with Chronic Kidney Disease (CKD), uncontrolled Diabetes, or Pregnancy must strictly consult their treating Nephrologist or Certified Clinical Dietitian before adopting high-potassium greens, millets, or protein-rich diets.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-900 to-teal-900 text-white rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-300" />
              <h3 className="font-bold text-base">
                {language === 'te'
                  ? 'ఉష్ణమండల వాతావరణంలో నీటి సమతుల్యత (Hydration Guide)'
                  : 'Daily Hydration Balance in Indian Climates'}
              </h3>
            </div>
            <p className="text-xs text-cyan-100 max-w-xl">
              Adequate fluid balance is essential for renal filtration, metabolic clearance of medications, and preventing heat exhaustion.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-medium text-cyan-200">Body Weight (kg):</span>
              <input
                type="number"
                min={40}
                max={130}
                value={userWeight}
                onChange={(e) => setUserWeight(Math.max(40, parseInt(e.target.value) || 65))}
                className="w-20 px-2 py-1 text-sm bg-white/20 border border-white/30 rounded-lg text-white font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl text-center min-w-[200px]">
            <span className="text-xs uppercase tracking-wider text-cyan-200 block font-semibold">
              Daily Target
            </span>
            <div className="text-3xl font-extrabold text-cyan-300 mt-1">
              {hydration.dailyTargetLiters} <span className="text-lg text-white">Liters</span>
            </div>
            <span className="text-[11px] text-cyan-100 block mt-1">~{Math.round(hydration.dailyTargetLiters * 4)} standard glasses</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'te' ? 'ఆరోగ్య లక్ష్యం:' : 'Health Focus:'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: language === 'te' ? 'అన్నీ (All)' : 'All Foods' },
              { id: 'diabetic', label: language === 'te' ? 'డయాబెటిస్ జాగ్రత్త' : 'Diabetic-Conscious' },
              { id: 'hypertension', label: language === 'te' ? 'తక్కువ ఉప్పు (BP)' : 'Low Sodium / BP' },
              { id: 'iron-rich', label: language === 'te' ? 'రక్తహీనత / ఐరన్' : 'Iron-Rich (Anemia)' },
              { id: 'digestive', label: language === 'te' ? 'జీర్ణశక్తి' : 'Digestive Wellness' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFocus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedFocus === f.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFoods.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  {item.teluguName && (
                    <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                      {item.teluguName}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  GI: {item.glycemicIndex}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Nutritional Highlights
                </span>
                <ul className="space-y-1">
                  {item.nutritionalHighlights.map((nh, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{nh}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">
                  {language === 'te' ? 'తయారీ విధానం:' : 'Recommended Preparation:'}
                </span>
                {item.preparationTip}
              </div>

              {item.cautionNote && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-medium">
                  <span className="font-bold">Caution: </span>
                  {item.cautionNote}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
