"use client";

import { type RefObject, useEffect, useRef } from "react";
import { trackReelTelemetry } from "@/lib/api";
import { isLoopWrap, summarizeReelView } from "@/lib/reels/telemetry";

/**
 * Watch %, loops and quick skips for one reel, sent as a single summary each
 * time the reel stops being the active one (or the page is hidden). Feeds the
 * v3 ranker's completion and loop terms via /api/reels/track.
 */
export function useReelTelemetry(options: {
  postId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  enabled: boolean;
  authorId?: string | null;
  institutionId?: string | null;
  tags?: string[];
}) {
  const { postId, videoRef, isActive, enabled } = options;
  const meta = useRef({ authorId: options.authorId, institutionId: options.institutionId, tags: options.tags });
  meta.current = { authorId: options.authorId, institutionId: options.institutionId, tags: options.tags };

  useEffect(() => {
    if (!enabled || !isActive || typeof window === "undefined") return;
    const video = videoRef.current;
    const startedAt = Date.now();
    let loops = 0;
    let lastSec = 0;
    let maxPositionMs = 0;
    let sent = false;

    const onTime = () => {
      if (!video) return;
      const current = video.currentTime;
      const duration = video.duration;
      if (isLoopWrap(lastSec, current, duration)) {
        loops += 1;
        maxPositionMs = Math.max(maxPositionMs, duration * 1000);
      }
      lastSec = current;
      maxPositionMs = Math.max(maxPositionMs, current * 1000);
    };

    const send = () => {
      if (sent) return;
      sent = true;
      const duration = video && Number.isFinite(video.duration) ? video.duration * 1000 : undefined;
      const summary = summarizeReelView({ watchMs: Date.now() - startedAt, durationMs: duration, loops, maxPositionMs });
      if (summary.watchDurationMs < 300) return;
      void trackReelTelemetry({
        postId,
        ...summary,
        authorId: meta.current.authorId ?? null,
        institutionId: meta.current.institutionId ?? null,
        tags: (meta.current.tags ?? []).slice(0, 5),
      }).catch(() => {});
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };

    video?.addEventListener("timeupdate", onTime);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => {
      video?.removeEventListener("timeupdate", onTime);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [postId, videoRef, isActive, enabled]);
}
