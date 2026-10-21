# Academics: Study Material + Courses — Plan

Status: in progress (Oct 2026). Owner: CampusLoop team.

## 1. Information architecture

| Route | What | Shell |
| --- | --- | --- |
| `/academics` | Study material home (notes, PYQs, cheat sheets), with a Study material / Courses switch | App shell |
| `/academics/study-material/*` | Everything that used to live under `/academics/*` (resource pages, search, saved, sources, upload, playlists). Old URLs 301 here (`next.config.ts`). | App shell |
| `/courses` | Course catalog: search, category, level, source, sort | App shell |
| `/courses/[slug]` | Course landing page (Udemy-style): outcomes, requirements, curriculum, instructor, reviews, enroll | App shell |
| `/courses/new`, `/courses/[slug]/edit` | Full-page course builder (no modals, per AGENTS.md §7) | App shell |
| `/courses/my` | My learning: in-progress, completed, certificates, wishlist | App shell |
| `/learn/[slug]/[lectureId]` | Course player | **`(learn)` route group: distraction-free, no nav, no feed, no notifications** |
| `/certificates/[id]` | Public, printable, verifiable certificate | Minimal shell |

Why a separate `(learn)` group: study must be distraction-free. The player renders outside the app shell, so the sidebar, feed widgets, chat and notification prompts never load there.

## 2. Data model (`src/db/schema/courses.ts`, migration `drizzle/manual/0007_courses.sql`)

- `courses`: slug, title, subtitle, description (Markdown), category, level, language, thumbnail, instructor name/bio, `creator_id` (null for imported OCW), `source` (`COMMUNITY` | `CS50`), source URL, license, outcomes[], requirements[], tags[], status (`DRAFT` | `PUBLISHED`), featured, denormalised counters (lectures, duration, enrolments, rating avg/count).
- `course_sections`: ordered sections.
- `course_lectures`: ordered lectures; kind `VIDEO` | `ARTICLE` | `LINK`; video provider + id/url; duration; Markdown body; `is_preview`; `attachments` jsonb [{label, url}].
- `course_enrollments`: (course, profile) unique; last lecture, completed_at.
- `course_lecture_progress`: (profile, lecture) unique; position seconds, completed.
- `course_notes`: timestamped private notes per lecture.
- `course_reviews`: one rating (1–5) + text per learner.
- `course_questions` / `course_answers`: per-lecture Q&A.
- `course_certificates`: public id, recipient name snapshot, course title snapshot, issued_at; (course, profile) unique.
- `course_wishlist`.

## 3. Learner experience (Udemy parity)

- Catalog with search, filters (category, level, source), sort (popular, rating, newest, shortest).
- Landing: what you'll learn, requirements, curriculum accordion with durations and free previews, instructor, rating summary and reviews, enroll (free), wishlist, share.
- Player:
  - Video left, curriculum sidebar right (collapsible; full screen on mobile as a sheet).
  - YouTube IFrame API: resume where you left off, auto-complete at 90% watched or on end, speed control, autoplay next with a 5-second countdown (cancellable).
  - Tabs under the video: Overview, Notes (timestamped; click to seek), Q&A, Resources (attachments), Reviews.
  - Keyboard: `space` play/pause, `←/→` 5s, `n` next, `p` previous, `m` mark complete, `[` toggle sidebar.
  - Progress bar in the header; manual complete toggle on every lecture.
- Certificate: issued when 100% of lectures are complete; public URL, printable, verification id. Certificates for CS50 courses state that the content is by CS50 / Harvard under CC BY-NC-SA 4.0 and that the certificate is issued by CampusLoop for completing the lectures, **not** by Harvard.

## 4. Creator experience

- `/courses/new`: details (title, subtitle, description, category, level, thumbnail), outcomes and requirements as tag-style lists, curriculum builder (sections, lectures, reorder, kind, video URL with live preview and auto-detected provider, Markdown body, preview flag, attachments), live preview card and publish checklist. Draft by default.
- Anyone signed in can create; only the creator (or an admin) can edit.

## 5. CS50 catalog

- `scripts/courses/fetch-cs50.ts` builds `src/data/courses/cs50.json` from each course site and its official YouTube playlist (CS50 2D Games reads week pages because its playlist holds trailers). Every video is checked with YouTube oEmbed and must have a real duration; upcoming/live streams are dropped.
- `scripts/courses/seed-cs50.ts` upserts them idempotently (by slug) with source `CS50`, license CC BY-NC-SA 4.0 and attribution.
- 13 courses / 123 lectures at last fetch: CS50x 2025, CS50P, CS50W, CS50 AI, CS50 SQL, Cybersecurity, R, Scratch, Understanding Technology, Business, Law, 2D Games, Mobile (React Native).

## 6. Quality bar

- Clean, minimal, calm UI: tonal surfaces, no borders where avoidable, generous whitespace, lucide icons, no emojis, 44px targets, visible focus rings, complete loading/empty/error states.
- Server components for SEO pages (Course JSON-LD on landing pages); client islands for interaction.
- Product Guide entries (`courses`, `study-material`) updated in the same change (AGENTS.md §15).

## 7. Later

- Transcripts (YouTube captions), quizzes and coding exercises between lectures, learning reminders, streak integration, instructor analytics, paid courses via Razorpay.
