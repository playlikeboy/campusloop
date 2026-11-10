"use client";

import { Play, Search, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CAMPUSLOOP_MCP_TOOLS } from "@/lib/mcp/tools-catalog";

export type McpTool = (typeof CAMPUSLOOP_MCP_TOOLS)[number];

const CATEGORIES = [
  "ALL",
  "Exclusive AI & Intelligence",
  "Feed & Posts",
  "Direct Messaging",
  "Communities & Clubs",
  "Academics & Vault",
  "Colleges & Campuses",
  "Profile & Loop Points",
  "Stories & Vibes",
];

function shortLabel(cat: string) {
  if (cat === "ALL") return "All";
  if (cat === "Exclusive AI & Intelligence") return "AI";
  return cat.split(" & ")[0];
}

/** Searchable list of MCP tools with a "Try it" button each. */
export function McpToolDirectory({ onTry }: { onTry: (tool: McpTool) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const q = query.trim().toLowerCase();
  const tools = CAMPUSLOOP_MCP_TOOLS.filter(
    (t) =>
      (category === "ALL" || t.category === category) &&
      (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  );

  return (
    <section aria-labelledby="mcp-tools" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 id="mcp-tools" className="text-xl text-fg">
            Tools{" "}
            <span className="font-sans text-base font-normal text-fg-muted tabular-nums">
              {CAMPUSLOOP_MCP_TOOLS.length}
            </span>
          </h2>
          <p className="text-sm text-fg-muted">What a connected agent can do. Try any of them here.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <label htmlFor="mcp-tool-search" className="sr-only">
            Search tools
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id="mcp-tool-search"
            type="search"
            placeholder="Search tools"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-full border border-border bg-surface pr-3 pl-10 text-sm text-fg outline-none transition-ui placeholder:text-fg-subtle focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
          <Chip key={cat} size="sm" selected={category === cat} onClick={() => setCategory(cat)}>
            {shortLabel(cat)}
          </Chip>
        ))}
      </div>

      {tools.length === 0 ? (
        <EmptyState icon={Wrench} size="compact" title="No tools match" description="Try another word." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {tools.map((tool) => (
            <li key={tool.name} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold text-fg">{tool.name}</p>
                <p className="line-clamp-2 text-sm text-fg-muted">{tool.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onTry(tool)} className="shrink-0">
                <Play className="size-3.5 fill-current" />
                Try it
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
