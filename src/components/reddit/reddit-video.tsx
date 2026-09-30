"use client";

import Hls from "hls.js";
import { AlertCircle, ExternalLink, Loader2, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ExternalPostInfo, ExternalPostMedia } from "@/hooks/use-feed";
import { extractVideoStreamInfo } from "@/lib/video/stream-helper";

interface RedditVideoProps {
  media: ExternalPostMedia;
  externalPost: ExternalPostInfo;
  className?: string;
  autoPlayInView?: boolean;
}

export function RedditVideo({
  media,
  externalPost,
  className = "",
  autoPlayInView = true,
}: RedditVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const streamInfo = useMemo(() => {
    return extractVideoStreamInfo(media.mediaUrl, [media]);
  }, [media]);

  const hlsUrl = streamInfo?.hlsUrl || media.hlsUrl;
  const videoUrl = streamInfo?.hdVideoUrl || media.mediaUrl;

  const isVertical = Boolean(media.height && media.width && media.height > media.width);
  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : isVertical ? "9 / 16" : "16 / 9";

  // Attach HLS stream or native HLS/MP4 fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setHasError(false);
    setIsLoading(true);

    if (hlsUrl && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        capLevelToPlayerSize: false,
      });
      hls.autoLevelCapping = -1;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls && hls.levels && hls.levels.length > 0) {
          hls.currentLevel = hls.levels.length - 1;
        }
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              hls = null;
              video.src = videoUrl;
              break;
          }
        }
      });
    } else if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      setIsLoading(false);
    } else {
      video.src = videoUrl;
      setIsLoading(false);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl, videoUrl]);

  // Pause playback when scrolled out of view
  useEffect(() => {
    if (!autoPlayInView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [autoPlayInView]);

  function togglePlay(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  }

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl border border-border/70 bg-muted/30 p-4 flex flex-col items-center justify-center text-center gap-3 select-none no-card-nav ${className}`}
        style={{ aspectRatio: isVertical ? "9 / 16" : "16 / 9", maxHeight: "520px" }}
        data-no-nav="true"
        onClick={(e) => e.stopPropagation()}
      >
        {media.thumbnailUrl && (
          <img
            src={media.thumbnailUrl}
            alt="Video preview"
            className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs"
          />
        )}
        <div className="relative z-10 flex flex-col items-center gap-2 max-w-xs">
          <div className="size-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <AlertCircle className="size-5" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Video format requires Reddit viewer</p>
          <a
            href={externalPost.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-xs"
          >
            <Play className="size-3.5 fill-white" />
            <span>Watch on Reddit</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className={`relative overflow-hidden rounded-2xl border border-border/70 bg-black shadow-sm max-w-xl no-card-nav group cursor-pointer select-none ${className}`}
      style={{
        aspectRatio,
        maxHeight: isVertical ? "520px" : "440px",
      }}
      data-no-nav="true"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={media.thumbnailUrl || media.previewUrl || undefined}
        playsInline
        muted={isMuted}
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-contain"
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      >
        <track kind="captions" />
      </video>

      {/* Centered Play Indicator when paused */}
      {!hasError && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] pointer-events-none transition-opacity">
          <div className="size-13 rounded-full bg-black/60 text-white border border-white/25 flex items-center justify-center shadow-xl backdrop-blur-md transition-transform group-hover:scale-105 active:scale-95">
            <Play className="size-6 fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 pointer-events-none">
          <Loader2 className="size-7 text-white/80 animate-spin" />
        </div>
      )}

      {/* Corner Mute / Unmute Button */}
      {!hasError && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-2.5 right-2.5 z-20 size-8 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer shadow-md"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </button>
      )}

      {/* Subtle Bottom Progress Bar */}
      {!hasError && isPlaying && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 overflow-hidden z-20 pointer-events-none">
          <div
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
