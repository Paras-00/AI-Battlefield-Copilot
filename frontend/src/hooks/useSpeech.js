import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech(onTranscriptCallback) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Keep a mutable reference to the latest callback to avoid effect re-triggers
  const callbackRef = useRef(onTranscriptCallback);
  useEffect(() => {
    callbackRef.current = onTranscriptCallback;
  }, [onTranscriptCallback]);

  useEffect(() => {
    // Check for Web Speech API Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (callbackRef.current) {
          callbackRef.current(transcript);
        }
      };

      setRecognition(rec);
      setSpeechSupported(true);
    }
  }, []); // Run once on mount

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Male') || v.name.includes('Robot') || v.name.includes('Natural')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis is not supported in this browser.");
    }
  }, []);

  return {
    isListening,
    speechSupported,
    startListening,
    stopListening,
    speakText
  };
}
