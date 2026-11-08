import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndExtractMedicine } from '../lib/ocrValidation';
import { findMedicineRecord, AUTHORITATIVE_MEDICINES } from '../lib/authoritativeData';
import { compareMedicationScans } from '../lib/comparison';

test('Workflow 1: Identifies Paracetamol blister pack with active ingredients, composition and strength', () => {
  const ocrText = `PARACETAMOL TABLETS IP 500 MG
Brand: Dolo-650 / Crocin
Composition: Paracetamol IP 500mg
Mfg Lic No: 28/UA/2021
Batch: DL8922 Exp: 10/2027
Warning: Taking more than 4,000 mg in 24 hours may cause severe liver damage.`;

  const result = validateAndExtractMedicine(ocrText);
  assert.equal(result.isCertain, true);
  assert.ok(result.confidenceScore >= 0.85);
  assert.ok(result.identifiedName?.toLowerCase().includes('paracetamol') || result.identifiedName?.toLowerCase().includes('dolo'));
  assert.equal(result.dosage, '500 mg');
  assert.equal(result.dosageForm, 'Tablet');
  assert.ok(result.activeIngredients && result.activeIngredients.length > 0);

  const monograph = findMedicineRecord(result.identifiedName || 'Paracetamol');
  assert.ok(monograph, 'Must match verified authoritative monograph');
  assert.ok(monograph.mechanismOfAction && monograph.mechanismOfAction.length > 20);
  assert.ok(monograph.administrationInfo && monograph.administrationInfo.length > 20);
  assert.ok(monograph.missedDoseGuidance && monograph.missedDoseGuidance.length > 20);
  assert.ok(monograph.overdoseWarnings && monograph.overdoseWarnings.length > 20);
  assert.ok(monograph.storageInstructions && monograph.storageInstructions.length > 20);
  assert.ok(monograph.boxedWarning && monograph.boxedWarning.includes('Liver Warning'));
  assert.ok(monograph.sources.length >= 2);
});

test('Workflow 2: Identifies Amoxicillin bottle with antibiotic class and FDA/CDSCO sources', () => {
  const ocrText = `AMOXICILLIN CAPSULES USP 500 MG
Brand: Amoxil
Each capsule contains Amoxicillin Trihydrate equivalent to 500mg amoxicillin.
Rx only. Keep out of reach of children.
Warning: Hypersensitivity to penicillin; risk of anaphylaxis.`;

  const result = validateAndExtractMedicine(ocrText);
  assert.equal(result.isCertain, true);
  assert.equal(result.dosage, '500 mg');
  assert.equal(result.dosageForm, 'Capsule');

  const monograph = findMedicineRecord('Amoxicillin');
  assert.ok(monograph);
  assert.equal(monograph.therapeuticClass, 'Aminopenicillin Beta-Lactam Antibiotic');
  assert.ok(monograph.mechanismOfAction?.includes('peptidoglycan') || monograph.mechanismOfAction?.includes('transpeptidation'));
  assert.ok(monograph.sources.some(s => s.publisher.includes('FDA') || s.publisher.includes('National Library of Medicine')));
});

test('Workflow 3: Identifies Ibuprofen with Boxed Warning and anti-inflammatory class', () => {
  const ocrText = `IBUPROFEN TABLETS USP 200 MG
Brand: Advil / Motrin
Active Ingredient: Ibuprofen 200 mg (NSAID)
Purpose: Pain reliever / fever reducer
Boxed Warning: Cardiovascular thrombotic events and gastrointestinal bleeding risk.`;

  const result = validateAndExtractMedicine(ocrText);
  assert.equal(result.isCertain, true);

  const monograph = findMedicineRecord('Ibuprofen');
  assert.ok(monograph);
  assert.ok(monograph.boxedWarning?.includes('Cardiovascular Thrombotic Events'));
  assert.ok(monograph.interactionsList && monograph.interactionsList.some(i => i.substance.includes('Aspirin')));
});

test('Workflow 4: Unclear generic packaging triggers uncertainty and prevents hallucination', () => {
  const unclearGenericPackaging = `TABLETS IP 500 MG
STORE IN A COOL DRY PLACE
KEEP OUT OF REACH OF CHILDREN
EXPIRY: 12/2026`;

  const result = validateAndExtractMedicine(unclearGenericPackaging);
  assert.equal(result.identifiedName, null, 'Must NOT invent a medicine name');
  assert.equal(result.isCertain, false, 'Must flag uncertainty');
  assert.ok(result.confidenceScore < 0.5);
  assert.ok(result.uncertaintyReason && result.uncertaintyReason.length > 10);
  assert.equal(result.dosage, '500 mg', 'Should still preserve detected strength');
  assert.equal(result.dosageForm, 'Tablet', 'Should still preserve detected dosage form');
});

test('Workflow 5: Blurry handwritten prescription note flags low confidence and requires confirmation', () => {
  const blurryPrescription = `Rx Clinic Dr. S. Rao
Date: 2026-05-12
Cap. .m.x.. 500 .. sig illegible
Signature: Dr. SR (Partially unverified)`;

  const result = validateAndExtractMedicine(blurryPrescription);
  assert.equal(result.isCertain, false, 'Must flag uncertainty when drug name is degraded or blurry');
  assert.ok(result.confidenceScore < 0.75);
});

test('Workflow 6: User confirmation recovers full monograph verification', () => {
  const userConfirmedName = 'Metformin';
  const monograph = findMedicineRecord(userConfirmedName);
  assert.ok(monograph);
  assert.equal(monograph.genericName, 'Metformin Hydrochloride');
  assert.ok(monograph.boxedWarning?.includes('Lactic Acidosis'));
  assert.ok(monograph.mechanismOfAction?.includes('gluconeogenesis') || monograph.mechanismOfAction?.includes('glucose'));
  assert.ok(monograph.administrationInfo?.includes('meals'));
  assert.ok(monograph.storageInstructions?.includes('Store at'));
});

test('Workflow 7: Compares two medications side-by-side highlighting clinical differences and organ risks', () => {
  const itemA = {
    id: 'scan_1',
    medicineName: 'Paracetamol',
    genericName: 'Acetaminophen',
    dosage: '500 mg',
    jurisdiction: 'United States (FDA)'
  };

  const itemB = {
    id: 'scan_2',
    medicineName: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosage: '200 mg',
    jurisdiction: 'United States (FDA)'
  };

  const report = compareMedicationScans([itemA, itemB]);
  assert.ok(report.items.length === 2);
  assert.ok(report.keyDifferences.length >= 2);
  assert.ok(report.safetySummary && report.safetySummary.length > 20);

  const paracetamolItem = report.items.find(i => i.medicineName.includes('Paracetamol'));
  assert.ok(paracetamolItem);
  const liverRisk = paracetamolItem.organRisks.find(r => r.system.includes('Liver'));
  assert.ok(liverRisk);
  assert.equal(liverRisk.severity, 'High');

  const ibuprofenItem = report.items.find(i => i.medicineName.includes('Ibuprofen'));
  assert.ok(ibuprofenItem);
  const giRisk = ibuprofenItem.organRisks.find(r => r.system.includes('Stomach'));
  assert.ok(giRisk);
  assert.equal(giRisk.severity, 'High');
});
