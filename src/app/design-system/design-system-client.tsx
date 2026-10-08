"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterBar } from "@/components/ui/filter-bar";
import { Tag } from "@/components/ui/tag";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ListRow } from "@/components/ui/list-row";
import { MediaCard } from "@/components/ui/media-card";
import {
  Sparkles,
  BookOpen,
  Users,
  Calendar,
  Home,
  ShoppingBag,
  Bell,
  Heart,
  Share2,
  Bookmark,
} from "lucide-react";

export function DesignSystemClient() {
  const [activeChip, setActiveChip] = useState("all");

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] py-8 pb-24">
      <PageContainer size="content">
        <PageHeader
          title="Design System & Token Catalog"
          description="Centralized, trustworthy, bright, and minimal UI primitives powering CampusLoop."
          primaryAction={
            <Button size="sm" variant="default">
              <Sparkles className="size-4" />
              <span>Token Matrix</span>
            </Button>
          }
        />

        {/* 1. PALETTE & TINTS */}
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xl mb-4 text-[var(--text)]">
            1. Core Palette & Semantic Tokens
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--canvas)]">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Canvas</div>
              <div className="text-sm font-mono mt-1 text-[var(--text)]">#F7F8FC</div>
            </div>
            <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)]">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">Surface</div>
              <div className="text-sm font-mono mt-1 text-[var(--text)]">#FFFFFF</div>
            </div>
            <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--primary)] text-white">
              <div className="text-xs font-semibold text-white/80">Primary Action</div>
              <div className="text-sm font-mono mt-1 text-white">#5B4BFF</div>
            </div>
            <div className="p-4 rounded-[var(--r-md)] border border-[var(--primary-soft-border)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <div className="text-xs font-semibold text-[var(--primary)]">Primary Soft</div>
              <div className="text-sm font-mono mt-1 font-semibold">Tonal Accent</div>
            </div>
          </div>

          <h3 className="font-heading font-semibold text-base mt-6 mb-3 text-[var(--text)]">
            Category Tints
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <Tag category="notes">Notes & PYQs</Tag>
            <Tag category="communities">Clubs & Communities</Tag>
            <Tag category="events">Campus Events</Tag>
            <Tag category="housing">Housing & Flats</Tag>
            <Tag category="market">Buy & Sell</Tag>
            <Tag category="safety">Campus Safety</Tag>
            <Tag category="confessions">Confessions</Tag>
            <Tag category="default">General</Tag>
          </div>
        </section>

        {/* 2. TYPOGRAPHY */}
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xl mb-4 text-[var(--text)]">
            2. Typography Hierarchy
          </h2>
          <div className="space-y-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
            <div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mb-1">
                Display H1 · Baloo 2 700 / 800
              </span>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[var(--text)]">
                The Verified Student Loop
              </h1>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mb-1">
                Section H2 · Baloo 2 700
              </span>
              <h2 className="font-heading font-bold text-2xl text-[var(--text)]">
                Academics, Notes & PYQs
              </h2>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mb-1">
                Subsection H3 · Baloo 2 600
              </span>
              <h3 className="font-heading font-semibold text-lg text-[var(--text)]">
                Data Structures & Algorithms (CS301)
              </h3>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mb-1">
                Body Default · Figtree 400 / 500
              </span>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Connect with verified students from your campus. Share study materials, discover campus
                clubs, and discuss real college life without ads or clutter.
              </p>
            </div>
          </div>
        </section>

        {/* 3. BUTTONS & CHIPS */}
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xl mb-4 text-[var(--text)]">
            3. Interactive Controls
          </h2>
          <div className="space-y-6 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                Button Variants
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Primary Action</Button>
                <Button variant="secondary">Secondary (Soft)</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <IconButton
                  aria-label="Bookmark this post"
                  icon={<Bookmark className="size-4" />}
                />
                <IconButton
                  aria-label="Share this post"
                  icon={<Share2 className="size-4" />}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                Filter Chips & Bar
              </div>
              <FilterBar>
                {["all", "notes", "discussions", "events", "polls"].map((key) => (
                  <FilterChip
                    key={key}
                    active={activeChip === key}
                    onClick={() => setActiveChip(key)}
                    count={key === "all" ? 142 : key === "notes" ? 28 : undefined}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </FilterChip>
                ))}
              </FilterBar>
            </div>

            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                Verified Badge (Single Source of Truth)
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Shaswat Sharma</span>
                <VerifiedBadge />
                <span className="text-xs text-[var(--text-muted)]">· BIT Mesra</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. COMPOSITES: LIST ROWS & MEDIA CARDS */}
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xl mb-4 text-[var(--text)]">
            4. Composite Rows & Cards
          </h2>
          <div className="space-y-4">
            <ListRow
              icon={<BookOpen className="size-4" />}
              title="Birla Institute of Technology, Mesra"
              subtitle="Ranchi, Jharkhand · 8,400+ Verified Students"
              showChevron
              right={<Tag category="notes">Tier 1 Hub</Tag>}
            />
            <ListRow
              icon={<Users className="size-4" />}
              title="Association for Computing Machinery (ACM)"
              subtitle="Technical Student Chapter · 512 Members"
              showChevron
              right={<Button size="sm" variant="secondary">Join</Button>}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <MediaCard
              header={<Tag category="notes">CS301 · 2025</Tag>}
              title="Operating Systems Endsem Solved PYQ"
              description="Full step-by-step solution set for questions on virtual memory, paging, and deadlocks."
              footer={
                <>
                  <span>Uploaded by Alex R.</span>
                  <span>1.4k downloads</span>
                </>
              }
            />
            <MediaCard
              header={<Tag category="events">Hackathon</Tag>}
              title="Bitotsav Hack'26 Campus Sprint"
              description="Annual flagship 36-hour hackathon hosted at R&D Building. Open to all branches."
              footer={
                <>
                  <span>Mar 14 – 16, 2026</span>
                  <span>Free entry</span>
                </>
              }
            />
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
