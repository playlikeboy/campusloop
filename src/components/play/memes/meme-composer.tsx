"use client";

import { ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sticker } from "@/components/ui/stickers";
import { Textarea } from "@/components/ui/textarea";
import { PLAY_ROUTES } from "@/constants/play";
import { apiRequest, fetcher } from "@/lib/api";
import type { getMemeWar } from "@/lib/play/server/memes";
import { uploadImageToImgBB } from "@/lib/upload";
import { announceBadges, PlayHeader } from "../play-ui";

const MAX_CAPTION = 140;
type MemeWar = Awaited<ReturnType<typeof getMemeWar>>;

/** /play/meme-war/new: pick an image, see it, add a caption, post. */
export function MemeComposer() {
  const router = useRouter();
  const { data } = useSWR<MemeWar>("/api/play/memes?sort=top", fetcher);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/") || f.type === "image/svg+xml") {
      toast.error("Pick a photo or GIF.");
      return;
    }
    setFile(f);
  }

  async function post() {
    if (!file) return;
    setProgress(0);
    try {
      const uploaded = await uploadImageToImgBB(file, (p) => setProgress(p.percent));
      const res = await apiRequest<{ newBadges?: Array<{ title: string; lp: number }> }>("/api/play/memes", "POST", {
        imageUrl: uploaded.url,
        caption: caption.trim(),
      });
      toast.success("Posted. Good luck this week.");
      announceBadges(res.newBadges);
      router.push(PLAY_ROUTES.memes);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post. Try again.");
      setProgress(null);
    }
  }

  const posting = progress !== null;
  const alreadyPosted = data?.myMemeStatus === "ACTIVE" || data?.myMemeStatus === "HIDDEN";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-10">
      <PlayHeader title="Post a meme" backHref={PLAY_ROUTES.memes} backLabel="Back to Meme War" />

      {data?.theme && (
        <Sticker flat className="space-y-1 p-4">
          <p className="text-sm font-semibold text-fg-muted">This week's theme</p>
          <p className="sticker-caption text-2xl text-balance text-sticker-fg">{data.theme.title}</p>
        </Sticker>
      )}

      {alreadyPosted ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-base text-fg">
          You already posted this week. One meme each keeps it fair.
        </p>
      ) : (
        <div className="space-y-5">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
            aria-label="Choose meme image"
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-lg border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img src={preview} alt="Your meme preview" className="max-h-[60vh] w-full object-contain" />
              <Button
                variant="circleIcon"
                size="icon"
                aria-label="Remove image"
                onClick={() => setFile(null)}
                disabled={posting}
                className="absolute top-2 right-2"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files?.[0]);
              }}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface text-fg-muted transition-ui outline-none hover:border-brand hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ImagePlus aria-hidden="true" className="size-8" />
              <span className="text-base font-semibold">Choose an image</span>
              <span className="text-sm">PNG, JPG, WebP or GIF</span>
            </button>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="meme-caption">Caption (optional)</Label>
            <Textarea
              id="meme-caption"
              value={caption}
              maxLength={MAX_CAPTION}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Say it in one line"
              rows={2}
            />
            <p className="text-right text-xs tabular-nums text-fg-muted">
              {caption.length}/{MAX_CAPTION}
            </p>
          </div>

          <p className="text-sm text-fg-muted">
            Keep it about campus life. No real names, phone numbers or making fun of a real person.
          </p>

          <Button size="lg" className="w-full" onClick={post} disabled={!file} loading={posting}>
            {posting ? `Posting ${progress}%` : "Post meme"}
          </Button>
        </div>
      )}
    </div>
  );
}
