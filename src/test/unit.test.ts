import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndExtractMedicine,
  extractDosage,
  extractDosageForm,
  GENERIC_PACKAGING_WORDS
} from '../lib/ocrValidation';
import {
  chunkTextWithOverlap,
  cosineSimilarity,
  MedicineVectorIndex,
  tokenize,
  createVector,
  buildVocabulary
} from '../lib/ragEngine';
import { compareMedicationScans } from '../lib/comparison';
import { findMedicineRecord } from '../lib/authoritativeData';
import { interpretTeluguQuestionToRAGQuery, generateTeluguMedExplanation } from '../lib/translations';

// --- OCR Validation Tests ---

test('extractDosage extracts mg, ml, and mcg values', () => {
  assert.equal(extractDosage('Paracetamol Tablets IP 500 mg'), '500 mg');
  assert.equal(extractDosage('Amoxicillin 250mg capsule'), '250 mg');
  assert.equal(extractDosage('Cetirizine 10 mg / 5ml'), '10 mg');
  assert.equal(extractDosage('No dosage here'), null);
});

test('extractDosageForm detects common pharmaceutical formulations', () => {
  assert.equal(extractDosageForm('Metformin Tablets 500mg'), 'Tablet');
  assert.equal(extractDosageForm('Amoxicillin Capsules USP'), 'Capsule');
  assert.equal(extractDosageForm('Cough Syrup with codeine'), 'Syrup');
});

test('validateAndExtractMedicine rejects generic packaging words', () => {
  const genericInput = 'TABLETS IP 500 MG\nSTORE IN A COOL DRY PLACE\nKEEP OUT OF REACH OF CHILDREN\nEXPIRY DATE 12/2027';
  const result = validateAndExtractMedicine(genericInput);
  assert.equal(result.identifiedName, null);
  assert.equal(result.isCertain, false);
  assert.ok(result.rejectionReason?.includes('generic packaging terms'));
});

test('validateAndExtractMedicine identifies valid brand/generic name with dosage', () => {
  const labelText = 'DOLO 650\nParacetamol Tablets IP 650 mg\nManufactured by Micro Labs Ltd\nBatch No: DL982';
  const result = validateAndExtractMedicine(labelText);
  assert.equal(result.identifiedName, 'Dolo');
  assert.equal(result.dosage, '650 mg');
  assert.equal(result.dosageForm, 'Tablet');
  assert.ok(result.confidenceScore >= 0.7);
});

test('validateAndExtractMedicine handles empty or near-empty inputs', () => {
  const result = validateAndExtractMedicine('');
  assert.equal(result.identifiedName, null);
  assert.equal(result.confidenceScore, 0);
  assert.equal(result.isCertain, false);
});

// --- Authoritative Data Lookup Tests ---

test('findMedicineRecord resolves generic and brand synonyms', () => {
  const tylenol = findMedicineRecord('Tylenol');
  assert.ok(tylenol);
  assert.equal(tylenol.id, 'med-paracetamol');

  const dolo = findMedicineRecord('Dolo-650');
  assert.ok(dolo);
  assert.equal(dolo.id, 'med-paracetamol');

  const amox = findMedicineRecord('Amoxicillin');
  assert.ok(amox);
  assert.equal(amox.id, 'med-amoxicillin');

  const nonExistent = findMedicineRecord('XyloFakeDrug12345');
  assert.equal(nonExistent, null);
});

// --- RAG Engine & Vector Search Tests ---

test('chunkTextWithOverlap splits long text with proper overlap', () => {
  const sample = 'First sentence about indications. Second sentence explaining dosage. Third sentence detailing hepatic warning and side effects. Fourth sentence about precautions and contraindications. Fifth sentence concluding the monograph.';
  const chunks = chunkTextWithOverlap(sample, 80, 20);
  assert.ok(chunks.length >= 2, 'Should create multiple chunks');
});

test('cosineSimilarity computes normalized similarity accurately', () => {
  const v1 = [1, 2, 3];
  const v2 = [1, 2, 3];
  assert.ok(Math.abs(cosineSimilarity(v1, v2) - 1.0) < 0.0001, 'Identical vectors should have similarity 1.0');

  const vOrthogonalA = [1, 0, 0];
  const vOrthogonalB = [0, 1, 0];
  assert.equal(cosineSimilarity(vOrthogonalA, vOrthogonalB), 0, 'Orthogonal vectors should have similarity 0');
});

test('MedicineVectorIndex retrieves relevant passages and abstains when irrelevant', () => {
  const index = new MedicineVectorIndex();
  assert.ok(index.getChunkCount() > 5, 'Index should have ingested monograph chunks');

  // Search for fever indication in paracetamol
  const result = index.search('fever and headache relief', 'med-paracetamol', 2);
  assert.equal(result.abstain, false);
  assert.ok(result.matchedChunks.length > 0);
  assert.equal(result.matchedChunks[0].chunk.medicineId, 'med-paracetamol');

  // Wrong medicine rejection test: searching for metformin when targeting paracetamol
  const targetMetforminChunk = result.matchedChunks.find(c => c.chunk.medicineId === 'med-metformin');
  assert.equal(targetMetforminChunk, undefined, 'Must reject wrong medicine chunks');

  // Abstention test: gibberish query
  const gibberishResult = index.search('zzqxw123498 impossible query', 'med-paracetamol', 2);
  assert.equal(gibberishResult.abstain, true);
  assert.ok(gibberishResult.abstentionReason?.includes('abstains'));
});

// --- Comparative Analysis Engine Tests ---

test('compareMedicationScans highlights differences in warnings and organ systems', () => {
  const scansToCompare = [
    {
      id: 'scan-1',
      medicineName: 'Paracetamol',
      genericName: 'Acetaminophen',
      dosage: '500 mg',
      jurisdiction: 'United States (FDA)',
      uses: ['Pain relief', 'Fever reduction'],
      warnings: ['Severe liver damage warning']
    },
    {
      id: 'scan-2',
      medicineName: 'Ibuprofen',
      genericName: 'Ibuprofen',
      dosage: '400 mg',
      jurisdiction: 'United States (FDA)',
      uses: ['Inflammation', 'Pain relief', 'Arthritis'],
      warnings: ['Cardiovascular thrombotic events and gastrointestinal bleeding']
    }
  ];

  const comparison = compareMedicationScans(scansToCompare);
  assert.equal(comparison.items.length, 2);
  assert.ok(comparison.keyDifferences.length >= 3);

  // Paracetamol should have high liver risk
  const paraProfile = comparison.items.find(i => i.medicineName.includes('Paracetamol'));
  assert.ok(paraProfile);
  const liver = paraProfile.organRisks.find(o => o.system === 'Liver (Hepatic)');
  assert.equal(liver?.severity, 'High');

  // Ibuprofen should have high GI risk
  const ibuProfile = comparison.items.find(i => i.medicineName.includes('Ibuprofen'));
  assert.ok(ibuProfile);
  const gi = ibuProfile.organRisks.find(o => o.system === 'Stomach & GI');
  assert.equal(gi?.severity, 'High');

  // Alternating interaction note should exist
  assert.ok(comparison.potentialInteractionNotes.length > 0);
});

// --- Telugu Query Interpretation & Translation Tests ---

test('interpretTeluguQuestionToRAGQuery maps Telugu intent phrases to RAG concepts', () => {
  const queryUses = interpretTeluguQuestionToRAGQuery('ఈ మందు దేనికి ఉపయోగిస్తారు?', 'Paracetamol');
  assert.ok(queryUses.includes('indications'), 'Should map to indications');
  assert.ok(queryUses.includes('Paracetamol'), 'Should preserve medicine name');

  const queryWarnings = interpretTeluguQuestionToRAGQuery('ఈ మందు వల్ల ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?', 'Ibuprofen');
  assert.ok(queryWarnings.includes('warnings') || queryWarnings.includes('precautions'), 'Should map to warnings');

  const queryDosage = interpretTeluguQuestionToRAGQuery('ఎలా తీసుకోవాలి మోతాదు ఎంత?', 'Metformin');
  assert.ok(queryDosage.includes('dosage'), 'Should map to dosage');
});

test('generateTeluguMedExplanation preserves names and warnings without truncation', () => {
  const explanation = generateTeluguMedExplanation(
    'Paracetamol',
    'Acetaminophen',
    'Analgesic and Antipyretic',
    ['Temporary relief of minor aches and pains', 'Reduction of fever'],
    ['Hepatotoxicity with excessive doses'],
    'Liver Warning: Severe liver damage may occur if an adult takes more than 4,000 mg in 24 hours'
  );

  assert.ok(explanation.includes('Paracetamol'));
  assert.ok(explanation.includes('Acetaminophen'));
  assert.ok(explanation.includes('ఉపయోగాలు'));
  assert.ok(explanation.includes('జాగ్రత్తలు'));
  assert.ok(explanation.includes('కాలేయం')); // Liver warning translated accurately
});
