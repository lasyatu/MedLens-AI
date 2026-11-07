/**
 * MedLens AI Localization & Telugu Translation Engine
 * Supports English ('en') and Telugu ('te') with extensible architecture for more Indian languages
 */

export type SupportedLanguage = 'en' | 'te';

export interface UIStrings {
  appName: string;
  tagline: string;
  disclaimerTitle: string;
  disclaimerText: string;
  safetyDetails: string;
  navDashboard: string;
  navScan: string;
  navHistory: string;
  navSettings: string;
  navOverview: string;
  signIn: string;
  signOut: string;
  getStarted: string;
  welcome: string;
  welcomeSub: string;
  scanNow: string;
  savedScans: string;
  recentScans: string;
  dropImageHere: string;
  orSelectFile: string;
  preprocessingTitle: string;
  contrast: string;
  brightness: string;
  binarize: string;
  noiseReduction: string;
  invert: string;
  resetFilters: string;
  applyFilters: string;
  extractTextBtn: string;
  processingImage: string;
  rawExtractedText: string;
  confirmedIdentity: string;
  confidence: string;
  viewEvidenceBtn: string;
  labeledUses: string;
  boxedWarning: string;
  warningsAndPrecautions: string;
  contraindications: string;
  retrievedEvidence: string;
  askQuestionPlaceholder: string;
  voiceSearchTooltip: string;
  recordingTelugu: string;
  speakNow: string;
  stopRecording: string;
  transcriptEditPrompt: string;
  submitQuestion: string;
  listenTelugu: string;
  pauseAudio: string;
  stopAudio: string;
  showEnglishSource: string;
  showTelugu: string;
  compareSelected: string;
  selectForCompare: string;
  clearHistory: string;
  dataDeletedSuccess: string;
  uncertainIdentityTitle: string;
  uncertainIdentityMsg: string;
  confirmMedicinePrompt: string;
  micPermissionDenied: string;
  micUnsupported: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, UIStrings> = {
  en: {
    appName: 'MedLens AI',
    tagline: 'Verified Medicine Label Intelligence',
    disclaimerTitle: 'Medical Information Disclaimer',
    disclaimerText: 'MedLens AI provides educational information extracted from verified regulatory drug labels only. It does not provide medical diagnoses or treatment recommendations.',
    safetyDetails: 'Safety details',
    navDashboard: 'Dashboard',
    navScan: 'Scan Medicine',
    navHistory: 'Scan History',
    navSettings: 'Settings',
    navOverview: 'Overview',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    getStarted: 'Get Started',
    welcome: 'Hello',
    welcomeSub: 'Upload medicine package photos to extract text, inspect authoritative FDA & Indian Pharmacopoeia evidence, and compare multiple prescriptions safely.',
    scanNow: 'Scan Medicine Now',
    savedScans: 'Saved Scans',
    recentScans: 'Recent Scans',
    dropImageHere: 'Drag & drop medicine package photo here',
    orSelectFile: 'or browse files from your computer or camera',
    preprocessingTitle: 'Image Preprocessing & OCR Enhancement',
    contrast: 'Contrast Boost',
    brightness: 'Brightness',
    binarize: 'Binarize (Black & White Text)',
    noiseReduction: 'Noise Smoothing',
    invert: 'Invert Dark Packaging',
    resetFilters: 'Reset',
    applyFilters: 'Apply Preprocessing',
    extractTextBtn: 'Extract Text with OCR',
    processingImage: 'Preprocessing image and analyzing label...',
    rawExtractedText: 'Extracted Label Text',
    confirmedIdentity: 'Confirmed Medicine Identity',
    confidence: 'Confidence Score',
    viewEvidenceBtn: 'Retrieve Evidence & Explanation',
    labeledUses: 'Approved Labeled Uses',
    boxedWarning: 'High-Priority Boxed Warning',
    warningsAndPrecautions: 'Warnings & Precautions',
    contraindications: 'Contraindications',
    retrievedEvidence: 'Actual Retrieved Monograph Evidence (RAG)',
    askQuestionPlaceholder: 'Ask a question about this medicine (e.g. uses, precautions, dosage)...',
    voiceSearchTooltip: 'Voice search in Telugu / English',
    recordingTelugu: 'Listening to Telugu speech...',
    speakNow: 'Speak clearly into your microphone...',
    stopRecording: 'Stop Recording',
    transcriptEditPrompt: 'Review or edit recognized speech before submitting:',
    submitQuestion: 'Search Evidence',
    listenTelugu: 'Listen Aloud in Telugu',
    pauseAudio: 'Pause Audio',
    stopAudio: 'Stop Audio',
    showEnglishSource: 'Show Original English Source',
    showTelugu: 'Show Telugu Explanation',
    compareSelected: 'Compare Selected Scans',
    selectForCompare: 'Select to Compare',
    clearHistory: 'Delete All Scan History',
    dataDeletedSuccess: 'All your scan history records have been permanently deleted from Firestore.',
    uncertainIdentityTitle: 'Medicine Identity Verification Required',
    uncertainIdentityMsg: 'The extracted text contains generic packaging terms or low confidence. Please verify the medicine name below or upload a clearer photo.',
    confirmMedicinePrompt: 'Confirm or select matching medicine:',
    micPermissionDenied: 'Microphone permission was denied. Please allow microphone access in your browser settings to use voice search.',
    micUnsupported: 'Speech recognition is not supported in this browser. Please use the text input below.'
  },
  te: {
    appName: 'మెడ్‌లెన్స్ AI (MedLens AI)',
    tagline: 'ధృవీకరించబడిన ఔషధ లేబుల్ సమాచారం',
    disclaimerTitle: 'వైద్య సమాచార నిరాకరణ (Medical Disclaimer)',
    disclaimerText: 'మెడ్‌లెన్స్ AI అధికారిక డ్రగ్ లేబుల్స్ ఆధారంగా విద్యాపరమైన సమాచారాన్ని మాత్రమే అందిస్తుంది. ఇది వైద్య నిర్ధారణ లేదా చికిత్స సలహా కాదు.',
    safetyDetails: 'భద్రతా వివరాలు',
    navDashboard: 'డ్యాష్‌బోర్డ్',
    navScan: 'మందును స్కాన్ చేయండి',
    navHistory: 'స్కాన్ చరిత్ర',
    navSettings: 'సెట్టింగ్‌లు',
    navOverview: 'పరిచయం',
    signIn: 'లాగిన్ అవ్వండి',
    signOut: 'లాగ్ అవుట్',
    getStarted: 'ప్రారంభించండి',
    welcome: 'నమస్కారం',
    welcomeSub: 'మందు ప్యాకెట్ ఫోటోను అప్‌లోడ్ చేసి అందులోని వివరాలు, ఉపయోగించే విధానం మరియు అధికారిక హెచ్చరికలను సరళమైన తెలుగులో తెలుసుకోండి.',
    scanNow: 'ఇప్పుడే మందును స్కాన్ చేయండి',
    savedScans: 'సేవ్ చేసిన మందులు',
    recentScans: 'ఇటీవలి స్కాన్లు',
    dropImageHere: 'మందు ప్యాకేజీ ఫోటోను ఇక్కడ లాగి వదలండి (Drag & Drop)',
    orSelectFile: 'లేదా మీ ఫోన్/కంప్యూటర్ నుండి ఫోటోను ఎంచుకోండి',
    preprocessingTitle: 'చిత్ర స్పష్టత మెరుగుదల (Image Preprocessing & OCR)',
    contrast: 'కాంట్రాస్ట్ (Contrast)',
    brightness: 'వెలుతురు (Brightness)',
    binarize: 'నలుపు-తెలుపు అక్షరాలు (Binarize)',
    noiseReduction: 'అక్షరాల స్పష్టత (Noise Smoothing)',
    invert: 'ముదురు రంగు ప్యాకెట్ (Invert)',
    resetFilters: 'రీసెట్ చేయండి',
    applyFilters: 'ఫిల్టర్లు వర్తింపజేయండి',
    extractTextBtn: 'అక్షరాలను గుర్తించండి (OCR)',
    processingImage: 'చిత్రాన్ని విశ్లేషిస్తోంది, దయచేసి వేచి ఉండండి...',
    rawExtractedText: 'లేబుల్ నుండి తీసిన అసలు అక్షరాలు (Raw Text)',
    confirmedIdentity: 'ధృవీకరించబడిన మందు పేరు',
    confidence: 'ఖచ్చితత్వ స్కోరు',
    viewEvidenceBtn: 'ఆధారాలు & వివరణ చూడండి',
    labeledUses: 'అధికారిక ఉపయోగాలు (Uses)',
    boxedWarning: 'ముఖ్యమైన బాక్స్ హెచ్చరిక (Boxed Warning)',
    warningsAndPrecautions: 'హెచ్చరికలు & జాగ్రత్తలు (Warnings)',
    contraindications: 'ఎవరు తీసుకోకూడదు? (Contraindications)',
    retrievedEvidence: 'అధికారిక గ్రంథాల నుండి సేకరించిన ఆధారాలు (RAG Evidence)',
    askQuestionPlaceholder: 'ఈ మందు గురించి తెలుగులో అడగండి (ఉదా: దేనికి వాడతారు? జాగ్రత్తలు?)...',
    voiceSearchTooltip: 'తెలుగులో మాట్లాడి వెతకండి (Voice Search)',
    recordingTelugu: 'తెలుగులో మాట్లాడుతున్నారు... వింటున్నాము...',
    speakNow: 'మైక్రోఫోన్‌లో స్పష్టంగా మాట్లాడండి...',
    stopRecording: 'రికార్డింగ్ ఆపండి',
    transcriptEditPrompt: 'రికార్డ్ అయిన తెలుగు ప్రశ్నను పరిశీలించండి లేదా సవరించండి:',
    submitQuestion: 'సమాధానం వెతకండి',
    listenTelugu: 'తెలుగులో వాయిస్ వినండి (Audio Assist)',
    pauseAudio: 'ఆపండి (Pause)',
    stopAudio: 'పూర్తిగా ఆపండి (Stop)',
    showEnglishSource: 'అసలు ఇంగ్లీష్ ఆధారాలు చూడండి',
    showTelugu: 'తెలుగు వివరణ చూడండి',
    compareSelected: 'ఎంచుకున్న మందులను సరిపోల్చండి',
    selectForCompare: 'సరిపోల్చడానికి ఎంచుకోండి',
    clearHistory: 'మొత్తం చరిత్రను తొలగించండి',
    dataDeletedSuccess: 'మీ స్కాన్ రికార్డులన్నీ ఫైర్‌స్టోర్ నుండి శాశ్వతంగా తొలగించబడ్డాయి.',
    uncertainIdentityTitle: 'మందు పేరు ధృవీకరణ అవసరం',
    uncertainIdentityMsg: 'ఫోటోలో సరైన మందు పేరు స్పష్టంగా కనిపించలేదు. దయచేసి క్రింద ఉన్న సరైన మందును ఎంచుకోండి లేదా స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.',
    confirmMedicinePrompt: 'మందు పేరును నిర్ధారించండి:',
    micPermissionDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి మీ బ్రౌజర్ సెట్టింగ్స్‌లో మైక్ అనుమతించండి.',
    micUnsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సదుపాయం లేదు. దయచేసి క్రింద ఉన్న బాక్స్‌లో టైప్ చేయండి.'
  }
};

/**
 * Maps spoken or typed Telugu questions to RAG retrieval intent concepts
 */
export function interpretTeluguQuestionToRAGQuery(teluguText: string, medicineName: string): string {
  const t = teluguText.toLowerCase().trim();

  // Pattern 1: Uses / Indications (ఉపయోగాలు, దేనికి వాడతారు, ఎందుకు, పని చేస్తుంది)
  if (t.includes('ఉపయోగ') || t.includes('దేనికి') || t.includes('వాడతారు') || t.includes('ఎందుకు') || t.includes('పని') || t.includes('జబ్బు')) {
    return `${medicineName} indications and usage approved symptoms conditions treated`;
  }

  // Pattern 2: Warnings / Side effects (జాగ్రత్తలు, ప్రమాదం, దుష్ప్రభావాలు, సైడ్ ఎఫెక్ట్స్, నష్టం)
  if (t.includes('జాగ్రత్త') || t.includes('ప్రమాద') || t.includes('సైడ్') || t.includes('దుష్ప్రభావ') || t.includes('నష్టం') || t.includes('హెచ్చరిక')) {
    return `${medicineName} warnings precautions contraindications adverse reactions boxed warning`;
  }

  // Pattern 3: Dosage / How to take (ఎలా తీసుకోవాలి, మోతాదు, డోస్, సమయం, ఆహారం)
  if (t.includes('ఎలా') || t.includes('మోతాదు') || t.includes('డోస్') || t.includes('ఆహారం') || t.includes('తీసుకోవాలి')) {
    return `${medicineName} dosage administration maximum daily dose food interactions`;
  }

  // Pattern 4: Label ingredients (లేబుల్, మందులో ఏమి ఉంది, పదార్థాలు)
  if (t.includes('లేబుల్') || t.includes('ఏమి ఉంది') || t.includes('పదార్థాలు')) {
    return `${medicineName} active ingredients composition strength formulation`;
  }

  // Default: comprehensive overview query
  return `${medicineName} indications uses warnings and contraindications`;
}

/**
 * Generate natural, faithful Telugu explanation grounded in verified monograph facts
 */
export function generateTeluguMedExplanation(
  medicineName: string,
  genericName: string,
  therapeuticClass: string,
  uses: string[],
  warnings: string[],
  boxedWarning?: string
): string {
  const parts: string[] = [];

  // Introduction
  parts.push(
    `ఈ మందు **${medicineName}** (${genericName}). ఇది **${therapeuticClass}** ఔషధ వర్గానికి చెందినది.`
  );

  // Uses
  if (uses && uses.length > 0) {
    parts.push(
      `**ప్రధాన ఉపయోగాలు (Uses):**\nఈ మందును ప్రధానంగా ఈ క్రింది సమస్యల ఉపశమనానికి ఉపయోగిస్తారు: ` +
      uses.slice(0, 3).map(u => {
        if (u.toLowerCase().includes('pain') || u.toLowerCase().includes('ache')) return 'నొప్పులు మరియు అసౌకర్యం';
        if (u.toLowerCase().includes('fever')) return 'జ్వరం తగ్గించడం';
        if (u.toLowerCase().includes('infection')) return 'బ్యాక్టీరియల్ ఇన్ఫెక్షన్లు';
        if (u.toLowerCase().includes('diabetes')) return 'టైప్-2 మధుమేహం (షుగర్ లెవెల్స్ నియంత్రణ)';
        if (u.toLowerCase().includes('gerd') || u.toLowerCase().includes('acid') || u.toLowerCase().includes('ulcer')) return 'కడుపులో ఎసిడిటీ మరియు అల్సర్లు';
        if (u.toLowerCase().includes('allerg')) return 'అలర్జీ మరియు తుమ్ములు';
        return u;
      }).join(', ') + '.'
    );
  }

  // Boxed Warning (if present)
  if (boxedWarning) {
    parts.push(
      `⚠️ **ముఖ్యమైన బాక్స్ హెచ్చరిక (Black Box Warning):**\n${boxedWarning.includes('Liver') ? 'కాలేయం (Liver) పై తీవ్ర ప్రభావం పడే అవకాశం ఉంది. నిర్దేశించిన గరిష్ట పరిమితికి మించి వాడకూడదు మరియు మద్యం తీసుకుంటూ ఈ మందు వాడకూడదు.' : boxedWarning.includes('Lactic') ? 'లాక్టిక్ అసిడోసిస్ అనే అరుదైన కానీ ప్రాణాంతక సమస్య వచ్చే ప్రమాదం ఉంది. మూత్రపిండాల (కిడ్నీ) పనితీరు సాధారణంగా ఉండాలి.' : boxedWarning}`
    );
  }

  // Warnings
  if (warnings && warnings.length > 0) {
    parts.push(
      `**ముఖ్యమైన జాగ్రత్తలు (Safety Precautions):**\n• వైద్యుల సూచన మేరకు మాత్రమే సరైన మోతాదులో వాడాలి.\n• ఇతర మందులతో కలిపి తీసుకునే ముందు ఫార్మసిస్ట్ లేదా డాక్టర్‌ను సంప్రదించండి.\n• అసాధారణ సైడ్ ఎఫెక్ట్స్ కనిపిస్తే వెంటనే వాడటం ఆపి వైద్యులను సంప్రదించండి.`
    );
  }

  // Disclaimer
  parts.push(
    `*గమనిక: ఈ సమాచారం అధికారిక డ్రగ్ లేబుల్స్ ఆధారంగా విజ్ఞానం కోసం మాత్రమే అందించబడింది. మీ వ్యక్తిగత చికిత్స కోసం తప్పనిసరిగా మీ వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి.*`
  );

  return parts.join('\n\n');
}
