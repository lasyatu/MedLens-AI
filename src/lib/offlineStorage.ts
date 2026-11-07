/**
 * Offline Mode Support & Static Verified Health Knowledge Base
 * Works 100% in local storage without network connectivity.
 */

import { useState, useEffect } from 'react';

export interface HealthGuideArticle {
  id: string;
  title: string;
  teluguTitle: string;
  category: 'Emergency' | 'Chronic Care' | 'Medication Safety' | 'Preventive Health';
  readingTimeMinutes: number;
  lastUpdated: string;
  sourceAuthority: string;
  sourceUrl: string;
  sections: {
    heading: string;
    teluguHeading: string;
    content: string;
    teluguContent: string;
    bulletPoints?: string[];
  }[];
}

export const OFFLINE_HEALTH_LIBRARY: HealthGuideArticle[] = [
  {
    id: 'emergency-red-flags',
    title: 'Recognizing Medical Emergencies & 112 India Escalation',
    teluguTitle: 'వైద్య అత్యవసర పరిస్థితులు & 112 ఇండియా ఎమర్జెన్సీ గైడ్',
    category: 'Emergency',
    readingTimeMinutes: 4,
    lastUpdated: 'January 2026',
    sourceAuthority: 'Ministry of Health & Family Welfare (MoHFW) / National Health Mission',
    sourceUrl: 'https://www.mohfw.gov.in',
    sections: [
      {
        heading: 'When to Call 112 or Visit the Emergency Department Immediately',
        teluguHeading: 'వెంటనే 112 కు కాల్ చేయవలసిన అత్యవసర సంకేతాలు',
        content: 'Certain clinical symptoms require urgent hospital emergency care. Never delay or wait for an online response when observing any of the following red flag warning signs.',
        teluguContent: 'కొన్ని లక్షణాలు కనిపించినప్పుడు ఆలస్యం చేయకుండా వెంటనే ఆసుపత్రి ఎమర్జెన్సీ విభాగానికి లేదా 112 కు కాల్ చేయాలి.',
        bulletPoints: [
          'Sudden chest pressure, tightness, squeezing pain radiating to left arm, neck, jaw, or back (potential Myocardial Infarction / Heart Attack).',
          'Sudden facial drooping, arm weakness, or slurred speech / difficulty speaking (Stroke warning - FAST protocol).',
          'Severe sudden difficulty breathing, gasping, or blue discoloration of lips/fingertips.',
          'Severe acute allergic reaction with swelling of face, lips, tongue, and throat (Anaphylaxis).',
          'Sudden loss of consciousness, persistent fainting, or violent convulsions / seizures.',
          'Uncontrolled, spurting bleeding that does not stop after direct pressure.'
        ]
      },
      {
        heading: 'National Emergency Numbers in India',
        teluguHeading: 'భారతదేశ జాతీయ అత్యవసర నంబర్లు',
        content: 'Memorize or save these toll-free nationwide emergency contact numbers in your phone for immediate assistance.',
        teluguContent: 'తక్షణ సహాయం కొరకు ఈ జాతీయ ఉచిత అత్యవసర నంబర్లను సేవ్ చేసుకోండి.',
        bulletPoints: [
          '112: All-in-One National Emergency Helpline (Police, Fire, Ambulance)',
          '108: Free Emergency Medical Ambulance Service (in most Indian states)',
          '102: Free Maternal & Child Care Ambulance Transportation',
          '1075: National Health Helpline / Communicable Disease Support'
        ]
      }
    ]
  },
  {
    id: 'safe-medicine-storage',
    title: 'Safe Medicine Storage, Disposal & Shelf-Life in Indian Climates',
    teluguTitle: 'మందుల సురక్షిత నిల్వ, గడువు తీరిన మందుల పారవేయడం',
    category: 'Medication Safety',
    readingTimeMinutes: 3,
    lastUpdated: 'February 2026',
    sourceAuthority: 'Central Drugs Standard Control Organisation (CDSCO)',
    sourceUrl: 'https://cdsco.gov.in',
    sections: [
      {
        heading: 'Temperature & Humidity Management',
        teluguHeading: 'ఉష్ణోగ్రత మరియు తేమ నుండి రక్షణ',
        content: 'India experiences high ambient temperatures and humidity which can rapidly degrade pharmaceutical active ingredients if stored improperly.',
        teluguContent: 'భారతదేశంలోని అధిక వేడి మరియు తేమ వల్ల మందులు త్వరగా పాడయ్యే అవకాశం ఉంటుంది. సరైన నిల్వ చాలా ముఖ్యం.',
        bulletPoints: [
          'Room Temperature: Store medicines marked "Store below 25°C or 30°C" in a cool, dry cupboard away from direct sunlight.',
          'Avoid Bathrooms and Kitchens: Steam and humidity from showers and cooking drastically accelerate tablet degradation.',
          'Refrigeration (2°C - 8°C): Only store insulin, certain eye drops, and specific antibiotic syrups in the fridge. Never freeze them in the freezer compartment.',
          'Keep in Original Blister Packs: Cutting individual tablets out of foil exposes moisture-absorbing desiccant layers.'
        ]
      },
      {
        heading: 'Child Safety & Expiry Rules',
        teluguHeading: 'పిల్లల భద్రత మరియు గడువు ముగింపు నియమాలు',
        content: 'Always store medicines out of reach and out of sight of children. Discard expired medicines safely.',
        teluguContent: 'పిల్లలకు అందని ఎత్తులో మందులను ఉంచండి. గడువు ముగిసిన మందులను ఎట్టి పరిస్థితుల్లోనూ వాడవద్దు.',
        bulletPoints: [
          'Never refer to medicine as "candy" or "chocolate" when giving it to children.',
          'Inspect tablets for discoloration, crumbling, strange odor, or separated liquid suspensions before consumption.'
        ]
      }
    ]
  },
  {
    id: 'understanding-hypertension',
    title: 'Understanding Blood Pressure Readings & Lifestyle Control',
    teluguTitle: 'రక్తపోటు (BP) రీడింగులు మరియు జీవనశైలి మార్పులు',
    category: 'Chronic Care',
    readingTimeMinutes: 4,
    lastUpdated: 'December 2025',
    sourceAuthority: 'Indian Council of Medical Research (ICMR) & World Health Organization (WHO)',
    sourceUrl: 'https://www.icmr.gov.in',
    sections: [
      {
        heading: 'Blood Pressure Target Categories (Systolic / Diastolic mmHg)',
        teluguHeading: 'రక్తపోటు రీడింగుల వర్గీకరణ',
        content: 'Blood pressure is measured as two numbers: Systolic (pressure when heart beats) over Diastolic (pressure when heart rests between beats).',
        teluguContent: 'రక్తపోటును రెండు సంఖ్యలుగా కొలుస్తారు: సిస్టోలిక్ మరియు డయాస్టోలిక్.',
        bulletPoints: [
          'Normal: Systolic < 120 mmHg AND Diastolic < 80 mmHg',
          'Elevated: Systolic 120-129 mmHg AND Diastolic < 80 mmHg',
          'Stage 1 Hypertension: Systolic 130-139 mmHg OR Diastolic 80-89 mmHg',
          'Stage 2 Hypertension: Systolic >= 140 mmHg OR Diastolic >= 90 mmHg',
          'Hypertensive Urgency / Crisis: Systolic > 180 mmHg and/or Diastolic > 120 mmHg (Requires immediate medical evaluation)'
        ]
      },
      {
        heading: 'Evidence-Based Sodium Reduction in Indian Diets',
        teluguHeading: 'భారతీయ ఆహారంలో ఉప్పు తగ్గించే మార్గాలు',
        content: 'The average Indian consumes 8-11g of salt daily, far exceeding the WHO recommended ceiling of 5g (1 teaspoon).',
        teluguContent: 'రోజుకు 5 గ్రాముల కంటే తక్కువ ఉప్పు తీసుకోవడం రక్తపోటును నియంత్రించడంలో సహాయపడుతుంది.',
        bulletPoints: [
          'Cut down commercial pickles (aachar/ooragaya), papads, salted namkeens, and packaged instant noodles.',
          'Enhance flavor using lemon juice, roasted cumin, black pepper, and coriander instead of extra salt.'
        ]
      }
    ]
  },
  {
    id: 'antibiotic-stewardship',
    title: 'Responsible Antibiotic Use & Preventing Drug Resistance',
    teluguTitle: 'యాంటీబయాటిక్స్ బాధ్యతాయుత వినియోగం & డ్రగ్ రెసిస్టెన్స్ నివారణ',
    category: 'Medication Safety',
    readingTimeMinutes: 3,
    lastUpdated: 'January 2026',
    sourceAuthority: 'Indian Pharmacopoeia Commission (IPC) & CDSCO',
    sourceUrl: 'https://ipc.gov.in',
    sections: [
      {
        heading: 'Why Antibiotics Do Not Cure Colds or Viral Fevers',
        teluguHeading: 'జలుబు లేదా వైరల్ జ్వరాలకు యాంటీబయాటిక్స్ ఎందుకు పనిచేయవు',
        content: 'Antibiotics kill bacteria, not viruses. Common colds, flu, and viral gastroenteritis are caused by viruses.',
        teluguContent: 'యాంటీబయాటిక్స్ బ్యాక్టీరియాను మాత్రమే నాశనం చేస్తాయి, వైరస్లను కాదు. జలుబు, ఫ్లూ వైరల్ ఇన్ఫెక్షన్లు.',
        bulletPoints: [
          'Taking antibiotics for viral illnesses provides ZERO therapeutic benefit while exposing you to side effects like diarrhea and allergic reactions.',
          'Overuse drives Antimicrobial Resistance (AMR), where bacteria evolve to survive standard medications.',
          'Always complete the exact duration prescribed by your doctor even if you feel better after 2 days.',
          'Never reuse leftover antibiotics or share them with relatives.'
        ]
      }
    ]
  }
];

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
