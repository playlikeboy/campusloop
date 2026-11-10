"use client";

import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronRight,
  FileQuestion,
  FlaskConical,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { AcademicAiStudyBar } from "@/components/academics/academic-ai-study-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface AcademicResourceItem {
  id: string;
  title: string;
  description?: string | null;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  resourceType: string;
  moduleOrChapter?: string | null;
  fileUrl?: string | null;
  driveUrl?: string | null;
  viewsCount: number;
  downloadsCount: number;
  upvotesCount: number;
  savedSemester?: number;
  savedAt?: string;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const MATERIAL_TYPES = [
  { id: "ALL", label: "All Formats" },
  { id: "NOTES", label: "Notes", icon: BookOpen },
  { id: "PYQ", label: "PYQs", icon: FileQuestion },
  { id: "CHEAT_SHEET", label: "Cheat Sheets", icon: Zap },
  { id: "LAB_MANUAL", label: "Lab Manuals", icon: FlaskConical },
] as const;

export function SavedMaterialsClient() {
  const router = useRouter();
  const { profile } = useProfile();
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingPackSem, setSavingPackSem] = useState<number | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{
    items: AcademicResourceItem[];
    total: number;
    bySemester: Record<number, AcademicResourceItem[]>;
    availableSemesters: number[];
  }>("/api/academics/saved", fetcher);

  const savedItems = data?.items || [];
  const availableSemesters = data?.availableSemesters || [1, 2, 3, 4, 5, 6, 7, 8];

  // Auto-organize filtered items by subject
  const filteredItems = useMemo(() => {
    return savedItems.filter((item) => {
      const matchSem =
        selectedSemester === "ALL" || (item.savedSemester || item.semester) === selectedSemester;
      const matchType = selectedType === "ALL" || item.resourceType === selectedType;
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSem && matchType && matchQuery;
    });
  }, [savedItems, selectedSemester, selectedType, searchQuery]);

  // Group by Subject Code
  const groupedBySubject = useMemo(() => {
    const groups: Record<
      string,
      { code: string; name: string; semester: number; items: AcademicResourceItem[] }
    > = {};

    for (const item of filteredItems) {
      const code = item.subjectCode || "GENERAL";
      if (!groups[code]) {
        groups[code] = {
          code,
          name: item.subjectName || code,
          semester: item.savedSemester || item.semester || 1,
          items: [],
        };
      }
      groups[code].items.push(item);
    }

    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredItems]);

  async function handleRemove(id: string) {
    sounds.tap();
    haptics.light();
    try {
      const res = await fetch(`/api/academics/${id}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNSAVE" }),
      });
      if (res.ok) {
        toast.success("Removed from Saved");
        mutate(
          (prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((i) => i.id !== id),
                  total: Math.max(0, prev.total - 1),
                }
              : prev,
          false
        );
      }
    } catch {
      toast.error("Couldn't remove it. Check your internet and try again.");
    }
  }

  async function handleSaveSemesterPack(sem: number) {
    sounds.send();
    haptics.medium();
    setSavingPackSem(sem);

    try {
      const res = await fetch("/api/academics/saved/semester-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: sem }),
      });
      const resData = (await res.json()) as any;

      if (res.ok && resData.success) {
        sounds.pop();
        haptics.success();
        toast.success(resData.message || `Saved semester ${sem} files`);
        mutate();
      } else {
        toast.error(resData.message || `No files for semester ${sem} yet.`);
      }
    } catch {
      toast.error("Couldn't save. Check your connection and try again.");
    } finally {
      setSavingPackSem(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 pt-2 pb-28 sm:px-6 sm:pt-4 lg:px-8">
      <header className="space-y-1">
        <Link
          href="/academics/study-material"
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-fg-muted transition-ui hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Study material
        </Link>
        <h1 className="text-2xl text-fg sm:text-3xl">Saved</h1>
        <p className="text-sm text-fg-muted">
          {savedItems.length === 1 ? "1 file" : `${savedItems.length} files`} you bookmarked, sorted by
          semester.
        </p>
      </header>

      <section
        className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5"
        aria-labelledby="sem-pack-title"
      >
        <div className="space-y-1">
          <h2 id="sem-pack-title" className="text-base text-fg">
            Save a whole semester
          </h2>
          <p className="text-sm text-fg-muted">
            Adds the notes, PYQs and cheat sheets for that semester to Saved.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <Button
              key={sem}
              variant="pill"
              size="sm"
              disabled={savingPackSem !== null}
              loading={savingPackSem === sem}
              onClick={() => handleSaveSemesterPack(sem)}
              aria-label={`Save all files for semester ${sem}`}
            >
              Sem {sem}
            </Button>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:px-0">
            {(["ALL", 1, 2, 3, 4, 5, 6, 7, 8] as const).map((sem) => (
              <Chip
                key={sem}
                size="sm"
                selected={selectedSemester === sem}
                onSelectedChange={() => {
                  sounds.tap();
                  setSelectedSemester(sem);
                }}
              >
                {sem === "ALL" ? "All" : `Sem ${sem}`}
              </Chip>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search saved files"
              placeholder="Search saved"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 no-scrollbar sm:mx-0 sm:px-0">
          {MATERIAL_TYPES.map((type) => (
            <Chip
              key={type.id}
              size="sm"
              selected={selectedType === type.id}
              onSelectedChange={() => {
                sounds.tap();
                setSelectedType(type.id);
              }}
            >
              {type.label}
            </Chip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="status">
          <span className="sr-only">Loading saved files</span>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : groupedBySubject.length > 0 ? (
        <div className="space-y-8">
          {groupedBySubject.map((group) => (
            <section key={group.code} className="space-y-3" aria-label={group.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="flex items-center gap-2 text-base text-fg sm:text-lg">
                  <Badge variant="outline">{group.code}</Badge>
                  {group.name}
                </h2>
                <span className="text-sm text-fg-muted">
                  Sem {group.semester} · {group.items.length} {group.items.length === 1 ? "file" : "files"}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Card size="sm" className="h-full">
                      <CardContent className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="neutral">{item.resourceType}</Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemove(item.id)}
                            aria-label={`Remove ${item.title} from saved`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                        <h3 className="line-clamp-2 font-sans text-sm font-semibold text-fg">{item.title}</h3>
                        {item.moduleOrChapter && (
                          <p className="text-sm text-fg-muted">{item.moduleOrChapter}</p>
                        )}
                      </CardContent>
                      <CardFooter className="justify-between gap-2">
                        <AcademicAiStudyBar
                          title={item.title}
                          subjectCode={item.subjectCode}
                          materialUrl={
                            item.fileUrl ||
                            item.driveUrl ||
                            `https://campusloop.space/academics/study-material/${item.id}`
                          }
                          pageUrl={`https://campusloop.space/academics/study-material/${item.id}`}
                          compact={true}
                        />
                        <Button asChild size="sm">
                          <Link href={`/academics/study-material/${item.id}`}>
                            Open
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Bookmark}
          title="Couldn't load your saved files"
          description="Check your connection and try again."
          action={
            <Button variant="secondary" onClick={() => mutate()}>
              Try again
            </Button>
          }
        />
      ) : savedItems.length > 0 ? (
        <EmptyState
          icon={Search}
          title="Nothing matches"
          description="Try another semester, type or search."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedSemester("ALL");
                setSelectedType("ALL");
                setSearchQuery("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark on any note or PYQ to keep it here."
          action={
            <Button asChild>
              <Link href="/academics/study-material">Browse study material</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
