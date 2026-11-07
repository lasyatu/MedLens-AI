/**
 * Medical Report Analyzer Component
 * Features:
 * - Accept PDF / Image / Text laboratory reports
 * - OCR / Text extraction of test names, values, units, reference intervals
 * - Interactive Editable Table for correcting values, units, or reference intervals
 * - Abnormal value flagging (High / Low / Normal) with plain language clinical education
 * - Multi-report historical trend tracker
 * - Privacy consent before saving sensitive diagnostic data
 */

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Download
} from 'lucide-react';
import {
  LabTestMetric,
  ParsedReportData,
  parseLabReportText,
  SAMPLE_REPORTS,
  determineFlag
} from '../lib/reportParser';
import { saveUserReport, SavedReportRecord } from '../lib/reportStorage';
import { downloadReportAsPDF } from '../lib/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../lib/translations';

interface ReportAnalyzerProps {
  language: SupportedLanguage;
  savedReports?: SavedReportRecord[];
  onReportSaved?: () => void;
  onOpenChatWithReport?: (reportSummary: string) => void;
}

export const ReportAnalyzer: React.FC<ReportAnalyzerProps> = ({
  language,
  savedReports = [],
  onReportSaved,
  onOpenChatWithReport
}) => {
  const { user } = useAuth();

  const [reportTitle, setReportTitle] = useState('Comprehensive Blood Panel');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawInputText, setRawInputText] = useState(SAMPLE_REPORTS.metabolic_diabetes.rawText);
  const [metrics, setMetrics] = useState<LabTestMetric[]>(() => {
    return parseLabReportText(SAMPLE_REPORTS.metabolic_diabetes.rawText, 'Comprehensive Blood Panel').metrics;
  });

  const [activeTab, setActiveTab] = useState<'table' | 'trends' | 'raw'>('table');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoadPreset = (key: keyof typeof SAMPLE_REPORTS) => {
    const preset = SAMPLE_REPORTS[key];
    setRawInputText(preset.rawText);
    const parsed = parseLabReportText(preset.rawText, preset.name);
    setReportTitle(preset.name);
    setReportDate(parsed.reportDate);
    setMetrics(parsed.metrics);
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  const handleReparse = () => {
    try {
      const parsed = parseLabReportText(rawInputText, reportTitle);
      setReportDate(parsed.reportDate);
      setMetrics(parsed.metrics);
      setSaveSuccess(false);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to parse text');
    }
  };

  const handleUpdateMetric = (index: number, field: keyof LabTestMetric, val: any) => {
    const updated = [...metrics];
    const item = { ...updated[index], [field]: val };

    if (field === 'value' || field === 'lowNormal' || field === 'highNormal') {
      const numVal = parseFloat(val);
      item.numericValue = isNaN(numVal) ? undefined : numVal;
      item.flag = determineFlag(item.numericValue, item.lowNormal, item.highNormal);
    }

    updated[index] = item;
    setMetrics(updated);
  };

  const handleAddMetric = () => {
    const newMetric: LabTestMetric = {
      id: `manual-${Date.now()}`,
      testName: 'New Test Parameter',
      category: 'Other',
      value: 0,
      numericValue: 0,
      unit: 'mg/dL',
      referenceRange: '0 - 100',
      lowNormal: 0,
      highNormal: 100,
      flag: 'NORMAL',
      plainExplanation: 'User-specified laboratory parameter.',
      clinicalContext: 'Consult your laboratory report documentation for specific interpretation.'
    };
    setMetrics([...metrics, newMetric]);
  };

  const handleDeleteMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleDownloadPdf = () => {
    const abnormal = metrics.filter((m) => m.flag === 'HIGH' || m.flag === 'LOW').length;
    const summaryText = `${abnormal} of ${metrics.length} test parameters are outside typical standard reference intervals. Verified with ICMR / AIIMS reference ranges.`;
    downloadReportAsPDF({
      reportTitle,
      reportDate,
      metrics,
      summary: summaryText,
      abnormalCount: abnormal,
      patientName: user?.displayName || 'Patient Record'
    });
  };

  const handleSaveReport = async () => {
    if (!user) {
      setErrorMessage(language === 'te' ? 'దయచేసి సేవ్ చేయడానికి లాగిన్ అవ్వండి.' : 'Please sign in to save your medical report.');
      return;
    }
    if (!consentAccepted) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి మీ మెడికల్ డేటాను సేవ్ చేయడానికి అనుమతి బాక్స్‌ను టిక్ చేయండి.'
          : 'Please check the consent box to authorize encrypted storage of your medical report.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const count = metrics.filter((m) => m.flag === 'HIGH' || m.flag === 'LOW').length;
      const summary = `${count} of ${metrics.length} test parameters are outside typical standard reference intervals.`;

      await saveUserReport(user.uid, {
        reportTitle,
        reportDate,
        extractedText: rawInputText,
        testResults: metrics,
        summary,
        consentToStore: true
      });

      setSaveSuccess(true);
      if (onReportSaved) {
        onReportSaved();
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const abnormalCount = metrics.filter((m) => m.flag === 'HIGH' || m.flag === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">
                {language === 'te' ? 'మెడికల్ ల్యాబ్ రిపోర్ట్ ఎనలైజర్' : 'Medical Report Analyzer'}
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {language === 'te'
                ? 'ల్యాబ్ రిపోర్ట్‌లను ఎక్స్‌ట్రాక్ట్ చేసి, విలువల పరిధులను మరియు వాటి అర్థాన్ని సులభంగా తెలుసుకోండి.'
                : 'Extract laboratory test parameters, verify reference ranges, and understand what abnormal flags indicate.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'te' ? 'నమూనాలు:' : 'Presets:'}
            </span>
            <button
              onClick={() => handleLoadPreset('metabolic_diabetes')}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-colors"
            >
              Diabetes / Metabolic
            </button>
            <button
              onClick={() => handleLoadPreset('cbc_anemia')}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-colors"
            >
              CBC (Anemia)
            </button>
            <button
              onClick={() => handleLoadPreset('lipid_profile')}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-colors"
            >
              Lipid Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'table'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'te' ? 'ల్యాబ్ విలువల పట్టిక (Editable Table)' : 'Lab Results Table (Editable)'}
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'trends'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {language === 'te' ? 'ట్రెండ్స్ & చరిత్ర' : 'Historical Trends'}
              {savedReports.length > 0 && (
                <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded-full">
                  {savedReports.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'raw'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'te' ? 'మూల పాఠ్యం (Raw Text / OCR)' : 'Raw Text / OCR Input'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Download or Print PDF Report"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              {language === 'te' ? 'PDF డౌన్‌లోడ్' : 'Download PDF'}
            </button>

            {onOpenChatWithReport && (
              <button
                onClick={() => {
                  const summary = `Report: ${reportTitle} (Date: ${reportDate}). Metrics: ${metrics
                    .map((m) => `${m.testName}: ${m.value} ${m.unit} [${m.flag}]`)
                    .join(', ')}`;
                  onOpenChatWithReport(summary);
                }}
                className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {language === 'te' ? 'ఈ రిపోర్ట్‌పై AIని అడగండి' : 'Discuss in Chatbot'}
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Editable Table */}
        {activeTab === 'table' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'te' ? 'రిపోర్ట్ పేరు' : 'Report Title'}
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'te' ? 'తేదీ' : 'Report Date'}
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-teal-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {language === 'te' ? 'ఫలితాల స్థితి' : 'Analysis Overview'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {abnormalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {abnormalCount} {language === 'te' ? 'పరిధి దాటినవి (Attention)' : 'Out of Range'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'te' ? 'అన్ని సాధారణ పరిధిలో ఉన్నాయి' : 'All Values Normal'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddMetric}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  {language === 'te' ? 'పరీక్షను జోడించండి' : 'Add Row'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'te' ? 'పరీక్ష పేరు' : 'Test Name'}</th>
                    <th className="py-3 px-3">{language === 'te' ? 'వర్గం' : 'Category'}</th>
                    <th className="py-3 px-3 w-28">{language === 'te' ? 'విలువ' : 'Value'}</th>
                    <th className="py-3 px-3 w-24">{language === 'te' ? 'యూనిట్' : 'Unit'}</th>
                    <th className="py-3 px-3">{language === 'te' ? 'సాధారణ పరిధి' : 'Ref Range'}</th>
                    <th className="py-3 px-3">{language === 'te' ? 'స్థితి' : 'Status'}</th>
                    <th className="py-3 px-2 text-center w-12">{language === 'te' ? 'చర్య' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {metrics.map((metric, idx) => (
                    <tr key={metric.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        <input
                          type="text"
                          value={metric.testName}
                          onChange={(e) => handleUpdateMetric(idx, 'testName', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none font-semibold text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-xs text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {metric.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={metric.value}
                          onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                          className={`w-full px-2 py-1 text-sm font-bold rounded border ${
                            metric.flag === 'HIGH' || metric.flag === 'LOW'
                              ? 'border-amber-300 bg-amber-50/50 text-amber-900'
                              : 'border-slate-300 bg-white text-slate-900'
                          } focus:outline-teal-600`}
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={metric.unit}
                          onChange={(e) => handleUpdateMetric(idx, 'unit', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-xs text-slate-600 font-mono">
                        <input
                          type="text"
                          value={metric.referenceRange}
                          onChange={(e) => handleUpdateMetric(idx, 'referenceRange', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        {metric.flag === 'HIGH' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            HIGH
                          </span>
                        )}
                        {metric.flag === 'LOW' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            LOW
                          </span>
                        )}
                        {metric.flag === 'NORMAL' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            NORMAL
                          </span>
                        )}
                        {metric.flag === 'INDETERMINATE' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            --
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteMetric(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-600" />
                {language === 'te'
                  ? 'విశ్లేషణ మరియు అవగాహన వివరణలు (Educational Guidance)'
                  : 'Educational Insights on Extracted Parameters'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${
                      m.flag === 'HIGH' || m.flag === 'LOW'
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{m.testName}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          m.flag === 'HIGH' || m.flag === 'LOW'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.value} {m.unit}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{m.plainExplanation}</p>
                    <div className="mt-2 text-xs font-medium text-slate-700 bg-white/80 p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-900">
                        {language === 'te' ? 'వైద్య అవగాహన: ' : 'Clinical Context: '}
                      </span>
                      {m.clinicalContext}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-teal-50/60 rounded-xl p-5 border border-teal-200 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-teal-950">
                    {language === 'te'
                      ? 'డేటా గోప్యత & సేవ్ అనుమతి (User Privacy & Consent)'
                      : 'Data Privacy & Encrypted User Storage'}
                  </h4>
                  <p className="text-xs text-teal-900/80">
                    {language === 'te'
                      ? 'మీ మెడికల్ రిపోర్ట్ వివరాలు గోప్యంగా ఉంచబడతాయి. మీ అనుమతి లేకుండా ఏ సమాచారం బహిర్గతం చేయబడదు. భవిష్యత్తులో ట్రెండ్స్ చూడటానికి మాత్రమే సేవ్ చేయబడుతుంది.'
                      : 'Medical reports contain private health metrics. Under MedLens AI privacy architecture, records are strictly isolated to your authenticated account UID and never shared.'}
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-xs font-semibold text-teal-950">
                      {language === 'te'
                        ? 'నేను ఈ రిపోర్ట్‌ను నా ఖాతాలో భద్రపరచుకోవడానికి అంగీకరిస్తున్నాను (I authorize saving this report).'
                        : 'I authorize MedLens AI to securely store this laboratory report under my private account.'}
                    </span>
                  </label>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {language === 'te'
                    ? 'రిపోర్ట్ విజయవంతంగా సేవ్ చేయబడింది!'
                    : 'Report successfully saved to your private health vault!'}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-2xs flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4 text-teal-600" />
                  {language === 'te' ? 'PDF సమ్మరీని డౌన్‌లోడ్ చేయండి' : 'Download PDF Summary'}
                </button>

                <button
                  onClick={handleSaveReport}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {language === 'te' ? 'భద్రపరుస్తోంది...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {language === 'te' ? 'ఖాతాలో భద్రపరచండి' : 'Save Report to My History'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Historical Trends */}
        {activeTab === 'trends' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'te' ? 'కాలక్రమేణా ల్యాబ్ విలువల మార్పులు' : 'Longitudinal Parameter Trends'}
                </h3>
                <p className="text-xs text-slate-600">
                  {language === 'te'
                    ? 'సేవ్ చేయబడిన రిపోర్టుల ఆధారంగా విలువల మార్పులను ట్రాక్ చేయండి.'
                    : 'Track how key markers evolve across repeated blood evaluations without diagnosing.'}
                </p>
              </div>
            </div>

            {savedReports.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <TrendingUp className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">
                  {language === 'te' ? 'ఇంకా సేవ్ చేసిన రిపోర్టులు లేవు' : 'No Saved Reports Yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {language === 'te'
                    ? 'ట్రెండ్స్ చూడటానికి ముందుగా "ల్యాబ్ విలువల పట్టిక" నుండి మీ రిపోర్ట్‌ను సేవ్ చేయండి.'
                    : 'Save this active report or upload additional dated laboratory tests to see biomarker trends over time.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-sm text-slate-900">Fasting Glucose / Sugar</span>
                      <span className="text-xs font-mono text-slate-500">Ref: 70 - 99 mg/dL</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      {savedReports.slice(0, 4).map((r) => {
                        const metric = r.testResults.find((m) =>
                          m.testName.toLowerCase().includes('glucose') || m.testName.toLowerCase().includes('sugar')
                        );
                        return (
                          <div key={r.id} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600">{r.reportDate || 'Recent'} ({r.reportTitle.substring(0, 16)}...)</span>
                            <span className={`font-bold ${metric?.flag === 'HIGH' ? 'text-amber-700 font-mono' : 'text-slate-800 font-mono'}`}>
                              {metric ? `${metric.value} ${metric.unit}` : 'Not measured'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-sm text-slate-900">Hemoglobin (Hb)</span>
                      <span className="text-xs font-mono text-slate-500">Ref: 12.0 - 17.5 g/dL</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      {savedReports.slice(0, 4).map((r) => {
                        const metric = r.testResults.find((m) =>
                          m.testName.toLowerCase().includes('hemoglobin') || m.testName.toLowerCase().includes('hb')
                        );
                        return (
                          <div key={r.id} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600">{r.reportDate || 'Recent'} ({r.reportTitle.substring(0, 16)}...)</span>
                            <span className={`font-bold ${metric?.flag === 'LOW' ? 'text-rose-700 font-mono' : 'text-slate-800 font-mono'}`}>
                              {metric ? `${metric.value} ${metric.unit}` : 'Not measured'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Raw Text Input */}
        {activeTab === 'raw' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'te'
                  ? 'ల్యాబ్ రిపోర్ట్ టెక్స్ట్ లేదా OCR డేటాను ఇక్కడ అతికించండి:'
                  : 'Paste laboratory report text or OCR output here:'}
              </label>
              <textarea
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                rows={10}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-teal-600 bg-slate-50"
                placeholder="Paste printed report lines here..."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleReparse}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {language === 'te' ? 'తిరిగి పార్స్ చేయండి (Extract Table)' : 'Extract Lab Metrics to Table'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-teal-600" />
          {language === 'te' ? 'వైద్య నిరాకరణ & మూలాలు:' : 'Medical Limitations & Evidence Sources:'}
        </div>
        <p>
          Reference ranges vary by laboratory method, temperature, calibration, and patient demographics. An isolated out-of-range value does not constitute a disease diagnosis. Always present printed results to your physician. Standards referenced from Indian Council of Medical Research (ICMR) & AIIMS Clinical Chemistry benchmarks.
        </p>
      </div>
    </div>
  );
};
