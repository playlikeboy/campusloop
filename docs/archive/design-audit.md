# CampusLoop Design Audit & Baseline (Phase 0)

**Date:** October 2026  
**Branch:** `redesign/design-system`  
**Reference Document:** Master UI/UX Redesign & Centralized Design System Specification

---

## 1. Stack Detection & Environment Verification

| Layer | Detected Stack | Version / Configuration | Compatibility Constraints |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js App Router | `16.2.6` (React 19.1.7) | App Router, Server Components, OpenNext Cloudflare Adapter |
| **CSS & Engine** | Tailwind CSS v4 | `@tailwindcss/postcss` v4 + `@theme inline` | Centralized `@theme` in `globals.css`, no `tailwind.config.js` |
| **Component Primitives** | Radix UI & Base UI | `@base-ui/react`, `radix-ui`, `cva` | Accessible primitives, unified variants with `cva` |
| **Iconography** | Lucide React | `lucide-react`, `@animateicons/react` | Zero raw emojis in UI chrome; consistent stroke width |
| **Motion & Audio** | Motion (Framer) & Web Audio | `motion/react`, `sounds.ts`, `haptics.ts` | 150-200ms ease-out transitions, respect `prefers-reduced-motion` |
| **Typography** | Google Fonts via `next/font` | `Baloo_2` (Headings), `Figtree` (Body), `DM_Mono` (Code) | Subsets Latin, `display: swap`, high readability |
| **Deployment** | Cloudflare Workers | OpenNext (`@opennextjs/cloudflare`) | Zero Node.js-only APIs on edge runtime, static asset caching |

---

## 2. Diagnosis Findings (Verified Against Code)

### Critical Defects
1. **Dark-only, low-contrast, glassy look:**
   - Previous default canvas had near-black theme color `#09090b` and dark cards.
   - Secondary text at 11–13px (`#777777`) had 4.08:1 contrast on light backgrounds (failing WCAG AA ≥4.5:1).
   - Solution: Bright light theme by default (`--canvas: #F7F8FC`, `--surface: #FFFFFF`, `--text: #1B1B3A`, `--text-muted: #6B6F8A`). Dark theme retained as a system preference (`--canvas: #0E1020`, `--surface: #161933`).
2. **Navigation overload & duplication:**
   - Sidebar had up to 15 items in 5 groups with duplicated services ("Buy & Sell" vs "Campus Market").
   - Solution: Sidebar capped at 7 items max (Home, Notes & PYQs, Communities, Events, Campus, Messages, Profile).
   - Campus Hub unites Housing, Marketplace, Lost & Found, Ride share, and Campus Map under one `ServiceTabs` interface.
3. **No single accent and button style:**
   - Ad-hoc mix of purple, orange, green, and gold filled buttons.
   - Solution: Exactly ONE action color (`--primary: #5B4BFF`). Semantic colors strictly for status (`--success`, `--warning`, `--danger`).
4. **Stacked controls above lists:**
   - Multiple filter bars, chips, and per-page scope toggles cluttered screen space.
   - Solution: Max 2 control rows per screen (view tabs + single filter bar). Unified scope switcher ("BIT Mesra \| All India") in the top chrome.
5. **Truncation and layout bugs:**
   - Titles clamped prematurely; meta wrapped awkwardly.
   - Solution: Titles clamp to 2 lines with tooltip/detail access. Essential meta lines wrap with max 3 icon-text pairs.
6. **Gamification noise:**
   - Clout, podiums, and LP badges cluttering social feeds and college directories.
   - Solution: LP displayed only on the user's own profile and in quiet, subtle reward toasts.
7. **Trust and fake content:**
   - Demo listings and unverified college student estimates.
   - Solution: Remove/flag demo content (`is_demo`); display only real, verified counts.

---

## 3. Metrics & Drift Counts

- **App Router Pages:** 188 routes
- **Raw Hex Occurrences:** ~555 occurrences across `src/app` and `src/components` (to be mapped to semantic tokens)
- **Distinct Radius Tokens in Use:** Sprawl across `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-full`.
- **Target Radius Hierarchy:**
  - `sm` (8px): Chips, pill filters, small badges
  - `md` (12px): Standard buttons, inputs, dropdown menus
  - `lg` (16px): Content cards, feed cards, dialogs
  - `xl` (24px): Hero panels, bottom sheets
  - `full`: Avatars, circular icon buttons

---

## 4. Component Migration Map

| Legacy Component / Pattern | Target Design System Primitive | Key Enhancements |
| :--- | :--- | :--- |
| Ad-hoc buttons (`bg-purple-600`, `bg-emerald-500`, `bg-orange-500`) | `Button` (`@/components/ui/button`) | Typed variants: `primary`, `secondary` (`primary-soft`), `ghost`, `destructive`. |
| Nested / glowing cards | `Card` (`@/components/ui/card`) | Flat 1px border (`--border`), `--r-lg` (16px), zero harsh drop-shadows. |
| Ad-hoc state / category chips | `FilterChip`, `Tag`, `Badge` | Exactly 3 components: interactive `FilterChip`, read-only `Tag`, status `Badge`. |
| Multi-colored verified checks | `VerifiedBadge` (`@/components/ui/verified-badge`) | Exactly ONE consistent verified badge design rendered beside the user name. |
| Mixed container widths | `PageContainer` (`@/components/ui/page-container`) | Strict container roles: `feed` (640px), `content` (960px), `wide` (1200px). |
| Complex multi-row headers | `PageHeader` (`@/components/ui/page-header`) | Clean H1, optional one-line description, max 1 primary action. |
| "Vault" / Academics cards | `NoteCard` (`@/components/academics/note-card`) | Course code + semester tags, helpful upvote count, direct download link. |
| Cluttered college podium | `CollegeRow` (`@/components/colleges/college-row`) | Clean list row with normalized name, city, state, and student hub link. |
| Inconsistent service cards | `ListingCard` (`@/components/campus/listing-card`) | 4:3 photo card, prominent price, area, verified student seller chip. |

---

## 5. Anonymity & Identity Safety Audit

- **Requirement:** Confirm that anonymous posts/confessions are never linked to the student's real profile in public views, search, or reposts.
- **Verification:**
  - Database stores real author IDs securely inside `anon_identity_vault` (accessible strictly by automated moderation).
  - Public endpoints (`/api/posts/[id]`, `/api/posts`, `/api/feed`) return `author: null` and pseudo-handle for anonymous entries.
  - On the user's own profile, their confessions are marked with a private indicator: *"Posted anonymously — only you can see this in your archive"*.
