"use client";

import {
  CircleAlert,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  compact?: boolean;
}

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

const controlButton =
  "flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition-ui hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);

  function togglePlay(e?: React.MouseEvent) {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => setIsPlaying(false));
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number.parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  }

  function toggleFullscreen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleUserActivity() {
    if (hasError) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playingRef.current) setShowControls(false);
    }, 2500);
  }

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setTotalDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setIsLoading(false);
      setHasError(false);
      if (video.videoHeight && video.videoWidth && video.videoHeight > video.videoWidth) {
        setIsPortrait(true);
      }
    };
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => {
      playingRef.current = false;
      setIsPlaying(false);
      setShowControls(true);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      playingRef.current = true;
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => {
      playingRef.current = false;
      setIsPlaying(false);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("error", onError);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const controlsVisible = !hasError && (showControls || !isPlaying);

  function retryVideo() {
    if (!videoRef.current) return;
    setHasError(false);
    setIsLoading(true);
    videoRef.current.load();
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "no-card-nav relative max-w-lg select-none overflow-hidden rounded-lg bg-black",
        isPortrait ? "aspect-[9/16] max-h-[520px]" : "aspect-video max-h-[440px]",
        className
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded video, no caption track available */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="h-full w-full cursor-pointer object-contain"
      />

      {!hasError && !isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 focus-visible:outline-none"
          aria-label="Play video"
        >
          <span className="cl-interactive flex size-14 items-center justify-center rounded-full bg-sticker text-sticker-fg shadow-sticker">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : (
              <Play className="ml-1 size-6 fill-current" aria-hidden />
            )}
          </span>
        </button>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
          <CircleAlert className="size-6" aria-hidden />
          <div>
            <p className="text-sm font-semibold">This video won't load</p>
            <p className="mt-1 text-xs text-white/75">Check your connection and try again.</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              retryVideo();
            }}
            className="cl-interactive inline-flex h-11 items-center gap-1.5 rounded-full bg-sticker px-4 text-sm font-semibold text-sticker-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <RefreshCw className="size-4" aria-hidden />
            Try again
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 space-y-1 bg-black/55 px-2 pt-2 pb-1 transition-ui",
          controlsVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="relative flex h-4 items-center px-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${progressPercent}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label="Seek"
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(totalDuration)}`}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-white">
          <div className="flex items-center">
            <button
              type="button"
              onClick={togglePlay}
              className={controlButton}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" aria-hidden />
              ) : (
                <Play className="size-4 fill-current" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className={controlButton}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-4" aria-hidden />
              ) : (
                <Volume2 className="size-4" aria-hidden />
              )}
            </button>
            <span className="pl-1 tabular-nums">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={controlButton}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" aria-hidden />
            ) : (
              <Maximize2 className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
