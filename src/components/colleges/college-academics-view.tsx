"use client";

import { ArrowUpRight, BookOpen, Download, Plus, Search, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { VerifiedSticker } from "@/components/ui/stickers";

export interface CollegeAcademicResourceItem {
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
  upvotesCount: number;
  downloadsCount: number;
  viewsCount: number;
  isVerified: boolean;
  createdAt: string | Date;
  uploader?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

interface CollegeAcademicsViewProps {
  collegeName: string;
  collegeSlug: string;
  resources: CollegeAcademicResourceItem[];
}

const TYPES = [
  { id: "ALL", label: "All" },
  { id: "NOTES", label: "Notes" },
  { id: "PYQ", label: "PYQs" },
  { id: "CHEAT_SHEET", label: "Cheat sheets" },
];

const TYPE_LABEL: Record<string, string> = { NOTES: "Notes", PYQ: "PYQ", CHEAT_SHEET: "Cheat sheet" };

export function CollegeAcademicsView({ collegeName, collegeSlug, resources }: CollegeAcademicsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const shortName = collegeName.split(",")[0];
  const uploadHref = `/academics/study-material/upload?college=${collegeSlug}`;

  const branches = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) if (r.branch && r.branch !== "All") set.add(r.branch.trim());
    return Array.from(set);
  }, [resources]);

  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return resources.filter((res) => {
      const matchesSearch =
        !q ||
        res.title.toLowerCase().includes(q) ||
        res.subjectCode.toLowerCase().includes(q) ||
        res.subjectName.toLowerCase().includes(q) ||
        res.description?.toLowerCase().includes(q);
      const matchesBranch =
        selectedBranch === "ALL" ||
        res.branch === "All" ||
        res.branch.toLowerCase() === selectedBranch.toLowerCase();
      const matchesType = selectedType === "ALL" || res.resourceType === selectedType;
      return matchesSearch && matchesBranch && matchesType;
    });
  }, [resources, searchQuery, selectedBranch, selectedType]);

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        bordered
        title={`No notes for ${shortName} yet`}
        description="Upload your notes or a past paper to help your juniors."
        action={
          <Button asChild>
            <Link href={uploadHref}>
              <Plus />
              Upload notes
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-fg">Notes and PYQs</h2>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/academics?college=${collegeSlug}`}>All study material</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={uploadHref}>
              <Plus />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search notes"
          placeholder="Subject, code or topic"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {TYPES.map((t) => (
          <Chip key={t.id} size="sm" selected={selectedType === t.id} onClick={() => setSelectedType(t.id)}>
            {t.label}
          </Chip>
        ))}
        {branches.length > 1 &&
          ["ALL", ...branches.slice(0, 4)].map((b) => (
            <Chip key={b} size="sm" selected={selectedBranch === b} onClick={() => setSelectedBranch(b)}>
              {b === "ALL" ? "All branches" : b}
            </Chip>
          ))}
      </div>

      {filteredResources.length === 0 ? (
        <EmptyState
          size="compact"
          bordered
          icon={Search}
          title="Nothing matches that"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
                setSelectedBranch("ALL");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {filteredResources.map((item) => {
            const directUrl = item.fileUrl || item.driveUrl;
            return (
              <li key={item.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
                  <span className="font-mono font-semibold text-fg">{item.subjectCode}</span>
                  <Badge>{TYPE_LABEL[item.resourceType] ?? item.resourceType}</Badge>
                  <span>
                    Sem {item.semester} · {item.branch}
                  </span>
                  {item.isVerified && <VerifiedSticker size="sm" label="Checked" className="shadow-none" />}
                </div>
                <h3 className="line-clamp-2 font-semibold leading-snug text-fg">{item.title}</h3>
                {item.description && <p className="line-clamp-2 text-sm text-fg-muted">{item.description}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-4 text-sm text-fg-muted tabular-nums">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Upvotes</span>
                      {item.upvotesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Downloads</span>
                      {item.downloadsCount}
                    </span>
                  </div>
                  {directUrl ? (
                    <Button asChild variant="secondary" size="sm">
                      <a href={directUrl} target="_blank" rel="noreferrer">
                        Open
                        <ArrowUpRight />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm text-fg-subtle">No file attached</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
