/**
 * OCR text extraction validation and medicine identity analysis
 */

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
  'USP', 'IP', 'BP', 'EP', 'USP GRADE', 'IP GRADE', 'MG', 'ML', 'MCG', 'GM', 'G', 'IU'
]);

export interface OCRValidationResult {
  rawText: string;
  identifiedName: string | null;
  confidenceScore: number; // 0 to 1
  isCertain: boolean;
  dosage: string | null;
  dosageForm: string | null;
  rejectionReason?: string;
  candidateTokens: string[];
}

/**
 * Clean and normalize text tokens
 */
export function normalizeToken(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
}

/**
 * Extract dosage information (e.g. 500 mg, 10mg, 250mcg, 5ml)
 */
export function extractDosage(text: string): string | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|gm|ml|iu|%)\b/i);
  return match ? `${match[1]} ${match[2].toLowerCase()}` : null;
}

/**
 * Extract dosage form (e.g., tablet, capsule, suspension, oral solution)
 */
export function extractDosageForm(text: string): string | null {
  const forms = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Ointment', 'Gel', 'Drops', 'Effervescent Tablet', 'Extended-Release Tablet'];
  for (const form of forms) {
    const regex = new RegExp(`\\b${form}s?\\b`, 'i');
    if (regex.test(text)) {
      return form;
    }
  }
  return null;
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
      candidateTokens: []
    };
  }

  const cleaned = rawText.trim();
  const dosage = extractDosage(cleaned);
  const dosageForm = extractDosageForm(cleaned);

  // Extract candidate lines / words
  const lines = cleaned.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const candidates: { name: string; score: number }[] = [];

  for (const line of lines) {
    // Check line against generic stop-words
    const upperLine = line.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').trim();
    const words = upperLine.split(/\s+/).filter(w => w.length > 1);

    if (words.length === 0) continue;

    // Reject pure generic lines like "TABLETS 500 MG" or "KEEP OUT OF REACH"
    const nonGenericWords = words.filter(w => !GENERIC_PACKAGING_WORDS.has(w));
    if (nonGenericWords.length === 0) {
      continue;
    }

    // Single or multi-word potential medicine name
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (GENERIC_PACKAGING_WORDS.has(w) || w.length < 3) continue;
      // Skip numbers
      if (/^\d+$/.test(w)) continue;

      let score = 0.5;
      // If line also has dosage, boost score
      if (dosage && line.includes(dosage.split(' ')[0])) {
        score += 0.25;
      }
      // If line is prominent (short, title-like)
      if (words.length <= 4) {
        score += 0.15;
      }
      // Capitalization bonus
      if (line === line.toUpperCase()) {
        score += 0.05;
      }

      candidates.push({ name: w, score: Math.min(score, 0.95) });
    }
  }

  if (candidates.length === 0) {
    return {
      rawText: cleaned,
      identifiedName: null,
      confidenceScore: 0.1,
      isCertain: false,
      dosage,
      dosageForm,
      rejectionReason: 'All extracted words appear to be generic packaging terms (e.g., dosage form, storage, warnings) without a discernible medicine name.',
      candidateTokens: []
    };
  }

  // Sort by score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // Capitalize properly
  const formattedName = best.name.charAt(0).toUpperCase() + best.name.slice(1).toLowerCase();
  const isCertain = best.score >= 0.75;

  return {
    rawText: cleaned,
    identifiedName: formattedName,
    confidenceScore: Math.round(best.score * 100) / 100,
    isCertain,
    dosage,
    dosageForm,
    candidateTokens: Array.from(new Set(candidates.map(c => c.name)))
  };
}
