"use client";

import { ArrowLeft, Check, FolderPlus, Layers, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  PLAYLIST_COVER_THEMES,
  type PlaylistCoverTheme,
  playlistCoverClass,
} from "@/components/academics/playlist-cover";
import { type ComboboxOption, SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const GRADIENTS = PLAYLIST_COVER_THEMES;

const CATEGORIES = [
  { value: "SEMESTER_PACK", label: "Full semester" },
  { value: "EXAM_PREP", label: "Midsem / endsem prep" },
  { value: "SUBJECT_BUNDLE", label: "One subject" },
  { value: "GATE", label: "GATE and placements" },
  { value: "CUSTOM", label: "Other" },
];

const BRANCHES = [
  "All",
  "Computer Science",
  "Information Technology",
  "ECE",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "Biotechnology",
];

const CATEGORY_OPTIONS: ComboboxOption[] = CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
}));

const BRANCH_OPTIONS: ComboboxOption[] = BRANCHES.map((b) => ({
  value: b,
  label: b,
}));

const SEMESTER_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All Semesters" },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  })),
];

interface ResourceSearchResult {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
}

export function NewPlaylistClient() {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SEMESTER_PACK");
  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState("4");
  const [coverGradient, setCoverGradient] = useState<PlaylistCoverTheme>(GRADIENTS[0].value);
  const [visibility] = useState("PUBLIC");

  // Material picker state
  const [selectedResources, setSelectedResources] = useState<ResourceSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search resources as query changes
  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/academics?q=${encodeURIComponent(query.trim())}&limit=8&scope=global&sort=latest`
      );
      if (res.ok) {
        const data = (await res.json()) as any;
        setSearchResults(data.items || []);
      }
    } catch (err) {
      console.error("Failed to search resources:", err);
    } finally {
      setIsSearching(false);
    }
  }

  function addResource(res: ResourceSearchResult) {
    if (selectedResources.some((r) => r.id === res.id)) {
      toast.info("Already added to this playlist");
      return;
    }
    sounds.tap();
    haptics.light();
    setSelectedResources((prev) => [...prev, res]);
  }

  function removeResource(id: string) {
    sounds.tap();
    haptics.light();
    setSelectedResources((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a playlist name first.");
      return;
    }

    if (selectedResources.length === 0) {
      toast.error("Add at least one file to your playlist first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/academics/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          branch,
          semester: semester === "all" ? null : parseInt(semester, 10),
          coverGradient,
          visibility,
          initialResourceIds: selectedResources.map((r) => r.id),
        }),
      });

      if (!res.ok) {
        const errData = ((await res.json().catch(() => ({}))) || {}) as any;
        throw new Error(errData.error || "Failed to create playlist");
      }

      const data = (await res.json()) as any;
      sounds.pop();
      haptics.success();
      toast.success("Playlist published");
      router.push(`/academics/study-material/playlists/${data.playlist.slug || data.playlist.id}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Couldn't publish the playlist. Try again.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto border-x border-border/40 bg-background px-4 py-4 space-y-5 select-none">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/academics/study-material"
            aria-label="Back to study material"
            className="flex size-11 items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <h1 className="text-lg text-fg sm:text-xl">New playlist</h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Publishing…</span>
            </>
          ) : (
            <>
              <FolderPlus className="size-3.5" />
              <span>Publish playlist</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── Compact Live Preview Banner ─── */}
        <div className="space-y-2">
          <div
            className={cn(
              "h-24 sm:h-28 w-full rounded-xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden transition-colors duration-300",
              playlistCoverClass(coverGradient)
            )}
          >
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-bg/15 border border-current/20">
                <Layers className="size-2.5" />
                <span>{CATEGORIES.find((c) => c.value === category)?.label.split(" ")[0] || "Pack"}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-bg/15">
                {selectedResources.length} Materials
              </span>
            </div>

            <div className="z-10">
              <h3 className="font-bold text-sm sm:text-base line-clamp-1">
                {title.trim() || "Untitled playlist"}
              </h3>
              <p className="text-xs opacity-80 font-medium">
                {branch} • {semester === "all" ? "All Semesters" : `Semester ${semester}`}
              </p>
            </div>
          </div>

          {/* Sleek Circular Color Swatches */}
          <div className="flex items-center gap-2 pt-0.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-muted-foreground mr-1">Theme:</span>
            {GRADIENTS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setCoverGradient(g.value)}
                className={cn(
                  "size-7 rounded-full transition-colors cursor-pointer shrink-0 flex items-center justify-center",
                  g.className,
                  coverGradient === g.value
                    ? "ring-2 ring-ring ring-offset-2 ring-offset-bg scale-110"
                    : "opacity-80 hover:opacity-100 hover:scale-105"
                )}
                title={g.label}
                aria-label={g.label}
              >
                {coverGradient === g.value && <Check className="size-3 stroke-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Stack Details ─── */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Playlist Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sem 4 endsem: OS, DBMS, CN"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl text-sm bg-background border border-border focus:outline-hidden focus:border-brand font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Tips for your batch (optional)</label>
            <textarea
              placeholder="Which units to focus on, what usually comes in the exam"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-2xl text-xs bg-background border border-border focus:outline-hidden focus:border-brand font-medium resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Category</label>
              <SearchableCombobox
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(val) => setCategory(val)}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
                clearable={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Branch</label>
              <SearchableCombobox
                options={BRANCH_OPTIONS}
                value={branch}
                onChange={(val) => setBranch(val)}
                placeholder="Select branch..."
                searchPlaceholder="Search branch, e.g. CSE"
                clearable={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Semester</label>
              <SearchableCombobox
                options={SEMESTER_OPTIONS}
                value={semester}
                onChange={(val) => setSemester(val)}
                placeholder="Select semester..."
                searchPlaceholder="Search semester (1–8)..."
                clearable={false}
              />
            </div>
          </div>
        </div>

        {/* ─── Material Assembler ─── */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Assemble Materials</h2>
              <p className="text-xs text-muted-foreground">Search for notes and PYQs to add</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-subtle text-brand-text border border-brand-subtle-border">
              {selectedResources.length} Selected
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Subject name or code, e.g. CS304"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-background border border-border focus:outline-hidden focus:border-brand font-medium"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown / Picker */}
          {searchResults.length > 0 && (
            <div className="border border-border/70 rounded-2xl bg-surface-raised divide-y divide-border max-h-56 overflow-y-auto p-1 shadow-lg">
              {searchResults.map((res) => {
                const isSelected = selectedResources.some((r) => r.id === res.id);
                return (
                  <div
                    key={res.id}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/50 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-brand-subtle text-brand-text font-mono text-xs font-bold">
                          {res.subjectCode}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {res.resourceType} • Sem {res.semester}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5">{res.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => (isSelected ? removeResource(res.id) : addResource(res))}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1",
                        isSelected
                          ? "bg-success-subtle text-success border border-success/30"
                          : "bg-brand text-brand-fg hover:bg-brand-hover"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-3" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-3" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Materials Queue */}
          {selectedResources.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-xs font-bold text-muted-foreground">
                In this playlist ({selectedResources.length})
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {selectedResources.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="size-5 rounded-full bg-card border border-border font-mono text-xs font-bold text-muted-foreground flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.subjectCode} • {item.resourceType}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeResource(item.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-subtle transition-colors cursor-pointer shrink-0"
                      aria-label="Remove from playlist"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-1 border border-dashed border-border/60 rounded-2xl">
              <FolderPlus className="size-6 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-bold text-foreground">No materials added yet</p>
              <p className="text-xs text-muted-foreground">Search above to add notes and PYQs.</p>
            </div>
          )}
        </div>

        {/* ─── Submit Bar ─── */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/academics/study-material"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-brand hover:bg-brand-hover text-brand-fg shadow-xs disabled:opacity-50 cursor-pointer transition-colors active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FolderPlus className="size-3.5" />
            )}
            <span>Publish playlist</span>
          </button>
        </div>
      </form>
    </div>
  );
}
