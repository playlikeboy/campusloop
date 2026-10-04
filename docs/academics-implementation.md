# 🏗️ CampusLoop Academics — Implementation & Architecture Report

This document details the architectural refactoring, component breakdown, state management, and file changes implemented for the CampusLoop Academics study vault experience at `/academics`.

---

## 1. Architectural Refactors

### 1.1 Decomposition of Monolithic Client
- **Previous State:** The previous `academics-client.tsx` was a heavy, intertwined file combining search input, 50+ inline filter pills (Branch, Semester, Type, Subject, Exam Year), sidebar cards, stats banners, guest limiter modals, and post cards in one flat flow.
- **Refactored Architecture:** Modularized into high-cohesion, low-coupling subcomponents in `src/components/academics/`:
  - `AcademicHeader`: Unified page title, value proposition, campus scope switcher (`My Campus` ↔ `All India`), and primary `+ Upload Notes` CTA.
  - `AcademicSearchBar`: Centralized search input with global `⌘ K` / `Ctrl K` keyboard listener, clear action, auto-suggestions dropdown, and GA4 telemetry integration.
  - `AcademicNavTabs`: Semantic content tabs (`For You`, `Notes`, `PYQs`, `Playlists`, `Saved Locker`).
  - `AcademicFilterBar`: Compact desktop popover dropdowns (`Branch ▾`, `Semester ▾`, `Resource Type ▾`, `Sort ▾`) and touch-optimized mobile bottom sheet filter drawer.
  - `AcademicActiveFilters`: Removable active filter chips (`CSE ×`, `Sem 5 ×`, `PYQ ×`, `Clear all`).
  - `AcademicCardSkeleton`: Card-matching skeleton loading states eliminating jumpy spinners.
  - `AcademicContextRail`: Streamlined right rail with "Popular This Week", "Curated Study Playlists", and contextual personalization ("Recommended for you · Sem 5 · Computer Science"). Hidden on `< xl` screens to keep the main column generous.
  - `AcademicEmptyState`: Distinct contextual empty states for No Search Results, Empty Saved Locker, and Fetch Errors with a retry CTA.

### 1.2 Resource Card Structure Standardized
- **Previous State:** Cards had mismatched button paddings, inconsistent upvote counters, buried document titles, and non-standard hover effects.
- **Refactored Structure:** Overhauled `src/components/communities/academic-card.tsx` to follow the standardized information hierarchy:
  1. **Contributor Row:** Avatar, username, campus badge, relative timestamp, and share button.
  2. **Metadata Header:** Bold subject code & name tag, semester badge, branch tag, and resource type badge.
  3. **Title & Summary:** Prominent line-clamped title (`text-base font-semibold group-hover:text-primary transition-colors`), optional description snippet.
  4. **Quality & Verification Signals:** Verification pill (`✓ Verified · 98% helpful`), page count, file format (`PDF`).
  5. **Actions Footer:** Upvote/downvote ratio counter with instantaneous local optimistic toggle, comment bubble counter, 1-click cloud bookmark save, and prominent `View PDF →` / `Folder ↗` button.
  6. **Interactive Semantics:** The card container uses `<article tabIndex={0} role="article">` navigating to `/academics/${id}` upon card click or pressing `Enter`. Sub-action buttons (voting, bookmarking, profile click, share) explicitly call `e.stopPropagation()`.

---

## 2. Component Breakdown

| Component | Path | Responsibility |
|---|---|---|
| `AcademicHeader` | `src/components/academics/academic-header.tsx` | Page title, subtitle, scope switcher (`My Campus` vs `All India`), and upload CTA. |
| `AcademicSearchBar` | `src/components/academics/academic-search-bar.tsx` | Search input, `⌘K` listener, clear query button, quick search suggestions. |
| `AcademicNavTabs` | `src/components/academics/academic-nav-tabs.tsx` | Primary section tabs (`For You`, `Notes`, `PYQs`, `Playlists`, `Saved Locker`). |
| `AcademicFilterBar` | `src/components/academics/academic-filter-bar.tsx` | Dropdown filter popovers on desktop, bottom sheet drawer on mobile viewports. |
| `AcademicActiveFilters` | `src/components/academics/academic-active-filters.tsx` | Active filter badges with one-click dismiss and "Clear all" action. |
| `AcademicCard` | `src/components/communities/academic-card.tsx` | Unified resource card with voting, bookmarks, download limiter, and preview. |
| `AcademicCardSkeleton` | `src/components/academics/academic-card-skeleton.tsx` | Layout-matching shimmer skeletons during pagination and initial loading. |
| `AcademicContextRail` | `src/components/academics/academic-context-rail.tsx` | Right rail for curated study playlists, trending materials, and exam guides. |
| `AcademicEmptyState` | `src/components/academics/academic-empty-state.tsx` | Illustrated empty states for empty search, empty locker, and API errors. |
| `MarketplaceComingSoonOverlay` | `src/components/marketplace/marketplace-coming-soon-overlay.tsx` | Fullscreen modal overlay on `/marketplace` with 4 service pillars and partner CTA. |

---

## 3. Files Touched

1. **`src/app/(app)/(academics)/academics/page.tsx`**:
   - Injected student personalization props (`collegeName`, `userBranch`, `userSemester`) from `getCachedUserProfile`.
   - Maintained Schema.org structured data (`CollectionPage`, `FAQPage`, `BreadcrumbList`).
2. **`src/app/(app)/(academics)/academics/academics-client.tsx`**:
   - Re-architected into a 2-column layout (`col-span-12 lg:col-span-8` feed, `col-span-4` context rail).
   - Preserved SWR Infinite cursor-based pagination, saved locker tab, playlists tab, and guest limiter.
3. **`src/components/communities/academic-card.tsx`**:
   - Redesigned card visual hierarchy, accessibility, and stop-propagation click handling.
4. **`src/components/academics/*`**:
   - Created 7 new dedicated modular UI subcomponents.
5. **`src/app/(app)/(marketplace)/marketplace/page.tsx` & `layout.tsx`**:
   - Allowed unauthenticated guest preview for coming soon overlay.
6. **`src/components/marketplace/marketplace-coming-soon-overlay.tsx`**:
   - Built rich coming soon overlay for Zomato/Blinkit/TumbleDry/UrbanClap campus vision.

---

## 4. State Management Details

- **SWR Infinite Query Key:**
  `getKey(pageIndex, previousPageData)` computes query params dynamically:
  - `branch`: empty if "All", else selected branch.
  - `semester`: empty if "all", else selected semester.
  - `resourceType`: empty if "all", else selected resource type.
  - `search`: trimmed search string.
  - `scope`: "campus" or "global".
  - `sort`: "for_you", "latest", "popular", or "downloads".
  - `cursor`: pagination cursor from previous page.
- **Search Query Debouncing & Shortcuts:**
  - `⌘ K` / `Ctrl K` captures focus anywhere on the page and jumps to the search bar.
  - Hitting `Escape` clears active query and blurs input.
  - Search trigger sends GA4 tracking event via `trackAcademicSearch(query, resultsCount)`.
- **Bookmark & Locker State:**
  - Optimistic local state updates on save/unsave via `/api/academics/[id]/save`.
  - Haptic feedback triggered on mobile (`haptics.impact("light")` / `sounds.pop()`).
- **Guest Download Counter:**
  - Stored in `localStorage` under `campusloop_guest_academic_downloads`.
  - Allows 5 free high-speed downloads before presenting the zero-cost account creation modal.
