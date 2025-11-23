"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoicePreference = {
  name?: string;
  rate: number;
  pitch: number;
};

const defaultPreference: VoicePreference = {
  name: undefined,
  rate: 1,
  pitch: 1,
};

export const useSpeechSynthesis = () => {
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [preference, setPreference] = useState<VoicePreference>(defaultPreference);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    synthesisRef.current = window.speechSynthesis;

    const populateVoices = () => {
      const found = window.speechSynthesis.getVoices();
      if (found.length) {
        setVoices(found);
        setReady(true);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!synthesisRef.current || !ready) {
          resolve();
          return;
        }
        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (preference.name) {
          const chosen = voices.find((voice) => voice.name === preference.name);
          if (chosen) {
            utterance.voice = chosen;
          }
        } else {
          const englishVoice =
            voices.find((voice) => voice.lang.toLowerCase().includes("en-gb")) ??
            voices.find((voice) => voice.lang.toLowerCase().includes("en-us"));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }

        utterance.rate = preference.rate;
        utterance.pitch = preference.pitch;
        utterance.volume = 0.9;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        synthesisRef.current.speak(utterance);
      }),
    [preference.name, preference.pitch, preference.rate, ready, voices],
  );

  const cancel = useCallback(() => {
    synthesisRef.current?.cancel();
  }, []);

  return {
    speak,
    cancel,
    voices,
    ready,
    setPreference,
  };
};
