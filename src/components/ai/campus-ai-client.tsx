"use client";

import {
  ArrowUp,
  BookOpen,
  ExternalLink,
  Flame,
  Loader2,
  Mic,
  MicOff,
  Radio,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { AiMode, AiSource } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AiSource[];
  suggestedActions?: Array<{ label: string; action: string; payload?: Record<string, unknown> }>;
  feedback?: "helpful" | "unhelpful";
}

const QUICK_ACTIONS: Array<{ label: string; prompt: string; mode: AiMode; icon: typeof Zap }> = [
  {
    label: "What's happening on my campus?",
    prompt: "What's happening on my campus today?",
    mode: "campus",
    icon: Flame,
  },
  {
    label: "What did I miss?",
    prompt: "Give me a useful recap of what I missed recently on campus.",
    mode: "personal",
    icon: Zap,
  },
  {
    label: "Help me study",
    prompt: "Help me study and find notes or question papers for my campus.",
    mode: "study",
    icon: BookOpen,
  },
  {
    label: "Find something to buy",
    prompt: "Show me secondhand essentials and items for sale on campus.",
    mode: "search",
    icon: ShoppingBag,
  },
  {
    label: "Make my post better",
    prompt: "Help me improve this post without changing its facts:",
    mode: "create",
    icon: Wand2,
  },
];

export function CampusAiClient() {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<AiMode>("campus");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);

  // Live Talking AI Voice State
  const [isLiveTalkingOpen, setIsLiveTalkingOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceVolumeEnabled, setVoiceVolumeEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, toolStatus]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setIsListening(false);
            void ask(transcript, mode, true);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [mode]);

  function speakText(text: string) {
    if (!voiceVolumeEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting for clean vocalization
    const plain = text.replace(/[*_#`[\]()]/g, "").slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function toggleLiveTalking() {
    if (isLiveTalkingOpen) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsListening(false);
      setIsSpeaking(false);
      setIsLiveTalkingOpen(false);
    } else {
      setIsLiveTalkingOpen(true);
      startVoiceListening();
    }
  }

  function startVoiceListening() {
    if (!recognitionRef.current) {
      toast.info("Voice doesn't work in this browser. Type your question instead.");
      return;
    }
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  async function handleFeedback(messageId: string, rating: "helpful" | "unhelpful") {
    const previousRating = messages.find((item) => item.id === messageId)?.feedback;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m)));
    try {
      const response = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
      const data = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || "Feedback could not be saved");
      toast.success("Thanks for the feedback");
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: previousRating } : m)));
      toast.error("Couldn't send feedback. Try again.");
    }
  }

  async function ask(prompt = message, selectedMode = mode, fromVoice = false) {
    if (!prompt.trim() || loading) return;
    const cleanPrompt = prompt.trim();
    setMessage("");

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: cleanPrompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setToolStatus("Looking through CampusLoop…");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanPrompt,
          mode: selectedMode,
          conversationId: conversationId || undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        answer?: string;
        sources?: AiSource[];
        suggestedActions?: Array<{ label: string; action: string; payload?: Record<string, unknown> }>;
        conversationId?: string;
        messageId?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Campus AI is temporarily unavailable. Try again in a moment.");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const reply = data.answer ?? data.error ?? "I couldn't answer that right now.";
      const assistantMsg: ChatMessage = {
        id: data.messageId || `asst_${Date.now()}`,
        role: "assistant",
        content: reply,
        sources: data.sources || [],
        suggestedActions: data.suggestedActions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (fromVoice || isLiveTalkingOpen) {
        speakText(reply);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Campus AI is temporarily unavailable. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      setToolStatus(null);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col px-3 py-6 sm:px-6">
      {/* Header Bar */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Campus AI</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Ask about notes, events and what's happening.</p>
        </div>

        {/* Live Talking AI trigger button */}
        <button
          type="button"
          onClick={toggleLiveTalking}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-ui cursor-pointer",
            isLiveTalkingOpen ? "bg-brand text-brand-fg" : "bg-surface-muted hover:bg-surface-sunken text-fg"
          )}
          aria-pressed={isLiveTalkingOpen}
        >
          <Radio className="size-4" aria-hidden />
          <span>{isLiveTalkingOpen ? "Stop talking" : "Talk"}</span>
        </button>
      </div>

      {/* Floating Live Talking AI HUD Modal */}
      {isLiveTalkingOpen && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-bold text-foreground">Voice chat on</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoiceVolumeEnabled(!voiceVolumeEnabled);
                  if (voiceVolumeEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="size-11 sm:size-8 shrink-0 rounded-full border border-border bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={voiceVolumeEnabled ? "Mute voice replies" : "Turn on voice replies"}
                title={voiceVolumeEnabled ? "Mute voice replies" : "Turn on voice replies"}
              >
                {voiceVolumeEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>

              <button
                type="button"
                onClick={toggleLiveTalking}
                aria-label="End voice chat"
                className="size-11 sm:size-8 shrink-0 rounded-full border border-border bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="my-6 flex flex-col items-center justify-center text-center">
            {/* Visual Speech Pulse Ring */}
            <div
              className={cn(
                "relative flex size-24 items-center justify-center rounded-full transition-colors duration-500",
                isListening
                  ? "bg-danger/20 scale-110 shadow-lg"
                  : isSpeaking
                    ? "bg-primary/20 scale-105 shadow-lg shadow-primary/30"
                    : "bg-muted/60"
              )}
            >
              <div
                className={cn(
                  "size-14 rounded-full flex items-center justify-center text-white transition-colors",
                  isListening
                    ? "bg-brand animate-pulse"
                    : isSpeaking
                      ? "bg-primary animate-pulse"
                      : "bg-muted-foreground/30 text-foreground"
                )}
              >
                {isListening ? <Mic className="size-6" /> : <Zap className="size-6" />}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm font-extrabold text-foreground">
                {isListening ? "Listening…" : isSpeaking ? "Campus AI is speaking..." : "Tap mic to speak"}
              </p>
              <p className="text-xs text-muted-foreground">
                Ask about mess timings, end-sem papers, campus confessions, or marketplace
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant={isListening ? "destructive" : "default"}
                size="sm"
                onClick={() => {
                  if (isListening) {
                    recognitionRef.current?.stop();
                    setIsListening(false);
                  } else {
                    startVoiceListening();
                  }
                }}
                className="rounded-full px-5 font-bold cursor-pointer"
              >
                {isListening ? (
                  <>
                    <MicOff className="size-3.5 mr-1.5" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="size-3.5 mr-1.5" /> Speak Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream Viewport */}
      <div className="flex-1 space-y-4 pb-28">
        {messages.length === 0 ? (
          <div className="py-4 space-y-6">
            <p className="text-sm text-fg-muted max-w-prose">
              Answers come from posts, notes and listings on CampusLoop. AI can still get things wrong, so
              check anything important.
            </p>

            <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0" aria-label="Try asking">
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <Chip
                    key={item.label}
                    icon={<Icon aria-hidden />}
                    onClick={() => {
                      setMode(item.mode);
                      setMessage(item.prompt);
                      void ask(item.prompt, item.mode);
                    }}
                  >
                    {item.label}
                  </Chip>
                );
              })}
            </fieldset>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col space-y-2", m.role === "user" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : "bg-card border border-border text-foreground rounded-tl-xs"
                )}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Source Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <div className="text-xs font-bold text-muted-foreground">Sources & Discussions</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((s) => {
                        const href =
                          s.type === "post"
                            ? `/post/${s.id}`
                            : s.type === "event"
                              ? `/events/${s.id}`
                              : s.type === "marketplace"
                                ? `/marketplace`
                                : s.type === "academic"
                                  ? `/academics`
                                  : `/feeds`;

                        return (
                          <Link
                            key={s.id}
                            href={href}
                            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors"
                          >
                            <span className="truncate max-w-40">{s.title || "Campus Thread"}</span>
                            <ExternalLink className="size-2.5 shrink-0 opacity-70" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Action Pills */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                    {m.suggestedActions.map((a, i) => (
                      <Link
                        key={i}
                        href={(a.payload?.url as string) || "/app"}
                        className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Controls for AI Responses */}
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 pl-2">
                  <button
                    type="button"
                    onClick={() => handleFeedback(m.id, "helpful")}
                    aria-label="Helpful answer"
                    aria-pressed={m.feedback === "helpful"}
                    className={cn(
                      "size-7 pointer-coarse:size-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
                      m.feedback === "helpful" && "text-success bg-success/10"
                    )}
                    title="Helpful response"
                  >
                    <ThumbsUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(m.id, "unhelpful")}
                    aria-label="Not helpful"
                    aria-pressed={m.feedback === "unhelpful"}
                    className={cn(
                      "size-7 pointer-coarse:size-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
                      m.feedback === "unhelpful" && "text-danger bg-danger/10"
                    )}
                    title="Unhelpful"
                  >
                    <ThumbsDown className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading / Searching Status Indicator */}
        {loading && (
          <div className="flex items-center gap-2 rounded-full bg-surface-muted px-4 py-2.5 text-sm text-fg-muted w-fit">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>{toolStatus || "Thinking…"}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Bottom Input Bar */}
      <div className="fixed right-0 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom))] left-0 z-30 border-t border-border bg-bg pt-3 pb-3 lg:bottom-0 lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl px-3 sm:px-6">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2">
            <button
              type="button"
              onClick={() => {
                if (!isListening) {
                  startVoiceListening();
                } else {
                  recognitionRef.current?.stop();
                  setIsListening(false);
                }
              }}
              className={cn(
                "size-11 rounded-full flex items-center justify-center transition-ui cursor-pointer shrink-0",
                isListening
                  ? "bg-brand text-brand-fg"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
              aria-label={isListening ? "Stop listening" : "Ask with your voice"}
            >
              <Mic className="size-4.5" />
            </button>

            <textarea
              value={message}
              maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask();
                }
              }}
              placeholder="Ask a question"
              rows={1}
              className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-fg-subtle"
            />

            <Button
              type="button"
              onClick={() => void ask()}
              disabled={!message.trim() || loading}
              className="size-11 rounded-full p-0 shrink-0 cursor-pointer"
              aria-label="Send"
            >
              <ArrowUp className="size-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
