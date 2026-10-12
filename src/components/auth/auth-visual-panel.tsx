import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Lock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

const FEATURED_CAMPUSES = [
  "IIT Bombay",
  "BITS Pilani",
  "DTU Delhi",
  "NIT Trichy",
  "VIT Vellore",
  "IIT Delhi",
  "IIIT Hyderabad",
  "Manipal Univ",
  "Thapar Inst",
  "SRM Chennai",
];

export function AuthVisualPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full bg-card/40 dark:bg-card/25 border-r border-border/40 p-10 xl:p-14 select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header */}
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" href="/" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <GraduationCap className="size-3.5" />
            <span>1,350+ Indian Campus Hubs</span>
          </span>
        </div>

        <div className="space-y-3 max-w-lg">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            {mode === "sign-in" ? (
              <>
                Your campus pulse, <br />
                <span className="text-primary">unfiltered & verified.</span>
              </>
            ) : (
              <>
                The real college experience <br />
                <span className="text-primary">happens right here.</span>
              </>
            )}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CampusLoop connects students through official university email verification.
            Uncensored student confessions with zero-trace privacy, peer study vaults, and live campus feeds.
          </p>
        </div>
      </div>

      {/* Center Live Campus Cards Preview */}
      <div className="relative z-10 my-8 space-y-3.5 max-w-lg">
        {/* Sample Confession Micro-Card */}
        <div className="p-4 rounded-2xl border border-border/50 bg-background/80 dark:bg-background/60 shadow-xs space-y-2.5 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-primary">
              <Lock className="size-3" />
              <span>Identity Sealed · Zero Trace</span>
            </span>
            <span className="text-[11px] text-muted-foreground">IIT Kharagpur · 18m ago</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-medium">
            &ldquo;The library 3rd floor reading room AC has been under maintenance for 2 weeks right in the middle
            of mid-sems. Everyone is huddled in the basement cafeteria!&rdquo;
          </p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <TrendingUp className="size-3 text-primary" /> +84 upvotes
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" /> 23 student replies
            </span>
          </div>
        </div>

        {/* Sample Academic Vault Drop Micro-Card */}
        <div className="p-3.5 rounded-2xl border border-border/50 bg-background/80 dark:bg-background/60 shadow-xs flex items-center justify-between gap-3 backdrop-blur-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">DSA & Operating Systems End-Sem PYQs</p>
              <p className="text-[11px] text-muted-foreground truncate">Computer Science · Uploaded by 4th Year Senior</p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-1 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
            340+ downloads
          </span>
        </div>
      </div>

      {/* Bottom Hubs & Guarantees */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-border/40">
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            Active College Communities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FEATURED_CAMPUSES.map((campus) => (
              <span
                key={campus}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/70 text-foreground/80 border border-border/40"
              >
                {campus}
              </span>
            ))}
            <Link
              href="/colleges"
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
            >
              +1,340 more →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>College Email Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-primary shrink-0" />
            <span>Zero-Trace Confessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Zero Webmail Bots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
