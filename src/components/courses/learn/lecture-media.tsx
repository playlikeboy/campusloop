"use client";

import { ExternalLink, Link2, SkipForward, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/common/markdown-content";
import type { CourseLecture } from "@/db/schema";
import { type PlayerHandle, YouTubePlayer } from "./youtube-player";

interface Props {
  lecture: CourseLecture;
  startAt: number;
  playerRef: RefObject<PlayerHandle | null>;
  nextTitle?: string;
  onProgress: (sec: number) => void;
  onComplete: () => void;
  onNext: () => void;
}

/** Five-second "Up next" card after a video ends; cancellable. */
function UpNext({ title, onGo, onCancel }: { title: string; onGo: () => void; onCancel: () => void }) {
  const [left, setLeft] = useState(5);
  useEffect(() => {
    if (left <= 0) {
      onGo();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onGo]);
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-white" role="dialog" aria-label="Up next">
      <div className="max-w-sm text-center">
        <p className="text-sm text-white/70">Up next in {left}s</p>
        <p className="mt-1 text-lg font-bold">{title}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={onGo} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-black cursor-pointer">
            <SkipForward className="size-4" aria-hidden /> Play now
          </button>
          <button type="button" onClick={onCancel} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-semibold cursor-pointer">
            <X className="size-4" aria-hidden /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function LectureMedia({ lecture, startAt, playerRef, nextTitle, onProgress, onComplete, onNext }: Props) {
  const [ended, setEnded] = useState(false);
  const fileRef = useRef<HTMLVideoElement>(null);
  useEffect(() => setEnded(false), [lecture.id]);

  const handleEnded = () => {
    onComplete();
    if (nextTitle) setEnded(true);
  };

  if (lecture.kind === "ARTICLE") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <h2 className="mb-6 text-2xl font-black text-foreground">{lecture.title}</h2>
        <MarkdownContent content={lecture.body ?? ""} autoEmbed />
      </div>
    );
  }

  if (lecture.kind === "LINK") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-card/70 p-6 text-center shadow-2xs">
          <Link2 className="mx-auto size-8 text-primary" aria-hidden />
          <p className="mt-3 font-bold text-foreground">{lecture.title}</p>
          {lecture.body && <p className="mt-1 text-sm text-muted-foreground">{lecture.body}</p>}
          <a href={lecture.videoRef ?? "#"} target="_blank" rel="noopener noreferrer" onClick={onComplete} className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90">
            Open resource <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      {lecture.videoProvider === "youtube" && lecture.videoRef ? (
        <YouTubePlayer
          ref={playerRef}
          videoId={lecture.videoRef}
          startAt={startAt}
          onProgress={(s) => onProgress(s)}
          onAlmostDone={onComplete}
          onEnded={handleEnded}
        />
      ) : lecture.videoProvider === "vimeo" && lecture.videoRef ? (
        <iframe
          src={`https://player.vimeo.com/video/${lecture.videoRef}?autoplay=1#t=${Math.floor(startAt)}s`}
          title={lecture.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : lecture.videoProvider === "file" && lecture.videoRef ? (
        // biome-ignore lint/a11y/useMediaCaption: user-supplied lecture video; captions not available
        <video
          ref={fileRef}
          src={lecture.videoRef}
          controls
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full"
          onLoadedMetadata={(e) => {
            if (startAt > 0) e.currentTarget.currentTime = startAt;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (Math.floor(v.currentTime) % 5 === 0) onProgress(v.currentTime);
            if (v.duration && v.currentTime / v.duration >= 0.9) onComplete();
          }}
          onEnded={handleEnded}
        />
      ) : (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">This video is unavailable.</p>
      )}
      {ended && nextTitle && <UpNext title={nextTitle} onGo={onNext} onCancel={() => setEnded(false)} />}
    </div>
  );
}
