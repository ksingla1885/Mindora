import { useState, useEffect, useCallback } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState(null);
  const [voice, setVoice] = useState(null);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a default voice (prefer en-US if available)
      const defaultVoice = 
        availableVoices.find(v => v.lang === 'en-US') || 
        availableVoices.find(v => v.default) ||
        availableVoices[0];
        
      if (defaultVoice) {
        setVoice(defaultVoice);
      }
    };

    // Load voices when they become available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      // Clean up speech synthesis when component unmounts
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle speaking state changes
  const handleSpeak = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Create a new utterance
    const newUtterance = new SpeechSynthesisUtterance(text);
    newUtterance.voice = voice;
    newUtterance.pitch = pitch;
    newUtterance.rate = rate;
    newUtterance.volume = volume;

    // Set up event listeners
    newUtterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    newUtterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    newUtterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    // Start speaking
    window.speechSynthesis.speak(newUtterance);
    setUtterance(newUtterance);
  }, [voice, pitch, rate, volume]);

  const pauseSpeaking = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resumeSpeaking = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const toggleSpeaking = useCallback((text) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      handleSpeak(text);
    }
  }, [isSpeaking, handleSpeak, stopSpeaking]);

  return {
    isSpeaking,
    isPaused,
    voices,
    voice,
    setVoice,
    pitch,
    setPitch,
    rate,
    setRate,
    volume,
    setVolume,
    speak: handleSpeak,
    pause: pauseSpeaking,
    resume: resumeSpeaking,
    stop: stopSpeaking,
    toggle: toggleSpeaking,
  };
};

export default useTextToSpeech;
