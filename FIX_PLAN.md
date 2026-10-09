# CampusLoop — Fix Everything + Design System v3

A phased brief for Claude Code, written from the October 2026 audit of campusloop.space and the `sh20raj/campusloop` repo (commit `31b89e9`).

> Note: `main` has since moved to `b817bbdc` (merged redesign PR #8). Phase 0 baseline numbers in `docs/fix/BASELINE.md` are measured against that commit.

---

## How to use this (for Shaswat — Claude Code can skip this box)

1. Fill in the **Decisions** block below (defaults are pre-filled; change anything you disagree with).
2. Save this file as `FIX_PLAN.md` in the repo root.
3. Run **one phase per Claude Code session**, so each phase gets a fresh context:
   > Read FIX_PLAN.md and AGENTS.md. Execute Phase N only. Stop when its "Done when" list passes, then summarise what you changed and what I must do manually.
4. Review and merge each phase's branch before starting the next.

---

## Decisions (fill in before running)

| Key | Value (default shown) |
| --- | --- |
| `FOUNDER_NAME` | Shaswat Raj |
| `LEGAL_ENTITY` | `CampusLoop (not yet incorporated)` — replace with the real Pvt Ltd name and CIN once registered |
| `GRIEVANCE_OFFICER` | Shaswat Raj, grievance@campusloop.space |
| `AGE_POLICY` | **A** = 18+ for Campus Match, Secret Crush, and DMs with non-mutual-follows; under-18 accounts can browse, post and comment, with analytics off. **B** = whole platform 18+ only. |
| `SEED_POLICY` | **A** = keep seeded content, but relabel every seed persona as "CampusLoop Example" with institution "CampusLoop Team", and hide seeded content from logged-out visitors, sitemaps and all metrics. **B** = unpublish all `seed_202609_%` content (script written, never auto-run). |
| `OVERVIEW_PAGE` | Remove links to `/overview` and 308-redirect it to `/pitch` |
| `ANALYTICS` | Keep Google Analytics 4, loaded only after consent, page views only, never for under-18 or viewer accounts |
| `REDDIT_IMPORT` | Disabled by default behind an env flag |
| `BRAND_DIRECTION` | Bright, clean, minimal, friendly, trustworthy (spec in Phase 5) |

Confirmed by the founder on 2026-10-09: **use the defaults as written** (AGE_POLICY A, SEED_POLICY A).

---

## Your role and ground rules (Claude Code)

You are working in the CampusLoop repo: Next.js 16 App Router, Tailwind CSS v4 (`@theme inline` in `src/app/globals.css`), shadcn `base-nova` on Base UI, Drizzle + Neon Postgres, Hexclave auth, Cloudflare Workers via OpenNext, Bun.

- Follow `AGENTS.md`, **except** where this brief overrides it: its §10 (social links) and §13–14 (design rules) are replaced by this plan.
- Work on a branch per phase: `fix/p1-claims`, `fix/p2-privacy`, `fix/p3-data`, `fix/p4-seo`, `ds/p5-foundations`, `ds/p6-shells`, `ds/p7-landing`.
- One commit per numbered task, conventional messages (`fix(trust): …`, `feat(ds): …`).
- After every phase run and fix until clean: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`. From Phase 5 onward also `bun run check:design`.
- **Never** run: `deploy`, `upload`, `db:push`, `db:migrate` against production, any `db:seed*`, `db:rollback-500`, or `db:backfill-anon`. Generate Drizzle migrations with `db:generate` only; write data fixes as scripts under `scripts/fix/` and list them for the founder to run.
- Never delete user data. Never edit `.env*` secrets. Never invent statistics, testimonials or traction numbers anywhere in copy.
- If a task depends on something not in the Decisions block, choose the more privacy-protective option, note it in `docs/fix/FIX_REPORT.md`, and continue.
- Keep `page.tsx` / `layout.tsx` as server components when they export metadata (AGENTS.md §2).

---

## Phase 0 — Baseline (no product changes)

1. Create `docs/fix/BASELINE.md` recording: typecheck/lint/test/build status, and these counts across `src/**/*.tsx` (re-measure; audit values in brackets):
   - hex colours `#[0-9a-fA-F]{6}` [405, 91 distinct]
   - arbitrary colour classes `-[#…]` [289]
   - raw Tailwind palette classes (`bg|text|border-(zinc|slate|gray|neutral|stone|rose|pink|violet|indigo|emerald|amber|orange|sky|blue|purple|red|green|yellow)-NNN`) [~3,981]
   - `rounded-[Npx]` [~26] and inline `style={{` [67]
   - number of layouts, navbars, headers, footers, sidebars (list file paths)
2. List every place a public marketing number appears: `grep -rnE "45,000|45K|8,400|1,350|43\.3M|43 million" src`.
3. List every `campusloop.space/app` string: `grep -rn "campusloop.space/app" src`.

**Done when:** `docs/fix/BASELINE.md` exists and is committed.

---

## Phase 1 — Honest claims and broken links

1. **Fabricated numbers.** Remove "45,000+ / 45K+ notes", "8,400+ students", and "1,350+ active hubs" wording from `src/app/page.tsx` metadata, `src/constants/landing.ts`, `src/components/landing/*`, footer, help, about, auth panels, pitch, overview, academics/confessions/communities pages, and `src/constants/products.ts`.
   - Add `src/lib/public-stats.ts` → `getPublicStats()` (server-only, cached ~1h) returning counts of: verified non-seeded students, non-seeded academic resources, colleges with ≥1 verified non-seeded member, colleges in the directory.
   - Show a live number only when it passes a threshold (`students ≥ 1000`, `resources ≥ 1000`, `active colleges ≥ 25`); otherwise use wording without numbers. "1,350+" may remain only as "colleges in our directory".
2. **Testimonials.** Remove the "Verified" student reviews (`voxel-student-reviews.tsx`, `auth-split-layout.tsx` quote, `publish-21st/voxel-testimonial-deck.tsx` usage). Their names come from seed personas. Replace with a short, true founder note ("Built at BIT Mesra by `FOUNDER_NAME`").
3. **Anonymity copy.** Everywhere it appears (`voxel-faq.tsx`, `/privacy`, `/terms`, `/help`, `/pitch`, `/overview`, `src/lib/docs-features.ts`, Peerlist-style copy in constants), replace claims of "even admins cannot trace", "hardware security modules", "zero-knowledge", and "ephemeral pseudonym" with this accurate statement:
   > Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a serious safety report, and every such access is logged.
4. **Trackers.** Remove "0 Ad Trackers", "no tracking cookies" and "no corporate ad trackers". Say instead: "We use Google Analytics for anonymous page statistics, only after you agree. We never sell your data or run ads based on your activity."
5. **Compliance badges.** Replace "DPDP Act 2023 Certified Compliance" / "Statutory" badges with "Built to follow India's DPDP Act, 2023". No certification claims.
6. **Faculty and access consistency.** Remove "verified professor notes" and "Zero-login direct PDF downloads" unless the code truly allows logged-out downloads (check the academics item route and say exactly what it does). Make "Who can join" in `/terms` match the homepage (students; say clearly whether faculty and alumni can post).
7. **Identity and contacts.** On `/about`, `/contact`, `/privacy`, `/terms`: name `FOUNDER_NAME` as founder; name the Grievance Officer as `GRIEVANCE_OFFICER`; replace "CampusLoop Inc., Registered in India" with `LEGAL_ENTITY`.
8. **Pitch page (`src/app/pitch/pitch-client.tsx`).** Delete the interactive valuation slider. Change "We're closing our Seed round" to "We're raising our first round". Replace the traction block with `getPublicStats()` numbers (or a "Live at BIT Mesra" statement if below threshold). Remove claims about features that are not live.
9. **`/overview`.** Apply `OVERVIEW_PAGE`: remove the "Read the full brief" links and add a 308 redirect `/overview → /pitch`.
10. **Social links.** X → `https://x.com/mycampusloop`; LinkedIn → `https://www.linkedin.com/company/mycampusloop/` (drop `?viewAsMember=true`). Centralise them in one constant (`src/constants/social.ts`) used by every footer, the pitch page, JSON-LD `sameAs`, and update `AGENTS.md` §10.
11. **Small copy fixes.** Double space in the hero ("campus  secretly"). Unify community category names into one constant so the list and filters match ("Music & Arts" vs "Cultural & Arts").

**Done when:** `grep -rnE "45,000|45K|8,400|viewAsMember|x.com/company|hardware security|Certified Compliance|0 Ad Trackers|cannot trace" src AGENTS.md` returns nothing, and all checks pass.

---

## Phase 2 — Privacy, safety and age gating

1. **Date of birth and age.** Make DOB required in onboarding (`src/app/(app)/onboarding/*`) with a clear "why we ask" line. Add a server helper `getAgeStatus(profile)` → `adult | minor | unknown`. Users with `unknown` DOB are prompted the next time they open a gated feature.
2. **Age gates (per `AGE_POLICY`).** Enforce on the server, not just the UI:
   - All `src/app/api/dating/*` routes (profiles, swipe, matches, crush) and the Secret Crush button/modal require `adult`.
   - Starting a DM or call with someone who is not a mutual follow requires `adult` (policy A) or applies to everyone (policy B).
   - Minors and viewer/aspirant ("Campus Preview") accounts are excluded from dating decks, crush search, people discovery, birthdays and "recommended users".
   - Show a friendly explainer screen instead of the feature when blocked.
3. **Sign-up consent.** In `src/components/auth/auth-form-card.tsx` add a required checkbox: "I'm a current student, I accept the Terms and Privacy Policy" (both linked), plus an age confirmation line. Store `consented_at` and `policy_version` on the profile (Drizzle migration). Rename the field hint from "roll number" to "college email" and keep the domain picker.
4. **Anonymous authorship.**
   - Add an `authorship_tag` column to posts and comments = `HMAC(ANON_PEPPER, "author:" + profileId + ":" + rowId)`. Use it for every "is this mine?" check (pin, edit, delete) so those routes no longer decrypt identities.
   - Route every remaining unseal through one server-only module `src/lib/anon-vault.ts` with `resolveAnonAuthorForSystem(rowId, purpose)` (notifications, points) that never returns the id to the client and writes an `anon_access_log` row (purpose, actor = "system", time). Add `adminUnmask(rowId, reason)` that requires admin role plus a written reason and also logs. Replace direct `openSealedIdentity` calls in `src/app/api/posts/**`.
   - New anonymous content gets a per-thread handle: `deriveAnonHandle(profileId, threadId)`, so a person's handle is consistent inside one thread but different across threads. Existing rows keep their handles.
   - Update tests in `src/lib/anonymity.test.ts` and add tests for the new module.
5. **Analytics (`src/components/analytics/google-analytics.tsx`, `src/lib/analytics/ga4.ts`).**
   - Move the hardcoded `G-3546ZQ6HB1` to `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
   - Load gtag only after the user accepts a small consent banner (Accept / Decline; choice in `localStorage` wrapped in try/catch, and on the profile when logged in).
   - Never load for minors or viewer accounts.
   - Stop sending `institution_name`, `institution_id`, `branch`, `semester` and `anonymity_mode` user properties. Page views and coarse events only.
6. **Public profiles.** For logged-out visitors, `/@username` shows only display name, college and a "Join to see more" card (no bio, year, program, followers or external links). Add `robots: noindex` to all profile pages. Return a real 404 for unknown usernames (see `AUDIT.md` §2.4). Stop generating usernames from the email local part; when an existing handle matches a roll-number pattern (for example `btech\d+_\d+`), show the owner a one-time "choose a new username" nudge (do not auto-rename).
7. **Birthdays.** Change `is_dob_private` default to `true` (migration). Write `scripts/fix/make-dob-private.ts` to set it to true for existing users (do not run). `/api/birthdays` returns month and day only, campus scope only, never the year.
8. **Privacy policy (`src/app/privacy/page.tsx`).** Rewrite the processors section to list every service that receives personal data — confirm by grepping outbound calls: Neon, Cloudflare, Hexclave, Google Analytics, Upstash Redis, Qdrant, Sanity, Giphy, Reddit (if enabled), and any others found. Add: retention periods, how to delete, age policy, parental-consent position, the honest anonymity statement, grievance officer name. Bump the "Updated" date.
9. **Secrets hygiene.** In `AUDIT.md` replace the quoted Giphy key with `[redacted — rotated]`. Check whether `src/lib/demo-credentials.ts` is imported into any client bundle; if so, move it server-side. List in the report: rotate the Giphy key and the demo account password.

**Done when:** dating/crush/DM APIs return 403 for minors in tests; no client code imports the anon vault; GA does not load before consent (test); profile pages render `noindex`; all checks pass.

---

## Phase 3 — Seeded content, Reddit import and data hygiene

1. **Mark seeds properly.** The seeding README publishes posts with `is_seeded = false` so they look organic — fix that:
   - Ensure an `is_seeded` boolean exists on users/profiles, posts, comments, communities, events, stories and academic resources (migration where missing).
   - Write `scripts/fix/mark-seeded-content.ts`: set `is_seeded = true` for every row whose id starts with `seed_202609_`, and for seed persona profiles. Do not run it.
   - Change `scripts/campusloop-seeding/*` so future runs insert `is_seeded = true`.
2. **Apply `SEED_POLICY`.**
   - Policy A: seed personas display "CampusLoop Example" badge and institution "CampusLoop Team"; seeded rows are excluded from logged-out views, sitemaps, explore/trending, college member counts, LP leaderboards and `getPublicStats()`.
   - Policy B: additionally write `scripts/fix/unpublish-seeds.ts` (sets status to hidden, never deletes). Do not run it.
3. **Metrics.** Admin analytics (`src/app/admin/_lib/queries.ts`, `/admin/analytics`) exclude seeded and imported content by default, with a toggle to include it.
4. **Reddit importer (`src/lib/reddit/*`, `/api/admin/reddit/ingest`).** Gate behind `REDDIT_INGEST_ENABLED` (default false). Imported posts show "From r/<subreddit>" with a link to the original permalink, are `noindex`, excluded from sitemaps, and never counted as verified-student content. Update `docs/REDDIT_INGESTION.md` with a note to check Reddit's developer terms before enabling.
5. **Junk data.** Write `scripts/fix/cleanup.sql` that hides the public "Test (Nope)" community and any other obvious test rows you find (list them). Do not run it.

**Done when:** a logged-out request to the feed, explore, a college hub and every sitemap contains no seeded or Reddit-imported rows (tests with fixture data); all checks pass.

---

## Phase 4 — SEO and indexing

Context: `src/middleware.ts` 308-redirects legacy `/app/*` URLs to clean routes and `robots.txt` disallows `/app/`, yet the sitemaps and some canonicals still emit `/app/...`, so crawlers are pointed at blocked URLs.

1. **Clean URLs everywhere.** Fix `src/app/sitemaps/colleges.xml/route.ts` (`/app/college/…` → `/college/…`), `academics.xml` (`/app/academics…` → `/academics…`), the academics canonical in `src/app/(app)/(academics)/academics/page.tsx`, and every other `campusloop.space/app` string from Phase 0. Add a test asserting no sitemap contains `/app/`.
2. **Sitemap index.** Remove `profiles.xml` and `comments.xml`. In `posts.xml` include only public, non-anonymous, non-seeded, non-imported posts. Add `<lastmod>` from `updatedAt` in every sitemap.
3. **Anonymous content is never indexed.** Confession and anonymous post pages get `noindex`; they are excluded from sitemaps.
4. **robots.txt.** Remove redundant `Allow` lines for private or noindex routes (`/feeds`, profiles), keep `Disallow` for private routes, keep the sitemap line. Make robots, sitemaps and meta robots agree for every route; document the matrix in `docs/fix/SEO_MATRIX.md`.
5. **Server-render what should rank.** `/colleges` must ship college names and links in the initial HTML (first 50 plus paginated `?page=` links; state filters as crawlable links). College hub, academics item and article pages server-render their main content.
6. **Structured data.** `Organization` JSON-LD on the homepage (name, logo, founder `FOUNDER_NAME`, `sameAs` from `src/constants/social.ts`); `FAQPage` on `/help` and the homepage FAQ with answers present in the DOM (use `<details>`); `BreadcrumbList` on college hubs and academic items.
7. **Metadata hygiene.** One `theme-color` per scheme (from Phase 5 tokens); titles as `{Page} · CampusLoop`; rewrite meta descriptions to honest copy (no "zero boomers", no fabricated numbers); OG images exist for every route that declares one.

**Done when:** sitemap tests pass, `grep -rn "campusloop.space/app" src` is empty, `/colleges` HTML contains college links without JS, and all checks pass. List "resubmit sitemap in Google Search Console" in the report.

---

## Phase 5 — Design System v3: foundations

Goal: replace the Neo-Pastel system and every competing spec with **one centralised design system**: bright, clean, minimal, friendly and trustworthy. No mesh gradients, gradient text, glassmorphism or neon; one accent per screen; generous white space.

### 5.1 One source of truth

Create `src/styles/tokens.css` (imported first by `src/app/globals.css`) with three layers: **primitives → semantic tokens → component tokens**, mapped to Tailwind utilities via `@theme inline`. Delete the duplicate `--font-sans` / `--font-display` definitions and all `.cl-*` one-off classes once migrated.

**Primitives**

```css
/* Warm neutrals */
--n-0:#FFFFFF; --n-25:#FCFBF8; --n-50:#F7F6F2; --n-100:#EFEDE7; --n-200:#E2DFD7;
--n-300:#CBC7BD; --n-400:#A29E94; --n-500:#6E6A61; --n-600:#5C5850; --n-700:#45423C;
--n-800:#2D2B27; --n-900:#1C1B18; --n-950:#12110F;
/* Loop Blue (brand, trust) */
--b-50:#EEF2FF; --b-100:#DDE4FF; --b-200:#BCC9FF; --b-300:#8FA4FF; --b-400:#6680FF;
--b-500:#3B5BFD; --b-600:#2A45E0; --b-700:#2236B3; --b-800:#1E2F8C; --b-900:#1C2A6B;
/* Sunny (warmth, rewards, Loop Points) */
--y-100:#FFF4D6; --y-300:#FFDE85; --y-500:#FFC83D; --y-700:#B7830A;
/* Crush (Campus Match only) */
--p-100:#FFE3EC; --p-500:#FF5C8A; --p-600:#D6336C; --p-700:#C2255C;
/* Status */
--g-600:#15803D; --g-100:#DCFCE7; --r-600:#DC2626; --r-100:#FEE2E2; --o-700:#B45309; --o-100:#FEF3C7;
```

**Semantic tokens** (light → dark)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | n-25 | n-950 | page canvas |
| `--surface` | n-0 | n-900 | cards, sheets |
| `--surface-muted` | n-50 | n-800 | inputs, inactive tabs |
| `--fg` | n-900 | n-50 | primary text |
| `--fg-muted` | n-600 | n-400 | secondary text |
| `--fg-subtle` | n-500 | n-400 | timestamps, placeholders |
| `--border` | n-200 | n-800 | hairlines |
| `--brand` | b-500 | b-500 | primary buttons, links on dark |
| `--brand-fg` | white | white | text on brand |
| `--brand-text` | b-600 | b-400 | links, active nav |
| `--brand-subtle` | b-50 | b-900 | selected states, chips |
| `--accent` | y-500 | y-500 | rewards, streaks (dark text on it) |
| `--crush` | p-600 | p-500 | Campus Match only |
| `--success` / `--danger` / `--warning` | g-600 / r-600 / o-700 | lighter equivalents | status |
| `--ring` | b-500 | b-400 | focus-visible ring |

Every text/background pair must reach WCAG AA (4.5:1 body, 3:1 large text and UI). Write `src/styles/contrast.test.ts` that computes contrast for every pair above in both themes and fails under the threshold; adjust shades if any fail.

**Typography.** One family: **Plus Jakarta Sans** via `next/font/google` (400/500/600/700) with **Noto Sans Devanagari** as fallback for Hindi; **JetBrains Mono** only for code. Remove DM Sans, DM Mono and Space Grotesk. Scale (size/line-height px): xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32, 3xl 30/36, 4xl 36/44, 5xl 48/56 (marketing only). Headings 600–700 with −0.01em tracking from 2xl up. Inputs ≥16px on mobile. Tabular numbers for counts.

**Shape and depth.** Radius tokens only: `sm` 8px (inputs, chips), `md` 12px (buttons), `lg` 16px (cards), `xl` 24px (sheets, marketing hero cards), `full` (avatars, pills). Three shadows: `xs` (hover), `sm` (cards), `lg` (popovers, dialogs). Each surface uses a border **or** a shadow, never both.

**Spacing and layout.** 4px base (Tailwind default scale). Gutters 16 / 24 / 32px (mobile / tablet / desktop). Content widths: feed 640px, reading 720px, app 1200px. Touch targets ≥44px. Mobile bottom nav 64px + safe-area inset.

**Motion.** 120 / 180 / 280ms, `cubic-bezier(0.2,0.8,0.2,1)`; press feedback `active:scale-[0.98]`; everything disabled under `prefers-reduced-motion`.

**Icons.** `lucide-react` only, 20px default, 1.75 stroke, no emoji in UI (AGENTS.md rule kept).

**Themes.** Light is the default (bright); dark supported through `next-themes`; `theme-color` light `#FCFBF8`, dark `#12110F`.

### 5.2 One component library

`src/components/ui/` becomes the **only** primitive layer, rebuilt on the tokens (Base UI / shadcn where they already exist):

Button (primary, secondary, ghost, danger, crush; sm/md/lg; loading; icon-only), Input, Textarea, Select, Combobox, Checkbox, Switch, RadioGroup, Label, FormField (label + hint + error), Badge (neutral, brand, success, warning, danger, verified, anonymous, example), Avatar (with verified ring and anonymous variant), Card (+ header/body/footer), Tabs, SegmentedControl, Dialog, Sheet (mobile), DropdownMenu, Popover, Tooltip, Toast, Banner (info, preview-mode, warning), EmptyState, Skeleton, Spinner, PageHeader, Section, Stat, ListItem, Pagination, Divider, Chip/Tag.

Feature components (PostCard, CollegeCard, NoteCard, CommunityCard, EventCard, ProfileCard, MatchCard, ChatBubble) live in their feature folders and may only compose `ui/` primitives and semantic utilities.

Third-party registries (`src/components/animate-ui`, `ruixen`, `primitives`, magicui pieces, `publish-21st`) are migrated into `ui/` or deleted when unused. Remove the magicui/animate-ui registries from `components.json` once nothing imports them.

### 5.3 Enforcement

Add `scripts/check-design.ts` and `bun run check:design` (wire it into CI in `.github/workflows`). Outside `src/styles/` and `src/components/ui/` it fails on: hex colours in TSX, arbitrary colour classes (`-[#`), raw palette classes (`zinc|slate|gray|neutral|stone|rose|pink|violet|indigo|emerald|amber|orange|sky|blue|purple|red|green|yellow-NNN`), `rounded-[Npx]`, inline `style` colours, and font imports other than the three above. Allow an explicit `// ds-allow: reason` escape comment and report the count.

### 5.4 Living style guide and docs

- Add `/design` (noindex; available in development and to admins only) showing every token, type style and component in both themes.
- Write `docs/DESIGN_SYSTEM.md` as the single spec. Move `DESIGN.md`, `docs/DESIGN.md`, `docs/academics-design-system.md` and `docs/CAMPUSLOOP_2.0_AUDIT_REDESIGN.md` into `docs/archive/`. Replace AGENTS.md §13–14 with a short pointer to `docs/DESIGN_SYSTEM.md`, and update `.agents/skills/campusloop-guide/SKILL.md` if it restates design rules.

**Done when:** tokens, fonts, `ui/` primitives, `/design`, `check:design` (reporting current violations without failing CI yet), the contrast test and `docs/DESIGN_SYSTEM.md` exist; all checks pass.

---

## Phase 6 — Design System v3: shells and page migration

1. **Exactly three shells** in `src/components/shells/`:
   - `MarketingShell` — one navbar and one footer for `/`, `/about`, `/privacy`, `/terms`, `/safety`, `/help`, `/contact`, `/pitch`, `/aspirants`, `/products`, `/sitemap` and public article pages.
   - `AppShell` — desktop sidebar (≥1024px), top bar (search, notifications, avatar), mobile bottom nav (Home, Colleges, Post, Chat, and Match only for adults), and the preview-mode Banner for logged-out visitors. Used by every `(app)` route group **and** `(dating)` (Campus Match gets a sub-header inside AppShell, replacing `dating-navbar.tsx` / `dating-footer.tsx`).
   - `AdminShell` — the existing admin sidebar and header rebuilt on tokens.
   - One navigation config in `src/constants/navigation.ts`.
   - Merge or delete: `ruixen/navbar-minimal.tsx`, `ruixen/footer-enterprise.tsx`, `landing/minimal-landing-navbar.tsx`, `landing/clean-footer.tsx`, `dating/dating-navbar.tsx`, `dating/dating-footer.tsx`, and fold `editorial-header`, `academic-header`, `explore-header`, `feed-header`, `community-header`, `college-hero-header`, `section-header` into `PageHeader` variants. Move `src/app/mobile-navigation.css` into the shell component.
   - One sign-in route: keep `/sign-in` and redirect `/handler/sign-in` to it (or the reverse if Hexclave requires it), and make every link use the same one.
2. **Codemod, then review.** Write `scripts/codemods/semantic-colors.ts` to map common raw classes to semantic utilities, then review each file by hand:

   | From | To |
   | --- | --- |
   | `bg-white`, `bg-zinc-50`, `bg-neutral-50`, `bg-slate-50`, `bg-gray-50` | `bg-surface` / `bg-bg` |
   | `text-{zinc,neutral,slate,gray}-{800,900,950}` | `text-fg` |
   | `text-{zinc,neutral,slate,gray}-{500,600,700}` | `text-fg-muted` |
   | `text-{zinc,neutral,slate,gray}-{300,400}` | `text-fg-subtle` |
   | `border-{zinc,neutral,slate,gray}-{100,200,300,800}` | `border-border` |
   | violet / indigo / purple / emerald used as brand | `brand` utilities |
   | rose / pink | `crush` inside Campus Match, otherwise `danger` |
   | red / green / amber / yellow used as status | `danger` / `success` / `warning`; rewards → `accent` |
   | `dark:` colour overrides | delete where semantic tokens already switch |

3. **Migrate in this order**, finishing each before the next, with before/after screenshots at 390px and 1280px in both themes if a browser is available: landing → sign-up / sign-in / onboarding → feed and PostCard → colleges and college hub → academics → communities → profile → Campus Match → chat and calls → events → marketplace → articles → notifications/settings → admin.
4. **Complete states.** Every migrated view has loading (Skeleton), empty (EmptyState with one clear action), error and disabled states, and visible `focus-visible` rings.

**Done when:** `bun run check:design` reports **zero** violations and is switched to failing CI; only the three shells exist; all checks pass.

---

## Phase 7 — Landing rewrite, QA and handoff

1. **Landing (`src/app/page.tsx`, `src/components/landing/*`)**, rebuilt with MarketingShell and Phase 5 primitives. Lead with the most real, safest value:
   - Hero: "Your campus, verified." Sub: "Notes and past papers from your college, and a feed only verified classmates can see." CTAs: "Join with college email" and "Find your college".
   - Sections in order: Academic Vault (real counts only past threshold) → Campus feed and communities → honest anonymity statement (Phase 1 text) → Campus Match marked "18+ verified students only" → Safety (reporting, anti-ragging, helplines) → FAQ (answers in DOM) → final CTA.
   - Remove "zero boomers", "inside hostel tea" as headline copy, fabricated mock counters, and voxel videos above the fold (keep illustrations light and below the fold if used).
2. **Accessibility pass.** Labels on every input, alt text, keyboard navigation through shells and dialogs, 44px targets, reduced motion respected, contrast test green.
3. **Final checks.** `bun run typecheck && bun run lint && bun run test && bun run build && bun run check:design` all pass. Re-measure the Phase 0 counts.
4. **Write `docs/fix/FIX_REPORT.md`** with: what changed per phase (with commit hashes), before/after Phase 0 counts, decisions applied, assumptions you made, and a **Founder to-do** list including at least:
   - run the generated migrations and `scripts/fix/*` against production, in order
   - rotate the Giphy key and the demo account password
   - set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `REDDIT_INGEST_ENABLED` in Cloudflare
   - resubmit `sitemap.xml` in Google Search Console
   - make the public Notion workspace private or curate it
   - decide parental consent vs 18+ only before the DPDP Rules deadline of 13 May 2027

**Done when:** the report exists, every check passes, and nothing was deployed.
