"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecognitionState = "idle" | "listening" | "error";

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<RecognitionState>("idle");
  const [transcript, setTranscript] = useState("");

  const recognitionConstructor = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    const globalWindow = window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
      SpeechRecognition?: SpeechRecognitionConstructor;
    };
    return globalWindow.webkitSpeechRecognition ?? globalWindow.SpeechRecognition ?? null;
  }, []);

  useEffect(() => {
    if (!recognitionConstructor) return;
    const recognition = new recognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      setTranscript("");
    };
    recognition.onerror = () => {
      setState("error");
    };
    recognition.onend = () => {
      setState("idle");
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map((item) => item[0].transcript)
        .join(" ");
      setTranscript(result);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [recognitionConstructor]);

  const start = useCallback(() => {
    if (!recognitionRef.current || state === "listening") return;
    recognitionRef.current.start();
  }, [state]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return {
    supported: Boolean(recognitionConstructor),
    state,
    transcript,
    start,
    stop,
    reset: () => setTranscript(""),
  };
};
