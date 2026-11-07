/**
 * Evidence-based Indian Dietary Guidelines & Nutritional Suggestions
 * Built strictly according to ICMR-National Institute of Nutrition (NIN) dietary guidelines for Indians.
 * Non-prescriptive, culturally authentic, and emphasizing clinical consultation for kidney/diabetic conditions.
 */

export interface FoodSuggestion {
  id: string;
  name: string;
  teluguName?: string;
  category: 'Grains & Millets' | 'Lentils & Pulses' | 'Vegetables & Greens' | 'Fruits' | 'Dairy & Fermented' | 'Healthy Fats & Seeds';
  dietType: ('vegetarian' | 'vegan' | 'non-vegetarian')[];
  healthFocus: ('general' | 'diabetic' | 'hypertension' | 'iron-rich' | 'renal-caution' | 'digestive')[];
  glycemicIndex: 'Low' | 'Medium' | 'High';
  nutritionalHighlights: string[];
  preparationTip: string;
  cautionNote?: string;
}

export const INDIAN_NUTRITIONAL_ITEMS: FoodSuggestion[] = [
  {
    id: 'ragi_finger_millet',
    name: 'Finger Millet (Ragi / Mandua)',
    teluguName: 'రాగులు (Ragi)',
    category: 'Grains & Millets',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['general', 'diabetic', 'iron-rich'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Exceptionally high calcium (344mg/100g)', 'Slow-release complex carbohydrates', 'Rich in dietary fiber and iron'],
    preparationTip: 'Consume as ragi malt (ambali) with buttermilk or ragi roti with vegetables rather than sweetened porridge.'
  },
  {
    id: 'foxtail_millet',
    name: 'Foxtail Millet (Kangni / Korra)',
    teluguName: 'కొర్రలు (Korralu)',
    category: 'Grains & Millets',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['diabetic', 'general'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['High fiber content (8g/100g)', 'Low glycemic load to blunt postprandial sugar spikes', 'Good source of magnesium'],
    preparationTip: 'Replace polished white rice with steamed foxtail millet paired with sambar or leafy dal.'
  },
  {
    id: 'brown_rice',
    name: 'Unpolished Brown / Red Rice',
    teluguName: 'దంపుడు బియ్యం (Brown Rice)',
    category: 'Grains & Millets',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['general', 'diabetic'],
    glycemicIndex: 'Medium',
    nutritionalHighlights: ['Preserves bran layer containing B-vitamins', 'Slower digestion than polished white rice', 'Rich in antioxidants and selenium'],
    preparationTip: 'Soak for 45 minutes prior to cooking for easier digestion.'
  },
  {
    id: 'moong_dal',
    name: 'Yellow Moong Dal (Split Green Gram)',
    teluguName: 'పెసరపప్పు (Pesara Pappu)',
    category: 'Lentils & Pulses',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['general', 'digestive', 'diabetic'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Easily digestible plant protein (24g/100g)', 'Very low flatulence factor', 'High potassium and folate'],
    preparationTip: 'Lightly seasoned with cumin (jeera) and ginger; ideal during convalescence or digestive sensitivity.'
  },
  {
    id: 'horse_gram',
    name: 'Horse Gram (Kulthi / Ulavalu)',
    teluguName: 'ఉలవలు (Ulavalu)',
    category: 'Lentils & Pulses',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['iron-rich', 'diabetic'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Extremely high protein and iron concentration', 'Natural polyphenols and enzyme inhibitors beneficial for metabolic health'],
    preparationTip: 'Consume as boiled ulava charu (soup) or sprouted in salads.'
  },
  {
    id: 'palak_spinach',
    name: 'Spinach (Palak)',
    teluguName: 'పాలకూర (Palakura)',
    category: 'Vegetables & Greens',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['iron-rich', 'hypertension', 'general'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Abundant lutein, vitamin A, and plant-based non-heme iron', 'High potassium which counteracts dietary sodium'],
    preparationTip: 'Combine with lemon juice (Vitamin C) to drastically increase iron absorption.',
    cautionNote: 'Contains oxalates; individuals with calcium-oxalate kidney stone history should moderate consumption.'
  },
  {
    id: 'methi_leaves',
    name: 'Fenugreek Leaves (Methi)',
    teluguName: 'మెంతికూర (Menthikura)',
    category: 'Vegetables & Greens',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['diabetic', 'digestive'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Contains 4-hydroxyisoleucine which stimulates glucose metabolism', 'High soluble fiber matrix that slows starch absorption'],
    preparationTip: 'Cook into methi dal or steam into whole-wheat phulkas without excess oil.'
  },
  {
    id: 'moringa_drumstick_leaves',
    name: 'Drumstick Leaves (Moringa / Munagaku)',
    teluguName: 'మునగాకు (Munagaku)',
    category: 'Vegetables & Greens',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['iron-rich', 'hypertension', 'general'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Exceptional micronutrient density: 4x vitamin C of oranges, 2x protein of yogurt', 'Rich in quercetin and chlorogenic acid'],
    preparationTip: 'Stir fry lightly with crushed garlic and split moong dal; do not overboil.'
  },
  {
    id: 'amla_gooseberry',
    name: 'Indian Gooseberry (Amla / Usirikaya)',
    teluguName: 'ఉసిరికాయ (Usirikaya)',
    category: 'Fruits',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['general', 'diabetic', 'iron-rich'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['One of the richest natural sources of heat-stable Vitamin C (600mg/100g)', 'Potent free-radical scavenging polyphenols'],
    preparationTip: 'Consume raw with a pinch of black salt or grated into fresh warm water in the morning.'
  },
  {
    id: 'guava',
    name: 'Guava (Amrood / Jama)',
    teluguName: 'జామకాయ (Jamakaya)',
    category: 'Fruits',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['diabetic', 'hypertension', 'digestive'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['High pectin dietary fiber (5.4g/100g)', 'Low fructose index suitable for blood sugar management', 'High potassium'],
    preparationTip: 'Consume whole with skin (wash thoroughly) for maximum fiber benefit; avoid artificial salts.'
  },
  {
    id: 'curd_buttermilk',
    name: 'Traditional Chhas / Majjiga (Spiced Buttermilk)',
    teluguName: 'మజ్జిగ (Majjiga)',
    category: 'Dairy & Fermented',
    dietType: ['vegetarian'],
    healthFocus: ['digestive', 'hypertension', 'general'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Live probiotic lactic cultures for microbiome health', 'Natural electrolytes (potassium, calcium) for cooling hydration'],
    preparationTip: 'Dilute homemade curd 1:3 with water, churn, and temper with curry leaves, crushed ginger, and roasted cumin; avoid high salt.'
  },
  {
    id: 'flaxseeds',
    name: 'Flaxseeds (Alsi / Avisa Ginjalu)',
    teluguName: 'అవిసె గింజలు (Avise Ginjalu)',
    category: 'Healthy Fats & Seeds',
    dietType: ['vegetarian', 'vegan'],
    healthFocus: ['hypertension', 'diabetic', 'general'],
    glycemicIndex: 'Low',
    nutritionalHighlights: ['Alpha-linolenic acid (ALA plant Omega-3)', 'Lignans that support healthy vascular endothelial function', 'Soluble mucilage fiber'],
    preparationTip: 'Grind lightly before consumption and sprinkle 1 tablespoon over dal, salads, or curd.'
  }
];

export interface HydrationPlan {
  dailyTargetLiters: number;
  tips: string[];
  signsOfDehydration: string[];
}

export function getHydrationRecommendation(weightKg: number = 65, isTropicalClimate: boolean = true): HydrationPlan {
  const baseLiters = (weightKg * (isTropicalClimate ? 0.038 : 0.032)).toFixed(1);
  return {
    dailyTargetLiters: Math.max(2.2, Math.min(3.8, parseFloat(baseLiters))),
    tips: [
      'Drink 1-2 glasses of room-temperature water upon waking to kickstart renal filtration.',
      'Incorporate traditional cooling unsweetened fluids: Spiced buttermilk (majjiga), tender coconut water, or barley water.',
      'Sip water steadily throughout the day rather than chugging large volumes at meal times.',
      'Limit high-caffeine beverages and commercial aerated sodas which have mild diuretic effects.'
    ],
    signsOfDehydration: [
      'Dark yellow or amber-colored urine',
      'Dry mouth or persistent afternoon headache',
      'Fatigue and decreased concentration',
      'Dry or inelastic skin'
    ]
  };
}
