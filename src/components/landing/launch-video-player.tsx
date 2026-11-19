"use client";

import {
  Captions,
  CaptionsOff,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { trackLaunchVideo } from "@/lib/analytics/ga4";
import { cn } from "@/lib/utils";
import { LAUNCH_VIDEO } from "./launch-video-meta";

const RATES = [1, 1.25, 1.5, 2, 0.75] as const;
const MILESTONES = [25, 50, 75] as const;

type Phase = "poster" | "started";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function prefersQuiet(): boolean {
  if (typeof window === "undefined") return true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  return reduced || saveData;
}

const controlBtn =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11";

/**
 * Accessible player on the native <video>. Poster with a sticker play button,
 * optional muted autoplay on view, custom controls, own caption rendering,
 * keyboard shortcuts (space/k, j/l, m, f, c) and GA4 progress events.
 */
export function LaunchVideoPlayer({ autoplayMuted = true }: { autoplayMuted?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sent = useRef({ start: false, complete: false, milestones: new Set<number>() });
  const autoplayed = useRef(false);

  const [near, setNear] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("poster");
  const [pendingPlay, setPendingPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mutedAutoplay, setMutedAutoplay] = useState(false);
  const [volume, setVolume] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [rateIdx, setRateIdx] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionsAvailable, setCaptionsAvailable] = useState(true);
  const [cue, setCue] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const markStart = useCallback(() => {
    if (sent.current.start) return;
    sent.current.start = true;
    trackLaunchVideo("play");
  }, []);

  // Load nothing until the player is within ~one screen of the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pick the 9:16 cut on narrow portrait screens. The box shape comes from CSS, so nothing shifts.
  useEffect(() => {
    if (!near) return;
    setSrc(window.matchMedia(LAUNCH_VIDEO.verticalQuery).matches ? LAUNCH_VIDEO.verticalSrc : LAUNCH_VIDEO.src);
    setPipSupported(
      typeof document !== "undefined" && "pictureInPictureEnabled" in document && document.pictureInPictureEnabled
    );
  }, [near]);

  // Muted autoplay while on screen; pause it again when it scrolls away.
  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video || !src || !autoplayMuted || failed || prefersQuiet()) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.6 && !autoplayed.current && video.paused) {
          autoplayed.current = true;
          video.muted = true;
          setMutedAutoplay(true);
          setPhase("started");
          video.play().catch(() => {
            setMutedAutoplay(false);
            setPhase("poster");
          });
        } else if (entry.intersectionRatio < 0.2 && video.muted && !video.paused) {
          video.pause();
        }
      },
      { threshold: [0, 0.2, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, autoplayMuted, failed]);

  // Play requested before the source was attached.
  useEffect(() => {
    const video = videoRef.current;
    if (!pendingPlay || !src || !video) return;
    setPendingPlay(false);
    video.muted = false;
    video.play().then(markStart, () => setPhase("poster"));
  }, [pendingPlay, src, markStart]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Captions are drawn by us (as a sticker label), so the track stays "hidden", never "showing".
  useEffect(() => {
    const track = trackRef.current?.track;
    if (!track || !src) return;
    track.mode = captionsOn ? "hidden" : "disabled";
    const onCue = () => {
      const active = track.activeCues?.[0] as VTTCue | undefined;
      setCue(active?.text ?? "");
    };
    track.addEventListener("cuechange", onCue);
    if (!captionsOn) setCue("");
    return () => track.removeEventListener("cuechange", onCue);
  }, [captionsOn, src]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) setControlsVisible(false);
    }, 2600);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const start = useCallback(() => {
    setPhase("started");
    wrapRef.current?.focus();
    setMutedAutoplay(false);
    const video = videoRef.current;
    if (!src || !video) {
      setNear(true);
      setPendingPlay(true);
      return;
    }
    video.muted = false;
    setMuted(false);
    video.play().then(markStart, () => setPhase("poster"));
  }, [src, markStart]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || phase === "poster") {
      start();
      return;
    }
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  }, [phase, start]);

  const unmuteFromAutoplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const pct = duration ? Math.round((video.currentTime / duration) * 100) : 0;
    video.currentTime = 0;
    video.muted = false;
    setMutedAutoplay(false);
    wrapRef.current?.focus();
    video.play().then(markStart, () => {});
    trackLaunchVideo("unmute", pct);
  }, [duration, markStart]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (mutedAutoplay) {
      unmuteFromAutoplay();
      return;
    }
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.6;
  }, [mutedAutoplay, unmuteFromAutoplay]);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!wrap) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (wrap.requestFullscreen) {
      wrap.requestFullscreen().catch(() => {});
    } else {
      video?.webkitEnterFullscreen?.();
    }
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else video.requestPictureInPicture().catch(() => {});
  }, []);

  const cycleRate = useCallback(() => {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    if (videoRef.current) videoRef.current.playbackRate = RATES[next];
  }, [rateIdx]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || failed) return;
    const target = e.target as HTMLElement;
    const onButton = target.tagName === "BUTTON";
    const onRange = target.tagName === "INPUT";
    switch (e.key) {
      case " ":
        if (onButton) return; // the button handles its own activation
        e.preventDefault();
        togglePlay();
        break;
      case "k":
      case "K":
        e.preventDefault();
        togglePlay();
        break;
      case "j":
      case "J":
        e.preventDefault();
        seekBy(-5);
        break;
      case "l":
      case "L":
        e.preventDefault();
        seekBy(5);
        break;
      case "m":
      case "M":
        e.preventDefault();
        toggleMute();
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "c":
      case "C":
        if (!captionsAvailable) return;
        e.preventDefault();
        setCaptionsOn((v) => !v);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (onRange) return;
        e.preventDefault();
        seekBy(e.key === "ArrowLeft" ? -5 : 5);
        break;
      default:
        return;
    }
    showControls();
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setTime(video.currentTime);
    if (!video.duration || !sent.current.start) return;
    const pct = (video.currentTime / video.duration) * 100;
    for (const m of MILESTONES) {
      if (pct >= m && !sent.current.milestones.has(m)) {
        sent.current.milestones.add(m);
        trackLaunchVideo("progress", m);
      }
    }
  };

  const onProgress = () => {
    const video = videoRef.current;
    if (!video || video.buffered.length === 0) return;
    // The range that holds the playhead, or the last one.
    let end = video.buffered.end(video.buffered.length - 1);
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
        end = video.buffered.end(i);
        break;
      }
    }
    setBuffered(end);
  };

  const pctPlayed = duration ? (time / duration) * 100 : 0;
  const pctBuffered = duration ? Math.min(100, (buffered / duration) * 100) : 0;
  const rate = RATES[rateIdx];
  const started = phase === "started";
  const chromeVisible = started && !failed && (controlsVisible || !playing);

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}
      role="region"
      aria-label="CampusLoop launch video"
      aria-describedby="launch-video-keys"
      onKeyDown={onKeyDown}
      onPointerMove={started ? showControls : undefined}
      onFocusCapture={started ? showControls : undefined}
      className={cn(
        "group/player relative mx-auto aspect-video w-full overflow-hidden rounded-xl bg-fg text-fg shadow-sticker-lift outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "max-sm:portrait:aspect-[9/16] max-sm:portrait:max-w-[calc(78svh*9/16)]",
        fullscreen && "rounded-none shadow-none",
        started && playing && !controlsVisible && "cursor-none"
      )}
    >
      <p id="launch-video-keys" className="sr-only">
        Keyboard: space or K to play and pause, J and L to skip 5 seconds, M to mute, F for full screen, C for
        captions.
      </p>
      <video
        ref={videoRef}
        src={src ?? undefined}
        preload={near ? "metadata" : "none"}
        playsInline
        crossOrigin="anonymous"
        tabIndex={-1}
        aria-hidden={!started}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPlaying={() => {
          if (!videoRef.current?.muted && !mutedAutoplay) markStart();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
          if (sent.current.start && !sent.current.complete) {
            sent.current.complete = true;
            trackLaunchVideo("complete");
          }
        }}
        onTimeUpdate={onTimeUpdate}
        onProgress={onProgress}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => {
          setMuted(e.currentTarget.muted);
          setVolume(e.currentTarget.volume);
        }}
        onError={() => setFailed(true)}
        className={cn("absolute inset-0 size-full object-cover", fullscreen && "object-contain")}
      >
        {src && (
          <track
            ref={trackRef}
            kind="captions"
            src={LAUNCH_VIDEO.captions}
            srcLang="en"
            label="English"
            onError={() => setCaptionsAvailable(false)}
          />
        )}
      </video>

      {/* Poster and the big sticker play button. */}
      {!started && (
        <div className="absolute inset-0">
          {posterFailed ? (
            <div aria-hidden="true" className="story-field absolute inset-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={LAUNCH_VIDEO.poster}
              alt=""
              decoding="async"
              loading="lazy"
              onError={() => setPosterFailed(true)}
              className="absolute inset-0 size-full object-cover"
            />
          )}
          {failed ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="sticker-caption max-w-[18ch] rounded-sticker bg-sticker px-5 py-4 text-center text-2xl text-fg shadow-sticker">
                The video is on its way. Check back soon.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={start}
              className="group/play absolute inset-0 flex items-center justify-center outline-none"
            >
              <span className="flex h-16 items-center gap-3 rounded-full bg-sticker py-2.5 pr-6 pl-2.5 text-fg shadow-sticker-lift transition-ui group-hover/play:scale-[1.04] group-active/play:scale-[0.97] group-focus-visible/play:ring-4 group-focus-visible/play:ring-ring group-focus-visible/play:ring-offset-2 group-focus-visible/play:ring-offset-bg sm:h-20 sm:pr-8 sm:pl-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-fg sm:size-14">
                  <Play className="ml-0.5 size-5 fill-current sm:size-6" aria-hidden="true" />
                </span>
                <span className="sticker-caption text-xl sm:text-2xl">Play the video</span>
                <span className="sr-only">, with sound</span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Muted autoplay: one sticker to turn the sound on. */}
      {started && mutedAutoplay && !failed && (
        <button
          type="button"
          onClick={unmuteFromAutoplay}
          className="absolute top-3 left-3 flex h-11 items-center gap-2 rounded-full bg-sticker px-4 text-sm font-semibold text-brand-text shadow-sticker transition-ui hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:top-4 sm:left-4"
        >
          <VolumeX className="size-5" aria-hidden="true" />
          Unmute
        </button>
      )}

      {started && failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-fg p-6">
          <p className="sticker-caption max-w-[18ch] rounded-sticker bg-sticker px-5 py-4 text-center text-2xl text-fg shadow-sticker">
            The video is on its way. Check back soon.
          </p>
        </div>
      )}

      {/* Captions as a sticker label, above the controls. */}
      {started && captionsOn && cue && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex justify-center px-4 transition-ui",
            chromeVisible ? "bottom-28 sm:bottom-20" : "bottom-6"
          )}
        >
          <p className="max-w-[40ch] rounded-md bg-sticker px-3 py-1.5 text-center text-base font-semibold text-pretty text-fg shadow-sticker sm:text-lg">
            {cue}
          </p>
        </div>
      )}

      {/* Control bar: a paper sticker strip along the bottom. */}
      {started && !failed && (
        <div
          className={cn(
            "absolute inset-x-2 bottom-2 transition-ui sm:inset-x-4 sm:bottom-4",
            chromeVisible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 rounded-lg bg-sticker px-2 py-1.5 shadow-sticker sm:flex-nowrap sm:rounded-full">
            <div className="relative order-first flex h-8 basis-full items-center px-2 sm:order-none sm:basis-auto sm:flex-1 sm:px-1">
              <div aria-hidden="true" className="absolute inset-x-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken sm:inset-x-1">
                <div className="absolute inset-y-0 left-0 bg-border-strong" style={{ width: `${pctBuffered}%` }} />
                <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${pctPlayed}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value);
                  if (videoRef.current) videoRef.current.currentTime = v;
                  setTime(v);
                }}
                aria-label="Seek"
                aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
                className="relative h-8 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:transition-ui focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-ring/40 focus-visible:[&::-moz-range-thumb]:ring-4"
              />
            </div>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className={cn(controlBtn, "sm:order-first")}
            >
              {playing ? (
                <Pause className="size-5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
              )}
            </button>

            <span className="shrink-0 px-1.5 text-sm font-medium text-fg-muted tabular-nums">
              <span className="text-fg">{formatTime(time)}</span> / {formatTime(duration)}
            </span>

            <span className="flex-1 sm:hidden" />

            <div className="group/vol flex shrink-0 items-center">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted || mutedAutoplay ? "Unmute" : "Mute"}
                className={controlBtn}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="size-5" aria-hidden="true" />
                ) : (
                  <Volume2 className="size-5" aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value);
                  const video = videoRef.current;
                  if (!video) return;
                  video.volume = v;
                  video.muted = v === 0;
                  if (v > 0) setMutedAutoplay(false);
                }}
                aria-label="Volume"
                aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}
                className="mr-1 hidden h-8 w-20 cursor-pointer accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:block"
              />
            </div>

            {captionsAvailable && (
              <button
                type="button"
                onClick={() => setCaptionsOn((v) => !v)}
                aria-label="Captions"
                aria-pressed={captionsOn}
                className={cn(controlBtn, captionsOn && "bg-brand-subtle text-brand-text hover:bg-brand-subtle")}
              >
                {captionsOn ? (
                  <Captions className="size-5" aria-hidden="true" />
                ) : (
                  <CaptionsOff className="size-5" aria-hidden="true" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={cycleRate}
              aria-label={`Playback speed ${rate}x. Change speed`}
              className={cn(controlBtn, "w-auto min-w-10 px-2 text-sm font-semibold tabular-nums pointer-coarse:min-w-11")}
            >
              {rate}x
            </button>

            {pipSupported && (
              <button type="button" onClick={togglePip} aria-label="Picture in picture" className={cn(controlBtn, "hidden sm:flex")}>
                <PictureInPicture2 className="size-5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              className={controlBtn}
            >
              {fullscreen ? (
                <Minimize className="size-5" aria-hidden="true" />
              ) : (
                <Maximize className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
