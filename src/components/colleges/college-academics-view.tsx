"use client";

import {
  ArrowUpRight,
  BookOpen,
  Download,
  ExternalLink,
  FileCheck2,
  Plus,
  Search,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

export function CollegeAcademicsView({
  collegeName,
  collegeSlug,
  resources,
}: CollegeAcademicsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const shortName = collegeName.split(",")[0];

  const branches = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.branch && r.branch !== "All") set.add(r.branch.trim());
    });
    return Array.from(set);
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        res.title.toLowerCase().includes(q) ||
        res.subjectCode.toLowerCase().includes(q) ||
        res.subjectName.toLowerCase().includes(q) ||
        (res.description && res.description.toLowerCase().includes(q));

      const matchesBranch =
        selectedBranch === "ALL" ||
        res.branch === "All" ||
        res.branch.toLowerCase() === selectedBranch.toLowerCase();

      const matchesSem = selectedSemester === "ALL" || res.semester === selectedSemester;

      const matchesType = selectedType === "ALL" || res.resourceType === selectedType;

      return matchesSearch && matchesBranch && matchesSem && matchesType;
    });
  }, [resources, searchQuery, selectedBranch, selectedSemester, selectedType]);

  return (
    <div className="space-y-4 select-none animate-in fade-in">
      {/* ─── Header & Upload CTA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <BookOpen className="size-4 text-primary" /> Academics &amp; Study Vault in {shortName}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Curated handwritten notes, solved previous year papers (PYQs), and cheat sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/academics/study-material/upload?college=${collegeSlug}`}
            className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Upload Notes (+50 LP)</span>
          </Link>

          <Link
            href={`/academics?college=${collegeSlug}`}
            className="px-3.5 py-1.5 rounded-full border border-border/70 bg-card text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <span>All Academics</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${resources.length} study materials in ${shortName} (e.g. CS305, FLAT, Maths)...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-full border border-border/50 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
              selectedType === "ALL"
                ? "bg-foreground text-background font-black"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Resources ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("NOTES")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
              selectedType === "NOTES"
                ? "bg-foreground text-background font-black"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("PYQ")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
              selectedType === "PYQ"
                ? "bg-foreground text-background font-black"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Solved PYQs
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("CHEAT_SHEET")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
              selectedType === "CHEAT_SHEET"
                ? "bg-foreground text-background font-black"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Cheat Sheets
          </button>

          {branches.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-border/40">
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                  selectedBranch === "ALL"
                    ? "bg-foreground text-background font-black"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                All Branches
              </button>
              {branches.slice(0, 3).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBranch(b)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                    selectedBranch === b
                      ? "bg-foreground text-background font-black"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Academic Resources Cards ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredResources.map((item) => {
          const directUrl = item.fileUrl || item.driveUrl;

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-card p-4 space-y-3 shadow-2xs border border-border/40 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {item.subjectCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {item.resourceType}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Sem {item.semester} • {item.branch}
                    </span>
                  </div>

                  {item.isVerified && (
                    <span
                      title="Verified Academic Material"
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0"
                    >
                      <FileCheck2 className="size-3" />
                      Verified
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-black text-foreground leading-snug line-clamp-2">
                  {item.title}
                </h4>

                {item.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="size-3 text-primary" />
                    {item.upvotesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="size-3 text-muted-foreground" />
                    {item.downloadsCount}
                  </span>
                </div>

                {directUrl ? (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    <span>View / Download</span>
                    <ArrowUpRight className="size-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-medium">Available via App</span>
                )}
              </div>
            </div>
          );
        })}

        {filteredResources.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-3xl bg-card border border-dashed border-border/70 p-6 space-y-3">
            <BookOpen className="size-8 mx-auto text-muted-foreground/40" />
            <p className="text-xs font-bold text-foreground">
              {resources.length === 0
                ? `No study materials uploaded for ${shortName} yet.`
                : `No resources match your filter "${searchQuery}".`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Be the first to upload lecture notes or past year question papers and earn 50 LP Loop Points!
            </p>
            <Link
              href={`/academics/study-material/upload?college=${collegeSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/95 transition-all"
            >
              <Plus className="size-3.5" />
              <span>Upload Notes for {shortName}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
