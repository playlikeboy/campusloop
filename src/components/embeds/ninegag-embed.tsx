"use client";

import { ExternalLink, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

interface NineGagEmbedProps {
  gagId?: string;
  rawUrl: string;
  isHome?: boolean;
}

export function NineGagEmbed({ gagId, rawUrl, isHome }: NineGagEmbedProps) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = gagId ? `https://img-9gag-fun.9cache.com/photo/${gagId}_460sv.mp4` : null;
  const imageUrl = gagId ? `https://img-9gag-fun.9cache.com/photo/${gagId}_700b.jpg` : null;

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }

  // 1. 9GAG Home / Feed Portal Card
  if (isHome || !gagId) {
    return (
      <div
        className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-ui hover:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-black/90 px-3.5 py-2 text-white dark:bg-black">
          <div className="flex items-center gap-2">
            <span className="flex size-5.5 items-center justify-center rounded-md bg-white font-bold text-black text-xs tracking-tighter">
              9G
            </span>
            <span className="text-xs font-bold">9GAG</span>
          </div>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
          >
            <span>Open</span>
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-fg-muted">A link to the 9GAG home page.</p>

          <div className="pt-1 flex items-center justify-end">
            <a
              href="https://9gag.com/home"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90"
            >
              <span>Open 9GAG</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Specific Gag Embed
  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-ui"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border bg-black/90 px-3.5 py-2 text-white dark:bg-black">
        <div className="flex items-center gap-2">
          <span className="flex size-5.5 items-center justify-center rounded-md bg-white font-bold text-black text-xs tracking-tighter">
            9G
          </span>
          <span className="text-xs font-bold tracking-wide">9GAG</span>
          <span className="text-xs text-white/60 font-mono">#{gagId}</span>
        </div>
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
        >
          <span>View on 9GAG</span>
          <ExternalLink className="size-3 opacity-70" />
        </a>
      </div>

      {/* Media container */}
      <div className="relative flex max-h-[520px] w-full items-center justify-center bg-black/95 overflow-hidden">
        {!videoError && videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={imageUrl || undefined}
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="max-h-[520px] w-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {/* Custom overlay controls */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="pointer-events-auto flex size-13 items-center justify-center rounded-full bg-black/60 text-white transition-transform active:scale-95 shadow-lg"
                  aria-label="Play video"
                >
                  <Play className="size-6 fill-white translate-x-0.5" />
                </button>
              )}
            </div>

            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="flex size-9 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/85"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
            </div>
          </>
        ) : imageUrl ? (
          // Fallback image for photo memes
          <img
            src={imageUrl}
            alt={`9GAG Gag ${gagId}`}
            className="max-h-[520px] w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <p className="text-xs font-semibold">This 9GAG post can't play here. Open it on 9GAG.</p>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs font-bold text-primary underline"
            >
              Open on 9GAG.com
            </a>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-border px-3.5 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-xs">9gag.com/gag/{gagId}</span>
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-xs text-primary hover:underline flex items-center gap-1"
        >
          <span>Comments & Upvotes</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
