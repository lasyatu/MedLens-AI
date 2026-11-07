/**
 * Offline Health Library Component
 * 100% static, clinically verified articles cached locally
 */

import React, { useState } from 'react';
import {
  BookOpen,
  WifiOff,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { OFFLINE_HEALTH_LIBRARY, HealthGuideArticle } from '../lib/offlineStorage';
import { SupportedLanguage } from '../lib/translations';

interface OfflineLibraryProps {
  language: SupportedLanguage;
}

export const OfflineLibrary: React.FC<OfflineLibraryProps> = ({ language }) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(OFFLINE_HEALTH_LIBRARY[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const activeArticle =
    OFFLINE_HEALTH_LIBRARY.find((a) => a.id === selectedArticleId) || OFFLINE_HEALTH_LIBRARY[0];

  const filteredArticles = OFFLINE_HEALTH_LIBRARY.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.teluguTitle.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {language === 'te'
                    ? 'ఆఫ్‌లైన్ ఆరోగ్య విజ్ఞాన నిధి (Offline Health Library)'
                    : 'Offline Verified Health Library'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> 100% Offline Ready
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {language === 'te'
                  ? 'ఇంటర్నెట్ లేకపోయినా బ్రౌజర్‌లో అందుబాటులో ఉండే శాస్త్రీయ ఆరోగ్య మార్గదర్శకాలు.'
                  : 'Peer-reviewed clinical guides stored permanently on your device for emergency or zero-signal access.'}
              </p>
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'te' ? 'విషయాన్ని వెతకండి...' : 'Search clinical topic...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-teal-600"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticleId(article.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedArticleId === article.id
                  ? 'bg-teal-50/80 border-teal-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {article.readingTimeMinutes} min read
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {language === 'te' ? article.teluguTitle : article.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 truncate">{article.sourceAuthority}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                {activeArticle.category}
              </span>
              <span>•</span>
              <span>Updated: {activeArticle.lastUpdated}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {language === 'te' ? activeArticle.teluguTitle : activeArticle.title}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                Verified Authority: <strong className="text-slate-800">{activeArticle.sourceAuthority}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            {activeArticle.sections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'te' ? sec.teluguHeading : sec.heading}
                </h3>
                <p className="text-slate-600">
                  {language === 'te' ? sec.teluguContent : sec.content}
                </p>

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <ul className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>Primary Reference: {activeArticle.sourceAuthority}</span>
            <a
              href={activeArticle.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold"
            >
              Verify source repository <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
