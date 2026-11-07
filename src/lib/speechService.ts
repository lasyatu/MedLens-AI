/**
 * Speech Recognition and Text-to-Speech Service
 * Supports Telugu (te-IN) and English (en-IN / en-US) using standard browser APIs
 */

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

// Window interface augmentation
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let activeRecognition: any = null;

/**
 * Start speech recognition in Telugu or English
 */
export function startListening(
  language: 'te' | 'en',
  handlers: SpeechRecognitionHandlers
): () => void {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError('Speech recognition is not supported in this browser. Please type your question.');
    return () => {};
  }

  // Stop any existing session
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch (e) {}
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRec();
  activeRecognition = recognition;

  recognition.lang = language === 'te' ? 'te-IN' : 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    handlers.onStart();
  };

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    handlers.onResult(final || interim, Boolean(final));
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech Recognition Event Error:', event.error);
    let message = 'An error occurred during voice recording.';
    if (event.error === 'not-allowed') {
      message = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
    } else if (event.error === 'no-speech') {
      message = 'No speech was detected. Please tap the microphone and speak again.';
    } else if (event.error === 'network') {
      message = 'Network error during voice recognition. Please check your internet connection.';
    } else if (event.error === 'audio-capture') {
      message = 'No microphone was found. Ensure that your microphone is plugged in and turned on.';
    }
    handlers.onError(message);
  };

  recognition.onend = () => {
    activeRecognition = null;
    handlers.onEnd();
  };

  try {
    recognition.start();
  } catch (err: any) {
    handlers.onError(err.message || 'Could not start microphone recording.');
  }

  return () => {
    try {
      recognition.stop();
    } catch (e) {}
  };
}

/**
 * Stop active listening
 */
export function stopListening(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {}
    activeRecognition = null;
  }
}

/**
 * Find the best voice for Telugu or English
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Speak text in Telugu or English
 */
export function speakText(
  text: string,
  language: 'te' | 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): { stop: () => void; pause: () => void; resume: () => void } {
  if (!isSpeechSynthesisSupported()) {
    onError?.('Speech synthesis is not supported on this device.');
    return { stop: () => {}, pause: () => {}, resume: () => {} };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text from Markdown asterisks and links before reading aloud
  const cleanSpeechText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/•/g, '')
    .replace(/⚠️/g, 'Warning: ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
  utterance.rate = 0.95; // slightly slower for clinical clarity
  utterance.pitch = 1.0;

  const voices = getAvailableVoices();
  const targetLang = language === 'te' ? 'te' : 'en';

  // Find exact voice matching te-IN or startsWith te
  const matchingVoice = voices.find(
    v => v.lang.toLowerCase().replace('_', '-') === (language === 'te' ? 'te-in' : 'en-us') ||
         v.lang.toLowerCase().startsWith(targetLang)
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }
  utterance.lang = language === 'te' ? 'te-IN' : 'en-US';

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn('TTS error:', e);
    onError?.('Audio assistance error or unsupported language on device.');
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
    pause: () => window.speechSynthesis.pause(),
    resume: () => window.speechSynthesis.resume()
  };
}

export const speechService = {
  startListening: (
    onResult: (text: string) => void,
    onError: (err: string) => void,
    langCode: string = 'te-IN'
  ) => {
    return startListening(langCode.startsWith('te') ? 'te' : 'en', {
      onResult: (t: string) => onResult(t),
      onError: (e: string) => onError(e),
      onEnd: () => {},
      onStart: () => {}
    });
  },
  stopListening: () => stopListening(),
  speak: (
    text: string,
    language: 'te' | 'en',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ) => {
    return speakText(text, language, onStart, onEnd, onError);
  },
  stopSpeaking: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
  stop: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
  pause: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  },
  resume: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
};
