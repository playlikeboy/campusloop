"use client";

import { ChevronDown, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ALL_CATEGORY, CATEGORIES, FAQS } from "./faqs";

/** Searchable FAQ list. Answers open in place, one at a time. */
export function HelpClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((faq) => {
      if (category !== ALL_CATEGORY && faq.category !== category) return false;
      if (!q) return true;
      return `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(q);
    });
  }, [query, category]);

  const reset = () => {
    setQuery("");
    setCategory(ALL_CATEGORY);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <label htmlFor="help-search" className="sr-only">
          Search help
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, like “notes” or “verify”"
          className="h-12 rounded-full pr-12 pl-11 text-base"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Topic</legend>
        {CATEGORIES.map((cat) => (
          <Chip key={cat} selected={category === cat} onSelectedChange={() => setCategory(cat)}>
            {cat}
          </Chip>
        ))}
      </fieldset>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          bordered
          title="No answers match that"
          description="Try a shorter word, or email us and a person will help."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={reset}>
                Show all questions
              </Button>
              <Link href="/contact" className={buttonVariants({ variant: "primary" })}>
                Contact us
              </Link>
            </div>
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {filtered.map((faq) => {
            const isOpen = openId === faq.id;
            const panelId = `faq-${faq.id}`;
            return (
              <li key={faq.id}>
                <h2 className="font-sans text-base">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left font-semibold text-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5"
                  >
                    {faq.question}
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-fg-muted transition-ui", isOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                </h2>
                <div
                  id={panelId}
                  hidden={!isOpen}
                  className="max-w-[68ch] px-4 pb-5 text-base text-fg-muted sm:px-5"
                >
                  {faq.answer}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
