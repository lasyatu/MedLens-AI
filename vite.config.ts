import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import { defineConfig, Plugin } from 'vite';
import {
  handleOCR,
  handleRAGExplanation,
  handleComparison,
  handleChat,
  handleAudioTranscription,
  handleDrugInteractions,
  handleGeneralDocumentAnalysis,
  handleCompareDocuments
} from './src/server/apiHandlers';
import { AUTHORITATIVE_MEDICINES, findMedicineRecord } from './src/lib/authoritativeData';
import { parseLabReportText } from './src/lib/reportParser';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      // Use express.json for robust body parsing with generous limits
      server.middlewares.use(express.json({ limit: '25mb' }));

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const sendJson = (data: any, status: number = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          const url = new URL(req.url, 'http://localhost:3000');
          const pathname = url.pathname;
          const body = (req as any).body || {};

          if (pathname === '/api/ocr' && req.method === 'POST') {
            const result = await handleOCR(body.imageBase64 || '', body.mimeType || 'image/jpeg');
            return sendJson(result);
          }

          if (pathname === '/api/rag' && req.method === 'POST') {
            const result = await handleRAGExplanation(body.query || '', body.medicineIdOrName || '');
            return sendJson(result);
          }

          if (pathname === '/api/compare' && req.method === 'POST') {
            const result = handleComparison(body.scans || []);
            return sendJson(result);
          }

          if (pathname === '/api/interactions' && req.method === 'POST') {
            const result = await handleDrugInteractions(body.medicines || []);
            return sendJson(result);
          }

          if (pathname === '/api/general-analysis' && req.method === 'POST') {
            const result = await handleGeneralDocumentAnalysis(
              body.rawText || '',
              body.docType || 'General Document / Academic Report',
              body.docTitle || 'Analyzed Document'
            );
            return sendJson(result);
          }

          if (pathname === '/api/compare-reports' && req.method === 'POST') {
            const result = handleCompareDocuments(
              body.type || 'medical',
              body.docA || { text: '' },
              body.docB || { text: '' }
            );
            return sendJson(result);
          }

          if (pathname === '/api/chat' && req.method === 'POST') {
            const result = await handleChat(
              body.messages || [],
              body.language || 'en',
              body.contextMedicine,
              body.contextReport,
              body.contextGeneralDoc
            );
            return sendJson(result);
          }

          if (pathname === '/api/parse-report' && req.method === 'POST') {
            const parsed = parseLabReportText(body.rawText || '', body.reportTitle);
            return sendJson(parsed);
          }

          if (pathname === '/api/transcribe' && req.method === 'POST') {
            const result = await handleAudioTranscription(body.audioBase64 || '', body.mimeType || 'audio/webm');
            return sendJson(result);
          }

          if (pathname === '/api/medicines' && req.method === 'GET') {
            const query = url.searchParams.get('q');
            if (query) {
              const matched = findMedicineRecord(query);
              return sendJson(matched ? [matched] : []);
            }
            return sendJson(AUTHORITATIVE_MEDICINES);
          }

          if (pathname === '/api/openfda' && req.method === 'GET') {
            const generic = url.searchParams.get('name') || '';
            try {
              const fdaRes = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(generic)}"&limit=1`);
              if (fdaRes.ok) {
                const fdaData = await fdaRes.json();
                return sendJson(fdaData);
              }
            } catch (fdaErr) {
              console.warn('openFDA fetch error, falling back to local monograph:', fdaErr);
            }
            const fallback = findMedicineRecord(generic);
            return sendJson({ results: fallback ? [fallback] : [] });
          }

          sendJson({ error: 'Endpoint not found' }, 404);
        } catch (err: any) {
          console.error('API Error:', err);
          sendJson({ error: err.message || 'Internal Server Error' }, 500);
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
