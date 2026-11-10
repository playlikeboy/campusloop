"use client";

import { SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/stickers";

/** Five-second "Up next" sticker over the finished video. Cancel stays on this lecture. */
export function UpNext({ title, onGo, onCancel }: { title: string; onGo: () => void; onCancel: () => void }) {
  const [left, setLeft] = useState(5);
  // The parent passes a fresh callback each render; keep the latest one so the
  // countdown is not restarted and the next lecture opens only once.
  const go = useRef(onGo);
  const fired = useRef(false);
  useEffect(() => {
    go.current = onGo;
  }, [onGo]);

  useEffect(() => {
    if (left <= 0) {
      if (!fired.current) {
        fired.current = true;
        go.current();
      }
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <section
      className="absolute inset-0 z-10 flex items-center justify-center bg-overlay p-4"
      aria-label="Up next"
    >
      <Sticker pop className="w-full max-w-xs p-5 text-center">
        <p className="text-sm tabular-nums text-fg-muted">
          <span aria-hidden>Next lecture in {left}s</span>
          <span className="sr-only" role="status">
            Next lecture starts in 5 seconds
          </span>
        </p>
        <p className="sticker-caption mt-2 line-clamp-2 text-xl text-fg">{title}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => go.current()}>
            <SkipForward aria-hidden /> Play now
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Stay here
          </Button>
        </div>
      </Sticker>
    </section>
  );
}
