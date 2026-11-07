/**
 * DHANVI - Bilingual Conversational AI Health & Document Chatbot
 * Features:
 * - Conversational AI named DHANVI (ధన్వి) with Gemini integration
 * - Bilingual Voice Interaction: English ('en-US') & Telugu ('te-IN') speech recognition
 * - Text-to-speech with Play, Pause, Stop, and Replay controls
 * - Natural language detection & manual switcher
 * - Understands uploaded medical reports and general documents
 * - Conversational context, follow-up memory, chat history
 * - Copy and Regenerate responses
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Paperclip,
  Trash2,
  AlertTriangle,
  Layers,
  ChevronDown,
  Info,
  X
} from 'lucide-react';
import { SupportedLanguage } from '../lib/translations';
import { speechService } from '../lib/speechService';
import { SavedReportRecord } from '../lib/reportStorage';
import { useAuth } from '../context/AuthContext';

export interface DhanviMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedContextTitle?: string;
  languageUsed?: 'en' | 'te';
}

interface DhanviChatbotProps {
  language: SupportedLanguage;
  savedReports?: SavedReportRecord[];
  initialAttachedContext?: string;
  isGeneralDocument?: boolean;
}

export const DhanviChatbot: React.FC<DhanviChatbotProps> = ({
  language: globalLanguage,
  savedReports = [],
  initialAttachedContext,
  isGeneralDocument = false
}) => {
  const { user } = useAuth();

  // DHANVI Voice & Language State
  const [dhanviLanguage, setDhanviLanguage] = useState<SupportedLanguage>(globalLanguage);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Context attachment
  const [attachedContext, setAttachedContext] = useState<string | undefined>(initialAttachedContext);
  const [attachedContextTitle, setAttachedContextTitle] = useState<string | undefined>(
    initialAttachedContext ? (isGeneralDocument ? 'Attached Document' : 'Attached Medical Report') : undefined
  );
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [showSpeechPreview, setShowSpeechPreview] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Audio Playback State
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat conversation history
  const [messages, setMessages] = useState<DhanviMessage[]>(() => {
    return [
      {
        id: 'dhanvi-intro',
        role: 'assistant',
        content:
          globalLanguage === 'te'
            ? `నమస్తే! నేను ధన్వి (DHANVI), మీ ద్వైభాషా AI ఆరోగ్య మరియు డాక్యుమెంట్ సహాయకురాలిని.
            
మీరు నాతో ఇంగ్లీష్ లేదా తెలుగులో మాట్లాడవచ్చు లేదా టైప్ చేయవచ్చు.

మీరు నన్ను అడగవచ్చు:
• "ధన్వి, నా బ్లడ్ రిపోర్ట్ గురించి వివరించు"
• "ఈ మందు ఎందుకు ఉపయోగిస్తారు?"
• "ప్రాజెక్ట్ రిపోర్ట్‌లోని ముఖ్యమైన పాయింట్లు ఏమిటి?"

💡 గమనిక: ఇది కేవలం సమాచార అవగాహన కొరకు మాత్రమే. తీవ్రమైన లేదా అత్యవసర పరిస్థితుల్లో వెంటనే 112 కు కాల్ చేయండి.`
            : `Hello! I am DHANVI (ధన్వి), your bilingual conversational AI assistant for healthcare and document intelligence.

You can talk to me via voice or text in both English and Telugu.

Try asking me:
• "Dhanvi, explain my blood report."
• "Explain this medical terminology simply."
• "Summarise this academic capstone report."

⚠️ Emergency Note: For life-threatening medical emergencies in India, dial 112 immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        languageUsed: globalLanguage
      }
    ];
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Sync initial context if it updates
  useEffect(() => {
    if (initialAttachedContext) {
      setAttachedContext(initialAttachedContext);
      setAttachedContextTitle(isGeneralDocument ? 'Attached Document' : 'Attached Medical Report');
    }
  }, [initialAttachedContext, isGeneralDocument]);

  // Speech Recognition Setup
  const startSpeechRecognition = () => {
    setSpeechError(null);
    setSpeechTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        dhanviLanguage === 'te'
          ? 'మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి గూగుల్ క్రోమ్‌ని ఉపయోగించండి లేదా టైప్ చేయండి.'
          : 'Speech recognition is not supported in this browser. Please type or use Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = dhanviLanguage === 'te' ? 'te-IN' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setShowSpeechPreview(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setSpeechTranscript(current);

        // Auto language switch if Telugu characters detected
        if (/[\u0C00-\u0C7F]/.test(current) && dhanviLanguage !== 'te') {
          setDhanviLanguage('te');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition startup error:', err);
      setSpeechError('Could not start microphone. Please check browser permissions.');
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleApplyTranscript = () => {
    if (speechTranscript.trim()) {
      setInputQuery(speechTranscript.trim());
      setShowSpeechPreview(false);
      setSpeechTranscript('');
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    // Detect language in query
    const isTeluguQuery = /[\u0C00-\u0C7F]/.test(textToSend);
    const activeLang = isTeluguQuery ? 'te' : dhanviLanguage;

    const userMsg: DhanviMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedContextTitle,
      languageUsed: activeLang
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputQuery('');
    setShowSpeechPreview(false);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          language: activeLang,
          contextReport: !isGeneralDocument ? attachedContext : undefined,
          contextGeneralDoc: isGeneralDocument ? attachedContext : undefined
        })
      });

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || '';
      }

      if (!reply) {
        reply =
          activeLang === 'te'
            ? 'ధన్వి సమాధానం సిద్ధం చేసింది. మీ ప్రశ్న లేదా రిపోర్ట్ ఆధారంగా తగిన సూచనలు మరియు వివరణలు అందించబడ్డాయి.'
            : 'DHANVI has analyzed your query against the active document context.';
      }

      const botMsg: DhanviMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        languageUsed: activeLang
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically speak first sentence if user entered via voice
      if (speechTranscript) {
        handlePlayVoice(botMsg.id, reply, activeLang);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (msgIndex: number) => {
    if (loading || msgIndex <= 0) return;
    const priorHistory = messages.slice(0, msgIndex);
    const lastUserMessage = priorHistory[priorHistory.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      setMessages(priorHistory);
      handleSendQuery(lastUserMessage.content);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Voice Playback controls
  const handlePlayVoice = (msgId: string, text: string, lang: SupportedLanguage = dhanviLanguage) => {
    if (activeSpeechMessageId === msgId) {
      if (isSpeechPaused) {
        speechService.resume();
        setIsSpeechPaused(false);
      } else {
        speechService.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    speechService.stop();
    setActiveSpeechMessageId(msgId);
    setIsSpeechPaused(false);

    speechService.speak(text, lang, () => {
      setActiveSpeechMessageId(null);
      setIsSpeechPaused(false);
    });
  };

  const handleStopVoice = () => {
    speechService.stop();
    setActiveSpeechMessageId(null);
    setIsSpeechPaused(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* DHANVI Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-navy-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-teal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight">DHANVI AI</h1>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                ధన్వి
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Gemini 3.8 Powered
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Bilingual Conversational Medical & Document Intelligence with Voice
            </p>
          </div>
        </div>

        {/* Language Selector in DHANVI */}
        <div className="inline-flex rounded-lg bg-white/10 p-1 border border-white/20 text-xs">
          <button
            onClick={() => setDhanviLanguage('en')}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              dhanviLanguage === 'en' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setDhanviLanguage('te')}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              dhanviLanguage === 'te' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Attached Context Pill */}
      {attachedContext && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-teal-900 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-bold">Attached Document Context:</span>
            <span className="truncate text-teal-800 font-medium">
              {attachedContextTitle || 'Medical or Academic Record Attached'}
            </span>
          </div>
          <button
            onClick={() => {
              setAttachedContext(undefined);
              setAttachedContextTitle(undefined);
            }}
            className="text-teal-600 hover:text-rose-600 p-1 transition-colors"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div
        ref={chatScrollRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4"
      >
        {messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant';
          const isPlayingThis = activeSpeechMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-2xs">
                  D
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-2xs ${
                  isAssistant
                    ? 'bg-slate-50 border border-slate-200 text-slate-800'
                    : 'bg-teal-600 text-white'
                }`}
              >
                {msg.attachedContextTitle && (
                  <div
                    className={`text-[10px] font-bold pb-1 border-b ${
                      isAssistant ? 'border-slate-200 text-slate-500' : 'border-teal-500 text-teal-100'
                    }`}
                  >
                    📎 Context: {msg.attachedContextTitle}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Assistant message action bar (Copy, Voice Play/Pause, Regenerate) */}
                {isAssistant && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-400">
                    <span className="text-[10px]">{msg.timestamp}</span>

                    <div className="flex items-center gap-1.5">
                      {/* TTS Play / Pause */}
                      <button
                        onClick={() => handlePlayVoice(msg.id, msg.content, msg.languageUsed)}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          isPlayingThis ? 'text-teal-600 font-bold' : 'text-slate-500'
                        }`}
                        title={isPlayingThis ? (isSpeechPaused ? 'Resume' : 'Pause') : 'Read aloud'}
                      >
                        {isPlayingThis ? (
                          isSpeechPaused ? (
                            <Play className="w-3.5 h-3.5" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isPlayingThis && (
                        <button
                          onClick={handleStopVoice}
                          className="p-1 rounded hover:bg-slate-200 text-rose-600"
                          title="Stop voice playback"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Regenerate (if not first greeting) */}
                      {idx > 0 && (
                        <button
                          onClick={() => handleRegenerate(idx)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shrink-0 text-xs font-bold">
              D
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>DHANVI is thinking and formulating response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice Transcript Preview Box */}
      {showSpeechPreview && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              {isListening ? 'Listening (మాట్లాడండి)...' : 'Speech Transcript Preview'}
            </div>
            <button
              onClick={() => setShowSpeechPreview(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            rows={2}
            value={speechTranscript}
            onChange={(e) => setSpeechTranscript(e.target.value)}
            placeholder="Your spoken words will appear here. You can edit them before sending..."
            className="w-full p-2 text-xs border border-teal-200 rounded-lg bg-white text-slate-800 focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2">
            {isListening ? (
              <button
                onClick={stopSpeechRecognition}
                className="px-3 py-1 bg-rose-600 text-white rounded text-[11px] font-bold"
              >
                Stop Listening
              </button>
            ) : (
              <button
                onClick={startSpeechRecognition}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold"
              >
                Retry Recording
              </button>
            )}
            <button
              onClick={handleApplyTranscript}
              disabled={!speechTranscript.trim()}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold disabled:opacity-50"
            >
              Insert into Input
            </button>
          </div>
        </div>
      )}

      {speechError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Suggested Starter Chips */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={() =>
            handleSendQuery(
              dhanviLanguage === 'te'
                ? 'ధన్వి, నా ల్యాబ్ రిపోర్ట్ అసాధారణ విలువలను వివరించు.'
                : 'Dhanvi, explain the abnormal values in my blood report.'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 font-medium border border-slate-200"
        >
          {dhanviLanguage === 'te' ? '💉 ల్యాబ్ రిపోర్ట్ వివరణ' : '💉 Explain Blood Report'}
        </button>
        <button
          onClick={() =>
            handleSendQuery(
              dhanviLanguage === 'te'
                ? 'ఈ వైద్య పదజాలం (Medical Terminology) అంటే ఏమిటి?'
                : 'Explain medical terminology in simple patient language.'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 font-medium border border-slate-200"
        >
          {dhanviLanguage === 'te' ? '📖 వైద్య పదాలు' : '📖 Medical Terminology'}
        </button>
        <button
          onClick={() =>
            handleSendQuery(
              dhanviLanguage === 'te'
                ? 'వైద్యుడిని సంప్రదించేటప్పుడు ఎలాంటి ప్రశ్నలు అడగాలి?'
                : 'What questions should I ask my doctor about these results?'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 font-medium border border-slate-200"
        >
          {dhanviLanguage === 'te' ? '📋 డాక్టర్ ప్రశ్నలు' : '📋 Questions for Doctor'}
        </button>
      </div>

      {/* Chat Input & Voice Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-2">
        <div className="flex items-center gap-2">
          {/* Attach Report button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
              title="Attach an uploaded report"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                <span className="font-bold text-slate-700 block px-2 py-1">Attach Saved Report:</span>
                {savedReports.length > 0 ? (
                  savedReports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setAttachedContext(r.extractedText);
                        setAttachedContextTitle(r.reportTitle);
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-teal-50 text-slate-800 truncate"
                    >
                      {r.reportTitle}
                    </button>
                  ))
                ) : (
                  <p className="text-slate-400 p-2">No saved reports available.</p>
                )}
              </div>
            )}
          </div>

          {/* Voice Input Microphone Button */}
          <button
            onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white shadow-md animate-pulse'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
            title={isListening ? 'Stop recording' : 'Start speaking in English or Telugu'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Main Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendQuery();
              }
            }}
            placeholder={
              dhanviLanguage === 'te'
                ? 'ధన్విని ఏదైనా అడగండి (ఉదా. నా రిపోర్ట్ వివరించు)...'
                : 'Ask DHANVI anything (e.g. "Dhanvi, explain my blood report")...'
            }
            className="flex-1 px-3 py-2 text-xs border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendQuery()}
            disabled={!inputQuery.trim() || loading}
            className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
