"use client";

import { Image as ImageIcon, Loader2, RefreshCw, Search, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { GifItem } from "@/app/api/gifs/search/route";
import { GIF_POPULAR_TAGS } from "@/constants";
import { cn } from "@/lib/utils";

interface GifPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

type GifStatus = "idle" | "loading" | "success" | "empty" | "error";

const SKELETONS = [52, 68, 44, 60, 76, 50, 64, 46, 72, 54, 66, 48];

export function GifPickerModal({ isOpen, onClose, onSelectGif }: GifPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("trending");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [status, setStatus] = useState<GifStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const clearSearchTimeout = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const fetchGifs = useCallback(async (query: string) => {
    const requestId = ++requestIdRef.current;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setErrorMessage("");

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: "24",
      });

      const res = await fetch(`/api/gifs/search?${params.toString()}`, {
        signal: controller.signal,
        cache: "no-store",
      });

      let data: { gifs?: GifItem[]; error?: string } = {};
      try {
        data = (await res.json()) as { gifs?: GifItem[]; error?: string };
      } catch {
        // Keep the generic network error below.
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 429
              ? "GIF service is temporarily rate-limited."
              : "GIFs could not be loaded right now.")
        );
      }

      if (requestId !== requestIdRef.current) return;

      const nextGifs = Array.isArray(data.gifs) ? data.gifs : [];
      setGifs(nextGifs);
      setStatus(nextGifs.length > 0 ? "success" : "empty");
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;

      console.error("[GIF Picker] Failed to fetch GIFs:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "GIFs could not be loaded right now."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearSearchTimeout();
      abortControllerRef.current?.abort();
      return;
    }

    clearSearchTimeout();
    setSearchQuery("");
    setSelectedTag("trending");
    void fetchGifs("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      clearSearchTimeout();
      abortControllerRef.current?.abort();
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [clearSearchTimeout, fetchGifs, isOpen, onClose]);

  useEffect(() => {
    return () => {
      clearSearchTimeout();
      abortControllerRef.current?.abort();
    };
  }, [clearSearchTimeout]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);

    const query = value.trim();
    setSelectedTag(query ? "" : "trending");

    clearSearchTimeout();
    searchTimeoutRef.current = setTimeout(() => {
      void fetchGifs(query);
    }, 300);
  };

  const handleTagClick = (tagId: string, tagQuery: string) => {
    clearSearchTimeout();
    setSelectedTag(tagId);
    setSearchQuery("");
    void fetchGifs(tagQuery);
  };

  const handleClearSearch = () => {
    clearSearchTimeout();
    setSearchQuery("");
    setSelectedTag("trending");
    void fetchGifs("");
  };

  const handleRetry = () => {
    void fetchGifs(searchQuery.trim());
  };

  const hasResults = gifs.length > 0;
  const showInitialSkeleton = status === "loading" && !hasResults;
  const showRefreshIndicator = status === "loading" && hasResults;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gif-picker-title"
        aria-describedby="gif-picker-description"
        className="flex h-[94dvh] max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[30px] border border-border/80 bg-card text-card-foreground shadow-2xl sm:h-[680px] sm:max-h-[calc(100dvh-32px)] sm:rounded-3xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Zap className="size-4.5" />
            </div>
            <div className="min-w-0">
              <h2
                id="gif-picker-title"
                className="truncate text-sm font-black tracking-tight text-foreground sm:text-[15px]"
              >
                Choose a GIF
              </h2>
              <p
                id="gif-picker-description"
                className="text-[10px] font-semibold text-muted-foreground sm:text-[11px]"
              >
                Powered by GIPHY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
            aria-label="Close GIF picker"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-border/40 bg-card/95 px-3 py-3 backdrop-blur-xl sm:px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search GIFs..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search GIFs"
              className="h-11 w-full rounded-2xl border border-border/60 bg-muted/45 pl-10 pr-11 text-[14px] font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/75 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10"
            />

            {showRefreshIndicator ? (
              <Loader2
                className="absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 animate-spin text-primary"
                aria-hidden="true"
              />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Clear GIF search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="relative mt-2.5">
            <div
              className="no-scrollbar flex gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 pr-5"
              role="tablist"
              aria-label="GIF categories"
            >
              {GIF_POPULAR_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedTag === tag.id}
                  onClick={() => handleTagClick(tag.id, tag.query)}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]",
                    selectedTag === tag.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/50 bg-muted/45 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
          aria-busy={status === "loading"}
        >
          {showInitialSkeleton ? (
            <div
              className="columns-2 gap-2 sm:columns-3"
              aria-label="Loading GIFs"
              role="status"
            >
              {SKELETONS.map((height, index) => (
                <div
                  key={index}
                  className="shimmer-effect mb-2 break-inside-avoid overflow-hidden rounded-xl border border-border/40 bg-muted/45"
                  style={{ height: `${height * 3}px` }}
                />
              ))}
            </div>
          ) : status === "error" && !hasResults ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-destructive/15 bg-destructive/10 text-destructive">
                <RefreshCw className="size-6" />
              </div>
              <h3 className="mt-4 text-sm font-black text-foreground">GIFs couldn&apos;t load</h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                {errorMessage || "Something went wrong while reaching GIPHY."}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95"
              >
                <RefreshCw className="size-3.5" />
                Try again
              </button>
            </div>
          ) : status === "empty" && !hasResults ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground/70">
                <ImageIcon className="size-6" />
              </div>
              <h3 className="mt-4 text-sm font-black text-foreground">No GIFs found</h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                Try another search such as &quot;reaction&quot;, &quot;exam&quot;, or &quot;crush&quot;.
              </p>
            </div>
          ) : hasResults ? (
            <>
              {showRefreshIndicator && (
                <div
                  className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  Updating GIFs…
                </div>
              )}

              {status === "error" && errorMessage && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/15 bg-destructive/5 px-3 py-2.5 text-[10px] font-semibold text-muted-foreground">
                  <span className="min-w-0">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 cursor-pointer font-black text-destructive hover:underline focus-visible:outline-none"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="columns-2 gap-2 sm:columns-3">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelectGif(gif.url);
                      onClose();
                    }}
                    aria-label={`Send GIF: ${gif.title}`}
                    className="group relative mb-2 block w-full break-inside-avoid cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/40 text-left shadow-2xs outline-none transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]"
                    style={{
                      aspectRatio: `${Math.max(gif.width, 1)} / ${Math.max(gif.height, 1)}`,
                    }}
                  >
                    <img
                      src={gif.previewUrl || gif.url}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/55 via-black/10 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="rounded-full bg-black/45 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-sm">
                        Send
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[55vh] flex-col items-center justify-center text-center text-muted-foreground">
              <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold">Finding reactions…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
