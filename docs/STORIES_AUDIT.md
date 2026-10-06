# 📖 CampusLoop Ephemeral Stories System — Comprehensive Audit & Architecture Specification

**Status**: Phase 1 Audit Complete · Migration Plan Drafted  
**Scope**: Stories, Story Highlights, Story Likes, Story Viewer, Story Creator, Story Tray (`StoryRing`), and Storage/Ingestion APIs  
**Target Invariant**: Ephemeral, Instagram/Threads-grade campus vibe stories with strictly enforced 24-hour expiration, college-first privacy, audience scoping, rich interactive stickers, and 60fps gesture-driven navigation.

---

## 1. Executive Summary

A full audit of the CampusLoop codebase was conducted to evaluate the current Stories implementation across data modeling, API contracts, authorization layers, UI/UX interaction models, and performance. 

While CampusLoop previously possessed a functional prototype for text/gradient and single-image story creation, the system operates closer to a styled post composer than a true ephemeral mobile-first Story engine:
1. **Unbounded Queries & Missing Expiration Checks**: Several API endpoints and server components query all active or historical stories without `LIMIT` or strict expiration clauses.
2. **Audience & Profile Data Leakage**: Full `user_profiles` database rows (including private metadata such as dating preferences, date of birth, emails, and target institution IDs) are returned directly across story queries.
3. **Missing Server-Side View Tracking**: Views are tracked only in client `localStorage` with zero server-side `story_views` table, preventing view count analytics and author viewer lists.
4. **Suboptimal Navigation & UX**: Advancing stories in the viewer triggers full Next.js page transitions (`router.push('/story/[id]')`) rather than in-memory smooth gesture-driven slide carousels.
5. **Absence of Story Multi-Slide Decks & Interactive Stickers**: Stories are limited to single-shot text or image posts without multi-slide author grouping, stickers (polls, quizzes, countdowns, sliders, questions), or drawing tools.

---

## 2. Inventory of Existing Story Codebase

### Database & Models
- `src/db/schema/stories.ts`: Defines `stories`, `storyLikes`, and `storyHighlights`.
- `src/db/schema/relations.ts`: Defines Drizzle ORM relations for `stories`, `storyLikes`, and `storyHighlights`.

### API Routes
- `src/app/api/stories/route.ts`: `GET` (active stories for feed) and `POST` (create story).
- `src/app/api/stories/[id]/like/route.ts`: `POST` (toggle like and send notification).
- `src/app/api/stories/archive/route.ts`: `GET` (fetch user's archived/historical stories).
- `src/app/api/highlights/route.ts`: `GET` (fetch highlights by user) and `POST` (create highlight).
- `src/app/api/highlights/[id]/route.ts`: `GET` (highlight details) and `DELETE` (delete highlight).

### Client UI & Viewers
- `src/app/(app)/(main)/feeds/feed-client.tsx`: Renders the stories rail (`StoryRing`) at the top of the feed timeline.
- `src/components/ui/story-ring.tsx`: Horizontal tray rendering the current user's active story and peers' stories.
- `src/components/stories/story-avatar-item.tsx`: Avatar bubble with unread status ring.
- `src/app/(app)/(main)/story/[id]/page.tsx`: Full-page story viewer entry point.
- `src/app/(app)/(main)/story/[id]/story-viewer-client.tsx`: Interactive viewer with progress bars, heart burst, and reply field.
- `src/app/(app)/(main)/stories/new/page.tsx` & `story-creator.tsx`: Story creation studio with gradient presets, Unsplash picker, and ImgBB/R2 media upload.
- `src/components/profile/profile-highlights.tsx` & `story-archive-modal.tsx`: Profile highlight bubbles and archive picker.
- `src/hooks/use-stories.ts`: SWR hook fetching `/api/stories`.
- `src/lib/stories-ranker.ts`: In-memory ranking and grouping utility.

---

## 3. Detailed Audit Findings

### 3.1. Architectural & Database Problems
1. **Flat Single-Slide Schema**: `stories` table directly stores `mediaUrl`, `text`, and `backgroundColor`. A user cannot publish a multi-slide story or sequence of slides within an author update.
2. **Missing `story_views` Table**:
   - `isStorySeen` is executed client-side via `localStorage.getItem("cl_seen_story_${id}")`.
   - Authors cannot view who saw their story or view count metrics.
   - Viewing status is device-bound and lost across browsers/sessions.
3. **No Interactive Sticker Persistence**:
   - Polls, quizzes, emoji sliders, and questions cannot be attached or responded to because there is no `story_elements` or `story_element_responses` schema.
4. **Missing Audience & Visibility Fields**:
   - `stories` table lacks an `audience` enum (`PUBLIC`, `CAMPUS_ONLY`, `FOLLOWERS`, `CLOSE_FRIENDS`, `PRIVATE`).
   - Lacks an `institutionId` column, making college-scoped indexing reliant on cross-table joins with `user_profiles`.

### 3.2. Security & Privacy Vulnerabilities
1. **Audience Leakage in JSON Responses**:
   - `src/app/api/stories/route.ts` executes `with: { user: true }` and returns the raw `user` object to the client.
   - `src/app/api/highlights/route.ts` and `src/app/api/highlights/[id]/route.ts` also return raw `user` objects.
   - This exposes sensitive profile columns (e.g. `email`, `dob`, `datingPreferences`, `targetInstitutionIds`, `referredById`).
2. **Missing Visibility Checks on Direct ID Access**:
   - `src/app/(app)/(main)/story/[id]/page.tsx` queries `stories.id = id` directly without verifying whether the requesting user is allowed to view the author's stories (e.g. followers-only or campus-only restriction).
3. **Missing Expiry Enforcement on Direct ID Access**:
   - `src/app/(app)/(main)/story/[id]/page.tsx` does NOT include `gt(stories.expiresAt, new Date())` in the initial story fetch. Anyone with a historical story ID can view expired media indefinitely unless saved in a highlight.
4. **Unsanitized URL Inputs in Story Creation**:
   - `POST /api/stories` accepts arbitrary `mediaUrl` strings without protocol/origin validation.

### 3.3. Performance & Query Scalability
1. **Unbounded Feed Query**:
   - In `src/app/api/stories/route.ts`, `db.query.stories.findMany({ where: gt(stories.expiresAt, now) })` has no `LIMIT`. As the user base grows, this pulls every unexpired story across all 1,350+ colleges into server memory.
2. **Unbounded ID Traversal in Story Page**:
   - In `src/app/(app)/(main)/story/[id]/page.tsx`, `db.query.stories.findMany({ where: gt(stories.expiresAt, new Date()) })` fetches all active story IDs across the entire database to compute `prevStoryId` and `nextStoryId`.
3. **Client Route Churn**:
   - In `story-viewer-client.tsx`, advancing slides triggers `router.push('/story/${nextStoryId}')`. This incurs full Next.js page lifecycle transitions rather than instantaneous local state transitions.

### 3.4. UI/UX & Mobile Interactions
1. **Empty Story Tray for New Users**:
   - `rankAndFilterStories` currently filters active stories to ONLY self or users the viewer follows (`if (!isSelf && !isFollowing) continue`). For a newly signed-up student with 0 follows, the story tray appears completely empty even if batchmates on their campus posted active vibes.
2. **Text Form Orientation**:
   - The creation page (`story-creator.tsx`) operates more like a text card generator with presets than an edge-to-edge camera and media canvas.
3. **No Gesture Snap / 3D Cube Transitions**:
   - Lacks Instagram/Snapchat standard cube-rotate or smooth horizontal drag physics between different authors' story stacks.

---

## 4. Phase 2–10 Architecture & Implementation Plan

### Phase 2: Relational Data Model Redesign
Extend `src/db/schema/stories.ts` with:
- `stories`: `id`, `userId`, `institutionId`, `audience` (`PUBLIC` | `COLLEGE` | `FOLLOWERS` | `CLOSE_FRIENDS`), `isAnonymous`, `pseudonym`, `createdAt`, `expiresAt`, `archivedAt`, `deletedAt`.
- `storySlides`: `id`, `storyId`, `position`, `mediaType` (`IMAGE` | `VIDEO` | `TEXT`), `mediaUrl`, `durationMs`, `backgroundColor`, `createdAt`.
- `storyElements`: `id`, `slideId`, `type` (`TEXT` | `STICKER_POLL` | `STICKER_QUIZ` | `STICKER_QUESTION` | `STICKER_SLIDER` | `STICKER_COUNTDOWN` | `STICKER_MENTION` | `STICKER_LOCATION` | `STICKER_MUSIC`), `x`, `y`, `scale`, `rotation`, `zIndex`, `payload` (JSONB).
- `storyViews`: `id`, `storyId`, `slideId`, `viewerId`, `viewedAt`, `watchDurationMs`, with unique constraint on `(slideId, viewerId)`.
- `storyElementResponses`: `id`, `elementId`, `userId`, `response` (JSONB), `createdAt`, with unique constraint on `(elementId, userId)`.

### Phase 3: Centralized Authorization & Audience Engine
Create `@/lib/stories/stories-guard.ts`:
- `canViewStory(viewerProfile, story)`
- `canInteractWithStory(viewerProfile, story)`
- `canReplyToStory(viewerProfile, story)`
- `canDeleteStory(viewerProfile, story)`
- Sanitize all public outputs to `PublicStoryAuthor` (strip `email`, `dob`, `datingPreferences`).

### Phase 4: Production Story Feed & Tray Engine
- Upgrade `/api/stories`:
  - Enforce `LIMIT 100` on active stories query.
  - Filter by `(story.audience = 'COLLEGE' AND story.institutionId = viewer.institutionId)` OR `(story.userId IN followerIds)` OR `(story.userId = viewer.id)`.
  - Batch-fetch user mutuals and campus popularity.
  - Return `hasUnseen` calculated against `story_views`.

### Phase 5: Instagram-Level Immersive Viewer
- Rebuild `StoryViewerClient`:
  - In-memory multi-user story deck with preloading of adjacent slides and authors.
  - 15ms requestAnimationFrame or smooth CSS progress bar timers.
  - Gesture engine: tap left (prev slide), tap right (next slide), hold (pause), swipe down (dismiss), swipe left/right (next/prev author).
  - Live interactive stickers: vote on polls, answer quizzes, slide emoji slider with real-time feedback.
  - Verified badges and campus badges.

### Phase 6: Rich Media & Sticker Creator
- Upgrade `StoryCreator`:
  - Fullscreen 9:16 interactive canvas with draggable, scalable, and rotatable text & sticker layers.
  - Camera capture via `navigator.mediaDevices.getUserMedia` with fallback to native file picker.
  - Interactive sticker tray: Polls, Questions, Mentions, Campus Tags, Music, and Location.
  - Direct upload through `/api/upload` with automatic client-side compression.
