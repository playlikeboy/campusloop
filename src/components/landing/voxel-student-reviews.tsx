import { ShieldCheck, Star } from "lucide-react";

export function VoxelStudentReviews() {
  const reviews = [
    {
      name: "Rohan Verma",
      role: "B.Tech CSE '25",
      college: "BIT Mesra",
      avatarBg: "bg-emerald-500",
      initials: "RV",
      text: "The Academic Vault saved our whole batch during mid-terms. Finding handwritten notes and exact PYQ solutions in 2 seconds beats scouring WhatsApp groups.",
      badge: "Verified Student",
    },
    {
      name: "Priya Nair",
      role: "ECE '26",
      college: "IIT Bombay",
      avatarBg: "bg-blue-500",
      initials: "PN",
      text: "Switching between local campus confessions and national hackathons is effortless. It feels like what college social media should have been all along.",
      badge: "Verified Student",
    },
    {
      name: "Aman Singhania",
      role: "Economics '25",
      college: "Delhi University",
      avatarBg: "bg-amber-500",
      initials: "AS",
      text: "Our dramatics society recruited 40+ new freshmen in one week using the official society hub. The student verification keeps the whole platform authentic.",
      badge: "Society Lead",
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 bg-gradient-to-b from-background via-emerald-50/10 to-background overflow-hidden select-none">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-[#16a34a] dark:text-emerald-400 mb-3 shadow-xs">
            <ShieldCheck className="size-3.5 text-[#22c55e]" />
            <span>Trusted Across Campuses</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            LOVED BY STUDENTS ACROSS INDIA
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            From premier tech institutes to central universities — built by students, for students.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.name}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-all hover:-translate-y-1 duration-300"
            >
              <div>
                {/* 5-star row */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic">
                  “{rev.text}”
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

                <span className="rounded-full bg-emerald-500/15 text-[#16a34a] text-[9px] font-black px-2 py-0.5">
                  {rev.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
