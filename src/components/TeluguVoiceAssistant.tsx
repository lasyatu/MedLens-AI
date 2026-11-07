/**
 * Bilingual Voice Assistant Console (Telugu & English)
 * Dedicated hands-free voice consultation screen for both English and Telugu speakers
 * Features:
 * - Real-time speech recognition in Telugu (te-IN) or English (en-US / en-IN)
 * - Switchable voice language toggle
 * - Live transcript preview with edit & clear capabilities
 * - Clear native audio speech synthesis (read-aloud) in chosen language
 * - Clinical questions presets for fast consultation
 * - Emergency 112 guidance
 */

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Send,
  HelpCircle,
  Sparkles,
  PhoneCall,
  Check,
  Globe
} from 'lucide-react';
import { speechService } from '../lib/speechService';
import { SupportedLanguage } from '../lib/translations';

interface TeluguVoiceAssistantProps {
  language: SupportedLanguage;
  onForwardToChat?: (query: string) => void;
}

export const TeluguVoiceAssistant: React.FC<TeluguVoiceAssistantProps> = ({
  language: initialLanguage,
  onForwardToChat
}) => {
  const [voiceLanguage, setVoiceLanguage] = useState<'te' | 'en'>(initialLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseAudioText, setResponseAudioText] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sampleTeluguQuestions = [
    'ఈ మందు దేనికి ఉపయోగిస్తారు?',
    'ఈ మందు వల్ల ఎలాంటి సైడ్ ఎఫెక్ట్స్ వస్తాయి?',
    'ఖాళీ కడుపుతో ఈ మాత్ర వేసుకోవచ్చా?',
    'షుగర్ ఉన్నవారు ఏ ఆహారం తీసుకోవాలి?',
    'నా రక్తపోటు 140/90 ఉంది, ఇది ప్రమాదకరమా?'
  ];

  const sampleEnglishQuestions = [
    'What is this medicine used for and how does it work?',
    'What are the common side effects and warnings for Paracetamol?',
    'Can I take this antibiotic on an empty stomach?',
    'What are the dietary recommendations for managing type 2 diabetes?',
    'My blood pressure reading is 140/90 mmHg. When should I consult a doctor?'
  ];

  const handleStartRecording = () => {
    setErrorMessage(null);
    setIsRecording(true);
    setResponseAudioText(null);

    const langCode = voiceLanguage === 'te' ? 'te-IN' : 'en-US';

    speechService.startListening(
      (text) => {
        setTranscript(text);
      },
      (err) => {
        setErrorMessage(err);
        setIsRecording(false);
      },
      langCode
    );
  };

  const handleStopRecording = () => {
    speechService.stopListening();
    setIsRecording(false);
  };

  const handleExecuteVoiceQuery = async (queryText?: string) => {
    const q = (queryText || transcript).trim();
    if (!q) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          language: voiceLanguage
        })
      });

      if (!res.ok) throw new Error('Voice query service unavailable');
      const data = await res.json();
      setResponseAudioText(data.reply);

      speechService.speak(
        data.reply,
        voiceLanguage,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    } catch (e: any) {
      setErrorMessage(
        voiceLanguage === 'te'
          ? 'వాయిస్ సమాధానం పొందడంలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా సాధారణ చాట్‌ని ఉపయోగించండి.'
          : 'Could not fetch voice response. Please try again or use the Ask MedLens AI chat.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAudio = () => {
    if (!responseAudioText) return;
    if (isPlayingAudio) {
      speechService.stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      speechService.speak(
        responseAudioText,
        voiceLanguage,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 text-xs font-semibold text-teal-200 border border-teal-600/50">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              {voiceLanguage === 'te'
                ? 'తెలుగు వాయిస్ అసిస్టెంట్ (Telugu Voice Assistant)'
                : 'English Voice Assistant (తెలుగు & English)'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {voiceLanguage === 'te' ? 'మీ ప్రశ్నను తెలుగులో అడగండి' : 'Ask Health Questions by Voice'}
            </h1>
            <p className="text-sm text-teal-100/90 font-normal">
              {voiceLanguage === 'te'
                ? 'టైప్ చేయాల్సిన అవసరం లేదు. మైక్రోఫోన్ నొక్కి మాట్లాడండి, సమాధానాన్ని తెలుగులో వినండి.'
                : 'No typing needed. Tap the microphone to speak your question in English or Telugu, review your transcript, and listen to verified spoken answers.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-teal-900/80 p-1 rounded-xl border border-teal-600/60 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setVoiceLanguage('en');
                  setTranscript('');
                  setResponseAudioText(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  voiceLanguage === 'en'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                English Voice
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceLanguage('te');
                  setTranscript('');
                  setResponseAudioText(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  voiceLanguage === 'te'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] uppercase tracking-wider text-teal-200 block font-bold">
                Emergency 112
              </span>
              <span className="text-xs text-white">
                {voiceLanguage === 'te' ? 'అత్యవసర సహాయం' : 'Emergency Assistance'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Microphone Console */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
        <div className="flex justify-center">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-8 ring-rose-100'
                : 'bg-teal-600 hover:bg-teal-700 text-white ring-8 ring-teal-50 hover:scale-105'
            }`}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            <span className="text-xs font-bold mt-1">
              {isRecording
                ? voiceLanguage === 'te'
                  ? 'ఆపండి (Stop)'
                  : 'Stop'
                : voiceLanguage === 'te'
                ? 'మాట్లాడండి'
                : 'Speak Now'}
            </span>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {isRecording
              ? voiceLanguage === 'te'
                ? 'శ్రద్ధగా వింటున్నాము... తెలుగులో మాట్లాడండి'
                : 'Listening carefully... speak your question now in English'
              : voiceLanguage === 'te'
              ? 'మైక్ బటన్ నొక్కి మీ ప్రశ్న మాట్లాడండి'
              : 'Tap microphone and ask any medicine, symptom, or wellness question'}
          </p>
          <p className="text-xs text-slate-500">
            Speech Recognition active for: {voiceLanguage === 'te' ? 'Telugu (te-IN)' : 'English (en-US / en-IN)'}
          </p>
        </div>

        <div className="max-w-xl mx-auto text-left space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            {voiceLanguage === 'te'
              ? 'గుర్తించిన మాటలు (సవరించవచ్చు):'
              : 'Recognized Transcript (Editable before asking):'}
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder={
              voiceLanguage === 'te'
                ? 'మీరు మాట్లాడిన మాటలు ఇక్కడ కనిపిస్తాయి...'
                : 'Spoken words will appear here in real-time...'
            }
            className="w-full p-4 rounded-xl border border-slate-300 text-sm font-medium focus:outline-teal-600 bg-slate-50/50"
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setTranscript('')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {voiceLanguage === 'te' ? 'క్లియర్ చేయండి' : 'Clear'}
            </button>

            <button
              onClick={() => handleExecuteVoiceQuery()}
              disabled={!transcript.trim() || loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              {loading
                ? voiceLanguage === 'te'
                  ? 'సమాధానం వెతుకుతోంది...'
                  : 'Analyzing with Gemini...'
                : voiceLanguage === 'te'
                ? 'సమాధానం పొందండి'
                : 'Ask Voice Assistant'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="max-w-xl mx-auto p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Response Box with Audio Read-Aloud */}
      {responseAudioText && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-teal-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {voiceLanguage === 'te' ? 'తెలుగులో వివరణ & సమాధానం' : 'Spoken Clinical Answer'}
                </h3>
                <span className="text-[11px] text-teal-700 font-semibold">
                  {voiceLanguage === 'te' ? 'తెలుగు ఆడియో సిద్ధంగా ఉంది' : 'English Audio Speech Synthesis Ready'}
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleAudio}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition-colors"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  {voiceLanguage === 'te' ? 'ఆడియో ఆపండి (Stop)' : 'Stop Audio'}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  {voiceLanguage === 'te' ? 'సమాధానం వినండి (Play)' : 'Listen Aloud'}
                </>
              )}
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line border border-slate-200">
            {responseAudioText}
          </div>
        </div>
      )}

      {/* Sample Questions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {voiceLanguage === 'te'
            ? 'సాధారణ ప్రశ్నల ఉదాహరణలు (నొక్కి వెంటనే అడగవచ్చు):'
            : 'Example Questions (Tap to ask immediately):'}
        </h4>
        <div className="flex flex-wrap gap-2">
          {(voiceLanguage === 'te' ? sampleTeluguQuestions : sampleEnglishQuestions).map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(q);
                handleExecuteVoiceQuery(q);
              }}
              className="text-xs px-3.5 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-800 rounded-xl border border-slate-200 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
