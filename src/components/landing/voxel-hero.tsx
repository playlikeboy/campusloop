import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

interface VoxelHeroProps {
  isAuthenticated?: boolean;
}

export function VoxelHero({ isAuthenticated = false }: VoxelHeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28">
      {/* Soft atmospheric gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Text & Actions */}
          <div className="text-center lg:col-span-6 lg:text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold tracking-wide text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>THE CAMPUS NETWORK</span>
            </div>

            {/* Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl sm:leading-[1.1]">
              Your campus,
              <br />
              <span className="text-primary">all in one place.</span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-4 text-base text-muted-foreground sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              Find people, resources, communities and events around your campus.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href={isAuthenticated ? "/feeds" : "/sign-up"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all sm:w-auto"
              >
                <span>{isAuthenticated ? "Enter Campus" : "Join CampusLoop"}</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/explore"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm hover:bg-muted/60 active:scale-[0.98] transition-all sm:w-auto"
              >
                <Compass className="size-4 text-muted-foreground" />
                <span>Explore Campus</span>
              </Link>
            </div>

            {/* Micro verification trust chip */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Verified student emails (.ac.in / .edu)
              </span>
              <span>•</span>
              <span>Free forever</span>
            </div>
          </div>

          {/* Right Column: Voxel Artwork */}
          <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:col-span-6 lg:max-w-none">
            <div className="relative rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-2 shadow-xl shadow-primary/5 sm:p-3">
              <div className="relative aspect-4/3 sm:aspect-16/11 w-full overflow-hidden rounded-2xl bg-muted/30">
                <Image
                  src="/campusloop/marketing/voxel/hero.webp"
                  alt="3D voxel illustration of CampusLoop college campus life with students, library, and clock tower"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                  className="object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>

              {/* Subtle caption */}
              <div className="mt-2.5 px-2 pb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium">Voxel Campus Plaza</span>
                <span className="text-primary font-semibold">CampusLoop 3D</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
