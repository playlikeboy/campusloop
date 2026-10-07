"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Download, Flame, MessageSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { sounds } from "@/lib/sounds";
import { haptics } from "@/lib/haptics";

export function VoxelCascadeShowcase() {
  return (
    <section className="relative py-10 sm:py-20 md:py-24 bg-gradient-to-b from-background via-emerald-50/15 to-background overflow-hidden select-none">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Cascading 3D Perspective Mockup Cards */}
          <div className="lg:col-span-7 relative order-2 lg:order-1 perspective-1000">
            {/* Background Voxel Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-emerald-400/5 to-transparent blur-2xl" />

            {/* Cascading Mobile Stack Mockup with subtle 3D float */}
            <div className="relative grid grid-cols-2 gap-3 sm:gap-6">
              {/* Phone 1: Campus Feed Stream */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ rotate: 0, scale: 1.03, y: -8 }}
                className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-lg sm:shadow-xl rotate-0 sm:-rotate-2 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <div className="size-6 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-[9px] font-black">
                    BIT
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground">Live Campus Feed</p>
                    <p className="text-[9px] text-muted-foreground">BIT Mesra Hub</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="rounded-2xl bg-muted/40 p-2.5 text-left">
                    <span className="rounded bg-rose-500/15 text-rose-600 px-1.5 py-0.5 text-[8px] font-black uppercase flex items-center gap-1 w-fit">
                      <MessageSquare className="size-2.5" />
                      <span>Confession</span>
                    </span>
                    <p className="text-[10px] text-foreground font-medium mt-1 leading-snug">
                      &ldquo;Who else is pulling an all-nighter for the OS mid-terms in Hostel 10?&rdquo;
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <span className="rounded bg-[#22c55e]/15 text-[#16a34a] px-1.5 py-0.5 text-[8px] font-black uppercase">
                      Live Campus Poll
                    </span>
                    <p className="text-[10px] text-foreground font-bold mt-1">Best chai stall near Main Gate?</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[9px] bg-[#22c55e]/10 text-[#16a34a] font-bold px-2 py-1 rounded-lg">
                        <span>Raju Bhaiya Chai</span>
                        <span>68%</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] bg-muted/50 px-2 py-1 rounded-lg">
                        <span>Canteen 3</span>
                        <span>32%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phone 2: Academic Vault & Notes */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                whileHover={{ rotate: 0, scale: 1.03, y: -4 }}
                className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-lg sm:shadow-xl rotate-0 sm:rotate-3 translate-y-0 sm:translate-y-6 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-black">
                      AV
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground">Academic Vault</p>
                      <p className="text-[9px] text-muted-foreground">Semester 5 Computer Science</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#16a34a] flex items-center gap-0.5">
                    <ShieldCheck className="size-2.5" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground">DBMS Unit 1-4 Complete Notes</p>
                        <p className="text-[8px] text-muted-foreground">Topper Curated • 4.9 ★ Rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground">2024 Solved End-Sem PYQs</p>
                        <p className="text-[8px] text-muted-foreground">Step-by-step exam answers</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-2 text-[9px] font-bold text-[#16a34a]">
                    <span className="flex items-center gap-1">
                      <Download className="size-2.5" />
                      <span>Instant Free Download</span>
                    </span>
                    <span>PDF (8.4 MB)</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Pitchy Viral Copy */}
          <div className="lg:col-span-5 text-center lg:text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] mb-3 border border-emerald-500/20">
              <Zap className="size-3.5 text-[#22c55e]" />
              <span>Stop The WhatsApp Group Chaos</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.1] sm:leading-[1.08]">
              REPLACE 17 CLUTTERED
              <br />
              <span className="text-[#16a34a] dark:text-emerald-400">WHATSAPP GROUPS.</span>
            </h2>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              No buried PDFs. No creepy DMs from random phone numbers. No fake internship forwards. Just clean, threaded campus conversations, instant exam survival notes, and real verified students.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Link
                href="/colleges"
                onClick={() => {
                  sounds.tap();
                  haptics.medium();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-5 sm:px-6 py-3 sm:py-3.5 min-h-[44px] text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Find Your College Hub</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/academics"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-card hover:bg-muted px-4 sm:px-5 py-3 sm:py-3.5 min-h-[44px] text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer"
              >
                <BookOpen className="size-4 text-blue-500" />
                <span>Browse 45K+ Notes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
