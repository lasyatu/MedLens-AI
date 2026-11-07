/**
 * Offline Mode Status Indicator Banner
 * Displays network availability, explains what works offline vs online
 */

import React from 'react';
import { Wifi, WifiOff, HardDrive, Cloud, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '../lib/offlineStorage';
import { SupportedLanguage } from '../lib/translations';

interface OfflineIndicatorProps {
  language: SupportedLanguage;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-medium shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
          <span>
            {language === 'te'
              ? 'ఆఫ్‌లైన్ మోడ్ సక్రియంగా ఉంది (No Internet Connection). మీ గత స్కాన్‌లు, ల్యాబ్ రిపోర్టులు మరియు హెల్త్ లైబ్రరీ ఆఫ్‌లైన్‌లో అందుబాటులో ఉన్నాయి.'
              : 'Offline Mode Active. Cached scans, saved lab reports, and offline health library remain accessible.'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-amber-100">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" /> Local Storage Active
          </span>
          <span className="flex items-center gap-1 opacity-75">
            <Cloud className="w-3.5 h-3.5" /> Gemini AI paused
          </span>
        </div>
      </div>
    </div>
  );
};
