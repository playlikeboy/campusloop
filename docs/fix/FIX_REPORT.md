# Fix report — Design System v3, honest claims, SEO, backend hardening

Executed 2026-11-02 → 2026-11-05 directly on `main`, in one pass with eleven parallel agents and a coordinator. Phases from `FIX_PLAN.md`: 1 (claims), 4 (SEO), 5 (foundations), 6 (shells + migration), 7 (landing), plus the backend items from `docs/archive/AUDIT.md` and a dead-code sweep. Phases 2 (privacy/age gating) and 3 (seed marking) need schema migrations and are **not** done; see the founder to-do.

## Before → after

| Metric (`src/**/*.tsx` unless noted) | Baseline (2026-10-09) | Now |
| --- | --- | --- |
| `bun run check:design` violations (src, outside styles/ui) | 2,972 at first run | **0** (67 lines carry a `// ds-allow: <reason>`) |
| Hex colours | 480 | 62, all under `ds-allow` or in `src/components/ui` |
| Arbitrary colour classes `-[#…]` | 228 | 0 |
| Raw Tailwind palette classes | 3,749 | 17, all under `ds-allow` |
| `rounded-[Npx]` | 29 | 0 |
| `transition-all` | n/a | 0 (`transition-ui` utility) |
| Layouts / navbars / headers / footers / sidebars / shells | 14 / 11 / 12 / 4 / 5 / 3 | 16 layouts on **3 shells**; 8 duplicate chrome files deleted |
| Fabricated-number hits (`45,000|45K|8,400|cannot trace|…`) | 117 lines / 55 files | 0 |
| `campusloop.space/app` URLs | 90 lines / 45 files | 0 outside the three legacy-redirect tests |
| `bun run typecheck` | pass | pass |
| `bun run test` | 3 suites failed to load | 75 files / 594 tests pass |
| `bun run lint` | 9 errors | 0 errors (warnings remain: `any`, `<img>`, unused vars) |
| Components | 345 | 325 (38 orphans deleted, 20 primitives added) |

## What changed

### Design System v3 (Phase 5)
- `src/styles/tokens.css`: primitives → semantic → component tokens, light + dark, Hallmark stamp. Loop Blue `#3B5BFD` brand, warm neutrals, Sunny reward (Loop Points only), Crush pink (Campus Match only), status trio.
- `src/styles/base.css`: Floor rules (overflow-x clip, focus-visible, reduced motion, themed scrollbars, 16px inputs on mobile).
- `src/app/globals.css`: `@theme inline` maps canonical utilities (`bg-surface`, `text-fg`, `bg-brand`…) and keeps every shadcn / v2 name (`bg-card`, `text-muted-foreground`, `bg-primary`, `text-ink`…) as aliases onto the same tokens. Aurora/mesh/glass/gradient utilities and the global `border-color: transparent !important` hack are gone. `campusloop-design-system.css` (a conflicting second palette) deleted.
- Fonts: Plus Jakarta Sans (display + body), Noto Sans Devanagari fallback, JetBrains Mono for code. Baloo 2 / Nunito Sans / DM Mono removed.
- `bun run check:design` (`--strict`, `--list`, `--json`) and `src/styles/contrast.test.ts` (66 WCAG AA pairs, both themes).
- `docs/DESIGN_SYSTEM.md` is the single spec; the five older design docs moved to `docs/archive/`.
- `src/components/ui/` rebuilt on tokens: Button (primary/secondary/outline/ghost/danger/crush/link + `loading`), Badge (neutral/brand/success/warning/danger/verified/anonymous/example/reward/crush), Card (shadow, no border), Input/Textarea, and new Select, Checkbox, Switch, RadioGroup, Label, FormField, SegmentedControl, Sheet, DropdownMenu, Popover, Tooltip, Banner, EmptyState, Spinner, Stat, Divider, Chip, Section. Old variant names remain as aliases. **Behaviour notes:** Badge default is now `neutral` (was brand); Button `size="lg"` is 52px; Card has no border.

### Shells (Phase 6)
- `src/components/shells/`: `MarketingShell` (nav + footer, skip link), `AppShell` (desktop sidebar ≥1024px, top bar, mobile bottom tab bar Home/Colleges/Post/Chat/Match, preview banner for guests), `AdminShell`. The mobile bottom bar was never mounted before; it is now.
- One nav config: `src/constants/navigation.ts` (`badgeTone` replaces raw class strings; "1,350+" badge removed).
- Deleted: ruixen navbar/footer, both dating navbar/footer pairs, `desktop-sidebar`, `feed/mobile-bottom-nav`, `landing/clean-footer`, `landing/minimal-landing-navbar`, `marketing/company-nav`, `marketing/legal-nav`, `articles/editorial-header`, `mobile-navigation.css`.
- `(marketplace)` still uses `MarketplaceShellClient` (its own full chrome); folding it into AppShell is a follow-up.

### Token migration (Phase 6.2–6.3)
Four codemod agents migrated every feature folder and `*-client.tsx`; the coordinator finished `[username]/page.tsx`, `colleges/[slug]/page.tsx`, constants and lib data files. Remaining `ds-allow` lines are canvas/PNG exports (QR codes, share cards, confetti), user-persisted class strings (story backgrounds, community swatches, playlist covers), third-party brand marks, email HTML, the sitemap XSL, theme-color meta tags and the Razorpay widget colour.

### Landing (Phase 7, Hallmark full redesign)
- `src/app/page.tsx` + `src/components/landing/landing-page.tsx` + `landing-college-search.tsx` + `landing.css`. Shape: Workbench; hero "Your campus, verified." on a full-bleed Loop Blue band with example feed cards (captioned as examples); sections: Academic vault (live counts only above threshold), Clubs, Anonymity statement, Campus Match "18+ verified students only", Safety, FAQ (`<details>`), close. sloplint: 28 FAIL / 73 REFLEX → 0 / 0.
- Five old landing components and the CSS module deleted.

### Honest claims (Phase 1)
- `src/lib/public-stats.ts` (`getPublicStats()`, 1h cache, thresholds 1000/1000/25, seeded + preview accounts excluded) and `src/constants/social.ts` (corrected LinkedIn/X URLs).
- Fabricated counts, testimonials, "zero-knowledge"/"hardware security"/"0 Ad Trackers"/"DPDP certified" wording removed everywhere; the approved anonymity statement, tracker statement and "Built to follow India's DPDP Act, 2023" line used instead. Founder and Grievance Officer named on about/contact/privacy/terms; "CampusLoop Inc." → "CampusLoop (not yet incorporated)" / "CampusLoop".
- Pitch: valuation slider deleted, "raising our first round", live traction only. `/overview` → 308 `/pitch`. `publish-21st/`, `/design-system` route, overview/about/products client components deleted.
- All marketing pages wrapped in `MarketingShell`; titles `Page · CampusLoop`.

### SEO (Phase 4)
- Clean URLs everywhere; `profiles.xml`, `comments.xml`, `reels.xml` removed from the sitemap index; `posts.xml` excludes anonymous, confession, seeded and imported posts; `<lastmod>` on every dynamic sitemap; 50k cap.
- `robots.ts` rewritten (no Allow rules); confessions and anonymous posts `noindex`; `(app)` public pages opt back in. Matrix: `docs/fix/SEO_MATRIX.md`.
- `/colleges` server-renders the first 50 colleges with `?page=`/`?state=` anchors and ItemList JSON-LD. BreadcrumbList on articles. Root template `%s · CampusLoop`; Organization JSON-LD uses `SOCIAL_SAME_AS` and names the founder.
- `/@username` soft-404: `generateMetadata` no longer calls `notFound()` (streaming metadata committed a 200 first); the page body still throws the real 404.

### Backend
- `src/lib/require-profile.ts` replaces the copy-pasted auth+profile block in 71 route files (92 blocks); status codes unchanged.
- `src/lib/pagination.ts`; hard limits / cursors on archived posts, story archive, marketplace orders, academic comments, store reviews, capsules, crush, highlights, conversations, stories, events, birthdays. Frontend "load more" wiring is a follow-up (see `docs/fix/BACKEND_REPORT.md` §4).
- 14 WRITE rate-limit rules added in `src/lib/rate-limits.ts`.
- `scripts/fix/indexes.sql` (20 `CREATE INDEX CONCURRENTLY IF NOT EXISTS`); one new index in the Drizzle schema.
- Test harness: `src/test/setup.ts` mocks `@/hexclave/server` so the three suites that failed to load now run.

### Dead code
`docs/fix/DEAD_CODE.md` is the audit. Deleted after re-verifying zero importers: `reels-feed-client`, `post-comments`, `auth-form-card`, `auth-visual-panel`, `confession-composer-modal`, the `ruixen/*` and `animate-ui/*` folders, `dream-campuses-modal`, `event-card-skeleton`, `campus-hub-strip`, `featured-campus-card`, `streak-banner`, `comment-thread-connector`, `use-mobile`, `use-post-actions`, `use-is-in-view`, `lib/ai/tools`, `edit-profile-dialog`, admin `stat-card`, legacy `ui/` files (confetti, marquee, bento-grid, shape-landing-hero, filter-bar, icon-button, list-row, media-card, page-container, tag, filter-chip, accordion) and the `primitives/` shims. Root docs `TODO.md`, `OVERVIEW.md`, `AUDIT.md`, `ADDCOURSES.md` moved to `docs/archive/`. `cmdk`, `next-themes`, `react-day-picker`, `radix-ui` are unused but left in `package.json` because `bun install` crashes on this host and CI uses `--frozen-lockfile`.

## Decisions applied / assumptions
- FIX_PLAN defaults (AGE_POLICY A, SEED_POLICY A) as confirmed by the founder on 2026-10-09; Phase 2/3 work that needs migrations was deferred rather than half-applied.
- Rating stars use the reward yellow; podium medals use reward / neutral / warning. Change in `rating-stars.tsx` and `all-india-college-podium.tsx` if unwanted.
- Reel/story likes use `danger` red; event and marketplace category artwork is flat brand (per-category colour differentiation removed by DS rule).
- Playlist cover themes reduced to Ink and Loop Blue; legacy stored gradients render as Ink.

## Founder to-do
1. **Re-enable R2** in the Cloudflare dashboard — every deploy fails with `R2 binding error for bucket 'campusloop-media' [code: 10136]` until then.
2. Run `scripts/fix/indexes.sql` against production (`CONCURRENTLY`, safe online).
3. Rotate the Giphy key and the demo account password.
4. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `REDDIT_INGEST_ENABLED=false` in Cloudflare (Phase 2/3 prerequisites).
5. Resubmit `https://campusloop.space/sitemap.xml` in Google Search Console; request removal of indexed `/app/*`, `/confessions`, `/@*` URLs.
6. Run `bun install` on a machine where Bun does not crash, then drop `cmdk`, `next-themes`, `react-day-picker`, `radix-ui` and move `@types/canvas-confetti|prismjs|turndown` to devDependencies.
7. Decide Phase 2 (DOB + age gates + consent + anon vault) and Phase 3 (seed marking) — both need `db:generate` migrations applied by hand because the migration folder carries unrelated drift (`drizzle/0005_cheerful_the_professor.sql`).
8. Replace the three example feed cards in the landing hero with consent-safe real screenshots when available.
9. Decide the DPDP position (parental consent vs 18+ only) before 13 May 2027.
