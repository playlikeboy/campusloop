import { CheckCircle2, ShieldCheck, Star } from "lucide-react";

export function VoxelStudentReviews() {
  const reviews = [
    {
      name: "Rohan Verma",
      role: "B.Tech CSE '25",
      college: "BIT Mesra",
      avatarBg: "bg-primary",
      initials: "RV",
      text: "The 2 AM PYQ drop before the Maths-III end-sem literally saved our batch from backlogs. Having handwritten topper notes indexed by professor rating is pure cheat codes.",
      badge: "Verified Student",
      highlight: "Saved Mid-Sem CGPA",
    },
    {
      name: "Priya Nair",
      role: "ECE '26",
      college: "IIT Bombay",
      avatarBg: "bg-blue-500",
      initials: "PN",
      text: "Campus Match actually works because everyone is gated by their university ID. No fake accounts, zero creepy bots, just genuine batchmates in your campus radius.",
      badge: "Verified Student",
      highlight: "Found Campus Circle",
    },
    {
      name: "Aman Singhania",
      role: "Economics '25",
      college: "Delhi University",
      avatarBg: "bg-amber-500",
      initials: "AS",
      text: "Our cultural society recruited 60+ new freshmen in 48 hours without spending a single rupee on Instagram boost. The campus hub reaches every student instantly.",
      badge: "Society Lead",
      highlight: "Recruited 60+ Freshmen",
    },
  ];

  return (
    <section className="relative py-10 sm:py-20 md:py-24 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden select-none">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-2.5 border border-primary/20 shadow-xs">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Unfiltered Campus Feedback</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.08]">
            WHAT STUDENTS SAY BEHIND
            <br />
            <span className="text-primary">CLOSED HOSTEL DOORS.</span>
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground">
            From premier tech institutes to central universities — built by students, for students.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.name}
              className="rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-4 sm:p-6 shadow-md flex flex-col justify-between hover:border-primary/40 transition-all hover:-translate-y-1 duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* 5-star row */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">
                    {rev.highlight}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-9 rounded-2xl ${rev.avatarBg} flex items-center justify-center text-white text-xs font-black shadow-xs`}
                  >
                    {rev.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-foreground">{rev.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {rev.role} • {rev.college}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="size-2.5" />
                  <span>{rev.badge}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
