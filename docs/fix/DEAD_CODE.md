# Dead code, duplicates, unused deps, broken links

Read-only audit of the working tree on 2026-11-05 (HEAD `f1d155c`, plus ~655 uncommitted changes from sibling agents).
Every candidate below was re-verified against the tree immediately before this file was written; the tree is still
moving, so anything marked **in flux** must be re-checked after the sibling branches merge.

Method: three Bun scripts (kept in the audit scratchpad, not committed) that resolve every `import`/`export … from`/
`require`/`import()`/CSS `@import`/`@plugin`/`@source` specifier in `src/**`, `scripts/**`, `tests/**`, `sanity/**`,
`drizzle/**`, root configs and `.claude`/`.agents` to a file on disk (handles `@/`, relative, extensionless, `index.*`,
`.js -> .ts`). A file is a **direct orphan** when zero files import it; a **transitive orphan** when its only importers
are themselves unreachable from the Next.js roots (`src/app/**`, `src/middleware.ts`, scripts, tests, configs).
Every orphan was then re-checked with a plain-text grep of its basename across all code and config files, and with
`graphify query`. No `knip`/`ts-prune`/`depcheck` is installed in `node_modules/.bin`, and running them via `bunx`
would require a download, so the per-symbol dead-export pass (step 2) was skipped.

Nothing was executed from `package.json` scripts (no build/typecheck/lint/test/deploy/db).

## Summary counts

| Area | Count |
| --- | --- |
| Direct orphans (`src/components`, `src/lib`, `src/hooks`, `src/constants`) | 53 (of 576 candidate files) |
| Transitive orphans (only imported by orphans) | 9 |
| Orphan non-convention files under `src/app` | 5 |
| Orphans already deleted/staged-deleted by sibling agents during this audit | 9 (listed separately, do not re-delete) |
| Duplicate component pairs/groups | 11 |
| `dependencies` with zero import sites | 6 (3 of them are `@types/*` in the wrong section) |
| `devDependencies` with zero import sites that are actually used by tooling | 8 (all false positives, see section) |
| Broken internal links (literal `href`/`redirect`/`router.push`/guide `routes`) | 0 of 1,229 literal links checked |
| Links that only resolve because `/[username]` swallows them | 0 (was 30+ for `/colleges` until `src/app/(app)/(main)/colleges/page.tsx` landed this week) |
| Unreachable page candidates | 10 (most are redirect shims) |
| Stale root docs/artifacts | 7 unreferenced files, 1 untracked build artefact, 1 verification file to keep |

## 1. Verified orphans

Columns: size (bytes), last commit date (`git log -1 --format=%ci`), working-tree status, confidence, flux flag.
"??" = untracked (created by a sibling agent, never committed); "M" = tracked and modified in the working tree.

### 1a. Direct orphans outside in-flux folders (safe to delete after merge)

| Path | Size | Last commit | WT | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/reels/reels-feed-client.tsx` | 52,034 | 2026-09-29 | M | high | Largest orphan. `src/app/(app)/(reels)/**` does not import it; the reels pages use their own client. |
| `src/components/confessions/confession-composer-modal.tsx` | 12,979 | 2026-09-28 | M | high | Confessions feed uses the inline composer. |
| `src/components/auth/auth-form-card.tsx` | 14,596 | 2026-10-06 | M | high | Auth pages use `@hexclave/next` + `auth-split-layout.tsx`. Mentioned only in `FIX_PLAN.md` and `docs/SECURITY-HARDENING-AUDIT.md`. |
| `src/components/auth/auth-visual-panel.tsx` | 2,895 | 2026-10-12 | M | high | Same as above. |
| `src/components/preview/dream-campuses-modal.tsx` | 9,456 | 2026-08-30 | – | high | No importer; `campus-unlocked-modal.tsx` is the one in use. |
| `src/components/events/event-card-skeleton.tsx` | 7,121 | 2026-10-04 | – | high | Events `loading.tsx` files use `ui/skeleton-card.tsx`. |
| `src/components/communities/campus-hub-strip.tsx` | 6,535 | 2026-09-29 | M | high | |
| `src/components/discover/featured-campus-card.tsx` | 2,731 | 2026-09-29 | M | high | Mentioned only in `AGENTS.md` prose. |
| `src/components/streaks/streak-banner.tsx` | 4,544 | 2026-10-23 | M | high | Mentioned only in `PRODUCT.md` prose. |
| `src/components/articles/editorial-header.tsx` | 4,190 | 2026-10-13 | – | high | Became an orphan this week: `src/app/(app)/(articles)/layout.tsx` was rewritten by a sibling (verify after merge). |
| `src/components/comments/comment-thread-connector.tsx` | 1,044 | 2026-10-01 | – | high | |
| `src/components/feed/feed-card.tsx` | 289 | 2026-10-11 | – | high | Pure re-export shim (`FeedCard`, `FeedCardHeader`, `FeedCardActions`, `FeedCardRepostModal`). All 9 consumers import `@/components/ui/feed-card` directly. |
| `src/components/reddit/index.ts` | 104 | 2026-09-11 | – | high | Barrel; the 3 consumers import `@/components/reddit/reddit-*` directly. |
| `src/components/marketing/legal-nav.tsx` | 160 | 2026-10-05 | M | medium | Shrunk to a 160-byte shim this week by a sibling; zero importers now. Re-check after merge. |
| `src/components/ruixen/accordion-indexed.tsx` | 3,567 | 2026-09-28 | – | high | Only importer of `ui/accordion.tsx` (and therefore of the `radix-ui` package). |
| `src/components/ruixen/feature-highlights.tsx` | 10,196 | 2026-09-28 | – | high | Landing leftovers from the Ruixen landing (`2857e2f`). `ruixen/footer-enterprise.tsx` and `ruixen/navbar-minimal.tsx` were already deleted by the landing agent. |
| `src/components/ruixen/grid-frame-hero.tsx` | 21,336 | 2026-09-28 | M | medium | Modified in WT by a sibling, yet still has zero importers. "in flux" by association with the landing rewrite. |
| `src/components/ruixen/split-feature-showcase.tsx` | 11,131 | 2026-09-28 | M | medium | Same. |
| `src/components/ruixen/structured-hero-section.tsx` | 8,546 | 2026-09-28 | – | high | |
| `src/lib/ai/tools.ts` | 4,093 | 2026-08-31 | – | high | Nothing imports it; `src/lib/ai/**` siblings are imported by API routes, this one is not. |
| `src/hooks/use-mobile.ts` | 576 | 2026-08-30 | – | high | Was only re-exported by the now staged-deleted `src/hooks/index.ts`. |
| `src/hooks/use-post-actions.ts` | 2,208 | 2026-08-30 | – | high | Same. |

### 1b. Transitive orphans (deletable together with their only importer)

| Path | Size | Last commit | WT | Only importer(s) | Confidence |
| --- | --- | --- | --- | --- | --- |
| `src/components/animate-ui/icons/icon.tsx` | – | 2026-08-30 | – | none (zero importers; not a candidate dir hit because `animate-ui/icons/` only contains this file) | high |
| `src/components/animate-ui/primitives/animate/slot.tsx` | 2,285 | 2026-08-30 | – | `animate-ui/icons/icon.tsx` | high |
| `src/hooks/use-is-in-view.tsx` | 750 | 2026-08-30 | – | `animate-ui/icons/icon.tsx` | high |
| `src/components/ui/accordion.tsx` | 2,168 | 2026-09-28 | M | `ruixen/accordion-indexed.tsx` | high, **in flux** (ui/) |
| `src/components/ui/chip.tsx` | 2,937 | untracked | ?? | `ui/filter-chip.tsx`, `ui/page-toolbar.tsx` (both orphans) | **in flux** |
| `src/components/ui/label.tsx` | 694 | untracked | ?? | `ui/form-field.tsx` (orphan) | **in flux** |
| `src/components/ui/meta-badges.tsx` | 2,548 | untracked | ?? | `primitives/badges.tsx` (orphan shim) | **in flux** |
| `src/components/ui/page-toolbar.tsx` | 3,119 | untracked | ?? | `primitives/page-toolbar.tsx` (orphan shim) | **in flux** |
| `src/components/ui/section.tsx` | 2,193 | untracked | ?? | `primitives/section-header.tsx` (orphan shim) | **in flux** |
| `src/components/ui/tactile-button.tsx` | 1,127 | untracked | ?? | `primitives/buttons.tsx` (orphan shim) | **in flux** |

### 1c. Direct orphans inside in-flux folders — recheck after merge

`src/components/ui/**` and `src/components/primitives/**` are being rewritten by the `ui-primitives` agent right now
(25 modified + 21 untracked files in `ui/`). Every file below has zero importers *today*; many are new shadcn-style
primitives that were just added and are probably about to be wired in. Do not delete from this list until the
rewrite lands and the script is re-run.

Untracked new files (created this week, never imported yet): `ui/banner.tsx` (1,963), `ui/checkbox.tsx` (1,398),
`ui/divider.tsx` (992), `ui/dropdown-menu.tsx` (4,697), `ui/form-field.tsx` (1,591), `ui/popover.tsx` (1,799),
`ui/radio-group.tsx` (2,058), `ui/segmented-control.tsx` (2,283), `ui/select.tsx` (4,303), `ui/sheet.tsx` (3,462, the
only importer of `vaul`), `ui/stat.tsx` (1,364), `ui/switch.tsx` (1,131), `ui/tooltip.tsx` (2,021).

Tracked files with zero importers (older, better candidates): `ui/confetti.tsx` (3,368, 2026-08-30; all confetti
consumers import `canvas-confetti` directly), `ui/marquee.tsx` (1,667, 2026-08-30; only the `marquee` keyframe name in
`globals.css` matches), `ui/tabs.tsx` (3,423, 2026-08-30, M), `ui/textarea.tsx` (634, 2026-08-30, M; consumers use raw
`<textarea>`), `ui/bento-grid.tsx` (5,451, 2026-09-28, M), `ui/shape-landing-hero.tsx` (6,070, 2026-09-29, M),
`ui/filter-bar.tsx` (470, 2026-10-08), `ui/filter-chip.tsx` (637, M), `ui/icon-button.tsx` (982), `ui/list-row.tsx`
(1,909, M), `ui/media-card.tsx` (1,724, M), `ui/page-container.tsx` (635, M), `ui/tag.tsx` (1,172, M).

Primitives shims, all shrunk to ~80–114 bytes this week and now unreferenced: `primitives/badges.tsx`,
`primitives/buttons.tsx`, `primitives/empty-state.tsx`, `primitives/page-toolbar.tsx`, `primitives/section-header.tsx`.
Each just re-exports a `ui/*` file. Once the ui-primitives agent finishes, either the shim or the target is redundant.

### 1d. Orphan non-convention files under `src/app`

| Path | Size | Last commit | WT | Notes |
| --- | --- | --- | --- | --- |
| `src/app/(app)/(post)/post/[id]/post-comments.tsx` | 23,985 | 2026-10-01 | M | Not imported by `post/[id]/page.tsx` or anything else. Second largest orphan in the repo. |
| `src/app/(app)/(main)/profile/edit-profile-dialog.tsx` | 7,142 | 2026-09-28 | – | Profile edit lives at `profile/edit/edit-profile-client.tsx`. |
| `src/app/admin/_components/stat-card.tsx` | 2,935 | 2026-10-06 | M | Admin dashboard no longer imports it. |
| `src/app/admin/_components/admin-header.tsx` | 63 | 2026-10-22 | M | 63-byte shim toward `components/shells/admin-shell.tsx`; zero importers. **in flux** (codemod-admin). |
| `src/app/admin/_components/admin-shell.tsx` | 84 | – | M | 84-byte shim; `admin/layout.tsx` now imports `@/components/shells/admin-shell` directly. **in flux** (codemod-admin). |

### 1e. Already removed by sibling agents during this audit (for the coordinator's awareness only)

Flagged as orphans on the first pass, now deleted or staged-deleted in the working tree: `src/hooks/index.ts`,
`src/lib/post-detail.ts`, `src/lib/profile.ts`, `src/lib/search-engines.ts` (all `D`),
`src/app/(dating)/components/DatingNavbar.tsx`, `src/app/(dating)/components/DatingFooter.tsx`,
`src/app/overview/overview-client.tsx`, `src/components/marketing/products-client.tsx`,
`src/components/ruixen/footer-enterprise.tsx`, `src/components/ruixen/navbar-minimal.tsx`,
`src/components/landing/{campusloop-homepage-refresh,landing-courses-section,landing-feed-preview,landing-home-footer,landing-streak-section}.tsx`,
`src/components/navigation/desktop-sidebar.tsx`, and the whole `publish-21st/` directory.
`src/constants/landing.ts` and `src/constants/products.ts` were orphans on the first pass and now have importers
again (landing rewrite) — no longer candidates.

Note `src/lib/public-stats.ts` is a brand-new untracked file (another agent is mid-write); it reported zero importers
on the first pass only because its consumer had not been written yet. Not a candidate.

## 2. Duplicates

Importer counts are from the final run; "shells/*" and "landing/*" are in flux.

| Pair / group | Importers | Status / recommendation |
| --- | --- | --- |
| `src/app/(dating)/components/DatingNavbar.tsx` vs `src/components/dating/dating-navbar.tsx` (same for `DatingFooter`) | 0 vs 1 (`(dating)/dating/layout.tsx`) | **Resolved**: the `(dating)/components` copies were deleted by a sibling this week. |
| Footers: `components/landing/clean-footer.tsx`, `components/landing/landing-home-footer.tsx` (deleted), `components/ruixen/footer-enterprise.tsx` (deleted), footer markup inside `components/shells/marketing-shell.tsx` and `components/marketing/system.tsx` | clean-footer 1, marketing-shell 15, system.tsx (`MarketingFooter`) in use by marketing pages | Two live marketing footers remain: `shells/marketing-shell.tsx` (15 importers, in flux) and `marketing/system.tsx`. Keep the shell; fold `system.tsx`'s footer/nav tables into it after `shells-nav` merges. `landing/clean-footer.tsx` (1 importer: `landing-page.tsx`) is a third copy; in flux (landing-redesign). |
| App shells: `components/ui/app-shell.tsx` vs `components/shells/app-shell.tsx` vs `app/admin/_components/admin-shell.tsx` vs `components/marketplace/marketplace-shell-client.tsx` | ui/app-shell 1 (`marketplace-client.tsx`), shells/app-shell 4 (three route-group layouts + `ui/navigation.tsx`), admin shim 0, marketplace-shell-client 1 | `shells/app-shell.tsx` is the winner and is new/untracked (in flux). `ui/app-shell.tsx` has one importer left and should go once the marketplace layout adopts the shell. `admin/_components/admin-shell.tsx` is an unreferenced 84-byte shim (delete). `marketplace-shell-client.tsx` is a feature-specific wrapper, not a true duplicate. |
| Page headers: `ui/page-header.tsx` vs `primitives/section-header.tsx` vs `ui/section.tsx` vs feature headers (`academics/academic-header.tsx`, `articles/editorial-header.tsx`, `explore/explore-header.tsx`, `feed/feed-header.tsx`, `communities/community-header.tsx`, `colleges/college-hero-header.tsx`) | page-header 1 (`ui/app-shell.tsx` only), section-header 0, ui/section 0 (via shim only), academic 1, editorial 0, explore 1, feed 1, community 2, college-hero 2 | `ui/page-header.tsx` is effectively dead (its only importer is itself a one-importer file). `primitives/section-header.tsx` + `ui/section.tsx` are unreferenced (in flux). The feature headers are each used by exactly their own feature and are not interchangeable; keep them, but `articles/editorial-header.tsx` is now a true orphan (1a). |
| `ui/skeleton.tsx` vs `ui/skeleton-card.tsx` | 46 vs 18 | Not duplicates: `skeleton.tsx` is the atom, `skeleton-card.tsx` composes it. Keep both. `events/event-card-skeleton.tsx` and `academics/academic-card-skeleton.tsx` (1) and `dating/dating-card-skeleton.tsx` (2) are feature variants; only the events one is dead. |
| `ui/pull-to-refresh.tsx` vs `ui/app-pull-to-refresh.tsx` | 1 (imported by app-pull-to-refresh) vs 2 (`(app)/layout.tsx`, `(dating)/dating/layout.tsx`) | Layered, not duplicate: `app-pull-to-refresh` wraps `pull-to-refresh`. Keep both or inline the inner one; no deletion. |
| `ui/searchable-combobox.tsx` vs `ui/searchable-select.tsx` | 4 vs 2 | Genuine duplicate (same purpose). Recommend keeping `searchable-combobox.tsx` (more importers) and migrating `profile/edit/edit-profile-client.tsx` and `onboarding/onboarding-form.tsx`. In flux (ui/). |
| `ui/empty-state.tsx` vs `primitives/empty-state.tsx` vs `academics/academic-empty-state.tsx` vs `confessions/confession-empty-state.tsx` | 2 (one is the shim) vs 0 vs 1 vs 1 | Primitives shim is dead; `ui/empty-state.tsx` is the new base (untracked). The two feature empty-states each have one importer. In flux. |
| `ui/page-toolbar.tsx` vs `primitives/page-toolbar.tsx` | 1 (the shim) vs 0 | Both unreferenced by product code. In flux. |
| `ui/pagination.tsx` vs `courses/catalog/pagination.tsx` | 7 vs 2 | Different APIs (page-number vs cursor). Keep both; could be merged later, not dead. |
| `feed/feed-card.tsx` vs `ui/feed-card.tsx` | 0 vs 9 | Shim vs real; delete the shim (1a). |
| Navigation: `ui/navigation.tsx` (5) vs `components/navigation/*` (`mobile-drawer` 1, `drawer-panel` 2, `contextual-living-nav` 6) vs `shells/app-sidebar.tsx`/`app-top-bar.tsx`/`app-bottom-nav.tsx` (1 each, via `shells/app-shell.tsx`) | – | `ui/navigation.tsx` is a 500+ line legacy nav still used by the chat/events/post layouts and `[username]/page.tsx`, and it now imports `shells/app-shell.tsx`. Expected to collapse once `shells-nav` finishes. In flux; do not touch. |
| Dating settings: `src/app/(app)/(main)/settings/settings-client.tsx` vs `src/app/(dating)/dating/settings/settings-client.tsx` | – | Different features (account vs matching). `(dating)/dating/settings/page.tsx` is a 5-line redirect to `/matching/settings`, so check whether the dating `settings-client.tsx` is still imported by `matching/settings/page.tsx`; it was not flagged as an orphan, so it is. |

## 3. Unused dependencies

Grep of every `from "<pkg>"`, `import("<pkg>")`, `require("<pkg>")`, CSS `@import`/`@plugin`/`@source` across
`src`, `scripts`, `tests`, `sanity`, `drizzle` and root configs, plus `package.json` scripts.

### `dependencies` with zero import sites

| Package | Verdict |
| --- | --- |
| `cmdk` | **Unused.** No `ui/command.tsx`, nothing imports it. Safe to remove. |
| `next-themes` | **Unused.** No `ThemeProvider` import anywhere; `ui/theme-toggle.tsx` does not use it. Safe to remove. |
| `react-day-picker` | **Unused.** No calendar component imports it. Safe to remove. |
| `@types/canvas-confetti`, `@types/prismjs`, `@types/turndown` | Used implicitly by TypeScript, but belong in `devDependencies`, not `dependencies`. Move. |

### `dependencies` that are used, but only by orphan or near-orphan code

| Package | Only import site | Note |
| --- | --- | --- |
| `radix-ui` | `src/components/ui/accordion.tsx` | That file is a transitive orphan (only `ruixen/accordion-indexed.tsx` imports it). Removable together with those two files — **in flux** (ui/). |
| `vaul` | `src/components/ui/sheet.tsx` | `sheet.tsx` is untracked and has zero importers today. **in flux**. |
| `sanity` | `sanity.cli.ts` only | The Sanity Studio config lives in `sanity/`; `@sanity/client` (2 sites) and `groq` (1 site) are used by `src/lib/sanity/*` and `src/app/api/atlas/route.ts`. `sanity` itself is a 6.x studio dependency pulled only for the CLI. Keep unless the studio is dropped. |
| `peerjs` | `src/lib/calls/call-engine.ts` | Used. |
| `hls.js` | `reddit/reddit-video.tsx`, `hooks/use-hls-video.ts` | Used. |
| `prismjs` | `common/code-block.tsx` | Used. |
| `turndown` | `articles/novel-markdown-editor.tsx` | Used. |
| `qrcode` | 3 sites | Used. |
| `recharts` | `admin/_components/activity-chart.tsx`, `articles/smart-blocks/data-blocks.tsx` | Used. |
| `canvas-confetti` | 5 sites (direct) | Used; `ui/confetti.tsx` wrapper is the dead part. |
| `@animateicons/react` | 3 sites | Used. |
| `@tiptap/*` (4) | editor + post composer | Used. |
| `tw-animate-css` | `src/app/globals.css` `@import` | Used (CSS counted). |

### `devDependencies`

All zero-import-site hits are tooling and are **not** unused: `@biomejs/biome` (`check`/`format` scripts),
`typescript` (`typecheck`), `@tailwindcss/postcss` (string in `postcss.config.mjs`), `@types/node`/`@types/react`/
`@types/react-dom`/`@types/qrcode` (ambient types), `eslint`/`wrangler` (scripts).
One oddity: `@rolldown/binding-linux-x64-gnu` is a platform-specific native binding pinned directly in
`devDependencies`. Nothing in the repo references rolldown; it is presumably a workaround for a transitive
`vitest`/`vite` optional dependency on a specific CI host. Worth a comment in `package.json` or removal if
`bun install` works without it.

## 4. Broken internal links

Checked 1,229 literal internal links (`href="/…"`, `href={"/…"}`, `href: "/…"`, `router.push/replace("/…")`,
`redirect()`/`permanentRedirect()`, `revalidatePath()`, `fetch("/api/…")`, `useSWR("/api/…")`, and the `routes: […]` /
`path: "…"` arrays in `src/lib/guide/entries/*.ts`) against 212 `page.tsx` + 258 `route.ts` files, the special
files (`sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image`), `public/**`, `src/middleware.ts` string
sources, and `next.config.ts` `redirects()`/`rewrites()`. Dynamic segments were normalised (`/post/[id]` matches
`/post/123`, catch-alls match any depth), and static routes were given precedence over `/[username]`.

**Result: 0 broken literal links on the current tree.**

Two notes for the coordinator:

- On the first pass (before `src/app/(app)/(main)/colleges/page.tsx` was (re)added by a sibling this week), 30+ links to
  `/colleges` across `constants/navigation.ts`, `shells/marketing-shell.tsx`, `marketing/system.tsx`, `not-found.tsx`,
  `sitemap/sitemap-client.tsx`, guide entries, etc. had no page and would have fallen through to `/[username]` with
  `username = "colleges"`. That page now exists; keep it.
- `src/lib/guide/entries/start-and-social.ts:339,341` contain the literal placeholders `/[username]` and
  `/[username]/friends` as `path:` values. They resolve (to the dynamic route itself) but render as literal brackets if
  shown to users. Not broken, just worth eyeballing.
- `/app`, `/app/*`, `/discover`, `/search`, `/u/:username`, `/c/:id`, `/overview` and `/academics/*` legacy paths are
  all covered by `next.config.ts` redirects or `src/middleware.ts`.
- The `tests/*.test.ts` files (`content-security`, `institution-domains`, `integrity`, `mcp-auth`, `merchant-auth`)
  are not matched by `vitest.config.ts` (`include: ["src/**/*.test.ts"]`), and three of them import `bun:test`, so
  `bun run test` never runs them. Not a link issue, but they are effectively dead tests. Surfacing here because the
  backend-audit agent may want them.

## 5. Unreachable routes (no inbound literal or template link; not for deletion)

| Route | File | What it is |
| --- | --- | --- |
| `/admin/moderation` | `src/app/admin/moderation/page.tsx` | 5-line `redirect("/admin/review")`. Nothing links to it; keep only if old bookmarks matter. |
| `/matching/filters` | `src/app/(dating)/matching/filters/page.tsx` | 5-line `redirect("/matching/settings")`. Unlinked. |
| `/dating`, `/dating/discover`, `/dating/filters`, `/dating/likes`, `/dating/matches`, `/dating/requests`, `/dating/settings` | `src/app/(dating)/dating/**/page.tsx` | All 5-line redirects to `/matching/*`. `/dating` itself is linked from nav; `/dating/discover`, `/dating/filters`, `/dating/requests` are not linked from anywhere. These could become `next.config.ts` redirects (one entry: `/dating/:path*` → `/matching/:path*`) and the 7 page files deleted. |
| `/hub/new` | `src/app/(app)/(main)/hub/new/page.tsx` | Not linked. `gaming/new`, `housing/new`, `rideshare/new` import its `hub-create-client.tsx` directly, so only the `page.tsx` is unreachable, not the client. |
| `/a/[slug]` | `src/app/a/[slug]/page.tsx` | Short-link redirect to `/articles/[slug]`; generated externally (share URLs), so expected to have no inbound link. Keep. |
| `/e/[id]` | `src/app/e/[id]/page.tsx` | Short link that re-renders the event page; its own JSON-LD uses `https://campusloop.space/e/…`. Keep. |
| `/profile/[username]` | `src/app/(app)/(main)/profile/[username]/page.tsx` | Redirect to `/@username`. Legacy; keep or move to `next.config.ts`. |
| `/events/category/[category]` | `…/events/category/[category]/page.tsx` | Only self-referenced in its own canonical URL. Either add links from the events index or treat as SEO-only. |
| `/post/[id]/comment/[commentId]` | `…/post/[id]/comment/[commentId]/page.tsx` | Linked only via `https://campusloop.space/post/…/comment/…` absolute URLs in `comment-item.tsx`; reachable in practice. |
| `/demo`, `/discover`, `/invalid-email`, `/admin-login`, `/overview`, `/docs` | various | Flagged on the first pass, now resolved: `/overview` is a middleware 308 to `/pitch`, `/discover` a redirect, the others are linked from `robots.ts`, layouts or `marketing/system.tsx`. |

The `src/app/sitemaps/static.xml/route.ts` list and `src/constants/navigation.ts` were both included in the link
corpus, so nothing in a sitemap or nav config appears above.

## 6. Stale docs and artifacts

| Path | Size / date | Referenced by | Verdict |
| --- | --- | --- | --- |
| `TODO.md` | 3 KB, 2026-09-28 | nothing | Stale; nothing links to it. Archive to `docs/archive/` or delete. |
| `OVERVIEW.md` | 49 KB, 2026-08-22 | nothing | Oldest root doc; superseded by `README.md`/`docs/ARCHITECTURE.md`. Archive. |
| `GEMINI.md` | 1 KB, 2026-10-29 | nothing (it references `graphify-out/`) | Agent-tool pointer, same content as `.claude/CLAUDE.md`. Keep if Gemini CLI is used; otherwise delete. |
| `ADDCOURSES.md` | 28 KB, 2026-10-22 | only itself; the `add-courses` skill is the live copy | Duplicate of a skill; archive. |
| `AUDIT.md` | 13 KB, 2026-09-08 | `FIX_PLAN.md` only | Superseded by `FIX_PLAN.md` + `docs/fix/*`. Archive. |
| `FIX_PLAN.md` | 28 KB, 2026-10-09 | `docs/fix/BASELINE.md` | Phases 0–2 already executed (BASELINE.md records Phase 0; many items in it reference files now deleted, e.g. `publish-21st/`, `DatingFooter.tsx`). Keep until the fix series closes, then move to `docs/archive/`. |
| `PRODUCT.md`, `AGENTS.md`, `README.md` | – | referenced by skills/agents | Live; keep. |
| `docs/archive/*` (10 files, 104 KB) | moved this week (staged renames) | `FIX_PLAN.md`, `docs/DESIGN_SYSTEM.md` | Already archived by a sibling. Fine. |
| `src/app/ff35ddf54af340798feb9034fcd9d317.txt/route.ts` + `public/ff35ddf54af340798feb9034fcd9d317.txt` | 29 B, 2026-07-22 | `scripts/submit-indexnow.ts`, (deleted) `src/lib/search-engines.ts` | IndexNow key verification. **Keep.** Note the route and the public file are both present; one would do, but the route is what guarantees the key is served under OpenNext. |
| `graphify-out/` | created during this audit by another agent | `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `.agents/rules/graphify.md` | Live knowledge graph; `CLAUDE.md` says a full rewrite per build is expected. Not stale. |
| `.agents/` (688 tracked files, 29 MB), `.claude/` (479 tracked) | – | `skills-lock.json`, `README.md`, `FIX_PLAN.md` | Skills vendored into the repo twice (`.agents/skills/*` and `.claude/skills/*` share many files, e.g. `ui-ux-pro-max`, `impeccable`, `graphify`). Large but intentional; the duplication is the only waste. |
| `.codex/`, `.cursor/`, `.gemini/`, `.opencode/` | 1 tracked file each (4 KB) | `.vscode/settings.json`, `.opencode/plugins/graphify.js` | Tiny agent-config stubs. Harmless; delete only if those tools are not used. |
| `tsconfig.tsbuildinfo` | 1.1 MB, untracked | `tsconfig.json` writes to `/tmp/tsconfig.tsbuildinfo` now | Stale build artefact at repo root, ignored by `.gitignore` (`*.tsbuildinfo`). Safe to delete locally. |
| `marketing/` (4 md files) | – | `README.md`, `docs/ARCHITECTURE.md`, `src/app/not-found.tsx` (string only) | Referenced; keep. |
| `plugins/` (149 tracked, 1.5 MB) | – | only its own READMEs and `.claude/plugins/*` | Claude Code plugin sources vendored in; duplicated under `.claude/plugins/`. Candidate to drop one copy. |
| `sanity/` + `sanity.cli.ts` | 84 KB | `package.json` (`sanity` dep), `src/app/api/atlas/route.ts` | Live. |
| `tests/` | 5 files | not in `vitest.config.ts` include | See section 4: never executed by `bun run test`. |

## Safest deletions (ordered)

1. `src/components/reels/reels-feed-client.tsx` (52 KB, orphan since the reels route-group got its own client)
2. `src/app/(app)/(post)/post/[id]/post-comments.tsx` (24 KB)
3. `src/components/auth/auth-form-card.tsx` + `auth-visual-panel.tsx` (17 KB, replaced by hexclave auth)
4. `src/components/confessions/confession-composer-modal.tsx` (13 KB)
5. `src/components/ruixen/{accordion-indexed,feature-highlights,structured-hero-section}.tsx` + `ui/accordion.tsx` + the `radix-ui` dependency (grid-frame-hero/split-feature-showcase too, once landing-redesign merges)
6. `src/components/animate-ui/**` (icon.tsx + slot.tsx) + `src/hooks/use-is-in-view.tsx`
7. `src/components/preview/dream-campuses-modal.tsx`, `events/event-card-skeleton.tsx`, `communities/campus-hub-strip.tsx`, `discover/featured-campus-card.tsx`, `streaks/streak-banner.tsx`, `comments/comment-thread-connector.tsx`
8. `src/components/feed/feed-card.tsx` and `src/components/reddit/index.ts` (re-export shims nobody imports)
9. `src/hooks/use-mobile.ts`, `src/hooks/use-post-actions.ts`, `src/lib/ai/tools.ts`
10. `package.json`: remove `cmdk`, `next-themes`, `react-day-picker`; move the three `@types/*` to devDependencies
11. `src/app/(app)/(main)/profile/edit-profile-dialog.tsx`, `src/app/admin/_components/stat-card.tsx`
12. Root docs: `TODO.md`, `OVERVIEW.md`, `AUDIT.md`, `ADDCOURSES.md` → `docs/archive/`; `tsconfig.tsbuildinfo` (local artefact)

Everything under `src/components/ui`, `src/components/primitives`, `src/components/shells`, `src/components/navigation`,
`src/components/landing`, `src/app/admin/_components` and the marketing pages is excluded from this list until the
sibling rewrites merge; re-run the orphan script then.
