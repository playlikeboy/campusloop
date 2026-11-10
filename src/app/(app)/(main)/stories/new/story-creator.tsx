"use client";

import { AtSign, Camera, ImagePlus, Loader2, MapPin, Music2, Timer, Trash2, Type, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { UnsplashImagePicker } from "@/components/common/unsplash-image-picker";
import {
  CountdownTray,
  MentionTray,
  PlaceTray,
  SongTray,
  type StoryTray,
  StyleTray,
} from "@/components/stories/story-creator-trays";
import {
  buildStoryClasses,
  EMPTY_STICKERS,
  encodeStoryText,
  STORY_BACKGROUNDS,
  STORY_FONTS,
  STORY_TEXT_SIZES,
  type StoryAlignment,
  type StoryStickers,
  splitStoryClasses,
} from "@/components/stories/story-format";
import { StoryStickerStack } from "@/components/stories/story-stickers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn, initialOf } from "@/lib/utils";

interface StoryCreatorProps {
  initialText?: string;
  initialMediaUrl?: string | null;
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    institution?: { name: string } | null;
  };
}

const MAX_CHARS = 160;

const railButton =
  "flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white transition-ui hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 aria-pressed:bg-sticker aria-pressed:text-sticker-fg";

export function StoryCreator({ profile, initialText = "", initialMediaUrl = null }: StoryCreatorProps) {
  const router = useRouter();

  const [storyText, setStoryText] = useState(initialText.slice(0, MAX_CHARS));
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialMediaUrl);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(1);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [align, setAlign] = useState<StoryAlignment>("center");
  const [stickers, setStickers] = useState<StoryStickers>(EMPTY_STICKERS);
  const [tray, setTray] = useState<StoryTray>("none");
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const savedClasses = buildStoryClasses(
    STORY_BACKGROUNDS[bgIndex],
    STORY_FONTS[fontIndex],
    STORY_TEXT_SIZES[sizeIndex],
    align
  );
  const { background, text: textClasses } = splitStoryClasses(savedClasses);

  const college = profile.institution?.name?.split(",")[0].trim();
  const placeSuggestions = [college, "Library", "Canteen", "Hostel", "Sports ground"].filter(
    (p): p is string => Boolean(p)
  );

  // Lock body scroll while the full-screen editor is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes an open panel
  useEffect(() => {
    if (tray === "none") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTray("none");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tray]);

  function toggleTray(next: StoryTray) {
    sounds.tap();
    haptics.light();
    setTray((prev) => (prev === next ? "none" : next));
  }

  function addSticker<K extends keyof StoryStickers>(key: K, value: StoryStickers[K]) {
    sounds.pop();
    haptics.success();
    setStickers((prev) => ({ ...prev, [key]: value }));
    setTray("none");
  }

  function removeSticker(key: keyof StoryStickers) {
    sounds.tap();
    setStickers((prev) => ({ ...prev, [key]: null }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.pop();
    haptics.light();
    const prevMedia = mediaUrl;
    const preview = URL.createObjectURL(file);
    setMediaUrl(preview);
    setIsUploadingImage(true);

    try {
      toast.loading("Uploading photo…", { id: "story-img" });
      const res = await uploadImageToImgBB(file, (progress) => {
        if (progress.percent > 0 && progress.percent < 100) {
          toast.loading(`Uploading photo… ${progress.percent}%`, { id: "story-img" });
        }
      });
      setMediaUrl(res.displayUrl || res.url);
      toast.success("Photo added", { id: "story-img" });
    } catch (err) {
      setMediaUrl(prevMedia);
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't upload that photo. Try a smaller image or check your connection.",
        { id: "story-img" }
      );
    } finally {
      setIsUploadingImage(false);
      URL.revokeObjectURL(preview);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleShare() {
    if (isPosting) return;
    if (isUploadingImage) {
      toast.info("Wait for your photo to finish uploading.");
      return;
    }
    const text = encodeStoryText(stickers, storyText);
    if (!text && !mediaUrl) {
      toast.warning("Write something or add a photo first.");
      return;
    }

    sounds.send();
    haptics.success();
    setIsPosting(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mediaUrl: mediaUrl || null, backgroundColor: savedClasses }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData?.error || "Couldn't share your story. Try again.");
      }

      toast.success("Story shared. It stays up for 24 hours.");
      mutate("/api/stories");
      router.push("/feeds");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't share your story. Try again.");
      setIsPosting(false);
    }
  }

  const rail: { id: StoryTray; label: string; icon: typeof Type; active: boolean }[] = [
    { id: "style", label: "Text style", icon: Type, active: false },
    { id: "place", label: "Add a place", icon: MapPin, active: Boolean(stickers.location) },
    { id: "song", label: "Add a song", icon: Music2, active: Boolean(stickers.song) },
    { id: "mention", label: "Mention someone", icon: AtSign, active: Boolean(stickers.mention) },
    { id: "countdown", label: "Add a countdown", icon: Timer, active: Boolean(stickers.countdown) },
  ];

  return (
    <div className="dark fixed inset-0 z-50 flex touch-manipulation select-none items-center justify-center bg-black">
      <div
        className={cn(
          "relative flex h-full w-full flex-col justify-between overflow-hidden md:h-[min(92dvh,844px)] md:w-[min(430px,100vw)] md:rounded-xl",
          mediaUrl ? "bg-black" : background,
          "text-white"
        )}
      >
        {mediaUrl && (
          <img
            src={mediaUrl}
            alt="Your story photo"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}

        {/* Top bar */}
        <div className="relative z-20 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              router.back();
            }}
            className={railButton}
            aria-label="Close without sharing"
          >
            <X className="size-5" aria-hidden />
          </button>

          {/* Tool rail */}
          <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 flex flex-col items-center gap-2">
            {rail.map(({ id, label, icon: Icon, active }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleTray(id)}
                aria-label={label}
                aria-pressed={tray === id || active}
                className={railButton}
              >
                <Icon className="size-5" aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              aria-label="Add a photo from your phone"
              className={railButton}
            >
              {isUploadingImage ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowUnsplashPicker(true)}
              aria-label="Find a background photo"
              className={railButton}
            >
              <Camera className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          aria-hidden
          tabIndex={-1}
        />

        {/* Canvas */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-16 py-4">
          <StoryStickerStack stickers={stickers} onRemove={removeSticker} />

          <div className={cn("w-full", mediaUrl && "rounded-lg bg-black/55 px-4 py-3")}>
            <label htmlFor="story-text" className="sr-only">
              Story text
            </label>
            <textarea
              id="story-text"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Type something…"
              maxLength={MAX_CHARS}
              rows={3}
              className={cn(
                "w-full resize-none bg-transparent leading-tight text-white caret-white placeholder:text-white/70 focus:outline-none",
                textClasses
              )}
            />
            {storyText.length > MAX_CHARS - 30 && (
              <p className="text-right text-xs tabular-nums text-white/80">
                {MAX_CHARS - storyText.length} left
              </p>
            )}
          </div>

          {mediaUrl && (
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setMediaUrl(null);
              }}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full bg-black/55 px-4 text-sm font-medium text-white transition-ui hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove photo
            </button>
          )}
        </div>

        {tray !== "none" && (
          <div className="relative z-30">
            <button
              type="button"
              onClick={() => setTray("none")}
              aria-label="Close panel"
              className="absolute top-3 right-3 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden />
            </button>
            {tray === "style" && (
              <StyleTray
                hasPhoto={Boolean(mediaUrl)}
                bgIndex={bgIndex}
                onBg={setBgIndex}
                fontIndex={fontIndex}
                onFont={setFontIndex}
                sizeIndex={sizeIndex}
                onSize={setSizeIndex}
                align={align}
                onAlign={setAlign}
              />
            )}
            {tray === "place" && (
              <PlaceTray suggestions={placeSuggestions} onPick={(place) => addSticker("location", place)} />
            )}
            {tray === "song" && <SongTray onPick={(song) => addSticker("song", song)} />}
            {tray === "mention" && <MentionTray onPick={(username) => addSticker("mention", username)} />}
            {tray === "countdown" && (
              <CountdownTray onPick={(countdown) => addSticker("countdown", countdown)} />
            )}
          </div>
        )}

        {/* Share bar */}
        {tray === "none" && (
          <div className="relative z-20 flex items-center justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-9">
                <AvatarImage src={profile.avatarUrl || ""} alt="" />
                <AvatarFallback className="bg-sticker text-sm font-semibold text-sticker-fg">
                  {initialOf(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-sm font-semibold">Your story</p>
            </div>

            <button
              type="button"
              onClick={handleShare}
              disabled={isPosting}
              className="cl-interactive inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-sticker px-5 text-sm font-semibold text-sticker-fg shadow-sticker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
            >
              {isPosting && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isPosting ? "Sharing…" : "Share story"}
            </button>
          </div>
        )}
      </div>

      <UnsplashImagePicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelect={(photo) => {
          setMediaUrl(photo.url);
          toast.success(`Photo by ${photo.photographerName}`);
        }}
        orientation="portrait"
        defaultQuery="campus"
        title="Pick a background photo"
      />
    </div>
  );
}
