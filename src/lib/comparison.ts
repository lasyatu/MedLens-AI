/**
 * Comparative analysis engine for multiple past medicine scans
 * Highlights key differences in uses, warnings, contraindications, and organ risks
 */

import { findMedicineRecord, MedicineRecord } from './authoritativeData';

export interface ScanItemForComparison {
  id: string;
  medicineName: string;
  genericName?: string;
  brandName?: string;
  dosage?: string;
  jurisdiction?: string;
  uses?: string[];
  warnings?: string[];
  precautions?: string[];
  createdAt?: string;
}

export interface OrganSystemRisk {
  system: 'Liver (Hepatic)' | 'Kidneys (Renal)' | 'Stomach & GI' | 'Heart & Cardiovascular' | 'Central Nervous (Drowsiness)';
  severity: 'High' | 'Moderate' | 'Low' | 'None Listed';
  explanation: string;
}

export interface MedicationComparisonProfile {
  scanId: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  jurisdiction: string;
  therapeuticClass: string;
  boxedWarning?: string;
  primaryUses: string[];
  uniqueIndications: string[];
  criticalWarnings: string[];
  contraindications: string[];
  organRisks: OrganSystemRisk[];
}

export interface ComparisonReport {
  items: MedicationComparisonProfile[];
  keyDifferences: {
    category: string;
    description: string;
    detailsByMedicine: Record<string, string>;
  }[];
  potentialInteractionNotes: string[];
  safetySummary: string;
}

/**
 * Extract organ risk assessment based on authoritative warnings
 */
function assessOrganRisks(warningsText: string): OrganSystemRisk[] {
  const lower = warningsText.toLowerCase();

  const liverRisk: OrganSystemRisk = {
    system: 'Liver (Hepatic)',
    severity: lower.includes('liver damage') || lower.includes('hepatotoxicity') || lower.includes('acute liver failure')
      ? 'High'
      : lower.includes('hepatic') ? 'Moderate' : 'None Listed',
    explanation: lower.includes('liver damage')
      ? 'Liver toxicity warning present. Overdose or alcohol combination increases risk of acute liver failure.'
      : 'No primary liver toxicity warning noted.'
  };

  const kidneyRisk: OrganSystemRisk = {
    system: 'Kidneys (Renal)',
    severity: lower.includes('renal failure') || lower.includes('renal impairment') || lower.includes('renal toxicity') || lower.includes('lactic acidosis')
      ? 'High'
      : lower.includes('kidney') ? 'Moderate' : 'None Listed',
    explanation: lower.includes('renal') || lower.includes('kidney')
      ? 'Renal monitoring required or kidney injury precaution indicated.'
      : 'No primary renal toxicity warning noted.'
  };

  const giRisk: OrganSystemRisk = {
    system: 'Stomach & GI',
    severity: lower.includes('gastrointestinal bleeding') || lower.includes('ulceration') || lower.includes('perforation')
      ? 'High'
      : lower.includes('nausea') || lower.includes('diarrhea') || lower.includes('dyspepsia') ? 'Moderate' : 'Low',
    explanation: lower.includes('gastrointestinal bleeding')
      ? 'High risk of stomach bleeding, ulceration, or intestinal irritation (common with NSAIDs).'
      : 'Mild gastrointestinal discomfort reported in adverse events.'
  };

  const cardioRisk: OrganSystemRisk = {
    system: 'Heart & Cardiovascular',
    severity: lower.includes('myocardial infarction') || lower.includes('stroke') || lower.includes('cardiovascular thrombotic')
      ? 'High'
      : lower.includes('hypertension') || lower.includes('heart') ? 'Moderate' : 'None Listed',
    explanation: lower.includes('cardiovascular thrombotic')
      ? 'Black box warning for cardiovascular events (heart attack and stroke risk).'
      : 'No primary cardiovascular black box warning.'
  };

  const cnsRisk: OrganSystemRisk = {
    system: 'Central Nervous (Drowsiness)',
    severity: lower.includes('somnolence') || lower.includes('drowsiness') || lower.includes('operating machinery')
      ? 'Moderate'
      : 'None Listed',
    explanation: lower.includes('somnolence') || lower.includes('drowsiness')
      ? 'Causes somnolence/drowsiness. Exercise caution when driving or operating machinery.'
      : 'Non-sedating profile under standard labeled use.'
  };

  return [liverRisk, kidneyRisk, giRisk, cardioRisk, cnsRisk];
}

/**
 * Compare two or more medicine scans and return a structured comparative analysis
 */
export function compareMedicationScans(scans: ScanItemForComparison[]): ComparisonReport {
  if (!scans || scans.length === 0) {
    return {
      items: [],
      keyDifferences: [],
      potentialInteractionNotes: [],
      safetySummary: 'No medicines selected for comparison.'
    };
  }

  const profiles: MedicationComparisonProfile[] = scans.map(scan => {
    // Attempt match with authoritative database
    const medRecord = findMedicineRecord(scan.medicineName || scan.genericName || '');

    const combinedWarnings = [
      ...(scan.warnings || []),
      ...(scan.precautions || []),
      ...(medRecord?.warningsAndPrecautions || []),
      medRecord?.boxedWarning || ''
    ].join(' ');

    const organRisks = assessOrganRisks(combinedWarnings);

    return {
      scanId: scan.id,
      medicineName: scan.medicineName || medRecord?.medicineName || 'Unknown Medicine',
      genericName: scan.genericName || medRecord?.genericName || scan.medicineName,
      dosage: scan.dosage || medRecord?.approvedDosages[0] || 'Standard dosage',
      jurisdiction: scan.jurisdiction || medRecord?.primaryJurisdiction || 'United States (FDA)',
      therapeuticClass: medRecord?.therapeuticClass || 'Therapeutic Agent',
      boxedWarning: medRecord?.boxedWarning,
      primaryUses: scan.uses && scan.uses.length > 0 ? scan.uses : (medRecord?.labeledUses || []),
      uniqueIndications: [],
      criticalWarnings: scan.warnings && scan.warnings.length > 0 ? scan.warnings : (medRecord?.warningsAndPrecautions || []),
      contraindications: medRecord?.contraindications || [],
      organRisks
    };
  });

  // Calculate distinct differences across items
  const keyDifferences: ComparisonReport['keyDifferences'] = [];

  // 1. Therapeutic Class Difference
  const classByMed: Record<string, string> = {};
  profiles.forEach(p => {
    classByMed[p.medicineName] = p.therapeuticClass;
  });
  keyDifferences.push({
    category: 'Therapeutic Class & Mechanism',
    description: 'Distinct pharmacological categories determine how each medicine acts in the human body.',
    detailsByMedicine: classByMed
  });

  // 2. Black Box & Primary Safety Warnings Difference
  const warningsByMed: Record<string, string> = {};
  profiles.forEach(p => {
    warningsByMed[p.medicineName] = p.boxedWarning || p.criticalWarnings[0] || 'Standard precautionary warnings apply.';
  });
  keyDifferences.push({
    category: 'Key Warnings & Safety Alerts',
    description: 'Comparison of high-priority boxed warnings and serious adverse warnings.',
    detailsByMedicine: warningsByMed
  });

  // 3. Primary Target Organ Impact
  const organByMed: Record<string, string> = {};
  profiles.forEach(p => {
    const highRisks = p.organRisks.filter(r => r.severity === 'High');
    organByMed[p.medicineName] = highRisks.length > 0
      ? highRisks.map(r => `${r.system}: ${r.explanation}`).join(' ')
      : 'No high-severity target organ toxicities detected in standard monograph.';
  });
  keyDifferences.push({
    category: 'Target Organ Sensitivity',
    description: 'Specific organ systems (liver, kidney, gastrointestinal tract, cardiovascular) that require monitoring.',
    detailsByMedicine: organByMed
  });

  // 4. Contraindications
  const contraByMed: Record<string, string> = {};
  profiles.forEach(p => {
    contraByMed[p.medicineName] = p.contraindications.length > 0
      ? p.contraindications.join('; ')
      : 'Hypersensitivity to active compound or formulation excipients.';
  });
  keyDifferences.push({
    category: 'Contraindications',
    description: 'Medical conditions under which taking the drug is strictly prohibited or inadvisable.',
    detailsByMedicine: contraByMed
  });

  // Potential cross-medication interaction notices
  const potentialInteractionNotes: string[] = [];
  const names = profiles.map(p => p.medicineName.toLowerCase());

  if (names.some(n => n.includes('ibuprofen')) && names.some(n => n.includes('paracetamol') || n.includes('acetaminophen'))) {
    potentialInteractionNotes.push(
      'Paracetamol and Ibuprofen operate via different metabolic pathways (hepatic vs renal/prostaglandin). While often taken alternately for severe pain, do not exceed daily maximum limits for either agent, and confirm spacing with a pharmacist.'
    );
  }
  if (names.some(n => n.includes('metformin')) && names.some(n => n.includes('ibuprofen'))) {
    potentialInteractionNotes.push(
      'Caution: NSAIDs like Ibuprofen can decrease renal function, which in turn reduces Metformin excretion and elevates the risk of Metformin-induced lactic acidosis. Consult your prescribing physician.'
    );
  }
  if (names.some(n => n.includes('omeprazole')) && names.some(n => n.includes('amoxicillin'))) {
    potentialInteractionNotes.push(
      'Note: Omeprazole and Amoxicillin are frequently combined in triple therapy for Helicobacter pylori eradication, where the PPI increases gastric pH to optimize antibiotic activity.'
    );
  }

  return {
    items: profiles,
    keyDifferences,
    potentialInteractionNotes,
    safetySummary: `Compared ${profiles.length} medications. Each medicine has distinct therapeutic indications, metabolic pathways, and safety warnings. Never combine or alter medications without professional guidance from a doctor or pharmacist.`
  };
}
