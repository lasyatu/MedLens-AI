/**
 * High-Fidelity Medical PDF Generator for Laboratory Report Summaries
 * Generates vector PDF document locally in browser without external server calls.
 * Formatted for patient offline review, doctor sharing, and record keeping.
 */

import { LabTestMetric } from './reportParser';

export interface PDFReportData {
  reportTitle: string;
  reportDate: string;
  laboratoryName?: string;
  patientName?: string;
  metrics: LabTestMetric[];
  summary: string;
  abnormalCount: number;
  sources?: { title: string; organization: string }[];
}

/**
 * Clean text for safe rendering
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate formatted HTML report suitable for print and PDF saving
 */
export function generateReportHtml(data: PDFReportData): string {
  const generatedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const rows = data.metrics.map((m) => {
    const isAbnormal = m.flag === 'HIGH' || m.flag === 'LOW';
    const badgeColor =
      m.flag === 'HIGH'
        ? 'background:#ffe4e6;color:#9f1239;border:1px solid #fecdd3;'
        : m.flag === 'LOW'
        ? 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'
        : 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;';

    const valueColor = isAbnormal ? 'color:#b91c1c;font-weight:700;' : 'color:#0f172a;font-weight:600;';

    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-weight:600;color:#0f172a;font-size:12px;">
          ${escapeHtml(m.testName)}
          <div style="font-size:10px;color:#64748b;font-weight:400;margin-top:2px;">Category: ${escapeHtml(m.category)}</div>
        </td>
        <td style="padding:10px 12px;font-size:12px;${valueColor}">
          ${escapeHtml(String(m.value))}
        </td>
        <td style="padding:10px 12px;color:#475569;font-size:11px;">
          ${escapeHtml(m.unit || '-')}
        </td>
        <td style="padding:10px 12px;color:#334155;font-size:11px;font-family:monospace;">
          ${escapeHtml(m.referenceRange || '-')}
        </td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="display:inline-block;padding:3px 8px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:0.025em;${badgeColor}">
            ${m.flag}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const clinicalNotes = data.metrics
    .filter((m) => m.flag === 'HIGH' || m.flag === 'LOW')
    .map(
      (m) => `
      <div style="margin-bottom:8px;padding:8px 12px;background:#fff;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;">
        <strong style="color:#0f172a;">${escapeHtml(m.testName)}:</strong>
        <span style="color:#475569;margin-left:4px;">${escapeHtml(m.clinicalContext || m.plainExplanation)}</span>
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.reportTitle)} - MedLens AI Summary</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 12mm 15mm 15mm 15mm; size: A4 portrait; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
    }
  </style>
</head>
<body>
  <!-- Print Header Toolbar for Browser Preview -->
  <div class="no-print" style="margin-bottom:20px;padding:12px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;display:flex;align-items:center;justify-content:between;gap:12px;">
    <div style="font-size:12px;color:#0f766e;font-weight:600;">
      📄 Print / Save as PDF: Use your browser's Print dialog ("Save as PDF" destination).
    </div>
    <button onclick="window.print()" style="background:#0d9488;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">
      Print / Save PDF Now
    </button>
  </div>

  <!-- Document Header -->
  <div style="border-bottom:2px solid #0d9488;padding-bottom:14px;margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
            Med<span style="color:#0d9488;">Lens</span> AI
          </span>
          <span style="background:#ccfbf1;color:#0f766e;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid #99f6e4;">
            Clinical Laboratory Summary
          </span>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">
          Evidence-Grounded Patient Health Literacy & Biomarker Analysis
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#475569;">
        <div><strong>Report Date:</strong> ${escapeHtml(data.reportDate)}</div>
        <div style="color:#94a3b8;font-size:10px;margin-top:2px;">Generated: ${escapeHtml(generatedAt)}</div>
      </div>
    </div>
  </div>

  <!-- Report Metadata Card -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;gap:16px;">
    <div>
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Report Title</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${escapeHtml(data.reportTitle)}</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Total Parameters</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${data.metrics.length} Analyzed</div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Attention Flags</div>
      <div style="font-size:14px;font-weight:700;color:${data.abnormalCount > 0 ? '#b91c1c' : '#059669'};margin-top:2px;">
        ${data.abnormalCount} Out of Range
      </div>
    </div>
  </div>

  <!-- Key Clinical Summary Statement -->
  <div style="background:#f0fdfa;border-left:4px solid #0d9488;padding:10px 14px;border-radius:4px;margin-bottom:18px;">
    <div style="font-size:11px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:0.04em;">Analysis Overview</div>
    <div style="font-size:12px;color:#134e4a;margin-top:3px;font-weight:500;">
      ${escapeHtml(data.summary)}
    </div>
  </div>

  <!-- Results Table -->
  <div style="margin-bottom:20px;">
    <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;">
      Laboratory Test Parameters & Reference Ranges
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;text-align:left;">
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;">Test Name</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;">Result Value</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;">Unit</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;">Reference Range</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <!-- Out-of-Range Clinical Educational Guidance -->
  ${clinicalNotes.length > 0 ? `
  <div style="margin-bottom:20px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px 14px;">
    <div style="font-size:11px;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">
      Educational Context for Out-of-Range Biomarkers
    </div>
    ${clinicalNotes}
  </div>
  ` : ''}

  <!-- Preparing Questions for Your Doctor -->
  <div style="margin-bottom:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;">
    <div style="font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">
      Recommended Questions to Ask Your Prescribing Physician
    </div>
    <ul style="margin:0;padding-left:18px;font-size:11px;color:#475569;">
      <li style="margin-bottom:3px;">Are these values consistent with my baseline clinical history and symptoms?</li>
      <li style="margin-bottom:3px;">Are any of my current medications, supplements, or recent dietary changes influencing these markers?</li>
      <li style="margin-bottom:3px;">Is a repeat evaluation recommended in 4–12 weeks to confirm persistence?</li>
      <li>Do these findings warrant lifestyle modifications (diet, exercise, hydration) or pharmacological intervention?</li>
    </ul>
  </div>

  <!-- Safety & Clinical Disclaimer Footer -->
  <div style="border-top:1px solid #e2e8f0;padding-top:10px;font-size:9.5px;color:#64748b;line-height:1.4;">
    <strong>Medical Safety Notice:</strong> MedLens AI provides algorithmic health literacy summaries extracted from user-supplied laboratory records and verified clinical reference standards (ICMR / AIIMS / WHO). This summary does not constitute a clinical disease diagnosis or treatment plan. An isolated out-of-range value must always be interpreted by a registered medical professional in correlation with physical examination. In case of acute symptoms (e.g. chest pain, severe breathlessness), contact national emergency services (India: 112).
  </div>
</body>
</html>
  `;
}

/**
 * Trigger immediate browser download / print-to-PDF flow
 */
export function downloadReportAsPDF(data: PDFReportData): void {
  const html = generateReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  // Open formatted report in a clean popup window with automated print trigger
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      // Trigger browser print to PDF
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn('Auto print trigger note:', e);
        }
      }, 350);
    };
  } else {
    // If popups are blocked, download HTML file directly with clear naming
    const sanitizedTitle = data.reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `MedLens_Lab_Report_${sanitizedTitle}_${data.reportDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
