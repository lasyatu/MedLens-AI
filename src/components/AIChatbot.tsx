/**
 * Ask MedLens AI - Bilingual Conversational Medical Literacy Chatbot
 * Features:
 * - English & Telugu (తెలుగు) support
 * - Attachment of verified medicine scan or lab report context
 * - Telugu voice recognition with editable transcript preview before submission
 * - Text-to-Speech audio readout with Play, Pause, and Stop controls
 * - Quick prompt suggestions in English & Telugu
 * - Structured 6-part patient-friendly response format
 * - Emergency 112 escalation warnings
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Trash2,
  Sparkles,
  AlertTriangle,
  FileText,
  ScanLine,
  PhoneCall,
  RefreshCw,
  X
} from 'lucide-react';
import { SupportedLanguage } from '../lib/translations';
import { speechService } from '../lib/speechService';
import { useAuth } from '../context/AuthContext';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedContextTitle?: string;
}

interface AIChatbotProps {
  language: SupportedLanguage;
  attachedScanContext?: string;
  attachedReportContext?: string;
  onClearContext?: () => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  language,
  attachedScanContext,
  attachedReportContext,
  onClearContext
}) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          language === 'te'
            ? `నమస్తే! నేను MedLens AI ఆరోగ్య సహాయకుడిని.

మీరు మీ మందుల లేబుల్స్, ల్యాబ్ టెస్ట్ ఫలితాలు లేదా సాధారణ ఆరోగ్య నియమాల గురించి ఏదైనా అడగవచ్చు.

💡 ముఖ్య గమనిక: ఇది సాధారణ అవగాహన కొరకు మాత్రమే. తీవ్రమైన లేదా అత్యవసర లక్షణాలు (ఛాతీ నొప్పి, పక్షవాతం, శ్వాసలో ఇబ్బంది) ఉంటే వెంటనే 112 కు కాల్ చేయండి.`
            : `Hello! I am MedLens AI, your bilingual medicine and laboratory report health companion.

Ask me about medicine labels, laboratory tests, diet, or questions to prepare for your doctor.

⚠️ Emergency Note: If you experience severe symptoms like chest pain or difficulty breathing, call 112 (National Emergency in India) immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedContext, setAttachedContext] = useState<string | undefined>(
    attachedScanContext || attachedReportContext
  );

  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (attachedScanContext) setAttachedContext(`Medicine: ${attachedScanContext}`);
    else if (attachedReportContext) setAttachedContext(`Report: ${attachedReportContext}`);
  }, [attachedScanContext, attachedReportContext]);

  const quickPrompts =
    language === 'te'
      ? [
          'ఈ మందు దేనికి ఉపయోగిస్తారు?',
          'నా ల్యాబ్ రిపోర్ట్ అర్థం ఏమిటి?',
          'డయాబెటిస్ వారికి భారతీయ ఆహార సూచనలు',
          'యాంటీబయాటిక్స్ వాడేటప్పుడు తీసుకోవలసిన జాగ్రత్తలు',
          'డాక్టర్‌ను ఏ ప్రశ్నలు అడగాలి?'
        ]
      : [
          'What is this medicine used for?',
          'Explain my lab report results simply',
          'Indian dietary tips for high blood sugar',
          'Common side effects and precautions',
          'What questions should I ask my doctor?'
        ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedContextTitle: attachedContext ? attachedContext.substring(0, 30) : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          language,
          contextMedicine: attachedScanContext,
          contextReport: attachedReportContext
        })
      });

      if (!res.ok) {
        throw new Error('Chat service error');
      }

      const data = await res.json();
      const aiReply: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Information received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.warn('Chat error fallback:', err);
      const fallbackReply: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'te'
            ? `క్షమించండి, సర్వర్ స్పందించడంలో తాత్కాలిక సమస్య ఉంది. సాధారణ మార్గదర్శకాల ప్రకారం, మందుల మోతాదు లేదా ల్యాబ్ ఫలితాల వివరాల కోసం ఎల్లప్పుడూ మీ వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి. అత్యవసర పరిస్థితుల్లో 112 కు కాల్ చేయండి.`
            : `I am currently operating with offline clinical guidance. Please consult your physician or pharmacist regarding this medication or lab result. In an emergency, call 112 immediately.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoice = () => {
    setVoiceError(null);
    setVoiceTranscript('');
    setIsRecording(true);
    setShowVoiceModal(true);

    const langCode = language === 'te' ? 'te-IN' : 'en-US';
    speechService.startListening(
      (text) => {
        setVoiceTranscript(text);
      },
      (error) => {
        setVoiceError(error);
        setIsRecording(false);
      },
      langCode
    );
  };

  const handleStopVoice = () => {
    speechService.stopListening();
    setIsRecording(false);
  };

  const handleApplyVoice = () => {
    if (voiceTranscript.trim()) {
      setInputQuery(voiceTranscript);
      setShowVoiceModal(false);
    }
  };

  const handleToggleAudio = (msg: ChatMessageItem) => {
    if (playingMessageId === msg.id) {
      speechService.stopSpeaking();
      setPlayingMessageId(null);
    } else {
      speechService.stopSpeaking();
      setPlayingMessageId(msg.id);
      speechService.speak(
        msg.content,
        language,
        () => setPlayingMessageId(msg.id),
        () => setPlayingMessageId(null),
        () => setPlayingMessageId(null)
      );
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-restart',
        role: 'assistant',
        content:
          language === 'te'
            ? 'సంభాషణ రీసెట్ చేయబడింది. మీకు ఏ సమాచారం కావాలి?'
            : 'Conversation cleared. How can I assist you with your health information today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[750px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wide">
                {language === 'te' ? 'MedLens AI ఆరోగ్య సంభాషణ' : 'Ask MedLens AI Assistant'}
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-900 text-teal-300 border border-teal-700">
                Bilingual (EN / TE)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'te'
                ? 'తెలుగు వాయిస్ & టెక్స్ట్ మద్దతుతో విశ్వసనీయ ఆరోగ్య సహాయకుడు'
                : 'Evidence-grounded medical literacy with Telugu voice input'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {attachedContext && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 border border-slate-700">
              <Paperclip className="w-3.5 h-3.5 text-teal-400" />
              <span className="max-w-[150px] truncate">{attachedContext}</span>
              <button
                onClick={() => {
                  setAttachedContext(undefined);
                  if (onClearContext) onClearContext();
                }}
                className="text-slate-400 hover:text-white ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'te'
              ? 'తీవ్రమైన అత్యవసర పరిస్థితులకు వెంటనే 112 కు కాల్ చేయండి.'
              : 'Medical Emergency: Call 112 (India) immediately for severe symptoms.'}
          </span>
        </div>
        <span className="font-bold text-amber-700 flex items-center gap-1">
          <PhoneCall className="w-3.5 h-3.5" /> 112 Helpline
        </span>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.attachedContextTitle && (
              <span className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 px-2">
                <Paperclip className="w-3 h-3 text-teal-600" /> Attached: {msg.attachedContextTitle}
              </span>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[10px]">{msg.timestamp}</span>
                  <button
                    onClick={() => handleToggleAudio(msg)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    {playingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-teal-700" />
                        <span>{language === 'te' ? 'ఆపు (Stop)' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>{language === 'te' ? 'వినండి (Listen)' : 'Read Aloud'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-4 shadow-2xs flex items-center gap-2 text-slate-600 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>
                {language === 'te'
                  ? 'MedLens AI సమాధానాన్ని సిద్ధం చేస్తోంది...'
                  : 'MedLens AI is reviewing medical evidence...'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white px-4 py-2 border-t border-slate-100 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          {language === 'te' ? 'సూచనలు:' : 'Suggested:'}
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleStartVoice}
            className={`p-3 rounded-xl border transition-all ${
              isRecording
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
            }`}
            title="Telugu Voice Input"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              language === 'te'
                ? 'తెలుగులో లేదా ఇంగ్లీషులో ప్రశ్న అడగండి...'
                : 'Ask about medicines, lab values, or health guidance in English or Telugu...'
            }
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-teal-600 text-sm font-medium"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl shadow-md shadow-teal-600/20 transition-all"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Mic className="w-5 h-5 animate-pulse" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'te' ? 'తెలుగు వాయిస్ రికార్డింగ్' : 'Telugu / English Voice Search'}
                </h3>
              </div>
              <button
                onClick={() => {
                  handleStopVoice();
                  setShowVoiceModal(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-teal-100 text-teal-700 mb-1">
                {isRecording ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {isRecording
                  ? language === 'te'
                    ? 'ఇప్పుడు మాట్లాడండి... (Listening)'
                    : 'Listening... Please speak clearly'
                  : language === 'te'
                  ? 'రికార్డింగ్ పూర్తయింది. క్రింద టెక్స్ట్ తనిఖీ చేయండి.'
                  : 'Recording finished. Review transcript below.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {language === 'te' ? 'గుర్తించబడిన పాఠ్యం (సవరించవచ్చు):' : 'Recognized Transcript (Editable):'}
              </label>
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                rows={3}
                className="w-full text-sm font-medium p-3 rounded-xl border border-slate-300 focus:outline-teal-600"
                placeholder={
                  language === 'te'
                    ? 'మీరు మాట్లాడిన మాటలు ఇక్కడ కనిపిస్తాయి...'
                    : 'Your spoken transcript will appear here...'
                }
              />
            </div>

            {voiceError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {voiceError}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-300"
                >
                  {language === 'te' ? 'రికార్డింగ్ ఆపు' : 'Stop Recording'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="px-4 py-2 bg-slate-100 text-teal-700 text-xs font-bold rounded-lg hover:bg-teal-50 border border-teal-200"
                >
                  {language === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Retry'}
                </button>
              )}

              <button
                type="button"
                onClick={handleApplyVoice}
                disabled={!voiceTranscript.trim()}
                className="px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 disabled:opacity-40"
              >
                {language === 'te' ? 'ఈ ప్రశ్నను ఉపయోగించండి' : 'Use Transcript'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
