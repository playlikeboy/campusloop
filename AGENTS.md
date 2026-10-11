# 🤖 AGENTS.md — CampusLoop Instructions for AI Agents & Developers

Welcome to **CampusLoop**, a verified student-only campus social network built for Next.js 16 (App Router), Cloudflare Workers, Neon PostgreSQL, Drizzle ORM, and Hexclave Auth.

---

## 🎯 Main Motive & Core Capabilities

CampusLoop is designed to empower college students with a safe, engaging, and feature-rich campus platform:
- **Campus Feed (`/feeds`)**: Dynamic feed supporting Confessions, Polls, Questions, Hashtags, and Twitter-style Reposts/Quotes.
- **Campus Radius & Discovery (`/discover`)**: Switch between local campus feed and global across all colleges in India.
- **Stories / Vibes (`/stories/new`)**: 24-hour visual campus vibe sharing with interactive fullscreen viewer.
- **Campus Match / Dating (`/dating`)**: Swipe deck for connecting with verified fellow students, filtered by gender & scope.
- **Campus Directory (`/colleges`)**: 1,350+ indexed Indian college hubs with instant search & hub request forms.
- **Sub-Hubs & Communities (`/communities`)**: Student-created interest groups and discussion spaces.
- **Clout & Gamification**: Loop Points (LP) system rewarding engagement, invites, and unlocking verified status.
- **Admin Moderation (`/admin`)**: Content reporting, automated keyword filtering, user management.

---

## 📌 Critical Architectural Rules

### 1. Hexclave Management
- User auth, sessions, and verification are handled by **Hexclave**.
- Server-side auth: `hexclaveServerApp.getUser()` in API routes.
- Client-side auth & user profile: `useProfile()` custom hook.
- Reference documentation: https://skill.hexclave.com

### 2. Next.js App Router & Metadata Rule
- **NEVER** add `"use client"` on `page.tsx` or `layout.tsx` when exporting `metadata` or `generateMetadata`.
- Delegate interactive UI to dedicated client component files (e.g. `feed-client.tsx`, `dating-client.tsx`, `post-composer.tsx`).

### 3. High Modularity & Component Architecture
- Keep component files concise (~150-200 lines max).
- Store feature-specific subcomponents in dedicated component folders:
  - `src/components/feed/` — `feed-card-header`, `feed-card-actions`, `feed-card-repost-modal`
  - `src/components/stories/` — `story-avatar-item`, `story-viewer-modal`
  - `src/components/dating/` — `dating-card-stack`, `dating-filters-modal`, `dating-match-modal`
  - `src/components/discover/` — `featured-campus-card`
  - `src/components/colleges/` — `college-hub-card`, `add-college-modal`
  - `src/components/post/` — `comment-item`, `post-composer-toolbar`
- Do **NOT** inline API fetchers or re-implement standard hooks. Use centralized helpers in `@/lib/api.ts` and custom hooks in `@/hooks/`.

### 4. Database & Drizzle ORM Best Practices
- Schema is centralized in [`src/db/schema.ts`](campusloop/src/db/schema.ts).
- Database connection uses Neon serverless Postgres driver via [`src/db/index.ts`](campusloop/src/db/index.ts).
- When querying Drizzle Relational Query Builder (`db.query`), avoid deep self-referential nested relational queries (e.g., `with: { repostOf: { with: { ... } } }`) to prevent worker query cache errors. Batch-fetch relational references when needed.

### 5. Verification & Deployment Commands
### 5. Qdrant Cloud Vector Search & Zero-Downtime Fallback Rule
- **Qdrant Vector Database** is integrated for semantic search, related post recommendations, and dating compatibility (`src/lib/qdrant/`).
- **CRITICAL INVARIANT**: Vector DB is strictly an asynchronous enhancement layer. Any query to Qdrant is protected by a strict 600ms timeout and circuit breaker.
- If Qdrant is unavailable, times out, or encounters network errors, the application **MUST gracefully fallback 100% to PostgreSQL relational queries** with zero interruption to users.

### 6. Mobile Bottom Navigation Bar & Anonymity Mode Switcher
- **Mobile Bottom Navigation**: The mobile bottom bar has 5 core tabs: **Home (`/feeds`)**, **Colleges (`/colleges`)**, **Post (`/post/new`)**, **Chat (`/chat`)**, and **Dating (`/dating`)**.
- **Anonymity Mode Switcher**: Desktop sidebar and mobile drawer feature a quick switcher between **All Posts & Anon 🎭** and **Public Only (No Anon) 🛡️**. Switching dispatches `campusloop_feed_visibility_change` on the window and saves to `localStorage` + `/api/profile/me` for instant zero-reload timeline filtering.

### 7. Dedicated Full-Page Routes (`page.tsx`) with Maximum SEO Over Popups for Creation & Editing
- **ALWAYS** create dedicated Next.js App Router full-page routes (`page.tsx`) with maximum SEO metadata, OpenGraph tags, JSON-LD Schema.org structured data, Twitter/X-style full-width clean UX, and robust backend/frontend, instead of modal popups for creation and editing workflows (e.g. Note/Resource Upload at `/academics/upload`, Study Playlist creation at `/academics/playlists/new`, Campus Hub posting, community creation, listing creation).
- Popups/modals are strictly forbidden for complex creation and editing forms and are reserved ONLY for micro-interactions (e.g. fast comment reply, quick repost quote, quick reaction).
- Dedicated pages maximize Google/search indexing, utilize 100% of mobile screen real estate, avoid cramped modal scrolling, and enable deep linkability and shareability.

### 8. PeerJS WebRTC Calling & Control vs. Media Plane Isolation
- Control plane (authentication, authorization, session state, ringing timeouts, block verification) runs strictly through Cloudflare Workers and PostgreSQL (`call_sessions` table).
- Media plane (PeerJS, getUserMedia, direct audio/video tracks) connects P2P directly between student browsers. **NEVER** route or relay raw WebRTC media streams through the worker.
- Encapsulate all WebRTC and PeerJS event handling inside `src/lib/calls/call-engine.ts` instead of scattering across React components.

### 9. Upstash Redis & User Behavior Personalization
- Low-latency cache, signaling, and user behavior analytics ingestion are supported via Upstash Redis (`@upstash/redis` via `src/lib/redis.ts`).
- High-frequency tracking (`trackUserBehavior`) updates real-time user affinity sets (`user:<id>:interests`) in Redis within 5ms, backed asynchronously by durable audit rows in `user_behavior_events`.
- If Redis is unavailable or unconfigured, all endpoints must continue functioning seamlessly with zero disruption.

### 10. Official Social Media Channels Priority
- Always prioritize official social media links in the order:
  1. **Instagram (Highlighted)**: `https://www.instagram.com/campusloop.space/` (`@campusloop.space`)
  2. **LinkedIn**: `https://www.linkedin.com/company/mycampusloop/?viewAsMember=true` (`CampusLoop`)
  3. **X (Twitter)**: `https://x.com/company/mycampusloop/` (`@mycampusloop`)

### 11. Iconography Standard: Zero Raw Emojis & Professionally Creative Form UX
- **NEVER** use raw emoji characters in UI labels, badges, tabs, buttons, or toast notifications. Emojis look amateurish and inconsistent across platforms.
- **ALWAYS** use `lucide-react` icons or custom animated SVGs (`@/components/ui/animated-icon`).
- **NO Primitive Form UI**: Avoid generic, plain forms with bare inputs. Form experiences must be creatively professional: visual category cards, drag-and-drop file upload with live previews, auto-detection (e.g. Drive permissions), tag generators, and sticky live preview cards with real-time validation checklists.

### 12. Link & Music Embed Engine & Sanitization
- Rich link previews and embedded media players are centralized through `@/lib/embeds.ts` and `@/components/embeds/post-embed-renderer.tsx`.
- Supported providers: **9GAG** (memes, player, `/home` portal), **Spotify** (tracks, playlists, albums), **SoundCloud** (HTML5 player), **Apple Music** (tracks & albums), **YouTube**, **Vimeo**, **Loom**, **CodePen**, **Instagram**.
- **Sanitization**: All RSS and third-party ingested content must be cleaned using `cleanPostHtml` (`@/lib/html-sanitize.ts`) to eliminate raw HTML table artifacts (`<table>`, `<!-- SC_OFF -->`, `&#32;`).
- Post composer features real-time embed extraction, live preview cards, and per-item dismissal.

### 13. Borderless Clean Design & Admin Console Architecture
- **Borderless Aesthetic**: High-density timelines and exploration hubs (`/birthdays`, `/discover`, feed cards) avoid harsh bounding borders. Use subtle tonal backgrounds (`bg-card/60`), soft ambient shadows (`shadow-2xs`), and borderless pill switchers.
- **Admin Operations Hub**: The Admin Console (`/admin`) is organized into dedicated operational domains:
  - **Operations & Safety**: Dashboard, Review Queue, Reports, Academics Vault (`/admin/academics`).
  - **Content & Campus**: Feed Curation, Posts, Comments, Users, Colleges, Campus Broadcasts (`/admin/broadcasts`).
  - **Integrations & Studio**: Composio Hub (`/admin/composio` — Reddit sync, Cloudflare CDN edge controls, webhook alerts, exports), Embeds Inspector (`/admin/embeds`), Short Links & Refs.
  - **Marketplace**: Overview, Merchants, Products, Rentals.
  - **Telemetry & System**: Platform Analytics & Pulse (`/admin/analytics`), System Health Matrix (`/admin/system`), Audit Log (`/admin/audit`).

### 14. Impeccable Design Guidelines & Quality Floor (https://impeccable.style/#why)
- **Eliminate AI Slop & Cookie-Cutter Layouts**: Never generate repetitive same-size 3-card rows, cheesy gradient-text hero metrics, or faux-brutalist zero-blur block shadows. Interfaces must feel custom-crafted, intentional, and production-grade.
- **Strict Craft Floor Checks**:
  - **Contrast**: Body text and placeholder contrast must strictly satisfy ≥4.5:1 (large text ≥3:1). Never use unreadable washed-out grays.
  - **Depth & Hierarchy**: Declare elevation once (subtle border or soft shadow, never competing double-elevation). Radii stay cohesive (12–16px for cards, pills reserved strictly for small interactive chips).
  - **Spacing & Typography**: Maintain deliberate typographic hierarchy without gradient text hacks. Tight element clusters with generous whitespace between sections; headings carry more spacing above than below.
  - **Browser Surfaces**: Theme native focus rings (`focus-visible:ring-2`), carets, scrollbars, and selection styling (`selection:bg-primary/20`).
  - **Iconography**: Icons must be drawn from `lucide-react` or custom SVGs in uniform stroke and weight. Zero raw emojis in UI.
  - **Complete States**: Every component and view must handle hover, focus, disabled, loading, empty, and error states gracefully.

---

## 📁 Workspace Directory Sitemap

```
campusloop/
├── docs/                      # Architectural docs & design guidelines
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── ROADMAP_PHASES.md
│   ├── RECOMMENDATION_ALGORITHMS_DEEP_DIVE.md
│   └── CHANGELOG.md
├── src/
│   ├── app/                   # Next.js App Router (Pages & API routes)
│   │   ├── (main)/            # Main app shell & client components
│   │   ├── (dating)/          # Standalone focused dating route (/dating)
│   │   ├── api/               # REST API endpoints (/feed, /posts, /chat, /dating, /stories, etc.)
│   │   └── admin/             # Admin moderation dashboard
│   ├── components/            # Feature subcomponents & Shadcn primitives
│   │   ├── feed/
│   │   ├── stories/
│   │   ├── dating/
│   │   ├── discover/
│   │   ├── colleges/
│   │   ├── post/              # Post comments & related-posts-widget
│   │   ├── chat/              # Messenger pane, conversation drawers
│   │   └── ui/
│   ├── db/                    # Schema & Drizzle ORM client initialization
│   │   ├── schema/            # Sub-schemas (users, posts, institutions, chat, dating, etc.)
│   │   └── schema.ts          # Centralized export barrel
│   ├── hexclave/              # Hexclave SDK configuration
│   ├── hooks/                 # Centralized React hooks (useProfile, useFeed, usePostActions, etc.)
│   └── lib/                   # API client (api.ts), utils, moderation, gamification
│       ├── qdrant/            # Qdrant client, embeddings, collections, async indexer
│       └── recommendations/   # Semantic related posts & deep compatibility matching
└── .agents/
    └── skills/
        └── campusloop-guide/
            └── SKILL.md       # Comprehensive AI Agent skill handbook
```

## 15. Strict Backend / Frontend / Database Boundaries

These rules are mandatory for all new and modified code. The architecture checker is wired into CI; do not introduce new legacy violations.

- **Pages and layouts:** UI and route composition only. Do not import `@/db`, `@/db/schema`, or `drizzle-orm`; do not call `getDb()` or run queries. Call a server-only feature query/service directly instead of making an HTTP request to the app's own API.
- **Route handlers:** `route.ts` files parse/validate HTTP input, invoke shared auth/capability helpers and feature services, then serialize a response. They must not issue database queries or own domain workflows.
- **Server Actions:** `actions.ts` files validate input, verify permissions, call feature services, revalidate affected cache keys, and return serializable results. They must not issue queries.
- **Repositories:** Only focused `*.repository.ts` modules under `src/server/features/**` may execute feature-level Drizzle queries. They may import the database connection and schema; they must not import React components or Next.js navigation/HTTP APIs.
- **Services:** `*.service.ts` modules own business rules, authorization orchestration, repository composition, side-effect order, and safe DTO shaping. They must not depend on UI components or HTTP Request/Response objects.
- **Client boundary:** Components and hooks must never import `@/db`, `@/server`, or `@/hexclave/server`. Use the existing `@/lib/api.ts` helper for browser HTTP calls and use type-only shared contracts for browser/server data shapes.
- **Security:** Client-provided user IDs, institution IDs, roles, admin flags, and anonymity claims are untrusted until verified server-side. Never return raw database records, secrets, internal auth data, or sealed anonymous identities to the browser.
- **Quality:** Do not duplicate domain logic across pages, routes, and actions. Keep queries bounded, preserve existing pagination/API contracts, and avoid unrelated schema, product, or UI changes during architectural refactors.
- **Enforcement:** Run `bun run check:architecture` for changed-file enforcement. Use `bun run check:architecture:full` to audit legacy violations. Full-scan violations are technical debt that must decrease as domains are migrated; never add a permanent exception to evade the rule.

Before moving existing code, search all imports/callers and preserve authentication, authorization, privacy, anonymity, caching, revalidation, SEO metadata, and side-effect ordering. Do not push, deploy, or execute database mutations unless explicitly instructed by the user.
