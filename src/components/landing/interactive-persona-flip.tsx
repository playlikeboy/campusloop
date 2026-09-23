"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Flame, Heart, MessageSquare, Repeat, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function InteractivePersonaFlip() {
  const [mode, setMode] = useState<"anon" | "verified">("anon");

  function switchMode(newMode: "anon" | "verified") {
    sounds.tap();
    haptics.medium();
    setMode(newMode);
  }

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 select-none relative">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        {/* Section Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold">
          <Sparkles className="size-3.5" />
          <span>Dual Campus Persona</span>
        </div>

        {/* Punchy Heading */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Speak your mind. Or rep your clout.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto font-medium">
          Toggle seamlessly between zero-log anonymous confessions and verified student status in one tap.
        </p>

        {/* Tactile Toggle Switcher */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex p-1.5 rounded-full bg-muted/60 border border-border/50 shadow-inner gap-1">
            <button
              type="button"
              onClick={() => switchMode("anon")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                mode === "anon"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>🎭</span>
              <span>Anonymous Mode</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("verified")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                mode === "verified"
                  ? "bg-primary text-white shadow-md shadow-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="size-4" />
              <span>Verified Student</span>
            </button>
          </div>
        </div>

        {/* Interactive Simulated Card */}
        <div className="pt-6 max-w-lg mx-auto">
          {mode === "anon" ? (
            <motion.div
              key="anon"
              initial={{ opacity: 0, rotateY: 90, scale: 0.96 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[32px] p-6 bg-slate-950 text-white border border-slate-800 shadow-2xl space-y-4 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
                    🎭
                  </div>
                  <div>
                    <p className="text-xs font-black text-purple-300">Hostel Phantom</p>
                    <p className="text-[10px] text-zinc-400">Computer Science • 2nd Year</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  Zero Logs
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-zinc-100 leading-relaxed">
                &ldquo;Accidentally submitted my Spotify Wrapped playlist link instead of my Software Engineering project zip file at 11:59 PM. Professor gave me full marks because he loved Arctic Monkeys.&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-bold text-rose-400">
                    <Heart className="size-3.5 fill-rose-400" /> 842
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Flame className="size-3.5 fill-amber-400" /> 312
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <MessageSquare className="size-3.5" /> 89
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500">Encrypted</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="verified"
              initial={{ opacity: 0, rotateY: -90, scale: 0.96 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 90, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="neo-card rounded-[32px] p-6 shadow-xl space-y-4 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-full p-0.5 bg-linear-to-tr from-emerald-400 to-teal-500 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
                      alt="Student"
                      className="size-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-black text-foreground">Tanvi Rastogi</p>
                      <BadgeCheck className="size-3.5 text-[#1D9BF0]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">IIT Bombay &bull; Electrical &bull; 3rd Yr</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="size-3 fill-emerald-500 text-emerald-500" /> 4,120 LP
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                &ldquo;Organizing an open robotics hackathon next weekend at the Main Auditorium! Looking for 1 frontend dev who knows Next.js &amp; Tailwind. Drop a comment or message!&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-bold text-rose-500">
                    <Heart className="size-3.5 fill-rose-500" /> 1.1k
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <MessageSquare className="size-3.5" /> 142
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <Repeat className="size-3.5" /> 84
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Verified Student
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
