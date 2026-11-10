"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { uploadImageToImgBB, uploadMediaFile } from "@/lib/upload";

const GIF_HOST = /^https?:\/\/(?:(?:media|i)\.giphy\.com|media\.tenor\.com)\/\S+/i;
const IMAGE_URL = /^https?:\/\/\S+?\.(png|jpe?g|gif|webp)(\?\S*)?$/i;

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Upload + send helpers for photos, videos, documents, voice notes, paste and drop. */
export function useChatMedia(conversationId: string | null, sendMessage: (body: string) => Promise<void>) {
  const [uploading, setUploading] = useState(false);

  const sendImage = useCallback(
    async (file: File) => {
      if (!conversationId) return;
      if (!file.type.startsWith("image/")) {
        toast.error("That file isn't a photo. Pick a JPG, PNG, WebP or GIF.");
        return;
      }
      setUploading(true);
      try {
        toast.loading("Sending photo…", { id: "chat-img" });
        const res = await uploadImageToImgBB(file);
        await sendMessage(res.displayUrl || res.url);
        toast.dismiss("chat-img");
      } catch (err) {
        toast.error(errorText(err, "Photo didn't send. Try again."), { id: "chat-img" });
      } finally {
        setUploading(false);
      }
    },
    [conversationId, sendMessage]
  );

  const sendFile = useCallback(
    async (file: File, kind: "video" | "document") => {
      if (!conversationId) return;
      const id = `chat-${kind}`;
      const label = kind === "video" ? "video" : "file";
      setUploading(true);
      try {
        toast.loading(`Uploading ${label}…`, { id });
        const res = await uploadMediaFile(file, kind, file.name, (p) => {
          if (p.percent > 0 && p.percent < 100) toast.loading(`Uploading ${label}… ${p.percent}%`, { id });
        });
        await sendMessage(
          kind === "video"
            ? `![video:${file.name}](${res.url})`
            : `![document:${file.name}:${file.size}](${res.url})`
        );
        toast.dismiss(id);
      } catch (err) {
        toast.error(errorText(err, `The ${label} didn't send. Try again.`), { id });
      } finally {
        setUploading(false);
      }
    },
    [conversationId, sendMessage]
  );

  const sendVideo = useCallback((file: File) => sendFile(file, "video"), [sendFile]);
  const sendDocument = useCallback((file: File) => sendFile(file, "document"), [sendFile]);

  const sendVoiceNote = useCallback(
    async (url: string, duration: number) => {
      if (!conversationId) return;
      try {
        await sendMessage(`![voice:Voice Note (${duration}s)](${url})`);
      } catch {
        toast.error("Voice note didn't send. Try again.");
      }
    },
    [conversationId, sendMessage]
  );

  /** Pasted photos, videos, PDFs, GIF/sticker images and bare image links send straight away. */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const data = e.clipboardData;
      if (!data) return;
      const files = Array.from(data.files || []);
      const image = files.find((f) => f.type.startsWith("image/"));
      const video = files.find((f) => f.type.startsWith("video/"));
      const doc = files.find((f) => f.type === "application/pdf" || /\.(pdf|docx)$/i.test(f.name));
      if (image || video || doc) {
        e.preventDefault();
        if (image) void sendImage(image);
        else if (video) void sendVideo(video);
        else if (doc) void sendDocument(doc);
        return;
      }

      for (const item of Array.from(data.items || [])) {
        const file = item.type.startsWith("image/") ? item.getAsFile() : null;
        if (file) {
          e.preventDefault();
          void sendImage(file);
          return;
        }
      }

      const html = data.getData("text/html");
      const src = html ? html.match(new RegExp("<" + 'img[^>]+src="([^">]+)"', "i"))?.[1] : undefined;
      if (
        src &&
        /^https?:\/\//i.test(src) &&
        (/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(src) || /giphy\.com|tenor\.com/.test(src))
      ) {
        e.preventDefault();
        void sendMessage(src);
        return;
      }

      const text = data.getData("text/plain").trim();
      if (IMAGE_URL.test(text) || GIF_HOST.test(text)) {
        e.preventDefault();
        void sendMessage(text);
      }
    },
    [sendImage, sendVideo, sendDocument, sendMessage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file?.type.startsWith("image/")) void sendImage(file);
    },
    [sendImage]
  );

  return { uploading, sendImage, sendVideo, sendDocument, sendVoiceNote, handlePaste, handleDrop };
}
