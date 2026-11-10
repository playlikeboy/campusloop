"use client";

import { Headphones, Pause, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { articlePlainText } from "@/lib/articles/text";

/**
 * "Listen" using the browser's built-in speech synthesis: free, private
 * (nothing leaves the device) and handy for commutes or accessibility.
 * Hidden where the browser has no speech support.
 */
export function ArticleListenButton({ title, content }: { title: string; content: string }) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  function start() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(`${title}. ${articlePlainText(content)}`);
    const voice =
      synth.getVoices().find((v) => v.lang === "en-IN") ??
      synth.getVoices().find((v) => v.lang.startsWith("en"));
    if (voice) u.voice = voice;
    u.rate = 1;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    utterance.current = u;
    synth.speak(u);
    setState("playing");
  }

  const base =
    "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={start}
        className={`${base} bg-surface-muted text-fg hover:bg-surface-sunken`}
      >
        <Headphones className="size-4" aria-hidden /> Listen
      </button>
    );
  }
  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => {
          if (state === "playing") {
            window.speechSynthesis.pause();
            setState("paused");
          } else {
            window.speechSynthesis.resume();
            setState("playing");
          }
        }}
        className={`${base} bg-brand-subtle text-brand-text`}
        aria-label={state === "playing" ? "Pause reading" : "Resume reading"}
      >
        {state === "playing" ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Headphones className="size-4" aria-hidden />
        )}
        {state === "playing" ? "Pause" : "Resume"}
      </button>
      <button
        type="button"
        onClick={() => {
          window.speechSynthesis.cancel();
          setState("idle");
        }}
        className={`${base} bg-surface-muted text-fg hover:bg-surface-sunken`}
        aria-label="Stop reading"
      >
        <Square className="size-4" aria-hidden />
      </button>
    </span>
  );
}
