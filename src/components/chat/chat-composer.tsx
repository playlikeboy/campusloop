"use client";

import { FileText, ImageIcon, Mic, Paperclip, SendHorizontal, Smile, Sticker, Video, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { UserProfile } from "@/db/schema";
import type { CachedMessage } from "@/lib/chat-cache";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./chat-avatar";
import { previewText } from "./chat-format";

const ROUND_BTN =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const MENU_ITEM =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-fg transition-ui outline-none hover:bg-surface-muted focus-visible:bg-surface-muted";

interface ChatComposerProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  sending: boolean;
  uploading: boolean;
  replyingTo: CachedMessage | null;
  replyName: string;
  onCancelReply: () => void;
  mentionSuggestions: UserProfile[];
  onPickMention: (username: string) => void;
  onImage: (file: File) => void;
  onVideo: (file: File) => void;
  onDocument: (file: File) => void;
  onGif: () => void;
  onSticker: () => void;
  onVoice: () => void;
}

/** Message box with reply preview, @mention suggestions, attachments and send / voice-note button. */
export function ChatComposer(props: ChatComposerProps) {
  const { textareaRef, value, onChange, onSend, sending, uploading, replyingTo } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Grow from one line up to about five.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 140)}px`;
  }, [value, textareaRef]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  const submit = () => {
    const text = value.trim();
    if (!text || sending) return;
    onSend(value);
    onChange("");
    textareaRef.current?.focus();
  };

  const pick = (ref: RefObject<HTMLInputElement | null>) => {
    setMenuOpen(false);
    ref.current?.click();
  };

  const fileHandler = (cb: (f: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) cb(file);
    e.target.value = "";
  };

  return (
    <footer className="z-20 shrink-0 border-t border-border bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
      <div className="mx-auto max-w-4xl space-y-2">
        {uploading && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-md bg-brand-subtle px-3 py-2 text-sm font-medium text-brand-text"
          >
            <Spinner size="sm" />
            Sending file…
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center gap-2 rounded-md bg-surface-muted py-1.5 pr-1 pl-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-text">Replying to {props.replyName}</p>
              <p className="truncate text-sm text-fg-muted">{previewText(replyingTo.body)}</p>
            </div>
            <button
              type="button"
              onClick={props.onCancelReply}
              aria-label="Cancel reply"
              className={ROUND_BTN}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {props.mentionSuggestions.length > 0 && (
          <ul aria-label="Mention someone" className="no-scrollbar flex gap-2 overflow-x-auto">
            {props.mentionSuggestions.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => props.onPickMention(u.username)}
                  className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-brand-subtle pr-3 pl-1.5 text-sm font-semibold text-brand-text transition-ui outline-none hover:bg-brand hover:text-brand-fg focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChatAvatar name={u.displayName} src={u.avatarUrl} className="size-7" />@{u.username}
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={fileHandler(props.onImage)}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={fileHandler(props.onVideo)}
        />
        <input
          ref={docRef}
          type="file"
          accept="application/pdf,.pdf,.docx,.doc,.zip,.txt"
          className="hidden"
          onChange={fileHandler(props.onDocument)}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-1"
        >
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Attach"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={cn(ROUND_BTN, menuOpen && "bg-surface-muted text-fg")}
            >
              <Paperclip className="size-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Attach"
                className="absolute bottom-13 left-0 z-(--z-dropdown) w-52 rounded-lg border border-border bg-surface-raised p-1.5 shadow-lg"
              >
                <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => pick(imageRef)}>
                  <ImageIcon className="size-4 text-fg-muted" /> Photo
                </button>
                <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => pick(videoRef)}>
                  <Video className="size-4 text-fg-muted" /> Video
                </button>
                <button type="button" role="menuitem" className={MENU_ITEM} onClick={() => pick(docRef)}>
                  <FileText className="size-4 text-fg-muted" /> Document or PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => {
                    setMenuOpen(false);
                    props.onGif();
                  }}
                >
                  <Smile className="size-4 text-fg-muted" /> GIF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => {
                    setMenuOpen(false);
                    props.onSticker();
                  }}
                >
                  <Sticker className="size-4 text-fg-muted" /> Sticker
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            aria-label="Message"
            placeholder="Message"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={props.onPaste}
            onKeyDown={(e) => {
              // Enter sends on desktop; on phones Enter adds a new line like WhatsApp.
              if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
                e.preventDefault();
                submit();
              }
            }}
            className="no-scrollbar max-h-36 min-h-11 flex-1 resize-none rounded-md bg-surface-muted px-4 py-2.5 text-base leading-snug text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-ring"
          />

          {value.trim() ? (
            <button
              type="submit"
              disabled={sending}
              aria-label="Send"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-brand-fg transition-ui outline-none hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-90 disabled:opacity-60"
            >
              <SendHorizontal className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={props.onVoice}
              aria-label="Record a voice note"
              className={ROUND_BTN}
            >
              <Mic className="size-5" />
            </button>
          )}
        </form>
      </div>
    </footer>
  );
}
