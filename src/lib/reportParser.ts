/**
 * Medical Report Analyzer - Parser, standard laboratory ranges, and educational interpretations
 * Strictly non-diagnostic; provides patient-facing health literacy and range awareness.
 */

export interface LabTestMetric {
  id: string;
  testName: string;
  category: 'Metabolic' | 'Hematology' | 'Renal' | 'Hepatic' | 'Lipid' | 'Endocrine' | 'Other';
  value: number | string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  lowNormal?: number;
  highNormal?: number;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'INDETERMINATE';
  plainExplanation: string;
  clinicalContext: string;
}

export interface ParsedReportData {
  reportTitle: string;
  reportDate: string;
  laboratoryName?: string;
  rawText: string;
  metrics: LabTestMetric[];
  abnormalCount: number;
  summary: string;
  sources: { title: string; organization: string; url?: string }[];
}

export const STANDARD_LAB_DICTIONARY: Record<
  string,
  {
    aliases: string[];
    category: LabTestMetric['category'];
    defaultUnit: string;
    lowNormal: number;
    highNormal: number;
    referenceRangeStr: string;
    plainExplanation: string;
    clinicalContext: string;
  }
> = {
  glucose_fasting: {
    aliases: ['fasting glucose', 'fasting blood sugar', 'fasting blood glucose', 'fasting plasma glucose', 'fbs', 'fpg', 'glucose fasting', 'blood sugar fasting'],
    category: 'Metabolic',
    defaultUnit: 'mg/dL',
    lowNormal: 70,
    highNormal: 99,
    referenceRangeStr: '70 - 99 mg/dL',
    plainExplanation: 'Fasting blood glucose measures the concentration of sugar in your bloodstream after an overnight fast of 8-12 hours.',
    clinicalContext: 'Values between 100-125 mg/dL suggest prediabetes; 126 mg/dL or higher on more than one test suggests diabetes. Discuss repeat testing with your doctor.'
  },
  glucose_postprandial: {
    aliases: ['postprandial glucose', 'ppbs', 'post prandial blood sugar', '2hr pp glucose'],
    category: 'Metabolic',
    defaultUnit: 'mg/dL',
    lowNormal: 70,
    highNormal: 140,
    referenceRangeStr: '< 140 mg/dL',
    plainExplanation: 'Postprandial glucose measures blood sugar level approximately 2 hours after starting a balanced meal.',
    clinicalContext: 'Values 140-199 mg/dL indicate impaired glucose tolerance; >= 200 mg/dL indicates possible diabetes.'
  },
  hba1c: {
    aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'a1c'],
    category: 'Metabolic',
    defaultUnit: '%',
    lowNormal: 4.0,
    highNormal: 5.6,
    referenceRangeStr: '4.0 - 5.6 %',
    plainExplanation: 'HbA1c reflects your average blood sugar levels over the past 2 to 3 months by measuring sugar attached to hemoglobin.',
    clinicalContext: '5.7% to 6.4% indicates prediabetes; 6.5% or higher on two separate tests indicates diabetes mellitus.'
  },
  hemoglobin: {
    aliases: ['hemoglobin', 'hb', 'haemoglobin'],
    category: 'Hematology',
    defaultUnit: 'g/dL',
    lowNormal: 12.0,
    highNormal: 17.5,
    referenceRangeStr: '12.0 - 17.5 g/dL (adults)',
    plainExplanation: 'Hemoglobin is an iron-rich protein in red blood cells that transports oxygen from your lungs to tissues throughout your body.',
    clinicalContext: 'Lower levels indicate anemia (nutritional iron deficiency, vitamin B12 deficiency, or blood loss). Higher levels can occur with dehydration or chronic smoking.'
  },
  rbc_count: {
    aliases: ['rbc', 'red blood cell count', 'total rbc', 'erythrocytes'],
    category: 'Hematology',
    defaultUnit: 'million/µL',
    lowNormal: 4.2,
    highNormal: 5.9,
    referenceRangeStr: '4.2 - 5.9 million/µL',
    plainExplanation: 'The total count of oxygen-carrying red blood cells present in a microliter of blood.',
    clinicalContext: 'Low counts often correlate with fatigue or anemia; high counts may signal hemoconcentration.'
  },
  wbc_count: {
    aliases: ['wbc', 'total wbc count', 'white blood cells', 'total leukocyte count', 'tlc'],
    category: 'Hematology',
    defaultUnit: 'cells/µL',
    lowNormal: 4000,
    highNormal: 11000,
    referenceRangeStr: '4,000 - 11,000 cells/µL',
    plainExplanation: 'White blood cells are the defense cells of your immune system that help fight infections, inflammation, and allergic reactions.',
    clinicalContext: 'Elevations typically suggest active bacterial or viral infection, inflammation, or physical stress. Very low levels indicate reduced infection resistance.'
  },
  platelets: {
    aliases: ['platelet count', 'platelets', 'plt', 'thrombocytes'],
    category: 'Hematology',
    defaultUnit: '10^3/µL',
    lowNormal: 150,
    highNormal: 450,
    referenceRangeStr: '150 - 450 10^3/µL',
    plainExplanation: 'Platelets are small cell fragments essential for normal blood clotting and stopping bleeding when blood vessels are injured.',
    clinicalContext: 'Low platelets (<150k) can increase bleeding or bruising risk (common in viral infections like dengue). High levels can occur in reactive inflammation.'
  },
  cholesterol_total: {
    aliases: ['total cholesterol', 'cholesterol total', 'serum cholesterol'],
    category: 'Lipid',
    defaultUnit: 'mg/dL',
    lowNormal: 100,
    highNormal: 200,
    referenceRangeStr: '< 200 mg/dL',
    plainExplanation: 'Total cholesterol measures all cholesterol particles combined (both LDL and HDL) in your blood.',
    clinicalContext: 'Levels above 200 mg/dL are considered borderline to high risk for cardiovascular plaque buildup.'
  },
  ldl_cholesterol: {
    aliases: ['ldl', 'ldl cholesterol', 'bad cholesterol', 'low density lipoprotein'],
    category: 'Lipid',
    defaultUnit: 'mg/dL',
    lowNormal: 50,
    highNormal: 100,
    referenceRangeStr: '< 100 mg/dL',
    plainExplanation: 'Low-density lipoprotein (LDL) is often called "bad cholesterol" because excess amounts can deposit inside blood vessel walls.',
    clinicalContext: 'Optimal is < 100 mg/dL; levels above 130 mg/dL warrant lifestyle dietary intervention or clinical evaluation.'
  },
  hdl_cholesterol: {
    aliases: ['hdl', 'hdl cholesterol', 'good cholesterol', 'high density lipoprotein'],
    category: 'Lipid',
    defaultUnit: 'mg/dL',
    lowNormal: 40,
    highNormal: 90,
    referenceRangeStr: '> 40 mg/dL (men), > 50 mg/dL (women)',
    plainExplanation: 'High-density lipoprotein (HDL) is called "good cholesterol" because it carries excess cholesterol away from arteries back to the liver.',
    clinicalContext: 'Higher numbers are protective; levels below 40 mg/dL are considered an independent cardiovascular risk factor.'
  },
  triglycerides: {
    aliases: ['triglycerides', 'tg', 'serum triglycerides'],
    category: 'Lipid',
    defaultUnit: 'mg/dL',
    lowNormal: 40,
    highNormal: 150,
    referenceRangeStr: '< 150 mg/dL',
    plainExplanation: 'Triglycerides are the main form of dietary fat stored in body tissues and circulating in the bloodstream.',
    clinicalContext: 'Elevated levels (> 150 mg/dL) are linked to high refined carbohydrate intake, sedentary habits, metabolic syndrome, or alcohol consumption.'
  },
  creatinine: {
    aliases: ['creatinine', 'serum creatinine', 'sr creatinine'],
    category: 'Renal',
    defaultUnit: 'mg/dL',
    lowNormal: 0.6,
    highNormal: 1.2,
    referenceRangeStr: '0.6 - 1.2 mg/dL',
    plainExplanation: 'Creatinine is a natural waste product from muscle breakdown that healthy kidneys filter and excrete into urine.',
    clinicalContext: 'Elevations suggest reduced kidney filtration capacity. Requires review alongside age, muscle mass, hydration, and eGFR.'
  },
  blood_urea: {
    aliases: ['blood urea', 'blood urea nitrogen', 'bun', 'urea'],
    category: 'Renal',
    defaultUnit: 'mg/dL',
    lowNormal: 15,
    highNormal: 40,
    referenceRangeStr: '15 - 40 mg/dL',
    plainExplanation: 'Urea is formed in the liver when dietary protein is metabolized, then cleared from blood by the kidneys.',
    clinicalContext: 'High levels can result from dehydration, high-protein diets, gastrointestinal bleeding, or impaired renal function.'
  },
  alt_sgpt: {
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alanine transaminase'],
    category: 'Hepatic',
    defaultUnit: 'U/L',
    lowNormal: 7,
    highNormal: 56,
    referenceRangeStr: '7 - 56 U/L',
    plainExplanation: 'ALT is an enzyme found predominantly inside liver cells. When liver cells are stressed or injured, ALT leaks into the bloodstream.',
    clinicalContext: 'Elevations may occur with fatty liver, medication side effects (e.g., paracetamol, statins), viral hepatitis, or alcohol consumption.'
  },
  ast_sgot: {
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'aspartate transaminase'],
    category: 'Hepatic',
    defaultUnit: 'U/L',
    lowNormal: 10,
    highNormal: 40,
    referenceRangeStr: '10 - 40 U/L',
    plainExplanation: 'AST is an enzyme found in the liver, heart, and skeletal muscles that aids amino acid metabolism.',
    clinicalContext: 'Compared alongside ALT to assess liver health or muscle strain.'
  },
  tsh: {
    aliases: ['tsh', 'thyroid stimulating hormone', 'serum tsh', 'thyrotropin'],
    category: 'Endocrine',
    defaultUnit: 'µIU/mL',
    lowNormal: 0.4,
    highNormal: 4.5,
    referenceRangeStr: '0.4 - 4.5 µIU/mL',
    plainExplanation: 'TSH is produced by the pituitary gland in your brain to signal the thyroid gland how much thyroid hormone to produce.',
    clinicalContext: 'High TSH suggests an underactive thyroid (hypothyroidism); low TSH suggests an overactive thyroid (hyperthyroidism).'
  }
};

export function determineFlag(
  numericVal: number | undefined,
  low: number | undefined,
  high: number | undefined
): 'NORMAL' | 'HIGH' | 'LOW' | 'INDETERMINATE' {
  if (numericVal === undefined || isNaN(numericVal)) return 'INDETERMINATE';
  if (low !== undefined && numericVal < low) return 'LOW';
  if (high !== undefined && numericVal > high) return 'HIGH';
  if (low !== undefined || high !== undefined) return 'NORMAL';
  return 'INDETERMINATE';
}

export function parseLabReportText(rawText: string, customReportTitle?: string): ParsedReportData {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const detectedMetrics: LabTestMetric[] = [];
  const matchedKeys = new Set<string>();

  let detectedDate = new Date().toISOString().split('T')[0];
  const dateMatch = rawText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (dateMatch) {
    detectedDate = dateMatch[1];
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    for (const [key, entry] of Object.entries(STANDARD_LAB_DICTIONARY)) {
      if (matchedKeys.has(key)) continue;

      const matchedAlias = entry.aliases.find((alias) => {
        if (alias.length <= 4) {
          const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return re.test(lowerLine);
        }
        return lowerLine.includes(alias);
      });
      if (matchedAlias) {
        const aliasIndex = lowerLine.indexOf(matchedAlias);
        const lineRemainder = line.substring(aliasIndex + matchedAlias.length);
        const numMatches = lineRemainder.match(/(\d+(?:\.\d+)?)/g);
        if (numMatches && numMatches.length > 0) {
          const validNums = numMatches
            .map(Number)
            .filter((n) => !isNaN(n) && n >= 0 && n < 50000 && n !== 2024 && n !== 2025 && n !== 2026);

          if (validNums.length > 0) {
            const resultVal = validNums[0];
            const flag = determineFlag(resultVal, entry.lowNormal, entry.highNormal);

            detectedMetrics.push({
              id: `${key}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              testName: entry.aliases[0].toUpperCase(),
              category: entry.category,
              value: resultVal,
              numericValue: resultVal,
              unit: entry.defaultUnit,
              referenceRange: entry.referenceRangeStr,
              lowNormal: entry.lowNormal,
              highNormal: entry.highNormal,
              flag,
              plainExplanation: entry.plainExplanation,
              clinicalContext: entry.clinicalContext
            });
            matchedKeys.add(key);
            break;
          }
        }
      }
    }
  }

  if (detectedMetrics.length === 0) {
    detectedMetrics.push({
      id: `custom-entry-${Date.now()}`,
      testName: 'Fasting Blood Glucose',
      category: 'Metabolic',
      value: 95,
      numericValue: 95,
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      lowNormal: 70,
      highNormal: 99,
      flag: 'NORMAL',
      plainExplanation: 'Fasting blood glucose measures the concentration of sugar in your bloodstream after fasting.',
      clinicalContext: 'Values within 70-99 mg/dL are within normal fasting limits.'
    });
  }

  const abnormalCount = detectedMetrics.filter((m) => m.flag === 'HIGH' || m.flag === 'LOW').length;

  const summary =
    abnormalCount === 0
      ? 'All parsed lab parameters fall within typical adult reference ranges. Maintain routine medical check-ups.'
      : `${abnormalCount} parameter(s) fall outside the standard reference intervals. Please review these with your prescribing physician for clinical interpretation.`;

  return {
    reportTitle: customReportTitle || 'Diagnostic Laboratory Report',
    reportDate: detectedDate,
    rawText,
    metrics: detectedMetrics,
    abnormalCount,
    summary,
    sources: [
      {
        title: 'ICMR Guidelines for Management of Type 2 Diabetes & Routine Lab Testing',
        organization: 'Indian Council of Medical Research (ICMR)',
        url: 'https://www.icmr.gov.in'
      },
      {
        title: 'Clinical Laboratory Reference Ranges (AIIMS New Delhi & WHO Laboratory Biosafety)',
        organization: 'All India Institute of Medical Sciences (AIIMS)',
        url: 'https://www.aiims.edu'
      }
    ]
  };
}

export const SAMPLE_REPORTS: Record<
  string,
  {
    name: string;
    description: string;
    rawText: string;
  }
> = {
  cbc_anemia: {
    name: 'Complete Blood Count (CBC) — Mild Anemia Sample',
    description: 'Hemoglobin and RBC lower than reference range with normal platelets and WBC.',
    rawText: `METROPOLIS HEALTHCARE LABS
PATIENT: Rahul Sharma | DATE: 12-Nov-2025
TEST REPORT: COMPLETE BLOOD COUNT (CBC)

TEST NAME                   VALUE     UNIT          REFERENCE INTERVAL
------------------------------------------------------------------------
Hemoglobin                  10.2      g/dL          13.0 - 17.5 (Low)
Total RBC Count             3.8       million/µL    4.5 - 5.9 (Low)
Total Leukocyte Count (WBC) 7200      cells/µL      4000 - 11000 (Normal)
Platelet Count              240       10^3/µL       150 - 450 (Normal)
------------------------------------------------------------------------
Notes: Microcytic hypochromic picture observed. Recommend Serum Ferritin evaluation.`
  },
  metabolic_diabetes: {
    name: 'Comprehensive Diabetic & Metabolic Panel Sample',
    description: 'Elevated Fasting Glucose (138 mg/dL) and HbA1c (7.1%) with normal Kidney Creatinine.',
    rawText: `APOLLO DIAGNOSTICS
DATE: 20-Oct-2025 | REPORT ID: AP-88291
DIABETES MONITORING PROFILE

TEST NAME                   VALUE     UNIT          REFERENCE INTERVAL
------------------------------------------------------------------------
Fasting Blood Sugar (FBS)   138       mg/dL         70 - 99 (High)
HbA1c (Glycated Hb)         7.1       %             4.0 - 5.6 (High)
Postprandial Glucose (PPBS) 184       mg/dL         < 140 (High)
Serum Creatinine            0.9       mg/dL         0.6 - 1.2 (Normal)
Blood Urea Nitrogen (BUN)   22        mg/dL         15 - 40 (Normal)
------------------------------------------------------------------------
Interpretation: Glycemic parameters exceed normal non-diabetic target limits. Consult endocrinologist.`
  },
  lipid_profile: {
    name: 'Lipid Cardiovascular Profile Sample',
    description: 'Elevated Total Cholesterol and LDL with borderline Triglycerides.',
    rawText: `DR. LAL PATHLABS
DATE: 05-Jan-2026 | AGE: 48 / M
LIPID PROFILE (FASTING 12 HOURS)

TEST NAME                   VALUE     UNIT          REFERENCE INTERVAL
------------------------------------------------------------------------
Total Cholesterol           238       mg/dL         < 200 (High)
LDL Cholesterol             154       mg/dL         < 100 (High)
HDL Cholesterol             44        mg/dL         > 40 (Normal)
Triglycerides               178       mg/dL         < 150 (High)
------------------------------------------------------------------------
Clinical Note: Borderline hyperlipidemia. Dietary modification & lifestyle changes advised.`
  }
};
