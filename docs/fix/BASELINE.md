# Phase 0 Baseline

Measured on 2026-10-09 against `main` @ `b817bbdc` (merge of PR #8, `redesign/design-system`).
The audit in `FIX_PLAN.md` was written against `31b89e9`; audit values are shown in brackets for comparison.

No product code was changed in this phase.

## 1. Check status

| Check | Result | Notes |
| --- | --- | --- |
| `bun run typecheck` | ✅ pass | 0 TS errors |
| `bun run lint` | ❌ fail | 1,497 problems: **4 errors**, 1,493 warnings |
| `bun run test` | ❌ fail | 328/328 tests pass, but **3 of 51 test files fail to load** |
| `bun run build` | ✅ pass | Measured via `npm run deploy` (OpenNext build) on the same commit: `✓ Compiled successfully in 83s`. Static generation logs "Dynamic server usage" for `/merchant-portal/*` (pages use `cookies`); non-fatal. |

### Lint errors (4)

| File | Rule |
| --- | --- |
| `publish-21st/time-capsule-card-demo.tsx:8` | React compiler: cannot call impure function during render |
| `src/app/(app)/(events)/events/my-tickets/my-tickets-client.tsx:66` | React compiler: cannot call impure function during render |
| `src/app/(dating)/components/DatingFooter.tsx:3` | `@typescript-eslint/no-require-imports` |
| `src/app/(dating)/components/DatingNavbar.tsx:3` | `@typescript-eslint/no-require-imports` |

One error is in `publish-21st/` (outside `src/`; a candidate for lint-ignore or deletion in Phase 5), one is in the events tickets client, and two are in the new `(dating)/components/` shell added by PR #8.

### Test file load failures (3)

| File | Cause |
| --- | --- |
| `src/lib/notifications.test.ts` | imports `bun:test`, but the suite runs under Vitest |
| `src/lib/streaks/streak-service.test.ts` | imports `bun:test`, but the suite runs under Vitest |
| `src/lib/r2-pipeline.test.ts` | Hexclave SDK throws at import time without `HEXCLAVE_PROJECT_ID` (needs a mock) |

These must be fixed before any later phase can satisfy "all checks pass".

## 2. Design-system violation counts (`src/**/*.tsx`, 647 files)

| Metric | Now | Audit |
| --- | --- | --- |
| Hex colours `#[0-9a-fA-F]{6}` | **480** (121 distinct, 61 files) | [405, 91 distinct] |
| Arbitrary colour classes `-[#…]` | **228** | [289] |
| Raw palette classes `(bg\|text\|border)-(zinc\|…\|yellow)-NNN` | **3,749** | [~3,981] |
| ↳ incl. `ring/from/to/via/fill/stroke/shadow/outline/divide/decoration/placeholder/caret/accent` prefixes | 4,192 | — |
| `rounded-[Npx]` | **29** | [~26] |
| Inline `style={{` | **68** | [67] |

The redesign merge added hex literals (mostly in `src/components/ui/cute-illustrations.tsx` and the `cute-*` landing sections) while removing some arbitrary classes and raw palette classes.

## 3. Layout / chrome inventory

**Layouts (14)**
- `src/app/layout.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/(main)/layout.tsx`
- `src/app/(app)/(academics)/layout.tsx`
- `src/app/(app)/(articles)/layout.tsx`
- `src/app/(app)/(chat)/chat/layout.tsx`
- `src/app/(app)/(events)/layout.tsx`
- `src/app/(app)/(marketplace)/layout.tsx`
- `src/app/(app)/(post)/layout.tsx`
- `src/app/(app)/(reels)/layout.tsx`
- `src/app/(dating)/dating/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/merchant-portal/layout.tsx`
- `src/app/merchant-portal/(portal)/layout.tsx`

**Navbars (11)** — site-level marked ★
- ★ `src/app/(dating)/components/DatingNavbar.tsx`
- ★ `src/components/dating/dating-navbar.tsx` (duplicate of the above)
- ★ `src/components/landing/cute-landing-navbar.tsx`
- ★ `src/components/landing/minimal-landing-navbar.tsx`
- ★ `src/components/ruixen/navbar-minimal.tsx`
- ★ `src/components/ui/navigation.tsx`
- `src/components/marketing/company-nav.tsx`
- `src/components/marketing/legal-nav.tsx`
- `src/components/navigation/contextual-living-nav.tsx`
- `src/components/academics/academic-nav-tabs.tsx`
- `src/components/explore/quick-explore-nav.tsx`

**Headers (12)**
- `src/app/admin/_components/admin-header.tsx`
- `src/app/admin/_components/admin-mobile-header.tsx`
- `src/app/admin/_components/admin-page-header.tsx`
- `src/components/ui/page-header.tsx`
- `src/components/primitives/section-header.tsx`
- `src/components/academics/academic-header.tsx`
- `src/components/articles/editorial-header.tsx`
- `src/components/colleges/college-hero-header.tsx`
- `src/components/communities/community-header.tsx`
- `src/components/explore/explore-header.tsx`
- `src/components/feed/feed-header.tsx`
- `src/components/feed/feed-card-header.tsx` (card-level, not page chrome)

**Footers (4)**
- `src/app/(dating)/components/DatingFooter.tsx`
- `src/components/dating/dating-footer.tsx` (duplicate of the above)
- `src/components/landing/clean-footer.tsx`
- `src/components/ruixen/footer-enterprise.tsx`

**Sidebars (5)**
- `src/components/navigation/desktop-sidebar.tsx`
- `src/components/ui/right-sidebar.tsx`
- `src/app/admin/_components/admin-sidebar.tsx`
- `src/components/articles/articles-right-sidebar.tsx`
- `src/components/confessions/confession-sidebar.tsx`

**Shells (3)**
- `src/components/ui/app-shell.tsx`
- `src/app/admin/_components/admin-shell.tsx`
- `src/components/marketplace/marketplace-shell-client.tsx`

## 4. Public marketing numbers

`grep -rnE "45,000|45K|8,400|1,350|43\.3M|43 million" src` → **117 lines in 55 files**.

| Pattern | Hits | Phase 1 action |
| --- | --- | --- |
| `45,000` | 9 | remove (fabricated) |
| `45K` | 6 | remove (fabricated) |
| `8,400` | 2 | remove (fabricated) |
| `1,350` | 97 | keep only as "colleges in our directory" |
| `43.3M` / `43 million` | 5 | market-size figure (AISHE); keep only with a source, never as traction |

**Fabricated-number hits (must go in Phase 1)**

```
src/app/page.tsx:21,57,75                                   45,000+ / 45K+ in metadata
src/components/auth/auth-split-layout.tsx:181              45K+ PYQs (inside testimonial quote)
src/components/landing/voxel-membership-tiers.tsx:38       45K+ PYQs & Notes
src/components/landing/voxel-faq.tsx:36                    45,000+ lecture notes
src/components/landing/clean-footer.tsx:53                 45,000+ peer notes
src/components/landing/cute-landing-hero.tsx:106           45,000+ solved PYQs
src/components/landing/voxel-vocarush-hero.tsx:186,216     45,000+ notes
src/components/landing/voxel-cascade-showcase.tsx:163      45K+ Notes
src/components/landing/cute-landing-faq.tsx:37             45,000+ lecture notes
src/components/landing/cute-features-bento.tsx:102         45,000+ Verified Lecture Notes
src/components/landing/cute-features-bento.tsx:311         8,400+ students
src/components/communities/community-detail-client.tsx:466 45K+ semester notes
src/app/design-system/design-system-client.tsx:219         8,400+ Verified Students (showcase sample)
```

**`1,350+` hits worded as activity/"hubs"/"live" (must be reworded to "in our directory")** — notably:
`landing/cute-landing-hero.tsx:255` ("Active hubs"), `landing/voxel-features-bento.tsx:387` ("Live College Hubs"), `landing/voxel-cta.tsx:104` ("Campuses Live"), `auth/auth-split-layout.tsx:87` ("verified peers across"), `landing/cute-landing-cta.tsx:45` ("Join thousands of verified peers"), `constants/landing.ts:385` ("Join thousands of students"), `colleges/page.tsx:8,20,50` ("verified college hubs", "accredited"), `aspirants/page.tsx:26` ("verified college loops").

**Admin note:** `src/app/admin/posts/posts-table.tsx:571` says "all 1,350+ seeded bot posts", which reuses the college count as a seed-post count. Relevant to Phase 3.

`43.3M` market figures: `overview/overview-client.tsx:23,110`, `pitch/pitch-client.tsx:177,460`, `components/about-client.tsx:71`.

## 5. `campusloop.space/app` URLs

`grep -rn "campusloop.space/app" src` → **90 lines in 45 files** (84 outside tests).

Groups (all fixed in Phase 4 unless noted):

| Group | Files |
| --- | --- |
| **Sitemaps** (point crawlers at blocked URLs) | `sitemaps/colleges.xml/route.ts`, `sitemaps/academics.xml/route.ts` (+ its test, which asserts the `/app/` URL), `sitemaps/reels.xml/route.ts` |
| **Canonicals / OG `url` / JSON-LD** | events (layout, page), marketplace (layout, page, rentals, food, barber, water, laundry, supermarket), developer, college/[id] (canonical + breadcrumbs), gaming, gaming/new, housing/new, rideshare/new, branch/[slug], hub/new, random, buy-and-sell (+ new), saved, academics (layout, page, [slug], search, sources, upload, saved), reels layout |
| **Share / QR URLs in UI** | `marketplace/store/[merchantId]/store-client.tsx:844,1120`, `academics/saved/saved-materials-client.tsx:398,400`, `academics/playlists/[slug]/playlist-detail-client.tsx:504`, `components/ui/share-story-modal.tsx:216` |
| **Emails / callbacks** | `lib/email-templates.ts:154,248,251`, `lib/notifications-email.ts:57`, `api/profile/upgrade-campus/route.ts:64` |
| **Admin placeholder** | `admin/links/links-table.tsx:344` |
| **Tests (intentional, legacy-redirect coverage — keep)** | `middleware.test.ts`, `lib/chat-actions.test.ts`, `lib/auth-redirect.test.ts` |

## 6. Observations for later phases

- PR #8 added a **second** dating navbar/footer pair (`src/app/(dating)/components/`) alongside `src/components/dating/`; Phase 6 should keep at most one. It also added `/design-system` (Phase 5 plans `/design`), so these should be reconciled into one route.
- PR #8 replaced `DESIGN.md` with a new "warm ivory / blush" spec. Phase 5 archives it in favour of `docs/DESIGN_SYSTEM.md`.
- The check status above means every later phase must first fix the 4 lint errors and 3 broken test files to meet "all checks pass".
