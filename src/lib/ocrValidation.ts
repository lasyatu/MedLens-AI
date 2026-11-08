/**
 * OCR text extraction validation and medicine identity analysis
 * Accurately extracts brand name, generic name, active ingredients, composition, and strength.
 * Flags uncertainty without hallucinating or inventing missing medication data.
 */

import { findMedicineRecord, AUTHORITATIVE_MEDICINES } from './authoritativeData';

// Generic stop-words common on medicine packaging that should NEVER be accepted as medicine identity
export const GENERIC_PACKAGING_WORDS = new Set([
  'TABLET', 'TABLETS', 'CAPSULE', 'CAPSULES', 'SYRUP', 'INJECTION', 'OINTMENT', 'CREAM',
  'GEL', 'DROPS', 'SOLUTION', 'SUSPENSION', 'LOTION', 'PATCH', 'PILL', 'PILLS',
  'EXP', 'EXPIRY', 'EXPIRY DATE', 'MFG', 'MFG DATE', 'BATCH', 'BATCH NO', 'LOT', 'LOT NO',
  'DATE', 'DATES', 'YEAR', 'MONTH', 'DAY', 'TIME', 'USE', 'USES', 'ONLY', 'BEFORE', 'AFTER',
  'B.NO', 'M.R.P', 'MRP', 'RS', 'TAXES', 'INCLUSIVE OF ALL TAXES',
  'STORAGE', 'STORE', 'STORE BELOW', 'PROTECT FROM LIGHT', 'KEEP OUT OF REACH OF CHILDREN',
  'CHILDREN', 'REACH', 'KEEP', 'OUT', 'OF', 'IN', 'A', 'AN', 'AT', 'BY', 'TO', 'COOL', 'DRY', 'PLACE', 'DIRECT', 'SUNLIGHT', 'PROTECT', 'FROM',
  'DOSAGE', 'AS DIRECTED BY THE PHYSICIAN', 'FOR EXTERNAL USE ONLY', 'ORAL USE ONLY',
  'PHYSICIAN', 'DIRECTED', 'EXTERNAL', 'ORAL', 'FOR', 'AND', 'WITH', 'WITHOUT', 'THE',
  'SCHEDULE H', 'SCHEDULE H PRESCRIPTION DRUG', 'WARNING', 'CAUTION', 'PRESCRIPTION',
  'MANUFACTURED BY', 'MARKETED BY', 'PHARMACEUTICALS', 'PVT LTD', 'LTD', 'INC', 'CORP',
  'PHARMA', 'LABORATORIES', 'HEALTHCARE', 'NET CONTENT', 'STRIP', 'BLISTER', 'PACK',
  'USP', 'IP', 'BP', 'EP', 'USP GRADE', 'IP GRADE', 'MG', 'ML', 'MCG', 'GM', 'G', 'IU',
  'EACH', 'FILM', 'COATED', 'UNCOATED', 'DELAYED', 'RELEASE', 'EXTENDED', 'GASTRO', 'RESISTANT'
]);

export interface OCRValidationResult {
  rawText: string;
  identifiedName: string | null;
  brandName?: string | null;
  genericName?: string | null;
  activeIngredients?: string[];
  composition?: string | null;
  strength?: string | null;
  dosage: string | null;
  dosageForm: string | null;
  manufacturer?: string | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  confidenceScore: number; // 0 to 1
  isCertain: boolean;
  rejectionReason?: string;
  uncertaintyReason?: string;
  candidateTokens: string[];
}

/**
 * Clean and normalize text tokens
 */
export function normalizeToken(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
}

/**
 * Extract dosage / strength information (e.g. 500 mg, 10mg, 250mcg, 5ml)
 */
export function extractDosage(text: string): string | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|gm|ml|iu|%)\b/i);
  return match ? `${match[1]} ${match[2].toLowerCase()}` : null;
}

/**
 * Extract dosage form (e.g., tablet, capsule, suspension, oral solution)
 */
export function extractDosageForm(text: string): string | null {
  const forms = [
    'Extended-Release Tablet',
    'Delayed-Release Capsule',
    'Delayed-Release Tablet',
    'Dispersible Tablet',
    'Chewable Tablet',
    'Tablet',
    'Capsule',
    'Syrup',
    'Suspension',
    'Injection',
    'Ointment',
    'Gel',
    'Drops'
  ];
  for (const form of forms) {
    const regex = new RegExp(`\\b${form}s?\\b`, 'i');
    if (regex.test(text)) {
      return form;
    }
  }
  return null;
}

/**
 * Extract expiry date from text
 */
export function extractExpiryDate(text: string): string | null {
  const match = text.match(/\b(?:EXP|EXPIRY|EXP\.?\s*DATE)\s*[:.-]?\s*([0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3,9}\s*[0-9]{2,4})\b/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract batch number from text
 */
export function extractBatchNumber(text: string): string | null {
  const match = text.match(/\b(?:BATCH|LOT|B\.?\s*NO|LOT\.?\s*NO)\s*[:.-]?\s*([A-Za-z0-9\-]+)\b/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract manufacturer from text
 */
export function extractManufacturer(text: string): string | null {
  const match = text.match(/\b(?:MFG BY|MANUFACTURED BY|MARKETED BY|MKT BY)\s*[:.-]?\s*([A-Za-z0-9\s.,&]+?)(?:\n|$|\bLIC\b|\bEXP\b)/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract composition line from text
 */
export function extractComposition(text: string): string | null {
  const match = text.match(/\b(?:COMPOSITION|EACH\s+(?:UNCOATED|FILM-COATED|TABLET|CAPSULE)\s+CONTAINS)\s*[:.-]?\s*([^\n\r]+)/i);
  return match ? match[0].trim() : null;
}

/**
 * Validate OCR text and determine medicine identity
 * Rejects generic-word and partial-substring matches
 */
export function validateAndExtractMedicine(rawText: string): OCRValidationResult {
  if (!rawText || rawText.trim().length < 3) {
    return {
      rawText: rawText || '',
      identifiedName: null,
      confidenceScore: 0,
      isCertain: false,
      dosage: null,
      dosageForm: null,
      rejectionReason: 'Extracted text is empty or too short to identify any medicine.',
      uncertaintyReason: 'No readable text was detected on the image.',
      candidateTokens: []
    };
  }

  const cleaned = rawText.trim();
  const dosage = extractDosage(cleaned);
  const dosageForm = extractDosageForm(cleaned);
  const expiryDate = extractExpiryDate(cleaned);
  const batchNumber = extractBatchNumber(cleaned);
  const manufacturer = extractManufacturer(cleaned);
  const composition = extractComposition(cleaned);

  // 1. Direct matching against authoritative records (brand or generic)
  const matchedAuth = findMedicineRecord(cleaned);
  let detectedBrand: string | null = null;
  let detectedGeneric: string | null = null;
  let activeIngredients: string[] = [];

  if (matchedAuth) {
    // Check if a specific brand name is present in raw text
    for (const b of matchedAuth.brandNames) {
      if (new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(cleaned)) {
        detectedBrand = b;
        break;
      }
    }
    detectedGeneric = matchedAuth.genericName;
    activeIngredients = matchedAuth.activeIngredients || [matchedAuth.genericName];
  }

  // Extract candidate lines / words for fallback scoring
  const lines = cleaned.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const candidates: { name: string; score: number }[] = [];

  for (const line of lines) {
    const upperLine = line.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').trim();
    const words = upperLine.split(/\s+/).filter(w => w.length > 1);

    if (words.length === 0) continue;

    // Reject pure generic lines like "TABLETS 500 MG" or "KEEP OUT OF REACH"
    const nonGenericWords = words.filter(w => !GENERIC_PACKAGING_WORDS.has(w));
    if (nonGenericWords.length === 0) {
      continue;
    }

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (GENERIC_PACKAGING_WORDS.has(w) || w.length < 3) continue;
      if (/^\d+$/.test(w)) continue;

      let score = 0.5;
      if (dosage && line.includes(dosage.split(' ')[0])) {
        score += 0.25;
      }
      if (words.length <= 4) {
        score += 0.15;
      }
      if (line === line.toUpperCase()) {
        score += 0.05;
      }

      // If matched authoritative record matches this token (brand or generic), apply boost
      if (matchedAuth && (
        matchedAuth.medicineName.toUpperCase().includes(w) ||
        matchedAuth.genericName.toUpperCase().includes(w) ||
        matchedAuth.brandNames.some(b => b.toUpperCase().includes(w))
      )) {
        score += 0.20;
      }

      candidates.push({ name: w, score: Math.min(score, 0.98) });
    }
  }

  // If no identifiable candidate words were found (e.g. only generic words "TABLETS 500MG")
  if (candidates.length === 0 && !matchedAuth) {
    return {
      rawText: cleaned,
      identifiedName: null,
      brandName: null,
      genericName: null,
      activeIngredients: [],
      composition,
      strength: dosage,
      dosage,
      dosageForm,
      manufacturer,
      expiryDate,
      batchNumber,
      confidenceScore: 0.15,
      isCertain: false,
      rejectionReason: 'All extracted words appear to be generic packaging terms (e.g., dosage form, storage, warnings) without a discernible medicine name.',
      uncertaintyReason: 'The image contains generic packaging terms and strength, but the chemical or brand name is unreadable, cropped, or missing. User confirmation is required.',
      candidateTokens: []
    };
  }

  // Sort candidates
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const primaryName = best
    ? best.name.charAt(0).toUpperCase() + best.name.slice(1).toLowerCase()
    : matchedAuth
      ? matchedAuth.medicineName
      : null;

  const finalConfidence = matchedAuth ? Math.max(0.92, best?.score || 0.9) : (best?.score || 0.5);
  const isCertain = finalConfidence >= 0.75;

  return {
    rawText: cleaned,
    identifiedName: primaryName,
    brandName: detectedBrand || matchedAuth?.brandNames[0] || null,
    genericName: detectedGeneric || matchedAuth?.genericName || primaryName,
    activeIngredients: activeIngredients.length > 0 ? activeIngredients : (primaryName ? [primaryName] : []),
    composition: composition || matchedAuth?.composition || (dosage ? `${primaryName} ${dosage}` : null),
    strength: dosage || matchedAuth?.approvedDosages[0] || null,
    dosage,
    dosageForm: dosageForm || matchedAuth?.dosageForms[0] || null,
    manufacturer,
    expiryDate,
    batchNumber,
    confidenceScore: Math.round(finalConfidence * 100) / 100,
    isCertain,
    uncertaintyReason: isCertain
      ? undefined
      : 'Extraction confidence is below safe regulatory threshold. Please verify the medicine name and strength before clinical review.',
    candidateTokens: Array.from(new Set(candidates.map(c => c.name)))
  };
}
