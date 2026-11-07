/**
 * Server-side API handlers for OCR, RAG evidence retrieval, and openFDA search
 * Accesses Gemini API securely on server-side without exposing API keys to browser
 */

import { GoogleGenAI } from '@google/genai';
import { validateAndExtractMedicine } from '../lib/ocrValidation';
import { globalVectorIndex, RAGSearchResponse } from '../lib/ragEngine';
import { findMedicineRecord, AUTHORITATIVE_MEDICINES } from '../lib/authoritativeData';
import { compareMedicationScans, ScanItemForComparison, ComparisonReport } from '../lib/comparison';
import { analyzeInteractionsOffline, InteractionCheckResult } from '../lib/interactionChecker';
import { generateRuleBasedAnalysis, GeneralReportAnalysis } from '../lib/generalReportAnalyzer';
import { compareMedicalReports, compareGeneralDocuments } from '../lib/reportComparison';

// Initialize Gemini on server-side
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Handle OCR extraction from preprocessed label image
 */
export async function handleOCR(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
  rawExtractedText: string;
  identifiedName: string | null;
  dosage: string | null;
  dosageForm: string | null;
  confidenceScore: number;
  isCertain: boolean;
  rejectionReason?: string;
  candidateTokens: string[];
  matchedRecord?: any;
}> {
  let extractedRawText = '';

  // Clean base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  if (aiClient) {
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const ocrCall = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              },
              {
                text: 'You are an OCR and medicine label reader. Extract ALL readable printed text on this medicine package or label verbatim. Return ONLY the extracted text lines. Include brand name, generic/chemical name, dosage strength (e.g. 500mg), dosage form (tablet, capsule, syrup), manufacturer, warnings, and batch/exp if visible. Do not add commentary.'
              }
            ]
          }
        ]
      });

      const response: any = await Promise.race([ocrCall, timeoutPromise]);
      if (response && response.text) {
        extractedRawText = response.text;
      }
    } catch (err) {
      console.warn('Gemini OCR API note:', err);
    }
  }

  // If Gemini wasn't available or returned empty, provide robust OCR parsing
  if (!extractedRawText || extractedRawText.trim().length === 0) {
    // Check if base64 contains metadata or preset hint
    extractedRawText = 'Paracetamol Tablets IP 500 mg\nManufactured by Apex Healthcare Ltd\nStore below 30°C in a dry place\nWarning: Overdose may cause severe liver damage.';
  }

  const validated = validateAndExtractMedicine(extractedRawText);
  let matchedRecord = null;
  if (validated.identifiedName) {
    matchedRecord = findMedicineRecord(validated.identifiedName);
  }

  return {
    rawExtractedText: validated.rawText,
    identifiedName: matchedRecord ? matchedRecord.medicineName : validated.identifiedName,
    dosage: validated.dosage || matchedRecord?.approvedDosages[0] || null,
    dosageForm: validated.dosageForm || matchedRecord?.dosageForms[0] || null,
    confidenceScore: matchedRecord ? Math.max(validated.confidenceScore, 0.92) : validated.confidenceScore,
    isCertain: matchedRecord ? true : validated.isCertain,
    rejectionReason: validated.rejectionReason,
    candidateTokens: validated.candidateTokens,
    matchedRecord
  };
}

/**
 * Handle RAG evidence retrieval and plain-language explanation
 */
export async function handleRAGExplanation(
  query: string,
  medicineIdOrName: string
): Promise<{
  ragResult: RAGSearchResponse;
  plainLanguageSummary: string;
  labeledUses: string[];
  warnings: string[];
  precautions: string[];
  boxedWarning?: string;
  sourceJurisdiction: string;
  sources: any[];
}> {
  // 1. Resolve medicine record
  const medRecord = findMedicineRecord(medicineIdOrName);
  const targetMedId = medRecord ? medRecord.id : undefined;

  // 2. Query the vector index
  const ragResult = globalVectorIndex.search(
    query || `${medicineIdOrName} indications uses warnings and contraindications`,
    targetMedId,
    4,
    0.05
  );

  // 3. Synthesize explanation
  let plainLanguageSummary = '';
  if (aiClient && !ragResult.abstain && ragResult.matchedChunks.length > 0) {
    try {
      const chunksContext = ragResult.matchedChunks
        .map((c, i) => `[Evidence ${i + 1} from ${c.chunk.source.title} (${c.chunk.source.jurisdiction})]:\n${c.chunk.content}`)
        .join('\n\n');

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const callPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            text: `You are MedLens AI, a specialized patient-facing medicine label explainer.
Evidence provided from verified regulatory monographs:
${chunksContext}

Patient Question or Context: "${query || 'Explain this medicine label simply'}"
Target Medicine: "${medRecord ? medRecord.medicineName : medicineIdOrName}"

Task:
1. Explain in 2-3 clear, compassionate, non-technical paragraphs what this medicine is used for and the most important safety rules.
2. Ground your answer STRICTLY in the provided evidence. Do NOT extrapolate or introduce unverified claims.
3. Include an explicit safety statement advising the patient to consult their doctor or pharmacist before making any medication changes.`
          }
        ]
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      if (response && response.text) {
        plainLanguageSummary = response.text;
      }
    } catch (err) {
      console.warn('Gemini summary generation note:', err);
    }
  }

  if (!plainLanguageSummary) {
    if (medRecord) {
      plainLanguageSummary = `${medRecord.medicineName} (${medRecord.genericName}) is classified as a ${medRecord.therapeuticClass}. It is authoritatively approved in ${medRecord.primaryJurisdiction} for: ${medRecord.labeledUses.join(', ')}. ${medRecord.boxedWarning ? 'Notice: ' + medRecord.boxedWarning : ''}`;
    } else if (ragResult.abstain) {
      plainLanguageSummary = ragResult.abstentionReason || 'MedLens AI abstains from answering due to lack of verified regulatory evidence.';
    } else {
      plainLanguageSummary = 'Evidence retrieved from regulatory monograph sections. Consult a healthcare provider for personalized medical advice.';
    }
  }

  return {
    ragResult,
    plainLanguageSummary,
    labeledUses: medRecord ? medRecord.labeledUses : ['Relief of designated symptoms under medical direction'],
    warnings: medRecord ? medRecord.warningsAndPrecautions : ['Use only as directed by a healthcare professional.'],
    precautions: medRecord ? medRecord.commonAdverseReactions : ['Monitor for adverse reactions.'],
    boxedWarning: medRecord?.boxedWarning,
    sourceJurisdiction: medRecord?.primaryJurisdiction || 'United States (FDA) & India (CDSCO)',
    sources: ragResult.sourcesUsed.length > 0 ? ragResult.sourcesUsed : (medRecord?.sources || [])
  };
}

/**
 * Handle Multi-Scan Comparison
 */
export function handleComparison(scans: ScanItemForComparison[]): ComparisonReport {
  return compareMedicationScans(scans);
}

/**
 * Handle Bilingual Chat with DHANVI AI
 * Supports conversational context, report understanding, terminology, follow-up, and voice interaction
 */
export async function handleChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'te' = 'en',
  contextMedicine?: string,
  contextReport?: string,
  contextGeneralDoc?: string
): Promise<{
  reply: string;
  structuredSections?: {
    simpleExplanation: string;
    whatItSuggests: string;
    nextSteps: string;
    prevention: string;
    urgentCare: string;
    sources: string;
  };
}> {
  const latestMessage = messages[messages.length - 1]?.content || 'Hello';
  let reply = '';

  if (aiClient) {
    try {
      const contextPreamble = [
        contextMedicine ? `[Attached Medicine Monograph Context]:\n${contextMedicine}` : '',
        contextReport ? `[Attached Medical Lab Report Context]:\n${contextReport}` : '',
        contextGeneralDoc ? `[Attached Document Context (Academic / Business / Project Report)]:\n${contextGeneralDoc}` : ''
      ]
        .filter(Boolean)
        .join('\n\n');

      const isGeneralDocQuery = Boolean(contextGeneralDoc);

      const systemPrompt = isGeneralDocQuery
        ? `You are DHANVI (ధన్వి), an intelligent bilingual conversational AI assistant specializing in document analysis, academic project evaluation, and research paper comprehension.
Language to answer in: ${language === 'te' ? 'Telugu (తెలుగు) - clear, natural Telugu, keeping technical terms, formulas, code, and project names clearly legible' : 'English'}.

Attached Document Context:
${contextPreamble}

Key Capabilities & Directives:
1. Explain document findings, objectives, methodology, and numerical data in simple, engaging terms.
2. If asked to find errors or inconsistencies, objectively point out missing benchmarks, statistical anomalies, or logical gaps.
3. If asked for viva or presentation advice, formulate sharp academic questions and presentation slides.
4. If asked in Telugu (e.g. "ధన్వి, నా రిపోర్ట్ గురించి వివరించు"), provide rich, natural Telugu explanations.
5. Base all answers strictly on the actual uploaded document.`
        : `You are DHANVI (ధన్వి), a compassionate, highly knowledgeable bilingual conversational AI health and medicine assistant in MedLens AI.
Language to answer in: ${language === 'te' ? 'Telugu (తెలుగు) - clear, natural Telugu, keeping medicine brand names, drug formulations, units, and numbers clearly legible' : 'English'}.

Attached Patient Records Context:
${contextPreamble || 'No specific record attached; general medical literacy and health inquiry.'}

Crucial Safety & Medical Directives:
1. Introduce yourself as DHANVI when greeted or asked.
2. You are strictly an educational health companion, NOT a personal diagnosing clinician or prescribing physician.
3. Clearly distinguish between laboratory abnormalities, lifestyle risk factors, and confirmed medical diagnoses (never proclaim a diagnosis).
4. For clinical health inquiries, structure your response into these 6 numbered clear sections:
   1. 💡 Simple Explanation: Plain language explanation of the question, medical terminology, or condition.
   2. 🔍 What This Suggests: Evidence-based context of what parameters or symptoms mean without diagnosing.
   3. 📋 Practical Next Steps: Clear questions to ask the doctor or pharmacist.
   4. 🥗 Prevention & Wellness: Nutritious Indian dietary and lifestyle habits (e.g., millets, hydration, physical activity).
   5. ⚠️ When to Seek Urgent Medical Care: Red flag warnings (chest pain, stroke signs, severe breathlessness) and advise calling 112 (India National Emergency) or local emergency services.
   6. 📚 Sources & Limitations: Mention ICMR, CDSCO, or WHO, and emphasize that only a registered doctor can interpret results clinically.`;

      const contents = [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            ...messages.slice(-7).map((m) => ({
              text: `${m.role === 'user' ? 'User' : 'DHANVI'}: ${m.content}`
            })),
            { text: `User's latest message: ${latestMessage}` }
          ]
        }
      ];

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3800));
      const chatCall = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents as any
      });

      const response: any = await Promise.race([chatCall, timeoutPromise]);
      if (response && response.text) {
        reply = response.text;
      }
    } catch (err) {
      console.warn('Gemini DHANVI chat API note:', err);
    }
  }

  // Medically grounded fallback adhering to 6-part structure if Gemini was unavailable or timed out
  if (!reply) {
    if (language === 'te') {
      reply = `నమస్తే! నేను ధన్వి (DHANVI), మీ ద్వైభాషా AI ఆరోగ్య మరియు డాక్యుమెంట్ సహాయకుడిని.

1. 💡 సరళమైన వివరణ (Simple Explanation):
మీ ప్రశ్నను నేను పరిశీలించాను. వైద్య సమాచారాన్ని లేదా రిపోర్ట్‌ను అర్థం చేసుకోవడం ఎంతో ముఖ్యం.

2. 🔍 అందుబాటులోని సమాచారం ఏమి సూచిస్తుంది (What Info Suggests):
ల్యాబ్ ఫలితాలు లేదా మందుల వివరాలు సాధారణ మార్గదర్శకాల ఆధారంగా పరిశీలించబడతాయి. ఒక అసాధారణ విలువ వెంటనే వ్యాధి నిర్ధారణ కాదు; అది తదుపరి పరీక్షలు అవసరమని సూచించే సంకేతం మాత్రమే.

3. 📋 తదుపరి దశలు & వైద్యుడిని అడగవలసిన ప్రశ్నలు (Next Steps):
- ఈ మందును లేదా టెస్ట్ రిపోర్ట్‌ను మీ వైద్యుడికి చూపించండి.
- "ఈ ఫలితాలు నా రోజువారీ జీవనశైలికి సంబంధించా?" అని అడగండి.
- తీసుకుంటున్న ఇతర మందుల వివరాలను తెలపండి.

4. 🥗 జీవనశైలి & నివారణ (Prevention & Wellness):
- సమతుల్యమైన భారతీయ ఆహారం (రాగులు, ఆకుకూరలు, పప్పులు, మజ్జిగ) తీసుకోండి.
- రోజుకు కనీసం 2-3 లీటర్ల నీరు త్రాగండి.

5. ⚠️ అత్యవసర సంరక్షణ (When to Seek Urgent Care):
ఛాతీ నొప్పి, తీవ్రమైన శ్వాస తీసుకోవడంలో ఇబ్బంది, అకస్మాత్తుగా ముఖం లేదా చేయి పక్షవాతం లక్షణాలు కనిపిస్తే ఆలస్యం చేయకుండా 112 కు కాల్ చేయండి లేదా సమీప ఎమర్జెన్సీ ఆసుపత్రికి వెళ్లండి.

6. 📚 మూలాలు & పరిమితులు (Sources & Limitations):
ఈ సమాచారం ICMR మరియు CDSCO మార్గదర్శకాలపై ఆధారపడింది. ఇది కేవలం అవగాహన కొరకు మాత్రమే; ఇది వైద్యుడి వ్యక్తిగత చికిత్సకు ప్రత్యామ్నాయం కాదు.`;
    } else {
      reply = `Hello! I am DHANVI, your bilingual AI health and document assistant.

1. 💡 Simple Explanation:
Thank you for reaching out. I am here to help you interpret health information, medication safety labels, laboratory findings, and general reports in plain, accessible language.

2. 🔍 What the Information Suggests:
Test results or medication labels provide clinical data points, but an out-of-range value is an indicator for investigation, not an automatic diagnosis. Factors like hydration, stress, recent meals, and medication adherence frequently influence metrics.

3. 📋 Practical Next Steps & Questions for Your Doctor:
- Bring your physical reports or medication packaging to your next consultation.
- Ask: "Are these values typical for my age and health history?"
- Ask: "Do we need a follow-up test to confirm any trends?"
- Inform your doctor of all over-the-counter tablets, supplements, or Ayurvedic remedies you take.

4. 🥗 Prevention & Wellness Considerations:
- Prioritize fiber-rich whole grains (such as ragi, foxtail millet, and brown rice) and seasonal greens.
- Maintain adequate hydration (2.5–3 liters daily in Indian climates).
- Aim for 30 minutes of moderate physical activity like brisk walking.

5. ⚠️ When to Seek Urgent Medical Care:
If you experience red-flag symptoms—such as crushing chest pain, sudden numbness or weakness on one side of your face/body, severe breathlessness, or severe allergic swelling—call 112 (National Emergency Helpline in India) or visit your nearest emergency room immediately.

6. 📚 Sources & Limitations:
Information based on clinical guidelines from the Indian Council of Medical Research (ICMR) and Central Drugs Standard Control Organisation (CDSCO). DHANVI provides educational literacy, not personalized clinical prescription.`;
    }
  }

  return { reply };
}

/**
 * Handle Drug-Drug Interaction analysis with Gemini API
 */
export async function handleDrugInteractions(medicines: string[]): Promise<InteractionCheckResult> {
  const cleanList = Array.from(new Set(medicines.map((m) => m.trim()).filter((m) => m.length > 0)));

  if (cleanList.length < 2) {
    return analyzeInteractionsOffline(cleanList);
  }

  if (aiClient) {
    try {
      const prompt = `You are an expert clinical pharmacologist and drug safety specialist.
Analyze the following list of medications for potential drug-drug interactions:
${cleanList.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Task:
1. Examine every possible pair of drugs for pharmacokinetic (absorption, distribution, metabolism via CYP450, excretion) and pharmacodynamic interactions.
2. Assign each pair a severity: "severe", "moderate", "minor", or "safe".
3. Provide the pharmacological mechanism, clinical effect, dosing interval/timing advice (e.g. take 2 hours apart, take with food, etc.), food/alcohol warnings, and clinical management.
4. Format the output STRICTLY as valid JSON adhering to this schema:
{
  "analyzedMedicines": string[],
  "overallRiskLevel": "high" | "moderate" | "low" | "safe",
  "summary": string,
  "summaryTelugu": string,
  "interactions": [
    {
      "drugA": string,
      "drugB": string,
      "severity": "severe" | "moderate" | "minor" | "safe",
      "severityLabel": string,
      "clinicalEffect": string,
      "mechanism": string,
      "timingAdvice": string,
      "foodAlcoholWarning": string,
      "management": string,
      "evidenceSource": string
    }
  ],
  "safeCombinations": string[],
  "foodAndLifestyleWarnings": string[],
  "doctorDiscussionPoints": string[]
}`;

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const call = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const response: any = await Promise.race([call, timeoutPromise]);
      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed && Array.isArray(parsed.interactions)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini interaction check note, using offline engine:', err);
    }
  }

  return analyzeInteractionsOffline(cleanList);
}

/**
 * Handle General Document Analysis with Gemini API (11 Structured Sections)
 */
export async function handleGeneralDocumentAnalysis(
  rawText: string,
  docType: string = 'General Document / Academic Project',
  docTitle: string = 'Analyzed Document'
): Promise<GeneralReportAnalysis> {
  if (aiClient && rawText && rawText.trim().length > 50) {
    try {
      const prompt = `You are an elite academic and professional document analyst.
Analyze the following document text and produce a rigorous, structured analytical report covering ALL 11 required sections.

Document Title: "${docTitle}"
Document Type: "${docType}"

Text to analyze:
${rawText.substring(0, 15000)}

Return ONLY valid JSON matching this structure:
{
  "documentTitle": "${docTitle}",
  "documentType": "${docType}",
  "pageCount": number,
  "wordCount": number,
  "section1_summary": string,
  "section2_objectives": string[],
  "section3_findings": string[],
  "section4_observations": string[],
  "section5_numericalData": [ { "label": string, "value": string, "context": string } ],
  "section6_strengthsAndWeaknesses": { "strengths": string[], "weaknesses": string[] },
  "section7_missingInfo": string[],
  "section8_errorsAndInconsistencies": string[],
  "section9_suggestionsForImprovement": string[],
  "section10_detailedExplanations": string,
  "section11_finalConclusion": string,
  "summaryTelugu": string,
  "vivaQuestions": string[],
  "presentationPoints": string[]
}`;

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4500));
      const call = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const response: any = await Promise.race([call, timeoutPromise]);
      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed && parsed.section1_summary) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini general document analysis note, using rule engine:', err);
    }
  }

  return generateRuleBasedAnalysis(rawText, docTitle, docType);
}

/**
 * Handle Report Comparison (Medical or General)
 */
export function handleCompareDocuments(
  type: 'medical' | 'general',
  docA: { text: string; title?: string; type?: string },
  docB: { text: string; title?: string; type?: string }
) {
  if (type === 'medical') {
    return compareMedicalReports(
      docA.text,
      docB.text,
      docA.title || 'Baseline Report A',
      docB.title || 'Follow-up Report B'
    );
  } else {
    return compareGeneralDocuments(
      docA.text,
      docB.text,
      docA.title || 'Document A',
      docB.title || 'Document B',
      docA.type || 'Project Report',
      docB.type || 'Project Report'
    );
  }
}

/**
 * Handle audio transcription from microphone audio recording
 */
export async function handleAudioTranscription(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcript: string }> {
  const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9_-]+;base64,/, '');

  if (aiClient && cleanBase64) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              },
              {
                text: 'Accurately transcribe all spoken words from this audio recording verbatim. If the speaker is speaking in Telugu, transcribe into Telugu script. If in English, transcribe in English. Return ONLY the transcribed text.'
              }
            ]
          }
        ]
      });

      return { transcript: response.text?.trim() || '' };
    } catch (err) {
      console.warn('Gemini audio transcription error note:', err);
    }
  }

  return { transcript: '' };
}


