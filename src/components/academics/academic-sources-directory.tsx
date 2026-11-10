"use client";

import { ExternalLink, FileText, Search, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { gtagEvent, trackAcademicSourceClick } from "@/lib/analytics/ga4";
import { sounds } from "@/lib/sounds";
import {
  type AcademicSource,
  type AcademicSourceCategory,
  SOURCE_CATEGORY_LABELS,
  VERIFIED_ACADEMIC_SOURCES,
} from "./academic-sources-data";

export type { AcademicSource } from "./academic-sources-data";
export { VERIFIED_ACADEMIC_SOURCES } from "./academic-sources-data";

const CATEGORY_FILTERS: { id: "all" | AcademicSourceCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Official University Archive", label: "College archives" },
  { id: "Curated Student Hub", label: "Student sites" },
  { id: "State Tech Board", label: "State universities" },
  { id: "National Repository", label: "National" },
];

interface AcademicSourcesDirectoryProps {
  onOpenUploadModal?: () => void;
}

export function AcademicSourcesDirectory({ onOpenUploadModal }: AcademicSourcesDirectoryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filteredSources = VERIFIED_ACADEMIC_SOURCES.filter((s) => {
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.university.toLowerCase().includes(q) ||
      s.coverage.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pt-2">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-2xl text-fg sm:text-3xl">Websites for notes and PYQs</h1>
          <p className="text-sm text-fg-muted">
            Free college and student sites we link to. They are run by others, so check each one.
          </p>
        </div>
        {onOpenUploadModal && (
          <Button
            onClick={() => {
              sounds.tap();
              gtagEvent("academic_source_submit_clicked", { source: "banner" });
              onOpenUploadModal();
            }}
          >
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload notes
            <Badge variant="reward">+20 points</Badge>
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
          {CATEGORY_FILTERS.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              selected={activeCategory === cat.id}
              onSelectedChange={() => {
                sounds.tap();
                setActiveCategory(cat.id);
              }}
            >
              {cat.label}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search websites"
            placeholder="Search by college or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredSources.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No websites match"
          description="Try another college or subject name."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredSources.map((source) => (
            <li key={source.id}>
              <SourceCard source={source} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: AcademicSource }) {
  const track = (action: "browse_internal" | "visit_external") =>
    trackAcademicSourceClick({ id: source.id, name: source.name, university: source.university, action });

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{SOURCE_CATEGORY_LABELS[source.category]}</Badge>
          <Badge variant="outline">{source.offers}</Badge>
        </div>
        <CardTitle className="text-lg">{source.name}</CardTitle>
        <CardDescription>{source.university}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm">
        <p className="text-fg">{source.description}</p>
        <p className="text-fg-muted">
          <span className="font-semibold text-fg">Covers:</span> {source.coverage}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button asChild size="sm">
          <Link href={source.campusLoopFilterUrl} onClick={() => track("browse_internal")}>
            <FileText className="size-4" aria-hidden="true" />
            Browse on CampusLoop
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <a
            href={source.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("visit_external")}
          >
            Open site
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
