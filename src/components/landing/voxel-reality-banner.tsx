import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface VoxelRealityBannerProps {
  isAuthenticated?: boolean;
}

export function VoxelRealityBanner({ isAuthenticated = false }: VoxelRealityBannerProps) {
  return (
    <section className="relative py-12 sm:py-20 overflow-hidden bg-background">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 sm:p-8 shadow-2xl transition-all hover:shadow-emerald-500/10">
          {/* Main Visual Image matching Image 2 */}
          <div className="relative aspect-2/1 sm:aspect-16/7 w-full overflow-hidden rounded-3xl border border-border/40 shadow-inner">
            <Image
              src="/campusloop/marketing/voxel/cute-reality-banner.webp"
              alt="Turn your ideas into reality — cute voxel student cheering on campus grass blocks"
              fill
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            
            {/* Top-Right Badge */}
            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[10px] sm:text-xs font-black text-foreground shadow-md backdrop-blur-md">
              <Sparkles className="size-3 text-[#22c55e]" />
              <span>CampusLoop 2026</span>
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                Your college journey deserves more than dead WhatsApp groups.
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Connect with verified students from your department, share notes, and build projects together.
              </p>
            </div>

            <Link
              href={isAuthenticated ? "/feeds" : "/sign-up"}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? "Go to Feed" : "Turn Ideas Into Reality"}</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
