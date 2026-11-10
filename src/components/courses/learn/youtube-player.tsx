"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * YouTube IFrame API wrapper for the course player.
 * Reports position every few seconds (for resume), fires onAlmostDone once at
 * 90% watched (auto-complete), and onEnded (autoplay next).
 */

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(s: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
  setPlaybackRate(r: number): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer; PlayerState: { ENDED: number; PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

export interface PlayerHandle {
  currentTime(): number;
  seek(sec: number): void;
  togglePlay(): void;
  setRate(rate: number): void;
}

interface Props {
  videoId: string;
  startAt?: number;
  autoplay?: boolean;
  onProgress?: (sec: number, duration: number) => void;
  onAlmostDone?: () => void;
  onEnded?: () => void;
}

export const YouTubePlayer = forwardRef<PlayerHandle, Props>(function YouTubePlayer(
  { videoId, startAt = 0, autoplay = true, onProgress, onAlmostDone, onEnded },
  ref
) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const cbs = useRef({ onProgress, onAlmostDone, onEnded });
  cbs.current = { onProgress, onAlmostDone, onEnded };

  useImperativeHandle(ref, () => ({
    currentTime: () => player.current?.getCurrentTime() ?? 0,
    seek: (sec) => player.current?.seekTo(Math.max(0, sec), true),
    togglePlay: () => {
      const p = player.current;
      if (!p) return;
      if (p.getPlayerState() === window.YT?.PlayerState.PLAYING) p.pauseVideo();
      else p.playVideo();
    },
    setRate: (r) => player.current?.setPlaybackRate(r),
  }));

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let almostFired = false;
    const mount = document.createElement("div");
    host.current?.appendChild(mount);

    loadApi().then(() => {
      if (cancelled || !window.YT) return;
      player.current = new window.YT.Player(mount, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(startAt), autoplay: autoplay ? 1 : 0 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT?.PlayerState.ENDED) cbs.current.onEnded?.();
          },
        },
      });
      timer = setInterval(() => {
        const p = player.current;
        if (!p || typeof p.getCurrentTime !== "function") return;
        const t = p.getCurrentTime();
        const d = p.getDuration();
        if (d > 0) {
          cbs.current.onProgress?.(t, d);
          if (!almostFired && t / d >= 0.9) {
            almostFired = true;
            cbs.current.onAlmostDone?.();
          }
        }
      }, 5000);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      // Report the final position before tearing down (lecture switch, unmount).
      const p = player.current;
      if (p && typeof p.getCurrentTime === "function") cbs.current.onProgress?.(p.getCurrentTime(), p.getDuration());
      p?.destroy();
      player.current = null;
      mount.remove();
    };
  }, [videoId, startAt, autoplay]);

  return <div ref={host} className="absolute inset-0 [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full" />;
});
