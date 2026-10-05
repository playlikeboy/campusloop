import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles } from "lucide-react";

export function VoxelCascadeShowcase() {
  return (
    <section className="relative py-16 sm:py-24 bg-gradient-to-b from-background via-emerald-50/15 to-background overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Cascading Perspective Mockup Cards */}
          <div className="lg:col-span-7 relative order-2 lg:order-1">
            {/* Background Voxel Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-emerald-400/5 to-transparent blur-2xl" />

            {/* Cascading Mobile Stack Mockup */}
            <div className="relative grid grid-cols-2 gap-4 sm:gap-6">
              {/* Phone 1: Campus Feed Stream */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-4 shadow-xl -rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <div className="size-6 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-[9px] font-black">
                    IIT
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground">Campus Feed</p>
                    <p className="text-[9px] text-muted-foreground">IIT Bombay Hub</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="rounded-2xl bg-muted/40 p-2.5 text-left">
                    <span className="rounded bg-rose-500/15 text-rose-600 px-1.5 py-0.5 text-[8px] font-black uppercase">
                      Confession
                    </span>
                    <p className="text-[10px] text-foreground font-medium mt-1">
                      Who else is pulling an all-nighter for the OS mid-terms?
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <span className="rounded bg-[#22c55e]/15 text-[#16a34a] px-1.5 py-0.5 text-[8px] font-black uppercase">
                      Campus Poll
                    </span>
                    <p className="text-[10px] text-foreground font-bold mt-1">Best chai stall near Main Gate?</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[9px] bg-[#22c55e]/10 text-[#16a34a] font-bold px-2 py-1 rounded-lg">
                        <span>Raju Chai</span>
                        <span>64%</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] bg-muted/50 px-2 py-1 rounded-lg">
                        <span>Canteen 3</span>
                        <span>36%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2: Academic Vault & Notes */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-4 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300 translate-y-4 sm:translate-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-black">
                      AV
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground">Academic Vault</p>
                      <p className="text-[9px] text-muted-foreground">Semester 5</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#16a34a]">Verified</span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-black text-foreground">DBMS Unit 1-4 Hand Notes</p>
                        <p className="text-[8px] text-muted-foreground">Prof. Sharma • 4.9 ★</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 p-2.5 text-left bg-background/80">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-amber-500" />
                      <div>
                        <p className="text-[10px] font-black text-foreground">2024 End-Sem PYQ Solutions</p>
                        <p className="text-[8px] text-muted-foreground">Computer Science Dept</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-2 text-[9px] font-bold text-[#16a34a]">
                    <span>✓ Free Instant Download</span>
                    <span>PDF (8.4 MB)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: "LEARN BY DOING" Heading matching Image 1 */}
          <div className="lg:col-span-5 text-center lg:text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] mb-3">
              <Sparkles className="size-3.5" />
              <span>Campus Collaboration</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.1]">
              LEARN BY DOING.
              <br />
              <span className="text-[#16a34a]">CONNECT BY LIVING.</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              Context is everything. Practice leadership, exchange notes, organize hackathons, and discover what your campus is talking about in real-time.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/colleges"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Find Your College Hub</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/academics"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card hover:bg-muted px-5 py-3 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer"
              >
                <BookOpen className="size-4 text-blue-500" />
                <span>Browse Notes</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
