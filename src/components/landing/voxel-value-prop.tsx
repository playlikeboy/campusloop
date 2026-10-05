import { BookOpen, Calendar, CheckCircle2, MessageSquare, Shield, Sparkles } from "lucide-react";

export function VoxelValueProp() {
  return (
    <section className="py-16 sm:py-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Text Side */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Unified Campus Experience
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Your campus,
              <br />
              <span className="text-primary">connected.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              A single quiet space for student conversations, notes, clubs, and events — with zero commercial ads or outside noise.
            </p>

            <div className="mt-8 space-y-3 max-w-md mx-auto lg:mx-0 text-left">
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-3">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Verified Peers Only</p>
                  <p className="text-[11px] text-muted-foreground">Every student is authenticated via .ac.in / .edu email.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-3">
                <Shield className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Anti-Harassment Escrow</p>
                  <p className="text-[11px] text-muted-foreground">Express candid opinions anonymously while deterring ragging.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Polished Mockup Side */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto max-w-lg rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xl shadow-primary/5">
              {/* Fake App Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                    CL
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Campus Feed
                      <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                    </p>
                    <p className="text-[10px] text-muted-foreground">Indian Institute of Technology • Live</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  <Sparkles className="size-3 text-amber-500" />
                  <span>Campus Radius</span>
                </div>
              </div>

              {/* Mockup Feed Stream */}
              <div className="mt-4 space-y-3.5">
                {/* Mock Card 1: Verified Post */}
                <div className="rounded-2xl border border-border/60 bg-background p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                        AK
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-1">
                          Aarav K.
                          <span className="rounded-full bg-primary/10 text-primary px-1 text-[9px] font-semibold">
                            CS &apos;27
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">15m ago • Robotics Club</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">#Hackathon</span>
                  </div>
                  <p className="mt-2 text-xs text-foreground/90 leading-relaxed">
                    Robot Wars registrations for the Annual Fest are officially open! Grab your team of 4 at the SAC room.
                  </p>
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="size-3" /> 24 replies
                    </span>
                    <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                      ♥ 68 vibes
                    </span>
                  </div>
                </div>

                {/* Mock Card 2: Academic Vault Quick Download */}
                <div className="rounded-2xl border border-border/60 bg-background p-3.5 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <BookOpen className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Data Structures & Algorithms — Midterm PYQ
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        5 Years Solved Papers • 1.2k peer downloads
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[10px] font-bold shrink-0">
                    Free PDF
                  </span>
                </div>

                {/* Mock Card 3: Live Event */}
                <div className="rounded-2xl border border-border/60 bg-background p-3.5 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Campus Open Mic & Indie Music Night
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Friday 7:00 PM • Amphitheater Lake
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-medium text-foreground shrink-0">
                    RSVP Open
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
