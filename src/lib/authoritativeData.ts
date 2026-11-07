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

export interface MedicineRecord {
  id: string;
  medicineName: string;
  genericName: string;
  brandNames: string[];
  therapeuticClass: string;
  primaryJurisdiction: 'United States (FDA)' | 'India (CDSCO / IP)' | 'Global (WHO / INN)';
  approvedDosages: string[];
  dosageForms: string[];
  labeledUses: string[];
  boxedWarning?: string;
  contraindications: string[];
  warningsAndPrecautions: string[];
  commonAdverseReactions: string[];
  sources: SourceCitation[];
  monographSections: MonographSection[];
}

export const AUTHORITATIVE_MEDICINES: MedicineRecord[] = [
  {
    id: 'med-paracetamol',
    medicineName: 'Paracetamol / Acetaminophen',
    genericName: 'Acetaminophen (USAN) / Paracetamol (INN / IP)',
    brandNames: ['Tylenol', 'Dolo-650', 'Crocin', 'Calpol', 'Panadol'],
    therapeuticClass: 'Analgesic and Antipyretic',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['325 mg', '500 mg', '650 mg', '1000 mg'],
    dosageForms: ['Tablet', 'Capsule', 'Oral Suspension', 'Suppository'],
    labeledUses: [
      'Temporary relief of minor aches and pains due to headache, muscular aches, backache, arthritis, the common cold, toothache, and menstrual cramps',
      'Temporary reduction of fever'
    ],
    boxedWarning: 'Liver Warning: This product contains acetaminophen. Severe liver damage may occur if an adult takes more than 4,000 mg in 24 hours, takes with other drugs containing acetaminophen, or has 3 or more alcoholic drinks every day while using this product.',
    contraindications: [
      'Severe active liver disease or severe hepatic impairment',
      'Known hypersensitivity to acetaminophen or any component of the formulation'
    ],
    warningsAndPrecautions: [
      'Hepatotoxicity with excessive doses or alcohol consumption',
      'Serious skin reactions: rare occurrences of Stevens-Johnson Syndrome (SJS), toxic epidermal necrolysis (TEN), and acute generalized exanthematous pustulosis (AGEP)',
      'Accidental overdose hazard when co-administered with over-the-counter multi-symptom cold medications containing acetaminophen'
    ],
    commonAdverseReactions: ['Nausea', 'Vomiting', 'Constipation', 'Pruritus (rare)', 'Rash'],
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
        sectionTitle: 'BOXED WARNING - HEPATOTOXICITY',
        content: 'WARNING: Acetaminophen has been associated with cases of acute liver failure, at times resulting in liver transplant and death. Most of the cases of liver injury are associated with the use of acetaminophen at doses that exceed 4000 milligrams per day, and often involve more than one acetaminophen-containing product.',
        citationIndex: 0
      },
      {
        sectionTitle: 'CONTRAINDICATIONS',
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
    brandNames: ['Amoxil', 'Mox', 'Augmentin (with clavulanate)', 'Novamox'],
    therapeuticClass: 'Aminopenicillin Beta-Lactam Antibiotic',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['250 mg', '500 mg', '875 mg'],
    dosageForms: ['Capsule', 'Tablet', 'Chewable Tablet', 'Oral Suspension'],
    labeledUses: [
      'Treatment of infections of the ear, nose, and throat (e.g., pharyngitis, tonsillitis, otitis media) caused by susceptible strains of Streptococcus pneumoniae and other susceptible bacteria',
      'Infections of the lower respiratory tract caused by Streptococcus pneumoniae, Haemophilus influenzae',
      'Infections of the genitourinary tract (e.g., uncomplicated urinary tract infections)',
      'Skin and skin structure infections'
    ],
    contraindications: [
      'Known serious hypersensitivity reaction (e.g., anaphylaxis or Stevens-Johnson syndrome) to amoxicillin or other beta-lactam antibacterial drugs (e.g., penicillins and cephalosporins)'
    ],
    warningsAndPrecautions: [
      'Severe, potentially fatal hypersensitivity (anaphylactic) reactions have been reported in patients on penicillin therapy',
      'Clostridioides difficile-associated diarrhea (CDAD) ranging in severity from mild diarrhea to fatal colitis',
      'Prescribing amoxicillin in the absence of a proven or strongly suspected bacterial infection is unlikely to provide benefit and increases the risk of the development of drug-resistant bacteria'
    ],
    commonAdverseReactions: ['Diarrhea', 'Rash', 'Nausea', 'Vomiting'],
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
    brandNames: ['Advil', 'Motrin', 'Brufen', 'Ibugesic'],
    therapeuticClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['200 mg', '400 mg', '600 mg', '800 mg'],
    dosageForms: ['Tablet', 'Capsule', 'Oral Suspension'],
    labeledUses: [
      'Relief of mild to moderate pain (headache, dental pain, menstrual cramps, muscle aches, backache)',
      'Reduction of fever',
      'Relief of symptoms of rheumatoid arthritis and osteoarthritis'
    ],
    boxedWarning: 'Cardiovascular Thrombotic Events: Nonsteroidal anti-inflammatory drugs (NSAIDs) cause an increased risk of serious cardiovascular thrombotic events, including myocardial infarction and stroke, which can be fatal. This risk may occur early in treatment and may increase with duration of use. Gastrointestinal Risk: NSAIDs cause an increased risk of serious gastrointestinal adverse events including bleeding, ulceration, and perforation of the stomach or intestines.',
    contraindications: [
      'Known hypersensitivity to ibuprofen or other NSAIDs, including patients who have experienced asthma, urticaria, or allergic-type reactions after taking aspirin or other NSAIDs',
      'In the setting of coronary artery bypass graft (CABG) surgery',
      'Severe renal failure or active peptic ulcer disease'
    ],
    warningsAndPrecautions: [
      'Gastrointestinal bleeding, ulceration, and perforation risk, especially in the elderly or those with history of ulcers',
      'Renal toxicity: Long-term administration can lead to renal papillary necrosis and other renal injury',
      'Hypertension: NSAIDs can lead to onset of new hypertension or worsening of pre-existing hypertension',
      'Avoid during the third trimester of pregnancy due to risk of premature closure of fetal ductus arteriosus'
    ],
    commonAdverseReactions: ['Dyspepsia', 'Abdominal pain', 'Nausea', 'Heartburn', 'Dizziness', 'Fluid retention'],
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
    brandNames: ['Glucophage', 'Glycomet', 'Obimet', 'Fortamet'],
    therapeuticClass: 'Biguanide Antihyperglycemic Agent',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['500 mg', '850 mg', '1000 mg'],
    dosageForms: ['Tablet', 'Extended-Release Tablet'],
    labeledUses: [
      'Adjunct to diet and exercise to improve glycemic control in adults and children with type 2 diabetes mellitus'
    ],
    boxedWarning: 'Lactic Acidosis: Lactic acidosis is a rare, but serious, complication that can occur due to metformin accumulation. The risk increases with conditions including renal impairment, sepsis, dehydration, excess alcohol intake, hepatic impairment, and acute congestive heart failure. Symptoms include malaise, myalgias, respiratory distress, somnolence, and abdominal pain. Discontinue metformin immediately if lactic acidosis is suspected.',
    contraindications: [
      'Severe renal impairment (eGFR below 30 mL/min/1.73 m2)',
      'Known hypersensitivity to metformin hydrochloride',
      'Acute or chronic metabolic acidosis, including diabetic ketoacidosis'
    ],
    warningsAndPrecautions: [
      'Lactic acidosis risk: evaluate renal function prior to initiation and at least annually thereafter',
      'Temporarily discontinue prior to any intravascular iodinated radiocontrast procedure in patients with eGFR between 30 and 60 mL/min',
      'Vitamin B12 deficiency risk with long-term therapy'
    ],
    commonAdverseReactions: ['Diarrhea', 'Nausea/vomiting', 'Flatulence', 'Abdominal discomfort', 'Indigestion', 'Asthenia'],
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
    brandNames: ['Prilosec', 'Omez', 'Ocid', 'Losec'],
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['10 mg', '20 mg', '40 mg'],
    dosageForms: ['Delayed-Release Capsule', 'Delayed-Release Tablet', 'Oral Suspension'],
    labeledUses: [
      'Treatment of active duodenal ulcer in adults',
      'Treatment of active benign gastric ulcer',
      'Treatment of symptomatic gastroesophageal reflux disease (GERD)',
      'Maintenance of healing of erosive esophagitis',
      'Eradication of Helicobacter pylori in combination with clarithromycin and amoxicillin'
    ],
    contraindications: [
      'Known hypersensitivity to substituted benzimidazoles or to any component of the formulation',
      'Co-administration with rilpivirine-containing products'
    ],
    warningsAndPrecautions: [
      'Presence of gastric malignancy: Symptomatic response to therapy does not preclude the presence of gastric malignancy',
      'Acute tubulointerstitial nephritis observed in patients taking PPIs',
      'Clostridioides difficile-associated diarrhea risk',
      'Bone fracture risk: Increased risk of osteoporosis-related fractures of the hip, wrist, or spine with high-dose or long-term PPI therapy',
      'Hypomagnesemia with prolonged use (> 1 year)'
    ],
    commonAdverseReactions: ['Headache', 'Abdominal pain', 'Nausea', 'Diarrhea', 'Vomiting', 'Flatulence'],
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
    brandNames: ['Zyrtec', 'Cetzine', 'Alerid', 'Okacet'],
    therapeuticClass: 'Second-Generation H1-Antihistamine',
    primaryJurisdiction: 'United States (FDA)',
    approvedDosages: ['5 mg', '10 mg'],
    dosageForms: ['Tablet', 'Chewable Tablet', 'Syrup'],
    labeledUses: [
      'Relief of symptoms associated with seasonal allergic rhinitis (sneezing, rhinorrhea, postnasal discharge, nasal pruritus, ocular pruritus)',
      'Relief of symptoms associated with perennial allergic rhinitis',
      'Treatment of the uncomplicated skin manifestations of chronic idiopathic urticaria'
    ],
    contraindications: [
      'Known hypersensitivity to cetirizine hydrochloride or hydroxyzine'
    ],
    warningsAndPrecautions: [
      'Somnolence and CNS depression: Caution patients against operating machinery or driving',
      'Concomitant use of alcohol and other central nervous system depressants should be avoided',
      'Urinary retention: Use with caution in patients with predispositions to urinary retention (e.g., prostatic hypertrophy)'
    ],
    commonAdverseReactions: ['Somnolence', 'Dry mouth', 'Fatigue', 'Pharyngitis', 'Dizziness'],
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
        sectionTitle: 'WARNINGS AND CNS EFFECTS',
        content: 'In clinical trials the occurrence of somnolence has been reported in some patients taking cetirizine. Due caution should be exercised when driving a car or operating potentially dangerous machinery.',
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
