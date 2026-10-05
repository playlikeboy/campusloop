"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type VoxelBackdropProps = {
  scene: "campus" | "academics" | "communities" | "events" | "utility" | "safety";
  className?: string;
  overlay?: "soft" | "dark" | "none";
  priority?: boolean;
};

const SCENES = {
  campus: { src: "/campusloop/voxel/campus.svg", alt: "A miniature voxel campus world" },
  academics: { src: "/campusloop/voxel/academics.svg", alt: "A cozy voxel campus library" },
  communities: { src: "/campusloop/voxel/communities.svg", alt: "A friendly voxel student community plaza" },
  events: { src: "/campusloop/voxel/events.svg", alt: "A welcoming voxel campus event at night" },
  utility: { src: "/campusloop/voxel/utility.svg", alt: "A voxel campus marketplace and mobility hub" },
  safety: { src: "/campusloop/voxel/safety.svg", alt: "A calm voxel campus safety gate" },
} as const;

export function VoxelBackdrop({ scene, className, overlay = "soft", priority = false }: VoxelBackdropProps) {
  const asset = SCENES[scene];

  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 overflow-hidden", className)} aria-hidden="true">
      <Image src={asset.src} alt={asset.alt} width={1600} height={800} priority={priority} className="h-auto w-full object-cover" />
      {overlay !== "none" && (
        <div
          className={cn(
            "absolute inset-0",
            overlay === "dark"
              ? "bg-gradient-to-b from-slate-950/65 via-slate-950/15 to-background"
              : "bg-gradient-to-b from-background/10 via-background/20 to-background"
          )}
        />
      )}
    </div>
  );
}
