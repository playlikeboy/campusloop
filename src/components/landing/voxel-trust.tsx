import Image from "next/image";
import Link from "next/link";
import { Check, Lock, ShieldCheck, UserCheck } from "lucide-react";

const TRUST_POINTS = [
  {
    icon: UserCheck,
    title: "Verified Student Accounts",
    description: "Every student account is gated by college institutional email (.ac.in and .edu).",
  },
  {
    icon: ShieldCheck,
    title: "Campus-First Communities",
    description: "Conversations and notes stay centered around your immediate university peers.",
  },
  {
    icon: Lock,
    title: "Accountable Anonymity",
    description: "Candid expression protected by identity escrow to permanently deter ragging.",
  },
  {
    icon: Check,
    title: "Transparent Moderation",
    description: "Student-guided reporting queues with active statutory anti-ragging compliance.",
  },
];

export function VoxelTrust() {
  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Voxel Trust Artwork */}
          <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:col-span-6 lg:max-w-none order-2 lg:order-1">
            <div className="relative rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-2 shadow-xl shadow-primary/5 sm:p-3">
              <div className="relative aspect-4/3 sm:aspect-16/11 w-full overflow-hidden rounded-2xl bg-muted/30">
                <Image
                  src="/campusloop/marketing/voxel/trust.webp"
                  alt="3D voxel illustration of a peaceful university campus plaza with fountain and students"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>
              <div className="mt-2.5 px-2 pb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium">Peaceful Campus Plaza</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Verified Environment
                </span>
              </div>
            </div>
          </div>

          {/* Trust Content */}
          <div className="text-center lg:col-span-6 lg:text-left order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Trust &amp; Community Safety
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              A safer, verified
              <br />
              <span className="text-primary">campus space.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
              Designed from day one for college life. Zero commercial advertisers, zero recruiters, and genuine student accountability.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">
              {TRUST_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="rounded-2xl border border-border/60 bg-card p-4 shadow-2xs"
                  >
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="mt-3 text-xs font-bold text-foreground">{point.title}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center lg:text-left">
              <Link
                href="/safety"
                className="text-xs font-semibold text-primary hover:underline underline-offset-4"
              >
                Read our Safety &amp; Anti-Ragging Standards →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
