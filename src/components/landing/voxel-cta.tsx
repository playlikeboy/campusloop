import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

interface VoxelCTAProps {
  isAuthenticated?: boolean;
}

export function VoxelCTA({ isAuthenticated = false }: VoxelCTAProps) {
  return (
    <section className="py-16 sm:py-24 border-t border-border/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 via-primary/5 to-card p-8 sm:p-12 lg:p-16 text-center shadow-lg shadow-primary/5">
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />

          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Start Today
          </span>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Your campus is already happening.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Connect with verified students, access the Academic Vault, and stay in the loop with what&apos;s next.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={isAuthenticated ? "/feeds" : "/sign-up"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/95 active:scale-[0.98] transition-all sm:w-auto"
            >
              <span>{isAuthenticated ? "Launch Campus Feed" : "Join CampusLoop"}</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/explore"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/60 active:scale-[0.98] transition-all sm:w-auto"
            >
              <Compass className="size-4 text-muted-foreground" />
              <span>Explore First</span>
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Requires college email (.ac.in / .edu) • No commercial ads
          </p>
        </div>
      </div>
    </section>
  );
}
