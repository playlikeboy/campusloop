"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CourseLecture } from "@/db/schema";
import { UpNext } from "./up-next";
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

export function LectureMedia({
  lecture,
  startAt,
  playerRef,
  nextTitle,
  onProgress,
  onComplete,
  onNext,
}: Props) {
  const [ended, setEnded] = useState(false);
  const fileRef = useRef<HTMLVideoElement>(null);
  useEffect(() => setEnded(false), [lecture.id]);

  const handleEnded = () => {
    onComplete();
    if (nextTitle) setEnded(true);
  };

  if (lecture.kind === "ARTICLE") {
    return (
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <h2 className="mb-6 text-2xl text-fg sm:text-3xl">{lecture.title}</h2>
        <MarkdownContent content={lecture.body ?? ""} autoEmbed />
      </article>
    );
  }

  if (lecture.kind === "LINK") {
    const yt = lecture.videoRef?.match(/youtube\.com\/watch\?v=([\w-]{11})/)?.[1];
    if (yt) {
      // The video owner disabled embedding, so it plays on YouTube.
      return (
        <a
          href={lecture.videoRef ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onComplete}
          className="group relative block aspect-video w-full overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <img
            src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-50"
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg transition-ui group-hover:bg-brand-hover">
              Watch on YouTube <ExternalLink className="size-4" aria-hidden />
            </span>
            <span className="max-w-sm text-sm text-white">
              This video only plays on YouTube. Opening it marks the lecture as done.
            </span>
          </span>
        </a>
      );
    }
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <EmptyState
          icon={Link2}
          title={lecture.title}
          description={lecture.body || "This lecture is a link to another site."}
          action={
            <Button asChild>
              <a
                href={lecture.videoRef ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onComplete}
              >
                Open link <ExternalLink aria-hidden />
              </a>
            </Button>
          }
          className="w-full max-w-md rounded-lg border border-border bg-surface"
        />
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
      ) : lecture.videoProvider === "dailymotion" && lecture.videoRef ? (
        <iframe
          src={`https://geo.dailymotion.com/player.html?video=${lecture.videoRef}&autoplay=1`}
          title={lecture.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : lecture.videoProvider === "drive" && lecture.videoRef ? (
        <iframe
          src={`https://drive.google.com/file/d/${lecture.videoRef}/preview`}
          title={lecture.title}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (lecture.videoProvider === "archiveorg" || lecture.videoProvider === "file") && lecture.videoRef ? (
        lecture.videoRef.startsWith("http") && !lecture.videoRef.includes("/embed/") ? (
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
          <iframe
            src={
              lecture.videoRef.startsWith("http")
                ? lecture.videoRef
                : `https://archive.org/embed/${lecture.videoRef}`
            }
            title={lecture.title}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )
      ) : (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
          This video can't be played. Try the next lecture or check the Resources tab.
        </p>
      )}
      {ended && nextTitle && <UpNext title={nextTitle} onGo={onNext} onCancel={() => setEnded(false)} />}
    </div>
  );
}
