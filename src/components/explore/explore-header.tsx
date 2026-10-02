"use client";

import { Compass, Globe, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import type { SearchScope } from "@/lib/search/types";
import { cn } from "@/lib/utils";

interface ExploreHeaderProps {
  searchQuery: string;
  scope: SearchScope;
  onSearchChange: (query: string) => void;
  onScopeChange: (scope: SearchScope) => void;
  onSearchSubmit: (query: string) => void;
}

export function ExploreHeader({
  searchQuery,
  scope,
  onSearchChange,
  onScopeChange,
  onSearchSubmit,
}: ExploreHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Title & Scope Pill Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="size-6 text-primary" />
            <span>Explore</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Find people, campuses, communities, events &amp; ideas.
          </p>
        </div>

        {/* Campus / India Scope Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-muted/60 border border-border/40 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onScopeChange("CAMPUS")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              scope === "CAMPUS"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="size-3 text-primary" />
            <span>My Campus</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange("INDIA")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              scope === "INDIA" || scope === "GLOBAL"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="size-3 text-primary" />
            <span>India</span>
          </button>
        </div>
      </div>

      {/* ─── Search Bar with Integrated Typeahead Autocomplete ─── */}
      <SearchAutocomplete
        value={searchQuery}
        onChange={onSearchChange}
        onSubmit={(query) => {
          if (query.startsWith("#")) {
            const cleanTag = query.replace(/^#+/, "").trim();
            if (cleanTag) {
              router.push(`/hashtag/${encodeURIComponent(cleanTag.toLowerCase())}`);
              return;
            }
          }
          onSearchSubmit(query);
        }}
        size="lg"
        placeholder="Search CampusLoop by keyword, @person, or #topic..."
        inputClassName="rounded-full h-11 text-xs sm:text-sm pl-10 pr-10"
      />
    </div>
  );
}
