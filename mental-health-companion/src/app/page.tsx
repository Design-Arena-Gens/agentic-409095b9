"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvatarCanvas, type AvatarMood } from "@/components/AvatarCanvas";
import { ChatBubble } from "@/components/ChatBubble";
import { generateCompanionResponse } from "@/lib/generateResponse";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { AnimatePresence, motion } from "framer-motion";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  meta?: string;
  mood?: AvatarMood;
};

const initialAssistantMessage: ChatMessage = {
  id: "init",
  role: "assistant",
  content:
    "Hi, I'm Lumi. I'm here to sit with you, listen closely, and help you find kinder ways to move through what you're feeling.",
  meta: "Draw a comfortable breath in for four, hold for two, exhale gently for six.",
  mood: "curious",
};

const generateId = () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [breathingCue, setBreathingCue] = useState(initialAssistantMessage.meta ?? "");
  const [currentMood, setCurrentMood] = useState<AvatarMood>(initialAssistantMessage.mood ?? "curious");

  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, ready: speechReady, cancel } = useSpeechSynthesis();
  const { supported: recognitionSupported, state: recognitionState, transcript, start, stop, reset } =
    useSpeechRecognition();

  const listening = recognitionState === "listening";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAssistantResponse = useCallback(
    async (prompt: string) => {
      const reply = generateCompanionResponse(prompt);
      setCurrentMood(reply.mood);
      setBreathingCue(reply.breathingCue);
      const reflectionMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: reply.text,
        meta: reply.breathingCue,
        mood: reply.mood,
      };
      const followUpMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: reply.followUpQuestion,
        mood: reply.mood,
      };
      setMessages((prev) => [...prev, reflectionMessage, followUpMessage]);

      if (autoVoice && speechReady) {
        setSpeaking(true);
        await speak(`${reply.text} ${reply.followUpQuestion}`);
        setSpeaking(false);
      }
    },
    [autoVoice, speak, speechReady],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isProcessing) return;

      setIsProcessing(true);
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      reset();
      await new Promise((resolve) => setTimeout(resolve, 450));
      await handleAssistantResponse(trimmed);
      setIsProcessing(false);
    },
    [handleAssistantResponse, isProcessing, reset],
  );

  const activeDraft = useMemo(
    () => (listening ? transcript : draft),
    [draft, listening, transcript],
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSend(activeDraft);
    },
    [activeDraft, handleSend],
  );

  const toggleListening = useCallback(() => {
    if (!recognitionSupported) return;
    if (listening) {
      stop();
      if (transcript.trim()) {
        setDraft(transcript.trim());
      }
    } else {
      reset();
      start();
    }
  }, [listening, recognitionSupported, reset, start, stop, transcript]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const avatarShouldAnimate = useMemo(() => speaking || isProcessing, [isProcessing, speaking]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:py-12 lg:flex-row lg:gap-10">
        <section className="flex flex-col gap-6 lg:sticky lg:top-10 lg:h-[calc(100vh-5rem)] lg:w-[45%]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_50px_-24px_rgba(56,189,248,0.45)] backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">
                L
              </span>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">
                  Lumi, your gentle companion
                </h1>
                <p className="text-sm text-slate-300">
                  Thoughtful check-ins, grounding prompts, and a voice that holds space.
                </p>
              </div>
            </div>
            <div className="hidden text-sm text-slate-300 md:block">
              <p>
                Share whatever is on your mind. When you send a message, Lumi steps forward, responds out loud, and
                offers a grounding cue tailored to how you&apos;re feeling.
              </p>
            </div>
          </div>
          <div className="h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_rgba(15,23,42,0.95))] shadow-[0_40px_80px_-48px_rgba(56,189,248,0.55)]">
            <AnimatePresence>
              <motion.div
                key={currentMood}
                initial={{ opacity: 0.5, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="h-full"
              >
                <AvatarCanvas mood={currentMood} speaking={avatarShouldAnimate} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium uppercase tracking-wide text-slate-400">Grounding Cue</span>
              <button
                type="button"
                onClick={() => setAutoVoice((prev) => !prev)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/20"
              >
                Voice {autoVoice && speechReady ? "On" : "Off"}
              </button>
            </div>
            <p className="mt-3 text-base leading-relaxed text-slate-100">{breathingCue}</p>
            {!speechReady ? (
              <p className="mt-4 text-xs text-slate-300">
                Voice playback is preparing. Try again in a moment or toggle Voice Off.
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur">
          <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {messages.map((message) => (
              <ChatBubble key={message.id} role={message.role} content={message.content} meta={message.meta} />
            ))}
            {isProcessing ? (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-sky-400" />
                <span>Lumi is tuning into your words...</span>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-white/10 bg-slate-950/50 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <textarea
                  value={activeDraft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Let Lumi know how you're feeling..."
                  rows={3}
                  disabled={listening}
                  className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-inner outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-75 sm:min-h-[140px] sm:text-base"
                />
                {recognitionSupported ? (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/20"
                    title={listening ? "Stop listening" : "Speak to Lumi"}
                  >
                    {listening ? (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M12 14.25A3.75 3.75 0 0 0 15.75 10.5V5.25a3.75 3.75 0 1 0-7.5 0v5.25A3.75 3.75 0 0 0 12 14.25Z" />
                        <path d="M5.25 10.5a.75.75 0 0 0-1.5 0 7.5 7.5 0 0 0 6.75 7.455v2.045H7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-3v-2.045A7.5 7.5 0 0 0 19.5 10.5a.75.75 0 0 0-1.5 0 6 6 0 1 1-12 0Z" />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:w-36">
                <button
                  type="submit"
                  disabled={!activeDraft.trim() || isProcessing || listening}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {isProcessing ? "Thinking..." : "Send to Lumi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancel();
                    setDraft("");
                    reset();
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
