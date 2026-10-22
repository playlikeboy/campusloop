"use client";

import { CheckCircle2, ChevronRight, Download, Globe, HardDrive, Library, Loader2, PlaySquare, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ImportedPlaylistResult } from "@/lib/courses/playlist-importer";
import { cn } from "@/lib/utils";

interface PlaylistImporterCardProps {
  onImport: (imported: ImportedPlaylistResult) => void;
  disabled?: boolean;
}

const PLATFORMS = [
  { id: "youtube", name: "YouTube", icon: PlaySquare, example: "https://www.youtube.com/playlist?list=PL..." },
  { id: "dailymotion", name: "Dailymotion", icon: Video, example: "https://www.dailymotion.com/playlist/x..." },
  { id: "archiveorg", name: "Archive.org", icon: Library, example: "https://archive.org/details/..." },
  { id: "drive", name: "Google Drive", icon: HardDrive, example: "https://drive.google.com/drive/folders/..." },
];

export function PlaylistImporterCard({ onImport, disabled }: PlaylistImporterCardProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importedSummary, setImportedSummary] = useState<{ platform: string; count: number; title: string } | null>(null);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a playlist or folder link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses/import-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import playlist.");
      }

      const imported: ImportedPlaylistResult = data.course;
      onImport(imported);
      setImportedSummary({
        platform: imported.platform.toUpperCase(),
        count: imported.itemCount,
        title: imported.title,
      });
      toast.success(`Imported ${imported.itemCount} lectures!`, {
        description: "Review curriculum, tweak any titles or notes below, then publish.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/60 p-5 shadow-2xs transition-all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Quick Import from Playlist</h2>
            <p className="text-xs text-muted-foreground">Import full video series with titles, descriptions and durations in one click.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <Icon className="size-3" aria-hidden />
                {p.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleImport();
              }
            }}
            placeholder="Paste YouTube, Dailymotion, Archive.org or Google Drive link..."
            disabled={loading || disabled}
            className="h-11 w-full rounded-xl bg-muted/50 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim() || disabled}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Importing...
            </>
          ) : (
            <>
              <Download className="size-4" aria-hidden />
              Import & Load
            </>
          )}
        </button>
      </div>

      {importedSummary && (
        <div className="mt-3.5 flex items-center justify-between rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs text-primary">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            <span>
              Loaded <strong>{importedSummary.count} lectures</strong> from {importedSummary.platform} ({importedSummary.title}). Edit anything below before publishing.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setImportedSummary(null)}
            className="text-primary/70 hover:text-primary cursor-pointer underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
