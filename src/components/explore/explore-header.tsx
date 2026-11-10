"use client";

import { Globe, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { SearchScope } from "@/lib/search/types";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl">Explore</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Find people, colleges, communities and events.</p>
        </div>
        <SegmentedControl
          size="sm"
          className="self-start sm:self-auto"
          value={scope === "CAMPUS" ? "CAMPUS" : "INDIA"}
          onChange={(value) => onScopeChange(value as SearchScope)}
          options={[
            { value: "CAMPUS", label: "My college", icon: <MapPin className="size-3.5" aria-hidden /> },
            { value: "INDIA", label: "All of India", icon: <Globe className="size-3.5" aria-hidden /> },
          ]}
        />
      </div>

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
        placeholder="Search people, posts, colleges or #tags"
        inputClassName="rounded-full h-12 text-base pl-10 pr-10"
      />
    </div>
  );
}
