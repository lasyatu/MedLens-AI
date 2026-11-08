import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info,
  Sun,
  Focus,
  Maximize2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import {
  PreprocessingOptions,
  DEFAULT_PREPROCESSING_OPTIONS,
  applyImageFilters,
  calculateOtsuThreshold
} from '../lib/imagePreprocessing';
import { OCRValidationResult } from '../lib/ocrValidation';
import { AUTHORITATIVE_MEDICINES, MedicineRecord } from '../lib/authoritativeData';
import { SupportedLanguage, TRANSLATIONS } from '../lib/translations';

interface MedicineScannerProps {
  onScanComplete: (result: {
    rawText: string;
    confirmedMedicine: string;
    genericName?: string | null;
    brandName?: string | null;
    activeIngredients?: string[];
    composition?: string | null;
    dosage?: string | null;
    strength?: string | null;
    dosageForm?: string | null;
    manufacturer?: string | null;
    expiryDate?: string | null;
    confidenceScore: number;
    jurisdiction?: string | null;
    preprocessedImageBase64?: string;
  }) => void;
  language: SupportedLanguage;
  initialPreset?: string;
}

export const MedicineScanner: React.FC<MedicineScannerProps> = ({
  onScanComplete,
  language,
  initialPreset
}) => {
  const t = TRANSLATIONS[language];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [preprocessingOptions, setPreprocessingOptions] = useState<PreprocessingOptions>(DEFAULT_PREPROCESSING_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRValidationResult | null>(null);
  const [showPreprocessedView, setShowPreprocessedView] = useState(false);
  const [showUncertaintyModal, setShowUncertaintyModal] = useState(false);
  const [manualConfirmName, setManualConfirmName] = useState('');
  const [manualConfirmStrength, setManualConfirmStrength] = useState('');
  const [showPhotoGuide, setShowPhotoGuide] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample presets for instant testing
  const SAMPLE_PRESETS: Record<string, { name: string; dosage: string; text: string; imageLabel: string }> = {
    paracetamol: {
      name: 'Paracetamol',
      dosage: '500 mg',
      text: 'PARACETAMOL TABLETS IP 500 MG\nBrand: Dolo-650 / Crocin\nComposition: Paracetamol IP 500mg\nMfg Lic No: 28/UA/2021\nBatch: DL8922 Exp: 10/2027\nWarning: Taking more than 4,000 mg in 24 hours may cause severe liver damage.',
      imageLabel: 'Paracetamol IP 500mg Blister Pack'
    },
    amoxicillin: {
      name: 'Amoxicillin',
      dosage: '500 mg',
      text: 'AMOXICILLIN CAPSULES USP 500 MG\nBrand: Amoxil\nEach capsule contains Amoxicillin Trihydrate equivalent to 500mg amoxicillin.\nRx only. Keep out of reach of children.\nWarning: Hypersensitivity to penicillin; risk of anaphylaxis.',
      imageLabel: 'Amoxicillin USP 500mg Capsule Bottle'
    },
    ibuprofen: {
      name: 'Ibuprofen',
      dosage: '200 mg',
      text: 'IBUPROFEN TABLETS USP 200 MG\nBrand: Advil / Motrin\nActive Ingredient: Ibuprofen 200 mg (NSAID)\nPurpose: Pain reliever / fever reducer\nBoxed Warning: Cardiovascular thrombotic events and gastrointestinal bleeding risk.',
      imageLabel: 'Ibuprofen USP 200mg Tablet Box'
    },
    metformin: {
      name: 'Metformin',
      dosage: '500 mg',
      text: 'METFORMIN HYDROCHLORIDE TABLETS IP 500 MG\nBrand: Glycomet / Glucophage\nActive: Metformin HCl 500 mg\nBoxed Warning: Lactic acidosis risk in renal impairment.\nPrescription drug Schedule H.',
      imageLabel: 'Metformin HCl 500mg Strip'
    },
    omeprazole: {
      name: 'Omeprazole',
      dosage: '20 mg',
      text: 'OMEPRAZOLE DELAYED-RELEASE CAPSULES 20 MG\nBrand: Prilosec / Omez\nActive ingredient: Omeprazole 20mg (Proton Pump Inhibitor)\nIndications: Frequent heartburn / GERD.\nStore at 20-25°C.',
      imageLabel: 'Omeprazole DR 20mg Bottle'
    },
    cetirizine: {
      name: 'Cetirizine',
      dosage: '10 mg',
      text: 'CETIRIZINE HYDROCHLORIDE TABLETS IP 10 MG\nBrand: Zyrtec / Cetzine\nSecond-generation H1-antihistamine for seasonal rhinitis.\nWarning: May cause somnolence.',
      imageLabel: 'Cetirizine 10mg Blister Strip'
    },
    aspirin: {
      name: 'Aspirin',
      dosage: '75 mg',
      text: 'ECOSPRIN 75 GASTRO-RESISTANT TABLETS IP\nBrand: Ecosprin 75\nComposition: Acetylsalicylic Acid IP 75mg\nMfg by: USV Private Ltd\nExp: 08/2027 Batch: ES-9941\nWarning: Antiplatelet medicine. Consult physician before use.',
      imageLabel: 'Ecosprin 75mg Gastro-Resistant Strip'
    },
    atorvastatin: {
      name: 'Atorvastatin',
      dosage: '10 mg',
      text: 'ATORVASTATIN TABLETS IP 10 MG\nBrand: Lipitor / Atorva 10\nActive Ingredient: Atorvastatin Calcium 10mg\nSchedule H Prescription Drug\nExp: 11/2027\nWarning: Report unexplained muscle pain immediately.',
      imageLabel: 'Atorvastatin 10mg Film-Coated Strip'
    },
    azithromycin: {
      name: 'Azithromycin',
      dosage: '500 mg',
      text: 'AZITHROMYCIN TABLETS IP 500 MG\nBrand: Azee 500 / Zithromax\nEach tablet contains: Azithromycin Dihydrate 500mg\nExp: 03/2028\nWarning: Complete 3-day prescribed course.',
      imageLabel: 'Azithromycin 500mg 3-Day Blister Strip'
    },
    pantoprazole: {
      name: 'Pantoprazole',
      dosage: '40 mg',
      text: 'PANTOPRAZOLE GASTRO-RESISTANT TABLETS IP 40 MG\nBrand: Pantocid 40 / Protonix\nActive: Pantoprazole Sodium 40mg\nExp: 05/2027\nTake 30 minutes before breakfast.',
      imageLabel: 'Pantoprazole 40mg Strip'
    },
    generic_uncertain: {
      name: 'Unclear Packaging',
      dosage: '500 mg',
      text: 'TABLETS IP 500 MG\nSTORE IN A COOL DRY PLACE\nKEEP OUT OF REACH OF CHILDREN\nEXPIRY: 12/2026',
      imageLabel: 'Generic Packaging with Missing Drug Name (Test Uncertainty)'
    },
    blurry_prescription: {
      name: 'Blurry Prescription',
      dosage: '500 mg',
      text: 'Rx Clinic Dr. S. Rao\nDate: 2026-05-12\nCap. .m.x.. 500 .. sig illegible\nSignature: Dr. SR (Partially unverified)',
      imageLabel: 'Blurry Prescription Note (Test Low Confidence)'
    }
  };

  // Trigger initial preset if provided
  useEffect(() => {
    if (initialPreset && SAMPLE_PRESETS[initialPreset]) {
      loadPreset(initialPreset);
    }
  }, [initialPreset]);

  // Load sample preset
  const loadPreset = (presetKey: string) => {
    const preset = SAMPLE_PRESETS[presetKey];
    if (!preset) return;

    // Draw realistic high-contrast synthetic label on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clean background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Packaging border
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Top Header banner
      ctx.fillStyle = '#0F766E';
      ctx.fillRect(10, 10, canvas.width - 20, 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(preset.imageLabel, 30, 48);

      // Content text
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px sans-serif';
      const lines = preset.text.split('\n');
      lines.forEach((line, idx) => {
        if (idx === 0) {
          ctx.font = 'bold 26px sans-serif';
          ctx.fillStyle = '#1E293B';
        } else if (line.includes('Warning') || line.includes('Boxed')) {
          ctx.font = 'bold 15px sans-serif';
          ctx.fillStyle = '#B91C1C';
        } else {
          ctx.font = 'normal 16px sans-serif';
          ctx.fillStyle = '#334155';
        }
        ctx.fillText(line, 35, 110 + idx * 32);
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setOcrResult(null);
      renderPreprocessedImage(dataUrl, preprocessingOptions);
    }
  };

  // Handle uploaded file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setSelectedImage(dataUrl);
      setOcrResult(null);
      renderPreprocessedImage(dataUrl, preprocessingOptions);
    };
    reader.readAsDataURL(file);
  };

  // Re-render preprocessed image onto canvas whenever options change
  const renderPreprocessedImage = (imageSrc: string, options: PreprocessingOptions) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxWidth = 700;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // If user requested binarize without manual threshold, compute Otsu
      let finalOptions = { ...options };
      if (options.binarize && options.binarizationThreshold === 128) {
        finalOptions.binarizationThreshold = calculateOtsuThreshold(imageData);
      }

      const filtered = applyImageFilters(imageData, finalOptions);
      ctx.putImageData(filtered, 0, 0);
    };
    img.src = imageSrc;
  };

  // Trigger preprocessing re-render when sliders change
  useEffect(() => {
    if (selectedImage) {
      renderPreprocessedImage(selectedImage, preprocessingOptions);
    }
  }, [preprocessingOptions]);

  // Run OCR Extraction
  const handleRunOCR = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      // Get data URL from processed canvas with compact size
      let imageToSend = selectedImage;
      if (canvasRef.current) {
        // Create downscaled canvas for fast transmission
        const exportCanvas = document.createElement('canvas');
        const exportWidth = Math.min(500, canvasRef.current.width);
        const exportScale = exportWidth / canvasRef.current.width;
        exportCanvas.width = exportWidth;
        exportCanvas.height = Math.round(canvasRef.current.height * exportScale);
        const exportCtx = exportCanvas.getContext('2d');
        if (exportCtx) {
          exportCtx.drawImage(canvasRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
          imageToSend = exportCanvas.toDataURL('image/jpeg', 0.75);
        } else {
          imageToSend = canvasRef.current.toDataURL('image/jpeg', 0.75);
        }
      }

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageToSend })
      });

      const data = await res.json();

      setOcrResult({
        rawText: data.rawExtractedText || '',
        identifiedName: data.identifiedName || null,
        brandName: data.brandName || null,
        genericName: data.genericName || null,
        activeIngredients: data.activeIngredients || [],
        composition: data.composition || null,
        strength: data.strength || data.dosage || null,
        dosage: data.dosage || null,
        dosageForm: data.dosageForm || null,
        manufacturer: data.manufacturer || null,
        expiryDate: data.expiryDate || null,
        confidenceScore: data.confidenceScore || 0,
        isCertain: data.isCertain || false,
        rejectionReason: data.rejectionReason,
        uncertaintyReason: data.uncertaintyReason,
        candidateTokens: data.candidateTokens || []
      });

      // If uncertain or generic words rejected or low confidence, prompt user to confirm
      if (!data.identifiedName || !data.isCertain || (data.confidenceScore && data.confidenceScore < 0.75)) {
        setShowUncertaintyModal(true);
        setManualConfirmName(data.identifiedName || '');
        setManualConfirmStrength(data.strength || data.dosage || '');
      }
    } catch (err) {
      console.error('OCR Extraction error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm medicine identity and proceed to verified monograph results
  const handleConfirmAndProceed = (finalName: string, finalStrength?: string) => {
    if (!ocrResult && !finalName) return;

    const medName = finalName.trim() || ocrResult?.identifiedName || 'Paracetamol';
    const matched = AUTHORITATIVE_MEDICINES.find(
      m => m.medicineName.toLowerCase().includes(medName.toLowerCase()) ||
           m.genericName.toLowerCase().includes(medName.toLowerCase()) ||
           m.brandNames.some(b => b.toLowerCase().includes(medName.toLowerCase()))
    );

    setShowUncertaintyModal(false);

    const chosenStrength = finalStrength?.trim() || ocrResult?.strength || ocrResult?.dosage || matched?.approvedDosages[0];

    onScanComplete({
      rawText: ocrResult?.rawText || 'Packaging OCR Text',
      confirmedMedicine: matched ? matched.medicineName : medName,
      genericName: matched?.genericName || ocrResult?.genericName,
      brandName: matched?.brandNames[0] || ocrResult?.brandName,
      activeIngredients: matched?.activeIngredients || ocrResult?.activeIngredients,
      composition: matched?.composition || ocrResult?.composition,
      dosage: chosenStrength,
      strength: chosenStrength,
      dosageForm: ocrResult?.dosageForm || matched?.dosageForms[0],
      manufacturer: ocrResult?.manufacturer,
      expiryDate: ocrResult?.expiryDate,
      confidenceScore: ocrResult?.confidenceScore || (matched ? 0.95 : 0.8),
      jurisdiction: matched?.primaryJurisdiction || 'United States (FDA)',
      preprocessedImageBase64: canvasRef.current ? canvasRef.current.toDataURL('image/jpeg', 0.8) : selectedImage || undefined
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <UploadCloud className="w-7 h-7 text-teal-600" />
          {t.navScan}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {language === 'te'
            ? 'మందు ప్యాకెట్ ఫోటోను అప్‌లోడ్ చేసి ప్రీప్రాసెసింగ్ ఫిల్టర్లను వర్తింపజేయండి.'
            : 'Upload or capture a medicine package photo. Use image preprocessing sliders to enhance text clarity before OCR verification.'}
        </p>
      </div>

      {/* Preset Pill Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            {language === 'te' ? 'తక్షణ పరీక్ష నమూనాలు (Verified Presets):' : 'Instant Testing Presets (Click to load label):'}
          </span>
          <span className="text-[11px] text-slate-400">Includes US FDA & Indian monographs</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'paracetamol', label: 'Paracetamol 500mg' },
            { id: 'amoxicillin', label: 'Amoxicillin 500mg' },
            { id: 'ibuprofen', label: 'Ibuprofen 200mg (Boxed Warning)' },
            { id: 'metformin', label: 'Metformin 500mg (Boxed Warning)' },
            { id: 'omeprazole', label: 'Omeprazole 20mg' },
            { id: 'cetirizine', label: 'Cetirizine 10mg' },
            { id: 'aspirin', label: 'Aspirin 75mg' },
            { id: 'atorvastatin', label: 'Atorvastatin 10mg' },
            { id: 'azithromycin', label: 'Azithromycin 500mg' },
            { id: 'pantoprazole', label: 'Pantoprazole 40mg' },
            { id: 'generic_uncertain', label: '⚠️ Unclear Generic Label (Test Uncertainty)' },
            { id: 'blurry_prescription', label: '⚠️ Blurry Prescription (Test Low Confidence)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Photo Guidance & OCR Best Practices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <div
          onClick={() => setShowPhotoGuide(!showPhotoGuide)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'te'
                    ? 'స్పష్టమైన ఫోటో తీయడానికి గైడ్ & చిట్కాలు'
                    : 'Real-Time Photo Capture Guidance for High OCR Accuracy'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {language === 'te' ? 'సిఫార్సు చేయబడింది' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'te'
                  ? 'మందు పేరు, మోతాదు (mg), గడువు తేదీ ఖచ్చితంగా గుర్తించడానికి సరైన కాంతి, కోణం మరియు ఫోకస్ ఉపయోగించండి.'
                  : 'Lighting, focus, and angle guidelines to maximize OCR extraction and prevent misread dosages.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Toggle Photo Guide"
          >
            {showPhotoGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showPhotoGuide && (
          <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
            {/* 4 Core Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pillar 1: Lighting */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'te' ? '1. సరైన వెలుతురు (Lighting)' : '1. Diffuse Lighting'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'te'
                    ? 'మెరిసే ఫాయిల్ ప్యాక్‌లపై డైరెక్ట్ ఫ్లాష్ నివారించండి. పగటి వెలుతురు లేదా సాధారణ గది కాంతి ఉపయోగించండి.'
                    : 'Avoid direct camera flash on reflective blister foils. Diffuse daylight prevents whiteout glare over text.'}
                </p>
              </div>

              {/* Pillar 2: Focus */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Focus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'te' ? '2. స్పష్టమైన ఫోకస్ (Focus)' : '2. Sharp Focus'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'te'
                    ? 'చిన్న అక్షరాలు (ఉదా: 500mg, Exp) స్పష్టంగా కనిపించేలా కెమెరాను 10-15 సెం.మీ దూరంలో స్థిరంగా ఉంచండి.'
                    : 'Hold steady 10–15 cm away. Tap screen to focus directly on small composition text and expiration dates.'}
                </p>
              </div>

              {/* Pillar 3: Angle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'te' ? '3. నిలువు కోణం (90° Angle)' : '3. Flat 90° Angle'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'te'
                    ? 'లేబుల్‌కు సరిగ్గా ఎదురుగా సమాంతరంగా పట్టుకోండి. వంకరగా తీస్తే అక్షరాలు సాగిపోయి OCR తప్పుగా రావచ్చు.'
                    : 'Align your camera directly perpendicular to the medicine strip. Slanted angles distort character shapes.'}
                </p>
              </div>

              {/* Pillar 4: Framing */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'te' ? '4. పూర్తి లేబుల్ (Framing)' : '4. Unobstructed Framing'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'te'
                    ? 'మందు బ్రాండ్, కాంపోజిషన్ మరియు తయారీదారు వివరాలు వేళ్ళతో కప్పబడకుండా ఫ్రేమ్‌లో ఉంచండి.'
                    : 'Ensure fingers, shadows, or torn edges do not obstruct the active ingredient name or dosage strength.'}
                </p>
              </div>
            </div>

            {/* Visual Good vs Bad Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Good Example Card */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">
                      {language === 'te' ? 'మంచి ఫోటో ఉదాహరణ (Optimal)' : 'Good Photo Example (Optimal)'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                      98% OCR Accuracy
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80">
                    Flat label, crisp high-contrast text, ambient room lighting, zero foil glare, and full active ingredient text readable.
                  </p>
                </div>
              </div>

              {/* Bad Example Card */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950">
                      {language === 'te' ? 'నివారించాల్సిన ఫోటో (Suboptimal)' : 'Suboptimal Photo (Avoid)'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/80 text-rose-900">
                      OCR Misread Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900/80">
                    Flash glare obscuring milligrams, blurry or out-of-focus camera shake, extreme 45° angle, or fingers covering key warnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Canvas Preview Zone (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-600" />
                {selectedImage ? 'Label Preview & Preprocessing Canvas' : t.dropImageHere}
              </h2>
              {selectedImage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreprocessedView(!showPreprocessedView)}
                    className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showPreprocessedView ? 'Show Original' : 'Show Canvas'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setOcrResult(null);
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Change photo
                  </button>
                </div>
              )}
            </div>

            {selectedImage ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center min-h-[300px]">
                {/* Canvas with applied filters */}
                <canvas
                  ref={canvasRef}
                  className={`max-w-full max-h-[380px] object-contain ${showPreprocessedView ? 'hidden' : 'block'}`}
                />
                {/* Raw original image toggle view */}
                {showPreprocessedView && (
                  <img
                    src={selectedImage}
                    alt="Original Upload"
                    className="max-w-full max-h-[380px] object-contain"
                  />
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center min-h-[280px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">{t.dropImageHere}</p>
                <p className="text-xs text-slate-500 mt-1">{t.orSelectFile}</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Choose Medicine Image
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Action Trigger */}
          {selectedImage && (
            <button
              onClick={handleRunOCR}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.processingImage}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {t.extractTextBtn}
                </>
              )}
            </button>
          )}
        </div>

        {/* Preprocessing Controls Toolbar & OCR Result (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preprocessing Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                {t.preprocessingTitle}
              </h2>
              <button
                onClick={() => setPreprocessingOptions(DEFAULT_PREPROCESSING_OPTIONS)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                {t.resetFilters}
              </button>
            </div>

            {/* Contrast Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{t.contrast}</span>
                <span className="text-teal-700">{preprocessingOptions.contrast}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                value={preprocessingOptions.contrast}
                onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, contrast: parseInt(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Brightness Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{t.brightness}</span>
                <span className="text-teal-700">{preprocessingOptions.brightness}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="80"
                value={preprocessingOptions.brightness}
                onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, brightness: parseInt(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Binarization Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">{t.binarize}</span>
                  <span className="text-[11px] text-slate-500">Converts image to stark high-contrast text</span>
                </div>
                <input
                  type="checkbox"
                  checked={preprocessingOptions.binarize}
                  onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, binarize: e.target.checked })}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </div>

              {preprocessingOptions.binarize && (
                <div className="pl-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Threshold: {preprocessingOptions.binarizationThreshold}</span>
                    <button
                      onClick={() => {
                        if (canvasRef.current) {
                          const ctx = canvasRef.current.getContext('2d');
                          if (ctx) {
                            const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
                            const otsu = calculateOtsuThreshold(imgData);
                            setPreprocessingOptions({ ...preprocessingOptions, binarizationThreshold: otsu });
                          }
                        }
                      }}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Auto-Otsu
                    </button>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="220"
                    value={preprocessingOptions.binarizationThreshold}
                    onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, binarizationThreshold: parseInt(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Noise Reduction & Invert Toggles */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.noiseReduction}
                  onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, noiseReduction: e.target.checked })}
                  className="w-3.5 h-3.5 accent-teal-600 rounded"
                />
                <span>{t.noiseReduction}</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preprocessingOptions.invert}
                  onChange={(e) => setPreprocessingOptions({ ...preprocessingOptions, invert: e.target.checked })}
                  className="w-3.5 h-3.5 accent-teal-600 rounded"
                />
                <span>{t.invert}</span>
              </label>
            </div>
          </div>

          {/* OCR Result Card */}
          {ocrResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  OCR Verification Status
                </h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  ocrResult.confidenceScore >= 0.7
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {Math.round(ocrResult.confidenceScore * 100)}% Confidence
                </span>
              </div>

              {/* Identified Medicine Name */}
              {ocrResult.identifiedName ? (
                <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    {t.confirmedIdentity}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-lg font-extrabold text-slate-900">{ocrResult.identifiedName}</p>
                    {ocrResult.dosage && (
                      <span className="text-xs font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                        {ocrResult.dosage}
                      </span>
                    )}
                  </div>
                  {ocrResult.dosageForm && (
                    <p className="text-xs text-teal-800 font-medium mt-0.5">
                      Formulation: {ocrResult.dosageForm}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                  <p className="font-bold">Medicine Identity Uncertain</p>
                  <p className="mt-1">{ocrResult.rejectionReason}</p>
                </div>
              )}

              {/* Extracted Raw Text Display (Separated) */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  {t.rawExtractedText}
                </span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {ocrResult.rawText}
                </pre>
              </div>

              {/* Next Step Button */}
              <button
                onClick={() => {
                  if (ocrResult.identifiedName && ocrResult.confidenceScore >= 0.7) {
                    handleConfirmAndProceed(ocrResult.identifiedName);
                  } else {
                    setShowUncertaintyModal(true);
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-colors"
              >
                {t.viewEvidenceBtn}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uncertainty & Identity Confirmation Modal */}
      {showUncertaintyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Medicine Identity Confirmation Required</h3>
                <p className="text-xs text-slate-500">Anti-hallucination medicine validation</p>
              </div>
            </div>

            {/* Explanation of uncertainty */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <span className="font-bold block">
                {ocrResult?.isCertain === false
                  ? '⚠️ Confidence is below clinical verification threshold'
                  : '⚠️ Active Medicine Name Ambiguity Detected'}
              </span>
              <p className="leading-relaxed">
                {ocrResult?.uncertaintyReason ||
                  ocrResult?.rejectionReason ||
                  'The scanned label does not clearly show an unmistakable active chemical or brand name. To protect patient safety, MedLens AI does not guess or invent medication identities.'}
              </p>
              {ocrResult?.dosage && (
                <p className="text-amber-800 font-medium pt-1">
                  Detected strength on label: <strong>{ocrResult.dosage}</strong>
                  {ocrResult.dosageForm && ` • Formulation: ${ocrResult.dosageForm}`}
                </p>
              )}
            </div>

            {/* Photo Capture Guidance Tips */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-600" />
                Tips for a clearer photo:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                <li>Lay the blister pack or bottle flat on an evenly lit surface.</li>
                <li>Avoid shiny light reflections or glare directly over the printed drug name.</li>
                <li>Frame the active ingredient chemical name and strength (e.g., 500 mg) in sharp focus.</li>
              </ul>
            </div>

            {/* Confirm or Select Medicine Identity */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-bold text-slate-800 block">
                Select or confirm the exact medicine you have:
              </label>

              {/* Quick Select Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AUTHORITATIVE_MEDICINES.slice(0, 6).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setManualConfirmName(m.medicineName);
                      if (!manualConfirmStrength) {
                        setManualConfirmStrength(m.approvedDosages[0]);
                      }
                    }}
                    className={`p-2.5 text-left rounded-xl text-xs font-bold border transition-all ${
                      manualConfirmName === m.medicineName
                        ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block truncate">{m.medicineName.split('/')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-normal block">{m.approvedDosages[0]}</span>
                  </button>
                ))}
              </div>

              {/* Manual Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Medicine / Generic Name:
                  </label>
                  <input
                    type="text"
                    value={manualConfirmName}
                    onChange={(e) => setManualConfirmName(e.target.value)}
                    placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Strength / Dose:
                  </label>
                  <input
                    type="text"
                    value={manualConfirmStrength}
                    onChange={(e) => setManualConfirmStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUncertaintyModal(false);
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4 text-teal-600" />
                Provide Clearer Image / Retake
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowUncertaintyModal(false)}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAndProceed(manualConfirmName, manualConfirmStrength)}
                  disabled={!manualConfirmName.trim()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Confirm Identity & Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
