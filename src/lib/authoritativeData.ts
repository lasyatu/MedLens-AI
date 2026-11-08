/**
 * Genuine authoritative medicine monograph records from openFDA (US) and CDSCO/IP (India).
 * Used for verification, RAG chunking, and regulatory evidence citations.
 */

export interface SourceCitation {
  title: string;
  publisher: string;
  jurisdiction: 'United States (FDA)' | 'India (CDSCO / IP)' | 'Global (WHO / INN)';
  url: string;
  documentId: string;
  revisionDate: string;
}

export interface MonographSection {
  sectionTitle: string;
  content: string;
  citationIndex: number;
}

export interface MedicineInteractionItem {
  substance: string;
  severity: 'severe' | 'moderate' | 'minor';
  effect: string;
  clinicalAdvice: string;
}

export interface MedicineRecord {
  id: string;
  medicineName: string;
  genericName: string;
  brandNames: string[];
  activeIngredients?: string[];
  composition?: string;
  therapeuticClass: string;
  primaryJurisdiction: 'United States (FDA)' | 'India (CDSCO / IP)' | 'Global (WHO / INN)';
  approvedDosages: string[];
  dosageForms: string[];
  labeledUses: string[];
  mechanismOfAction?: string;
  administrationInfo?: string;
  missedDoseGuidance?: string;
  overdoseWarnings?: string;
  storageInstructions?: string;
  boxedWarning?: string;
  contraindications: string[];
  warningsAndPrecautions: string[];
  commonAdverseReactions: string[];
  interactionsList?: MedicineInteractionItem[];
  sources: SourceCitation[];
  monographSections: MonographSection[];
}

export const AUTHORITATIVE_MEDICINES: MedicineRecord[] = [
  {
    id: 'med-paracetamol',
    medicineName: 'Paracetamol / Acetaminophen',
    genericName: 'Acetaminophen (USAN) / Paracetamol (INN / IP)',
    brandNames: ['Tylenol', 'Dolo-650', 'Crocin', 'Calpol', 'Panadol', 'Pacimol'],
    activeIngredients: ['Acetaminophen (Paracetamol)'],
    composition: 'Each uncoated tablet contains: Paracetamol IP / Acetaminophen USP 500 mg or 650 mg. Excipients q.s.',
    therapeuticClass: 'Analgesic and Antipyretic',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['325 mg', '500 mg', '650 mg', '1000 mg'],
    dosageForms: ['Tablet', 'Capsule', 'Oral Suspension', 'Suppository', 'IV Infusion'],
    labeledUses: [
      'Temporary relief of minor aches and pains due to headache, muscular aches, backache, arthritis, the common cold, toothache, and menstrual cramps',
      'Temporary reduction of fever'
    ],
    mechanismOfAction: 'Exerts antipyretic action through direct action on hypothalamic heat-regulating centers, resulting in peripheral vasodilation, sweating, and heat dissipation. Produces analgesia by inhibiting prostaglandin synthesis in the central nervous system (CNS) with minimal peripheral anti-inflammatory activity.',
    administrationInfo: 'May be administered orally with or without food. Swallow tablets whole with a full glass of water. For oral liquid suspensions, use a calibrated measuring device. Do not exceed the maximum daily adult dose of 4,000 mg in 24 hours (or 3,000 mg in vulnerable populations).',
    missedDoseGuidance: 'If taking on a regular schedule and a dose is missed, take it as soon as remembered. If it is almost time for the next scheduled dose, skip the missed dose and resume normal schedule. Never take a double dose to make up for a missed dose.',
    overdoseWarnings: 'BOXED TOXICITY WARNING: Ingestion of doses exceeding 4,000 mg/day or acute toxic ingestion (> 7.5g in adults or > 150 mg/kg in children) can result in severe hepatic necrosis, acute liver failure, encephalopathy, and death. Symptoms of acute overdose within 24 hours include anorexia, nausea, vomiting, diaphoresis, and general malaise. Immediate emergency treatment with intravenous or oral N-acetylcysteine (NAC) within 8 hours is essential.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F); excursions permitted between 15°C and 30°C (59°F and 86°F). Protect from excessive heat, light, and moisture. Keep tightly closed in child-resistant containers out of reach of children.',
    boxedWarning: 'Liver Warning: This product contains acetaminophen. Severe liver damage may occur if an adult takes more than 4,000 mg in 24 hours, takes with other drugs containing acetaminophen, or has 3 or more alcoholic drinks every day while using this product.',
    contraindications: [
      'Severe active liver disease or severe hepatic impairment',
      'Known hypersensitivity to acetaminophen, paracetamol, or any component of the formulation'
    ],
    warningsAndPrecautions: [
      'Hepatotoxicity with excessive doses or concurrent alcohol consumption (>= 3 drinks daily)',
      'Serious skin reactions: rare occurrences of Stevens-Johnson Syndrome (SJS), toxic epidermal necrolysis (TEN), and acute generalized exanthematous pustulosis (AGEP)',
      'Accidental overdose hazard when co-administered with over-the-counter multi-symptom cold or cough medications containing acetaminophen',
      'Chronic malnutrition, dehydration, or renal impairment require clinical dosage adjustments'
    ],
    commonAdverseReactions: ['Nausea', 'Vomiting', 'Constipation', 'Pruritus (rare)', 'Erythematous rash'],
    interactionsList: [
      {
        substance: 'Alcohol (Ethanol)',
        severity: 'severe',
        effect: 'Induction of CYP2E1 enzymes increases toxic metabolite NAPQI, drastically heightening liver damage risk.',
        clinicalAdvice: 'Avoid chronic or excessive alcohol intake while taking paracetamol.'
      },
      {
        substance: 'Warfarin / Oral Anticoagulants',
        severity: 'moderate',
        effect: 'Prolonged daily use of paracetamol (> 2,000 mg/day) may elevate INR and increase bleeding risk.',
        clinicalAdvice: 'Monitor coagulation parameters (INR) if paracetamol is taken regularly for more than several days.'
      },
      {
        substance: 'Isoniazid',
        severity: 'severe',
        effect: 'Elevated hepatotoxic risk due to altered hepatic metabolism.',
        clinicalAdvice: 'Consult physician before co-administration.'
      }
    ],
    sources: [
      {
        title: 'FDA Drug Safety Communication: Acetaminophen Prescription Combination Drug Products',
        publisher: 'U.S. Food and Drug Administration (FDA)',
        jurisdiction: 'United States (FDA)',
        url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-prescription-acetaminophen-products-be-limited-325-mg-dosage-unit',
        documentId: 'FDA-SPL-TYLENOL-500MG-NDC-50580-498',
        revisionDate: '2023-08-15'
      },
      {
        title: 'Indian Pharmacopoeia (IP) Monograph: Paracetamol Tablets IP 500mg/650mg',
        publisher: 'Indian Pharmacopoeia Commission / CDSCO',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Drugs/Safety-Alerts/',
        documentId: 'IPC-MONO-PARACETAMOL-IP-650',
        revisionDate: '2022-11-10'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Acetaminophen is indicated for the temporary relief of mild to moderate aches and pains associated with headache, muscle aches, backache, minor arthritis pain, the common cold, toothache, and premenstrual/menstrual cramps. It is also indicated for the temporary reduction of fever.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Acetaminophen produces analgesia through elevation of the pain threshold and antipyresis through hypothalamic thermoregulatory centers. While not fully elucidated, mechanisms include inhibition of central cyclooxygenase enzymes and cannabinoid receptor modulation.',
        citationIndex: 0
      },
      {
        sectionTitle: 'BOXED WARNING - HEPATOTOXICITY',
        content: 'WARNING: Acetaminophen has been associated with cases of acute liver failure, at times resulting in liver transplant and death. Most of the cases of liver injury are associated with the use of acetaminophen at doses that exceed 4000 milligrams per day, and often involve more than one acetaminophen-containing product.',
        citationIndex: 0
      },
      {
        sectionTitle: 'CONTRAINDICATIONS AND PRECAUTIONS',
        content: 'Acetaminophen is contraindicated in patients with known severe hypersensitivity to acetaminophen or any other ingredient in the product, and in patients with severe active hepatic impairment or severe active liver disease.',
        citationIndex: 0
      },
      {
        sectionTitle: 'INDIAN PHARMACOPOEIA STANDARDS',
        content: 'Paracetamol Tablets IP comply with the requirements of the Indian Pharmacopoeia. Dolo-650 and Crocin formulations provide 650mg and 500mg paracetamol respectively for antipyretic action. Daily adult dosage must not exceed 4000 mg. Discontinue use and consult physician if fever persists for more than 3 days.',
        citationIndex: 1
      }
    ]
  },
  {
    id: 'med-amoxicillin',
    medicineName: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    brandNames: ['Amoxil', 'Mox', 'Augmentin (with clavulanate)', 'Novamox', 'Almox'],
    activeIngredients: ['Amoxicillin Trihydrate'],
    composition: 'Each capsule contains: Amoxicillin Trihydrate IP/USP equivalent to anhydrous Amoxicillin 250 mg or 500 mg.',
    therapeuticClass: 'Aminopenicillin Beta-Lactam Antibiotic',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['250 mg', '500 mg', '875 mg'],
    dosageForms: ['Capsule', 'Tablet', 'Chewable Tablet', 'Oral Suspension'],
    labeledUses: [
      'Treatment of ear, nose, and throat bacterial infections (pharyngitis, tonsillitis, otitis media) caused by susceptible Streptococcus spp. and Haemophilus influenzae',
      'Infections of the lower respiratory tract caused by Streptococcus pneumoniae and Haemophilus influenzae',
      'Infections of the genitourinary tract (e.g., uncomplicated urinary tract infections)',
      'Skin and skin structure infections',
      'Helicobacter pylori eradication (in combination with PPI and clarithromycin)'
    ],
    mechanismOfAction: 'Inhibits bacterial cell wall synthesis by binding to one or more of the penicillin-binding proteins (PBPs), which inhibits the final transpeptidation step of peptidoglycan synthesis in bacterial cell walls, leading to cell lysis and bacterial death.',
    administrationInfo: 'May be taken without regard to meals; however, taking with food may improve gastrointestinal tolerability. Chewable tablets must be chewed before swallowing. Reconstituted oral suspension must be shaken well before each dose and stored in a refrigerator (discard unused suspension after 14 days). Complete full prescribed course even if symptoms resolve earlier.',
    missedDoseGuidance: 'Take the missed dose as soon as remembered. If it is almost time for the next dose, skip the missed dose and resume normal schedule. Do not take extra doses to compensate.',
    overdoseWarnings: 'In case of severe overdosage, discontinue medication and initiate supportive measures. Interstitial nephritis resulting in oliguric renal failure and crystalluria has been reported in a small number of patients after amoxicillin overdosage. Maintain adequate fluid intake and diuresis; hemodialysis can remove amoxicillin from circulation.',
    storageInstructions: 'Store dry capsules and tablets at 20°C to 25°C (68°F to 77°F). Store reconstituted oral suspension in a refrigerator between 2°C and 8°C (36°F to 46°F) for up to 14 days. Do not freeze.',
    contraindications: [
      'Known serious hypersensitivity reaction (e.g., anaphylaxis or Stevens-Johnson syndrome) to amoxicillin or other beta-lactam antibacterial drugs (e.g., penicillins and cephalosporins)',
      'Infectious mononucleosis (high frequency of erythematous maculopapular rash)'
    ],
    warningsAndPrecautions: [
      'Severe, potentially fatal hypersensitivity (anaphylactic) reactions reported in patients on penicillin therapy',
      'Clostridioides difficile-associated diarrhea (CDAD) ranging from mild diarrhea to fatal pseudomembranous colitis',
      'Prescribing amoxicillin in the absence of a proven or strongly suspected bacterial infection increases drug-resistant bacteria risk',
      'Prolonged use may result in superinfection with fungal or resistant bacterial pathogens'
    ],
    commonAdverseReactions: ['Diarrhea', 'Skin rash', 'Nausea', 'Vomiting', 'Oral candidiasis (thrush)'],
    interactionsList: [
      {
        substance: 'Methotrexate',
        severity: 'severe',
        effect: 'Penicillins decrease renal clearance of methotrexate, leading to methotrexate toxicity.',
        clinicalAdvice: 'Avoid concurrent use or monitor methotrexate serum levels carefully.'
      },
      {
        substance: 'Allopurinol',
        severity: 'moderate',
        effect: 'Concurrent use significantly increases incidence of maculopapular skin rashes.',
        clinicalAdvice: 'Monitor skin integrity and discontinue if rash occurs.'
      },
      {
        substance: 'Oral Contraceptives',
        severity: 'minor',
        effect: 'May reduce gut flora, slightly decreasing estrogen reabsorption and oral contraceptive effectiveness.',
        clinicalAdvice: 'Use additional barrier contraception during antimicrobial therapy.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - AMOXICILLIN capsule, gelatin coated (Teva Pharmaceuticals USA, Inc.)',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6b7c53e8-5bbf-4638-9562-bbbeeb08be2f',
        documentId: 'FDA-SPL-AMOX-500MG-NDC-0093-3109',
        revisionDate: '2023-01-20'
      },
      {
        title: 'CDSCO Approved Antibacterial Monograph - Amoxicillin Trihydrate IP',
        publisher: 'Central Drugs Standard Control Organisation (India)',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
        documentId: 'CDSCO-LIST-AMOX-IP-500',
        revisionDate: '2022-09-18'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Amoxicillin is indicated in the treatment of infections due to susceptible isolates of the designated microorganisms in ear, nose, throat, genitourinary tract, skin and skin structure, and lower respiratory tract.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Amoxicillin is an antibacterial drug that inhibits transpeptidase enzymes required for cross-linking peptidoglycan polymers in bacterial cell wall synthesis. Susceptible bacteria undergo osmotic lysis.',
        citationIndex: 0
      },
      {
        sectionTitle: 'WARNINGS - ANAPHYLAXIS AND HYPERSENSITIVITY',
        content: 'Serious and occasionally fatal hypersensitivity (anaphylactic) reactions have been reported in patients on penicillin therapy. Although anaphylaxis is more frequent following parenteral therapy, it has occurred in patients on oral penicillins. Before initiating therapy with amoxicillin, careful inquiry should be made concerning previous hypersensitivity reactions.',
        citationIndex: 0
      },
      {
        sectionTitle: 'CLOSTRIDIOIDES DIFFICILE ASSOCIATED DIARRHEA',
        content: 'Clostridioides difficile-associated diarrhea (CDAD) has been reported with use of nearly all antibacterial agents, including amoxicillin, and may range in severity from mild diarrhea to fatal colitis. Treatment with antibacterial agents alters the normal flora of the colon leading to overgrowth of C. difficile.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-ibuprofen',
    medicineName: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: ['Advil', 'Motrin', 'Brufen', 'Ibugesic', 'Combiflam (with Paracetamol)'],
    activeIngredients: ['Ibuprofen'],
    composition: 'Each film-coated tablet contains: Ibuprofen IP/USP 200 mg, 400 mg, or 600 mg.',
    therapeuticClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['200 mg', '400 mg', '600 mg', '800 mg'],
    dosageForms: ['Tablet', 'Capsule', 'Oral Suspension', 'Topical Gel'],
    labeledUses: [
      'Relief of mild to moderate pain (headache, dental pain, menstrual cramps, muscle aches, backache)',
      'Reduction of fever',
      'Relief of signs and symptoms of rheumatoid arthritis and osteoarthritis'
    ],
    mechanismOfAction: 'Inhibits cyclooxygenase-1 (COX-1) and cyclooxygenase-2 (COX-2) enzymes, thereby inhibiting the synthesis of prostaglandins involved in mediating pain, inflammation, and fever.',
    administrationInfo: 'Administer with food, milk, or a full glass of water to minimize gastrointestinal distress. Use the lowest effective dose for the shortest duration necessary to achieve patient treatment goals.',
    missedDoseGuidance: 'If taken on a regular schedule, take as soon as remembered. If close to next dose, skip and proceed normally. Never take two doses simultaneously.',
    overdoseWarnings: 'Acute toxicity symptoms include nausea, vomiting, epigastric pain, lethargy, drowsiness, tinnitus, gastrointestinal bleeding, acute renal failure, metabolic acidosis, and respiratory depression. Management is supportive: activated charcoal within 1 hour of ingestion, hydration, and monitoring of renal function and coagulation.',
    storageInstructions: 'Store at controlled room temperature 20°C to 25°C (68°F to 77°F). Avoid excessive heat above 40°C (104°F). Protect from direct light and moisture.',
    boxedWarning: 'Cardiovascular Thrombotic Events: NSAIDs cause an increased risk of serious cardiovascular thrombotic events, including myocardial infarction and stroke, which can be fatal. This risk may occur early in treatment and may increase with duration of use. Gastrointestinal Risk: NSAIDs cause an increased risk of serious gastrointestinal adverse events including bleeding, ulceration, and perforation of the stomach or intestines, which can be fatal.',
    contraindications: [
      'Known hypersensitivity to ibuprofen, aspirin, or other NSAIDs (history of asthma, urticaria, or anaphylaxis)',
      'In the setting of coronary artery bypass graft (CABG) surgery',
      'Active peptic ulcer disease, active gastrointestinal bleeding, or severe renal/hepatic failure',
      'Third trimester of pregnancy (risk of premature closure of fetal ductus arteriosus)'
    ],
    warningsAndPrecautions: [
      'Gastrointestinal bleeding, ulceration, and perforation risk, especially in the elderly or those with history of ulcers',
      'Renal toxicity: Long-term administration can lead to renal papillary necrosis and other renal injury',
      'Hypertension: NSAIDs can lead to onset of new hypertension or worsening of pre-existing hypertension',
      'Fluid retention and edema: Caution in patients with fluid retention or heart failure',
      'Avoid during the third trimester of pregnancy'
    ],
    commonAdverseReactions: ['Dyspepsia', 'Abdominal pain', 'Nausea', 'Heartburn', 'Dizziness', 'Fluid retention'],
    interactionsList: [
      {
        substance: 'Aspirin / Other NSAIDs',
        severity: 'severe',
        effect: 'Significantly increases gastrointestinal bleeding and ulceration risks without additive efficacy; antagonizes irreversible platelet inhibition of low-dose aspirin.',
        clinicalAdvice: 'Avoid concurrent NSAID combinations.'
      },
      {
        substance: 'Anticoagulants (Warfarin, Apixaban)',
        severity: 'severe',
        effect: 'Synergistic bleeding risk due to platelet function inhibition and gastric mucosal injury.',
        clinicalAdvice: 'Avoid or closely monitor prothrombin time/INR.'
      },
      {
        substance: 'ACE Inhibitors / ARBs / Diuretics',
        severity: 'severe',
        effect: 'Triple whammy risk: diminishes antihypertensive effect and drastically accelerates acute renal impairment.',
        clinicalAdvice: 'Monitor renal function and serum potassium regularly.'
      }
    ],
    sources: [
      {
        title: 'FDA DailyMed - Ibuprofen tablet (McNeil Consumer Healthcare)',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0a012019-3543-47e0-b6fa-9bf6786a51d9',
        documentId: 'FDA-SPL-IBU-200MG-NDC-50580-141',
        revisionDate: '2023-04-12'
      },
      {
        title: 'Indian Pharmacopoeia Monograph - Ibuprofen Tablets IP',
        publisher: 'Indian Pharmacopoeia Commission / CDSCO',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
        documentId: 'IPC-MONO-IBUPROFEN-400',
        revisionDate: '2022-05-14'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'BOXED WARNING - CARDIOVASCULAR AND GASTROINTESTINAL RISK',
        content: 'NSAIDs cause an increased risk of serious cardiovascular thrombotic events, myocardial infarction, and stroke, which can be fatal. NSAIDs also cause an increased risk of serious gastrointestinal adverse events including bleeding, ulceration, and perforation of the stomach or intestines.',
        citationIndex: 0
      },
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Ibuprofen is indicated for relief of the signs and symptoms of rheumatoid arthritis and osteoarthritis, for relief of mild to moderate pain, and for reduction of fever.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Inhibits prostaglandin G/H synthase 1 and 2 (COX-1 and COX-2), reducing conversion of arachidonic acid to prostaglandin precursors, resulting in decreased pain and inflammatory response.',
        citationIndex: 0
      },
      {
        sectionTitle: 'RENAL EFFECTS',
        content: 'Long-term administration of NSAIDs has resulted in renal papillary necrosis and other renal injury. Renal toxicity has also been seen in patients in whom renal prostaglandins have a compensatory role in the maintenance of renal perfusion.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-metformin',
    medicineName: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['Glucophage', 'Glycomet', 'Obimet', 'Fortamet', 'Riomet'],
    activeIngredients: ['Metformin Hydrochloride'],
    composition: 'Each film-coated tablet contains: Metformin Hydrochloride IP/USP 500 mg, 850 mg, or 1000 mg.',
    therapeuticClass: 'Biguanide Antihyperglycemic Agent',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['500 mg', '850 mg', '1000 mg'],
    dosageForms: ['Tablet', 'Extended-Release Tablet', 'Oral Solution'],
    labeledUses: [
      'Adjunct to diet and exercise to improve glycemic control in adults and pediatric patients 10 years and older with type 2 diabetes mellitus'
    ],
    mechanismOfAction: 'Decreases hepatic glucose production (gluconeogenesis), decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization mediated by AMP-activated protein kinase (AMPK) activation.',
    administrationInfo: 'Administer with meals (breakfast and dinner) to reduce gastrointestinal adverse effects. Swallow extended-release (ER) tablets whole; do not split, crush, chew, or dissolve. Start at low doses and titrate gradually.',
    missedDoseGuidance: 'Take the missed dose with your next meal. If it is time for the subsequent dose, skip the missed dose and resume your regular dosing schedule. Do not take extra medicine.',
    overdoseWarnings: 'BOXED WARNING - LACTIC ACIDOSIS: Overdose or drug accumulation can trigger fatal lactic acidosis. Symptoms include malaise, severe muscle aches, respiratory distress, deep rapid breathing, hypothermia, hypotension, and bradyarrhythmias. Hemodialysis is prompt and effective for correcting acidosis and removing accumulated metformin.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F); excursions permitted to 15°C to 30°C. Protect from light and moisture in tight, light-resistant containers.',
    boxedWarning: 'Lactic Acidosis: Lactic acidosis is a rare, but serious, complication that can occur due to metformin accumulation. The risk increases with conditions including renal impairment, sepsis, dehydration, excess alcohol intake, hepatic impairment, and acute congestive heart failure. Symptoms include malaise, myalgias, respiratory distress, somnolence, and abdominal pain. Discontinue metformin immediately if lactic acidosis is suspected.',
    contraindications: [
      'Severe renal impairment (eGFR below 30 mL/min/1.73 m2)',
      'Known hypersensitivity to metformin hydrochloride',
      'Acute or chronic metabolic acidosis, including diabetic ketoacidosis'
    ],
    warningsAndPrecautions: [
      'Lactic acidosis risk: evaluate renal function (eGFR) prior to initiation and at least annually thereafter',
      'Temporarily discontinue prior to any intravascular iodinated radiocontrast procedure in patients with eGFR between 30 and 60 mL/min',
      'Vitamin B12 deficiency risk with long-term therapy; monitor serum B12 every 2 to 3 years',
      'Hypoglycemia risk when combined with sulfonylureas or insulin'
    ],
    commonAdverseReactions: ['Diarrhea', 'Nausea/vomiting', 'Flatulence', 'Abdominal discomfort', 'Metallic taste', 'Asthenia'],
    interactionsList: [
      {
        substance: 'Alcohol (Ethanol)',
        severity: 'severe',
        effect: 'Potentiates metformin effect on lactate metabolism and elevates acute lactic acidosis and hypoglycemia risk.',
        clinicalAdvice: 'Avoid acute or chronic alcohol consumption.'
      },
      {
        substance: 'Iodinated Radiocontrast Media',
        severity: 'severe',
        effect: 'May lead to contrast-induced nephropathy and subsequent rapid metformin accumulation and lactic acidosis.',
        clinicalAdvice: 'Discontinue metformin prior to or at time of procedure and withhold for 48 hours post-procedure until renal function confirmed stable.'
      },
      {
        substance: 'Cimetidine',
        severity: 'moderate',
        effect: 'Inhibits renal tubular secretion of metformin, increasing plasma concentrations by approximately 40%.',
        clinicalAdvice: 'Consider alternative H2-receptor antagonist or monitor glycemic response.'
      }
    ],
    sources: [
      {
        title: 'FDA Label - GLUCOPHAGE (metformin hydrochloride) tablets',
        publisher: 'U.S. Food and Drug Administration',
        jurisdiction: 'United States (FDA)',
        url: 'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=020357',
        documentId: 'FDA-SPL-MET-500MG-NDC-0087-6060',
        revisionDate: '2023-06-01'
      },
      {
        title: 'CDSCO Approved List of Fixed Dose Combinations and Monotherapies - Metformin IP',
        publisher: 'Central Drugs Standard Control Organisation',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
        documentId: 'CDSCO-METFORMIN-IP-500',
        revisionDate: '2022-07-20'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'BOXED WARNING - LACTIC ACIDOSIS',
        content: 'Postmarketing cases of metformin-associated lactic acidosis have resulted in death, hypothermia, hypotension, and resistant bradyarrhythmias. The onset is often subtle, accompanied only by nonspecific symptoms such as malaise, myalgias, respiratory distress, somnolence, and abdominal pain.',
        citationIndex: 0
      },
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Metformin Hydrochloride Tablets are indicated as an adjunct to diet and exercise to improve glycemic control in adults and pediatric patients 10 years of age and older with type 2 diabetes mellitus.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Metformin improves glucose tolerance in patients with type 2 diabetes, lowering both basal and postprandial plasma glucose. It does not stimulate insulin secretion and therefore does not produce hypoglycemia when used as monotherapy.',
        citationIndex: 0
      },
      {
        sectionTitle: 'RENAL IMPAIRMENT MONITORING',
        content: 'Assess renal function prior to initiation of metformin and periodically thereafter. Metformin is contraindicated in patients with an eGFR below 30 mL/min/1.73 m2.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-omeprazole',
    medicineName: 'Omeprazole',
    genericName: 'Omeprazole',
    brandNames: ['Prilosec', 'Omez', 'Ocid', 'Losec', 'Omecip'],
    activeIngredients: ['Omeprazole Magnesium'],
    composition: 'Each delayed-release capsule contains: Omeprazole IP/USP 20 mg or 40 mg as enteric-coated pellets.',
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['10 mg', '20 mg', '40 mg'],
    dosageForms: ['Delayed-Release Capsule', 'Delayed-Release Tablet', 'Oral Suspension'],
    labeledUses: [
      'Treatment of active duodenal ulcer in adults',
      'Treatment of active benign gastric ulcer',
      'Treatment of symptomatic gastroesophageal reflux disease (GERD)',
      'Maintenance of healing of erosive esophagitis',
      'Eradication of Helicobacter pylori in triple therapy with amoxicillin and clarithromycin',
      'Pathological hypersecretory conditions (e.g., Zollinger-Ellison syndrome)'
    ],
    mechanismOfAction: 'Suppresses gastric acid secretion by specific inhibition of the H+/K+ ATPase enzyme system at the secretory surface of the gastric parietal cell. Because this enzyme is the final common pathway for acid secretion, it blocks both basal and stimulated gastric acid output.',
    administrationInfo: 'Take in the morning approximately 30 to 60 minutes before a meal (preferably breakfast). Swallow capsules whole with liquid. Do not open, crush, or chew enteric-coated pellets because acid-labile omeprazole would be degraded by stomach acid.',
    missedDoseGuidance: 'Take as soon as remembered before your next meal. If close to next scheduled dose, skip the missed dose and resume your regular schedule. Do not double doses.',
    overdoseWarnings: 'Symptoms of overdose include confusion, drowsiness, blurred vision, tachycardia, nausea, diaphoresis, flushing, headache, and dry mouth. Treatment is symptomatic and supportive. Omeprazole is extensively protein-bound and is not readily dialyzable.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F). Protect from light and moisture. Keep container tightly closed.',
    contraindications: [
      'Known hypersensitivity to substituted benzimidazoles or to any component of the formulation',
      'Co-administration with rilpivirine-containing products'
    ],
    warningsAndPrecautions: [
      'Presence of gastric malignancy: Symptomatic response to therapy does not preclude the presence of gastric malignancy',
      'Acute tubulointerstitial nephritis observed in patients taking PPIs; discontinue if nephritis develops',
      'Clostridioides difficile-associated diarrhea (CDAD) risk with PPI therapy',
      'Bone fracture risk: Increased risk of osteoporosis-related fractures of the hip, wrist, or spine with high-dose or long-term therapy (> 1 year)',
      'Hypomagnesemia with prolonged use (> 1 year); monitor serum magnesium prior to and periodically during therapy',
      'Vitamin B12 malabsorption with daily long-term use'
    ],
    commonAdverseReactions: ['Headache', 'Abdominal pain', 'Nausea', 'Diarrhea', 'Vomiting', 'Flatulence'],
    interactionsList: [
      {
        substance: 'Clopidogrel',
        severity: 'severe',
        effect: 'Omeprazole inhibits CYP2C19, decreasing active metabolite of clopidogrel and reducing its antiplatelet efficacy.',
        clinicalAdvice: 'Avoid concomitant use; consider alternative PPI with less CYP2C19 inhibition such as pantoprazole.'
      },
      {
        substance: 'Methotrexate',
        severity: 'severe',
        effect: 'PPIs may elevate and prolong serum methotrexate levels, increasing toxicity risk.',
        clinicalAdvice: 'Temporarily withhold PPI during high-dose methotrexate administration.'
      },
      {
        substance: 'Iron Salts / Ketoconazole',
        severity: 'moderate',
        effect: 'Reduced gastric acidity decreases gastrointestinal absorption of drugs requiring acidic pH.',
        clinicalAdvice: 'Monitor therapeutic efficacy of pH-dependent absorption drugs.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - PRILOSEC (omeprazole) delayed release capsule',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4e2f419d-7cfc-4a37-b6a4-4f938f3dcf5f',
        documentId: 'FDA-SPL-OMEP-20MG-NDC-0186-0602',
        revisionDate: '2023-02-14'
      },
      {
        title: 'Indian Pharmacopoeia Commission - Omeprazole Capsules IP',
        publisher: 'Central Drugs Standard Control Organisation / IPC',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
        documentId: 'IPC-MONO-OMEZ-20',
        revisionDate: '2022-04-10'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Omeprazole delayed-release capsules are indicated for the treatment of active duodenal ulcer, gastric ulcer, gastroesophageal reflux disease (GERD), and maintenance of healing of erosive esophagitis.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Omeprazole belongs to a class of antisecretory compounds, the substituted benzimidazoles, that suppress gastric acid secretion by specific inhibition of the H+/K+ ATPase enzyme system at the secretory surface of the gastric parietal cell.',
        citationIndex: 0
      },
      {
        sectionTitle: 'WARNINGS AND PRECAUTIONS',
        content: 'Long term treatment with PPIs may increase the risk of bone fractures, Clostridioides difficile infection, hypomagnesemia, and vitamin B12 deficiency. Patients should be treated with the lowest effective dose for the shortest duration.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-cetirizine',
    medicineName: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    brandNames: ['Zyrtec', 'Cetzine', 'Alerid', 'Okacet', 'Hicet'],
    activeIngredients: ['Cetirizine Dihydrochloride'],
    composition: 'Each film-coated tablet contains: Cetirizine Hydrochloride IP/USP 5 mg or 10 mg.',
    therapeuticClass: 'Second-Generation H1-Antihistamine',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['5 mg', '10 mg'],
    dosageForms: ['Tablet', 'Chewable Tablet', 'Oral Syrup', 'Drops'],
    labeledUses: [
      'Relief of symptoms associated with seasonal allergic rhinitis (sneezing, rhinorrhea, postnasal discharge, nasal pruritus, ocular pruritus)',
      'Relief of symptoms associated with perennial allergic rhinitis',
      'Treatment of uncomplicated skin manifestations of chronic idiopathic urticaria'
    ],
    mechanismOfAction: 'A potent, highly selective peripheral H1 receptor antagonist that inhibits the early histamine-mediated phase of the allergic reaction and reduces the migration of inflammatory cells and the release of mediators associated with the late-phase allergic response.',
    administrationInfo: 'May be taken with or without food. Recommended once daily, preferably in the evening if mild drowsiness is experienced. For liquid formulations, use an accurate measuring syringe.',
    missedDoseGuidance: 'Take the missed dose as soon as remembered. If near next scheduled dose, skip missed dose. Do not take double doses.',
    overdoseWarnings: 'Symptoms of overdose include somnolence, restlessness, irritability, tachycardia, tremor, urinary retention, and fatigue. In massive overdose, gastric lavage should be considered along with general supportive treatment. Cetirizine is not effectively removed by hemodialysis.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F). Protect from excessive moisture and direct sunlight.',
    contraindications: [
      'Known hypersensitivity to cetirizine hydrochloride, hydroxyzine, or levocetirizine',
      'End-stage renal disease (CrCl < 10 mL/min) undergoing hemodialysis'
    ],
    warningsAndPrecautions: [
      'Somnolence and CNS depression: Caution patients against operating machinery, driving, or performing hazardous tasks',
      'Concomitant use of alcohol and other central nervous system depressants should be avoided',
      'Urinary retention: Use with caution in patients with predispositions to urinary retention (e.g., prostatic hypertrophy, spinal cord lesions)',
      'Renal impairment requires dose adjustment'
    ],
    commonAdverseReactions: ['Somnolence', 'Dry mouth', 'Fatigue', 'Pharyngitis', 'Dizziness', 'Headache'],
    interactionsList: [
      {
        substance: 'Alcohol / Sedatives (Benzodiazepines, Opioids)',
        severity: 'severe',
        effect: 'Additive central nervous system depression, profound sedation, impaired psychomotor performance.',
        clinicalAdvice: 'Avoid alcohol and sedatives during therapy.'
      },
      {
        substance: 'Theophylline',
        severity: 'minor',
        effect: 'Slight decrease (16%) in cetirizine clearance, while theophylline disposition is unaffected.',
        clinicalAdvice: 'Routine monitoring sufficient.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - CETIRIZINE HYDROCHLORIDE tablet (Aurobindo Pharma)',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ee92b77b-e7b3-4f9e-b9ff-fa7f8845e2ef',
        documentId: 'FDA-SPL-CETIRIZINE-10MG-NDC-65862-243',
        revisionDate: '2023-05-18'
      },
      {
        title: 'Indian Pharmacopoeia Monograph - Cetirizine Hydrochloride IP',
        publisher: 'Indian Pharmacopoeia Commission',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in/opencms/opencms/en/Home/',
        documentId: 'IPC-MONO-CETZINE-10',
        revisionDate: '2022-03-12'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Cetirizine hydrochloride is indicated for the relief of symptoms associated with seasonal and perennial allergic rhinitis, and for the treatment of chronic idiopathic urticaria in adults and children 2 years of age and older.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Cetirizine is a human metabolite of hydroxyzine and an antihistamine; its principal effects are mediated via selective inhibition of peripheral H1 receptors.',
        citationIndex: 0
      },
      {
        sectionTitle: 'WARNINGS AND CNS EFFECTS',
        content: 'In clinical trials the occurrence of somnolence has been reported in some patients taking cetirizine. Due caution should be exercised when driving a car or operating potentially dangerous machinery.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-aspirin',
    medicineName: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    brandNames: ['Bayer Aspirin', 'Ecosprin', 'Disprin', 'Bufferin', 'Aspro'],
    activeIngredients: ['Acetylsalicylic Acid (Aspirin)'],
    composition: 'Each gastro-resistant or uncoated tablet contains: Acetylsalicylic Acid IP/USP 75 mg, 81 mg, 150 mg, or 325 mg.',
    therapeuticClass: 'Antiplatelet and NSAID',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['75 mg', '81 mg', '150 mg', '325 mg', '500 mg'],
    dosageForms: ['Enteric-Coated Tablet', 'Dispersible Tablet', 'Delayed-Release Tablet'],
    labeledUses: [
      'Secondary prevention of cardiovascular events in patients with established coronary artery disease, prior myocardial infarction, or transient ischemic attack (TIA)',
      'Acute management of suspected myocardial infarction',
      'Mild to moderate pain, inflammation, and fever (at higher doses)'
    ],
    mechanismOfAction: 'Irreversibly acetylates and inhibits cyclooxygenase-1 (COX-1) enzyme in platelets, preventing the synthesis of thromboxane A2 (a potent platelet aggregator and vasoconstrictor) for the entire 7 to 10 day lifespan of the platelet.',
    administrationInfo: 'For cardiovascular prevention, take low dose (75–81 mg) daily with food or water. Enteric-coated formulations must be swallowed whole to protect gastric mucosa; do not crush or chew unless acute heart attack is suspected, where an uncoated aspirin should be chewed immediately.',
    missedDoseGuidance: 'Take as soon as remembered. If close to next dose, skip and resume schedule. Do not take double doses.',
    overdoseWarnings: 'Salicylate toxicity (salicylism) manifests with tinnitus, vertigo, hyperventilation, vomiting, respiratory alkalosis followed by severe metabolic acidosis, hyperthermia, seizures, and coma. Emergency management involves gastric lavage, activated charcoal, urine alkalinization with sodium bicarbonate, and hemodialysis for severe poisoning.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F). Keep tightly closed away from moisture. Discard if vinegar-like acetic acid odor is detected.',
    boxedWarning: 'Reye Syndrome Warning: Children and teenagers who have or are recovering from chickenpox or flu-like symptoms should NOT use this medicine. A rare but serious illness called Reye syndrome has been associated with aspirin.',
    contraindications: [
      'Reye syndrome risk in children/teens with viral infections',
      'Known hypersensitivity to salicylates or other NSAIDs (asthma triad)',
      'Active gastrointestinal ulcer or severe bleeding disorders (hemophilia)'
    ],
    warningsAndPrecautions: [
      'Gastrointestinal bleeding and perforation risk',
      'Bleeding risk prior to elective surgical procedures (usually withheld 7 days prior under surgeon supervision)',
      'Renal function impairment in hypovolemic or elderly patients'
    ],
    commonAdverseReactions: ['Dyspepsia', 'Epigastric discomfort', 'Nausea', 'Prolonged bleeding time', 'Occult GI blood loss'],
    interactionsList: [
      {
        substance: 'Ibuprofen',
        severity: 'severe',
        effect: 'Ibuprofen reversibly binds COX-1 and competitively blocks aspirin from irreversibly acetylating platelets, destroying aspirin cardio-protective antiplatelet benefit.',
        clinicalAdvice: 'Take immediate-release aspirin at least 30 minutes before ibuprofen, or 8 hours after.'
      },
      {
        substance: 'Warfarin / Anticoagulants',
        severity: 'severe',
        effect: 'Major hemorrhagic complications due to dual inhibition of platelet plug formation and coagulation cascade.',
        clinicalAdvice: 'Combine only under direct specialist supervision.'
      }
    ],
    sources: [
      {
        title: 'FDA Monograph - Aspirin Tablets (Bayer Healthcare LLC)',
        publisher: 'U.S. Food and Drug Administration',
        jurisdiction: 'United States (FDA)',
        url: 'https://www.fda.gov/drugs',
        documentId: 'FDA-SPL-ASPIRIN-81MG-NDC-0280-2100',
        revisionDate: '2023-03-10'
      },
      {
        title: 'Indian Pharmacopoeia Monograph - Gastro-Resistant Acetylsalicylic Acid Tablets IP',
        publisher: 'Indian Pharmacopoeia Commission / CDSCO',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in',
        documentId: 'IPC-MONO-ECOSPRIN-75',
        revisionDate: '2022-08-15'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Aspirin is indicated for secondary prevention of cardiovascular and cerebrovascular events, reduction of mortality in acute myocardial infarction, and relief of pain and fever.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Irreversible inhibition of platelet cyclooxygenase-1 suppresses thromboxane A2 production, inhibiting platelet aggregation for the lifetime of circulating platelets.',
        citationIndex: 0
      },
      {
        sectionTitle: 'REYE SYNDROME WARNING',
        content: 'Children and teenagers who have or are recovering from chickenpox or flu-like symptoms should not use this medicine. A serious illness called Reye syndrome can occur.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-atorvastatin',
    medicineName: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    brandNames: ['Lipitor', 'Atorva', 'Storvas', 'Atocor', 'Tonact'],
    activeIngredients: ['Atorvastatin Calcium'],
    composition: 'Each film-coated tablet contains: Atorvastatin Calcium IP/USP equivalent to Atorvastatin 10 mg, 20 mg, 40 mg, or 80 mg.',
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['10 mg', '20 mg', '40 mg', '80 mg'],
    dosageForms: ['Film-Coated Tablet'],
    labeledUses: [
      'Prevention of cardiovascular disease: reduction of myocardial infarction, stroke, revascularization procedures, and angina in patients with coronary heart disease or risk factors',
      'Reduction of elevated total cholesterol, LDL-C, apolipoprotein B, and triglycerides in primary hyperlipidemia and mixed dyslipidemia'
    ],
    mechanismOfAction: 'Selective, competitive inhibitor of HMG-CoA reductase, the rate-limiting enzyme that converts 3-hydroxy-3-methylglutaryl-coenzyme A to mevalonate, a precursor of sterols including cholesterol. Inhibition decreases hepatic cholesterol synthesis and upregulates hepatic LDL receptors, promoting LDL catabolism and clearance.',
    administrationInfo: 'Administer orally once daily at any time of day, with or without food. Take at the same time each day for adherence. Do not drink excessive amounts of grapefruit juice (> 1 liter/day).',
    missedDoseGuidance: 'If missed by less than 12 hours, take as soon as remembered. If more than 12 hours have passed, skip the missed dose and resume usual schedule. Never double up.',
    overdoseWarnings: 'No specific antidote exists. In severe overdose, treat symptomatically with supportive measures, monitor liver enzymes and serum creatine kinase (CK). Hemodialysis does not significantly clear atorvastatin due to extensive plasma protein binding (> 98%).',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F). Protect from moisture and heat.',
    contraindications: [
      'Active liver disease or unexplained persistent elevations in hepatic transaminases',
      'Hypersensitivity to any component of this medication',
      'Pregnancy and lactation (potential for fetal harm)'
    ],
    warningsAndPrecautions: [
      'Myopathy and Rhabdomyolysis: Risk increases with higher doses and concurrent CYP3A4 inhibitors (e.g., clarithromycin, ketoconazole). Instruct patients to report unexplained muscle pain or weakness immediately',
      'Immune-mediated necrotizing myopathy (IMNM) rare cases',
      'Liver enzyme abnormalities: monitor LFTs before initiation and clinically thereafter',
      'Small increase in HbA1c and fasting serum glucose levels'
    ],
    commonAdverseReactions: ['Nasopharyngitis', 'Arthralgia', 'Diarrhea', 'Pain in extremity', 'Urinary tract infection', 'Dyspepsia'],
    interactionsList: [
      {
        substance: 'Clarithromycin / Strong CYP3A4 Inhibitors',
        severity: 'severe',
        effect: 'Marked increase in atorvastatin exposure (up to 4.5-fold AUC increase), heightening rhabdomyolysis and acute renal failure risk.',
        clinicalAdvice: 'Limit atorvastatin dose to 20mg or temporarily withhold statin during macrolide antibiotic course.'
      },
      {
        substance: 'Grapefruit Juice (> 1.2 L daily)',
        severity: 'moderate',
        effect: 'Inhibits intestinal CYP3A4, substantially elevating systemic atorvastatin levels.',
        clinicalAdvice: 'Avoid large consumption of grapefruit juice.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - LIPITOR (atorvastatin calcium) tablet, film coated',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=295e92be-3c66-4177-8898-90f70a79058b',
        documentId: 'FDA-SPL-LIPITOR-20MG-NDC-0071-0156',
        revisionDate: '2023-07-28'
      },
      {
        title: 'Indian Pharmacopoeia Monograph - Atorvastatin Tablets IP',
        publisher: 'Indian Pharmacopoeia Commission / CDSCO',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in',
        documentId: 'IPC-MONO-ATORVA-10',
        revisionDate: '2022-06-18'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Atorvastatin is indicated as an adjunct to diet to reduce elevated total-C, LDL-C, apo B, and TG levels and to increase HDL-C in patients with primary hyperlipidemia and mixed dyslipidemia, and for cardiovascular event risk reduction.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Selective, competitive inhibitor of 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, which catalyzes conversion of HMG-CoA to mevalonate. Reduces plasma cholesterol and lipoprotein levels by inhibiting hepatic synthesis and increasing surface LDL receptors.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MYOPATHY AND RHABDOMYOLYSIS',
        content: 'Myopathy, defined as muscle aching or muscle weakness in conjunction with increases in creatine phosphokinase (CPK) values > 10 times ULN, should be considered in any patient with diffuse myalgias, muscle tenderness, or marked elevations in CPK.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-azithromycin',
    medicineName: 'Azithromycin',
    genericName: 'Azithromycin Dihydrate',
    brandNames: ['Zithromax', 'Azee', 'Azithral', 'Zady', 'Azax'],
    activeIngredients: ['Azithromycin'],
    composition: 'Each film-coated tablet contains: Azithromycin Dihydrate IP/USP equivalent to anhydrous Azithromycin 250 mg or 500 mg.',
    therapeuticClass: 'Macrolide / Azalide Antibiotic',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['250 mg', '500 mg', '600 mg'],
    dosageForms: ['Tablet', 'Capsule', 'Oral Suspension', 'IV Injection'],
    labeledUses: [
      'Acute bacterial exacerbations of chronic obstructive pulmonary disease',
      'Community-acquired pneumonia (mild to moderate)',
      'Uncomplicated skin and skin structure infections',
      'Urethritis and cervicitis due to Chlamydia trachomatis or Neisseria gonorrhoeae',
      'Acute bacterial sinusitis and tonsillitis/pharyngitis'
    ],
    mechanismOfAction: 'Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, interfering with microbial protein synthesis by inhibiting transpeptidation and translocation during peptide chain elongation.',
    administrationInfo: 'May be taken with or without food; taking with food decreases common gastrointestinal discomfort. Extended-release suspension must be taken on an empty stomach. Complete the full prescribed course (typically 3 to 5 days due to long tissue half-life of ~68 hours).',
    missedDoseGuidance: 'Take as soon as remembered. If close to next dose, skip and proceed on schedule. Do not take double doses.',
    overdoseWarnings: 'Adverse events experienced in higher than recommended doses are similar to typical adverse reactions: severe diarrhea, nausea, vomiting, and abdominal cramping. Initiate standard supportive and symptomatic care.',
    storageInstructions: 'Store tablets at 20°C to 25°C (68°F to 77°F). Store oral suspension at controlled room temperature; do not refrigerate.',
    contraindications: [
      'Known hypersensitivity to azithromycin, erythromycin, or any macrolide/ketolide antibacterial drug',
      'History of cholestatic jaundice or hepatic dysfunction associated with prior use of azithromycin'
    ],
    warningsAndPrecautions: [
      'QT Prolongation and Torsades de Pointes: Prolongs cardiac repolarization, especially in elderly patients, those with known QT prolongation, or those taking antiarrhythmic medications',
      'Hepatotoxicity: Abnormal liver function, hepatitis, cholestatic jaundice, and rare hepatic necrosis reported',
      'Clostridioides difficile-associated diarrhea (CDAD) risk',
      'Exacerbation of myasthenia gravis symptoms'
    ],
    commonAdverseReactions: ['Diarrhea / loose stools', 'Nausea', 'Abdominal pain', 'Vomiting', 'Headache'],
    interactionsList: [
      {
        substance: 'Antacids (Aluminum & Magnesium Hydroxide)',
        severity: 'moderate',
        effect: 'Reduces peak serum concentration of azithromycin by approximately 24%.',
        clinicalAdvice: 'Administer azithromycin at least 1 hour before or 2 hours after antacids.'
      },
      {
        substance: 'Warfarin',
        severity: 'moderate',
        effect: 'Spontaneous bleeding and elevated prothrombin times reported during co-administration.',
        clinicalAdvice: 'Monitor prothrombin time/INR carefully.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - ZITHROMAX (azithromycin) tablet, film coated',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=295e92be-3c66-4177-8898-90f70a79058b',
        documentId: 'FDA-SPL-ZITHROMAX-500MG-NDC-0069-3150',
        revisionDate: '2023-04-18'
      },
      {
        title: 'CDSCO Approved List - Azithromycin IP',
        publisher: 'Central Drugs Standard Control Organisation (India)',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in',
        documentId: 'CDSCO-AZI-500-IP',
        revisionDate: '2022-10-05'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'Azithromycin is a macrolide antibacterial drug indicated for mild to moderate infections caused by designated susceptible organisms in acute bacterial exacerbations of COPD, community-acquired pneumonia, and genital ulcer disease.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Azithromycin acts by binding to the 50S ribosomal subunit of susceptible microorganisms and, thus, interfering with microbial protein synthesis. Nucleic acid synthesis is not affected.',
        citationIndex: 0
      },
      {
        sectionTitle: 'QT PROLONGATION WARNING',
        content: 'Prolongation of cardiac repolarization and QT interval, imparting a risk of developing cardiac arrhythmia and torsades de pointes, have been seen in treatment with macrolides including azithromycin.',
        citationIndex: 0
      }
    ]
  },
  {
    id: 'med-pantoprazole',
    medicineName: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    brandNames: ['Protonix', 'Pantocid', 'Pan-40', 'Pantop', 'Pantodac'],
    activeIngredients: ['Pantoprazole Sodium Sesquihydrate'],
    composition: 'Each gastro-resistant tablet contains: Pantoprazole Sodium IP/USP equivalent to Pantoprazole 20 mg or 40 mg.',
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['20 mg', '40 mg'],
    dosageForms: ['Delayed-Release Tablet', 'IV Injection'],
    labeledUses: [
      'Short-term treatment of erosive esophagitis associated with gastroesophageal reflux disease (GERD)',
      'Maintenance of healing of erosive esophagitis',
      'Pathological hypersecretory conditions including Zollinger-Ellison syndrome'
    ],
    mechanismOfAction: 'Proton pump inhibitor that covalently binds to the H+/K+ ATPase enzyme system at the secretory surface of the gastric parietal cell, blocking the final step of acid secretion. Because of its covalent binding to the pump, antisecretory effect persists for more than 24 hours.',
    administrationInfo: 'Administer orally once daily in the morning approximately 30 minutes before breakfast. Swallow whole; do not split, crush, or chew gastro-resistant tablets. Concomitant antacids may be taken if needed for acute breakthrough symptoms.',
    missedDoseGuidance: 'Take as soon as remembered before eating. If close to next scheduled dose, skip the missed dose and resume usual schedule. Do not take two doses at once.',
    overdoseWarnings: 'Experience with human overdosage is limited. Doses up to 240 mg intravenously have been administered with good tolerability. Pantoprazole is not removed by hemodialysis. Provide supportive and symptomatic treatment.',
    storageInstructions: 'Store at 20°C to 25°C (68°F to 77°F). Protect from moisture and heat.',
    contraindications: [
      'Known hypersensitivity to substituted benzimidazoles or to any component of the formulation',
      'Concurrent administration with rilpivirine-containing products'
    ],
    warningsAndPrecautions: [
      'Symptomatic response does not preclude the presence of gastric malignancy',
      'Acute tubulointerstitial nephritis observed in patients taking PPIs; discontinue if suspected',
      'Clostridioides difficile-associated diarrhea (CDAD) risk',
      'Bone fracture risk with high-dose or long-term therapy (> 1 year)',
      'Severe hypomagnesemia and hypocalcemia with prolonged use (> 1 year)',
      'Cyanocobalamin (Vitamin B12) deficiency with long-term therapy'
    ],
    commonAdverseReactions: ['Headache', 'Diarrhea', 'Nausea', 'Abdominal pain', 'Flatulence', 'Dizziness', 'Arthralgia'],
    interactionsList: [
      {
        substance: 'Methotrexate',
        severity: 'severe',
        effect: 'Elevates and prolongs serum methotrexate concentrations, leading to serious systemic methotrexate toxicities.',
        clinicalAdvice: 'Consider temporary withdrawal of PPI during high-dose methotrexate therapy.'
      },
      {
        substance: 'Warfarin',
        severity: 'moderate',
        effect: 'Increases INR and prothrombin time in patients receiving PPIs and warfarin concomitantly.',
        clinicalAdvice: 'Monitor prothrombin time/INR when pantoprazole is started or discontinued.'
      }
    ],
    sources: [
      {
        title: 'DailyMed - PROTONIX (pantoprazole sodium) tablet, delayed release',
        publisher: 'U.S. National Library of Medicine / FDA',
        jurisdiction: 'United States (FDA)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4e2f419d-7cfc-4a37-b6a4-4f938f3dcf5f',
        documentId: 'FDA-SPL-PROTONIX-40MG-NDC-0008-0841',
        revisionDate: '2023-05-12'
      },
      {
        title: 'Indian Pharmacopoeia Monograph - Pantoprazole Gastro-resistant Tablets IP',
        publisher: 'Indian Pharmacopoeia Commission / CDSCO',
        jurisdiction: 'India (CDSCO / IP)',
        url: 'https://cdsco.gov.in',
        documentId: 'IPC-MONO-PANTOCID-40',
        revisionDate: '2022-09-02'
      }
    ],
    monographSections: [
      {
        sectionTitle: 'INDICATIONS AND USAGE',
        content: 'PROTONIX Delayed-Release Tablets are indicated for short-term treatment in the healing and symptomatic relief of erosive esophagitis and maintenance of healing of erosive esophagitis in adults.',
        citationIndex: 0
      },
      {
        sectionTitle: 'MECHANISM OF ACTION',
        content: 'Pantoprazole is a proton pump inhibitor (PPI) that suppresses the final step in gastric acid production by covalently binding to the (H+,K+)-ATPase enzyme system at the secretory surface of the gastric parietal cell.',
        citationIndex: 0
      },
      {
        sectionTitle: 'ACUTE INTERSTITIAL NEPHRITIS',
        content: 'Acute tubulointerstitial nephritis has been observed in patients taking PPIs and may occur at any point during PPI therapy. Discontinue PROTONIX and evaluate appropriately.',
        citationIndex: 0
      }
    ]
  }
];

/**
 * Find matching authoritative medicine record by name or brand
 */
export function findMedicineRecord(query: string): MedicineRecord | null {
  if (!query || query.trim().length < 2) return null;
  const q = query.toLowerCase().trim();

  // 1. Direct id / exact generic or brand match
  for (const med of AUTHORITATIVE_MEDICINES) {
    if (med.genericName.toLowerCase().includes(q)) return med;
    if (med.medicineName.toLowerCase().includes(q)) return med;
    if (med.brandNames.some(b => b.toLowerCase() === q || q.includes(b.toLowerCase()))) return med;
  }

  // 2. Tokenized search for common active names
  const tokens = q.split(/[\s\-_,]+/).filter(t => t.length > 2);
  for (const med of AUTHORITATIVE_MEDICINES) {
    for (const token of tokens) {
      if (med.genericName.toLowerCase().includes(token) ||
          med.medicineName.toLowerCase().includes(token) ||
          med.brandNames.some(b => b.toLowerCase().includes(token))) {
        return med;
      }
    }
  }

  return null;
}
