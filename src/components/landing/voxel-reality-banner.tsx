import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

interface VoxelRealityBannerProps {
  isAuthenticated?: boolean;
}

export function VoxelRealityBanner({ isAuthenticated = false }: VoxelRealityBannerProps) {
  return (
    <section className="relative w-full py-10 sm:py-20 overflow-hidden bg-background select-none">
      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-card to-card p-3.5 sm:p-6 lg:p-8 shadow-xl border border-border/60 hover:border-emerald-500/40 transition-all">
          {/* Visual banner */}
          <div className="relative aspect-2/1 sm:aspect-16/7 w-full overflow-hidden rounded-xl sm:rounded-2xl">
            <Image
              src="/campusloop/marketing/voxel/cute-reality-banner.webp"
              alt="Turn your ideas into reality — cute voxel student cheering on campus grass blocks"
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover object-center transition-transform duration-700 hover:scale-102"
            />
            
            <div className="absolute top-2.5 right-2.5 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black text-foreground shadow-md backdrop-blur-md border border-border/40">
              <Sparkles className="size-3 text-primary" />
              <span>CampusLoop Verified Layer</span>
            </div>
          </div>

          {/* Action Strip */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-1 sm:px-2">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-2xl font-black text-foreground leading-snug">
                College only happens once. Don&apos;t spend it on the sidelines.
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                Find your crowd, pass your toughest papers without solo all-nighters, and make the college memories everyone else only dreams about.
              </p>
            </div>

            <Link
              href={isAuthenticated ? "/feeds" : "/sign-up"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 px-6 sm:px-7 py-3 sm:py-3.5 min-h-[48px] w-full sm:w-auto text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="size-4" />
              <span>{isAuthenticated ? "Enter Campus Feed" : "Claim Your Free Handle"}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
