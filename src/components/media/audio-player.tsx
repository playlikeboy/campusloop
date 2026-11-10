"use client";

import { AlertCircle, Loader2, Mic, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  title?: string;
  duration?: number; // seconds
  compact?: boolean;
  /** Inside the sender's violet chat bubble: draws in the bubble's foreground colour. */
  isMe?: boolean;
  className?: string;
}

// Fixed bar heights so the waveform looks the same on server and client.
const WAVE_BARS = [
  35, 60, 90, 45, 75, 100, 80, 50, 65, 95, 70, 40, 85, 100, 60, 75, 90, 45, 80, 60, 40, 90, 70, 50,
];

const RATES = [1, 1.5, 2] as const;
type Rate = (typeof RATES)[number];

function formatTime(seconds: number) {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function AudioPlayer({
  src,
  title = "Voice note",
  duration,
  compact = false,
  isMe = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [rate, setRate] = useState<Rate>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const onBubble = compact && isMe;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || failed) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number.parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  }

  function cycleRate(e: React.MouseEvent) {
    e.stopPropagation();
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setTotalDuration(audio.duration);
      setIsLoading(false);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setFailed(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "no-card-nav select-none rounded-lg",
        compact ? "min-w-[210px] max-w-xs px-1 py-1" : "max-w-md border border-border bg-surface p-3",
        className
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: user voice notes have no caption track */}
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={failed}
          className={cn(
            "cl-interactive flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            onBubble
              ? "bg-brand-fg text-brand hover:opacity-90"
              : "bg-brand text-brand-fg hover:bg-brand-hover"
          )}
          aria-label={failed ? "Voice note can't play" : isPlaying ? "Pause" : "Play"}
        >
          {failed ? (
            <AlertCircle className="size-5" aria-hidden />
          ) : isLoading && isPlaying ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : isPlaying ? (
            <Pause className="size-5 fill-current" aria-hidden />
          ) : (
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          {!compact && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 font-semibold text-fg">
                <Mic className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                <span className="truncate">{title}</span>
              </span>
              <span className="shrink-0 tabular-nums text-fg-muted">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>
          )}

          <div className="relative flex h-6 items-center">
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-between gap-[2px] px-0.5"
              aria-hidden
            >
              {WAVE_BARS.map((height, idx) => {
                const passed = (idx / (WAVE_BARS.length - 1)) * 100 <= progressPercent;
                return (
                  <span
                    key={idx}
                    className={cn(
                      "w-[3px] rounded-full transition-ui",
                      onBubble
                        ? passed
                          ? "bg-brand-fg"
                          : "bg-brand-fg/40"
                        : passed
                          ? "bg-brand"
                          : "bg-border-strong"
                    )}
                    style={{ height: `${Math.max(15, (height / 100) * 22)}px` }}
                  />
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={totalDuration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={failed}
              className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
              aria-label="Seek"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(totalDuration)}`}
            />
          </div>

          {compact && (
            <div className="flex items-center justify-between text-xs leading-none tabular-nums opacity-80">
              <span>{failed ? "Can't play this voice note" : formatTime(currentTime)}</span>
              {!failed && <span>{formatTime(totalDuration)}</span>}
            </div>
          )}
          {!compact && failed && (
            <p className="text-xs text-danger">This voice note can't play. Try opening it again later.</p>
          )}
        </div>

        <button
          type="button"
          onClick={cycleRate}
          disabled={failed}
          className={cn(
            "flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
            onBubble ? "text-brand-fg hover:bg-brand-fg/15" : "text-fg hover:bg-surface-muted"
          )}
          aria-label={`Playback speed ${rate}x`}
        >
          {rate}x
        </button>
      </div>
    </div>
  );
}
