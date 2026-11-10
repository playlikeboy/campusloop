"use client";

import { Camera, GraduationCap, Heart, MapPin, School, X } from "lucide-react";
import { motion, type PanInfo, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { formatStudyYear, initials } from "./crush-types";

export type Candidate = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  photos: string[];
  bio: string | null;
  gender?: string | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  points?: number;
  interests?: string[];
  compatibilityScore: number;
  sharedInterests: string[];
  likedYou?: boolean;
  /** Coarse bucket ("Within 5 km") from the server; never coordinates. */
  distanceLabel?: string | null;
  institution?: { name: string; slug?: string | null; state?: string | null } | null;
};

/** Generated avatars and stock portraits are not the student, so they never show as their photos. */
const isPlaceholder = (url?: string | null) =>
  !url || url.includes("dicebear.com") || url.includes("images.unsplash.com");

/** The student's own photos only. Empty when they have not added any. */
export function candidatePhotos(c: Candidate): string[] {
  return (c.photos || []).filter((p) => !isPlaceholder(p));
}

/** Shown instead of a photo when the student has not added one. */
function NoPhoto({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center gap-2 bg-crush-subtle text-crush-text",
        // Full cards keep the letter in the top half, clear of the name and details overlay.
        compact ? "justify-center" : "justify-start pt-[18%]"
      )}
    >
      <span className="font-display text-7xl font-extrabold">{initials(name)}</span>
      {!compact && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Camera className="size-4" aria-hidden="true" />
          No photo yet
        </span>
      )}
    </div>
  );
}

const META_CHIP = "inline-flex max-w-full items-center gap-1 truncate rounded-full bg-black/55 px-2.5 py-1";

/** Top card: drag or use the buttons below. Shows a Like / Pass sticker while dragging. */
export function TopCard({
  candidate,
  onSwipe,
}: {
  candidate: Candidate;
  onSwipe: (d: "like" | "pass") => void;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], reduceMotion ? [0, 0] : [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [exitX, setExitX] = useState(0);

  const photos = candidatePhotos(candidate);
  const year = formatStudyYear(candidate.year);
  const study = [candidate.course, candidate.branch].filter(Boolean).join(" · ");

  function fireSwipe(direction: "like" | "pass") {
    setExitX(direction === "like" ? 500 : -500);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(direction === "like" ? [20, 40] : 15);
    }
    if (direction === "like") sounds.pop();
    else sounds.tap();
    setTimeout(() => onSwipe(direction), reduceMotion ? 0 : 180);
  }

  return (
    <motion.article
      aria-label={`${candidate.displayName}'s profile`}
      style={{ x, rotate }}
      animate={exitX !== 0 ? { x: exitX, opacity: 0 } : {}}
      transition={exitX !== 0 ? { duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] } : undefined}
      drag={exitX === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_: unknown, info: PanInfo) => {
        if (info.offset.x > 80 || info.velocity.x > 400) fireSwipe("like");
        else if (info.offset.x < -80 || info.velocity.x < -400) fireSwipe("pass");
        else x.set(0);
      }}
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-xl bg-black shadow-lg select-none active:cursor-grabbing"
    >
      {photos.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[photoIdx]}
          alt={`${candidate.displayName}, photo ${photoIdx + 1} of ${photos.length}`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          loading="eager"
        />
      ) : (
        <NoPhoto name={candidate.displayName} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-black/40" />

      {photos.length > 1 && (
        <>
          <div className="absolute inset-x-3 top-3 z-30 flex gap-1" aria-hidden="true">
            {photos.map((p, i) => (
              <span
                key={p}
                className={cn(
                  "h-1 flex-1 rounded-full transition-ui",
                  i <= photoIdx ? "bg-white" : "bg-white/35"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Previous photo"
            disabled={photoIdx === 0}
            onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
            className="absolute top-8 bottom-44 left-0 z-20 w-1/3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default"
          />
          <button
            type="button"
            aria-label="Next photo"
            disabled={photoIdx === photos.length - 1}
            onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
            className="absolute top-8 right-0 bottom-44 z-20 w-1/3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default"
          />
        </>
      )}

      <motion.div
        aria-hidden="true"
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-10 left-5 z-30 flex -rotate-6 items-center gap-1.5 rounded-sticker bg-crush px-4 py-2 text-crush-fg shadow-sticker"
      >
        <Heart className="size-5 fill-current" aria-hidden="true" />
        <span className="sticker-caption text-2xl">Like</span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute top-10 right-5 z-30 flex rotate-6 items-center gap-1.5 rounded-sticker bg-sticker px-4 py-2 text-sticker-fg shadow-sticker"
      >
        <X className="size-5" aria-hidden="true" />
        <span className="sticker-caption text-2xl">Pass</span>
      </motion.div>

      {candidate.likedYou && (
        <span className="absolute top-6 right-4 z-20 inline-flex items-center gap-1 rounded-full bg-crush px-3 py-1 text-xs font-semibold text-crush-fg">
          <Heart className="size-3 fill-current" aria-hidden="true" /> Likes you
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 space-y-2.5 p-5 text-white">
        <div className="flex min-w-0 items-center">
          <Link
            href={`/@${candidate.username}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-display text-3xl leading-tight font-extrabold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {candidate.displayName}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/90">
          <span className={META_CHIP}>{candidate.compatibilityScore}% match</span>
          {year && <span className={META_CHIP}>{year}</span>}
          {candidate.institution?.name && (
            <span className={META_CHIP}>
              <School className="size-3.5 shrink-0" aria-hidden="true" />
              {candidate.institution.name.split(",")[0]}
            </span>
          )}
          {candidate.distanceLabel && (
            <span className={META_CHIP}>
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {candidate.distanceLabel}
            </span>
          )}
          {study && (
            <span className={META_CHIP}>
              <GraduationCap className="size-3.5 shrink-0" aria-hidden="true" />
              {study}
            </span>
          )}
        </div>

        {candidate.sharedInterests.length > 0 && (
          <p className="text-sm text-white/90">
            <span className="font-semibold text-white">You both like </span>
            {candidate.sharedInterests.slice(0, 4).join(", ")}
          </p>
        )}

        {candidate.bio && (
          <p className="line-clamp-2 text-sm leading-relaxed text-white/85">{candidate.bio}</p>
        )}
      </div>
    </motion.article>
  );
}

/** Static card behind the top card for the stack look. */
export function BackCard({ candidate, depth }: { candidate: Candidate; depth: 1 | 2 }) {
  const photo = candidatePhotos(candidate)[0];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-black shadow-sm"
      style={{ transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`, zIndex: -depth }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
        />
      ) : (
        <NoPhoto name={candidate.displayName} compact />
      )}
    </div>
  );
}
