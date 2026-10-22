---
name: add-courses
description: Add or refresh free courses on CampusLoop /courses: import YouTube playlists from universities (MIT, Stanford, NPTEL...) and educators (CodeWithHarry, Gate Smashers, Neso...), seed CS50, or create a single course by hand. Use when asked to add courses, add a YouTuber/university, fix broken lectures, or change how imported courses rank.
---

# Adding courses to CampusLoop

Courses live in Postgres (`src/db/schema/courses.ts`). There are four sources, set in `courses.source`:

| source | What | Listed in /courses | rank_boost |
|---|---|---|---|
| `CS50` | Harvard CS50 (scripts/courses/*-cs50.ts) | always | 1.0 |
| `UNIVERSITY` | MIT OCW, Stanford, CMU, Caltech, NPTEL, DeepLearning.AI, 3Blue1Brown, Karpathy | always | 0.9 |
| `CREATOR` | YouTube educators (mostly Indian) | always | 0.4 |
| `COMMUNITY` | made by students in /courses/new | only after promotion (src/lib/courses/promotion.ts) | 0 |

`rank_boost` (`SOURCE_BOOST` in promotion.ts) is a ranking head start only. It is never shown as stars: the "popular" score is `rank_boost*4 + ln(1+enrolments) + trend*0.5 + ln(1+reviews)*0.5`, and "rating" sort uses a Bayesian prior of `3.5 + rank_boost*1.2`. Real student ratings and enrolments overtake it. Never insert fake reviews, ratings or enrolment counts.

## 1. Add a YouTube channel (most common)

1. Find the channel handle (the `@name` in its URL). Confirm it is the creator's **official** channel, not a re-upload.
2. Add an entry to `SOURCES` in `scripts/courses/sources.ts`:
   ```ts
   { key: "neso", name: "Neso Academy", handle: "@nesoacademy", kind: "CREATOR", language: "English",
     bio: "One factual sentence about the creator.", exclude: /(VHDL)/i, maxCourses: 25 },
   ```
   - `kind`: `UNIVERSITY` only for universities and their official course channels; everyone else is `CREATOR`.
   - `include` / `exclude`: regexes on playlist titles. Use `include` for huge channels (MIT, NPTEL) to keep only CS/maths/AI.
   - `playlists: ["PL..."]` forces specific playlists in, bypassing filters.
   - `maxCourses` caps how many playlists one channel adds (largest matching first). `minVideos` defaults to 6.
   - `stripTitle` removes a noisy prefix from titles (NPTEL uses it).
   - `license`: only when the channel states one (MIT OCW is `CC BY-NC-SA 4.0`). Leave it out otherwise.
3. Preview what would be picked, without fetching videos:
   ```bash
   bun scripts/courses/import-youtube.ts neso --dry
   ```
   Check titles and categories. Tighten `include`/`exclude` until every line is a real course (no shorts, podcasts, live streams, interview-experience or "Chapter N" duplicate playlists).
4. Import (refreshes only the listed keys and keeps everything else in the data file):
   ```bash
   bun scripts/courses/import-youtube.ts neso
   ```
   This writes `scripts/courses/data/youtube.json`. Videos under 90 seconds, private, deleted, live/upcoming and **non-embeddable** videos (oEmbed check) are dropped, so nothing seeded is broken.
5. Seed the database (idempotent; keeps learner progress):
   ```bash
   bun --env-file=.env scripts/courses/seed-youtube.ts
   ```
   Course id `crs_yt_<playlistId>`, lecture id `lec_<last 8 of playlist>_<videoId>`, sections of 10 lectures, first 2 lectures are free previews, `source_url` is the original playlist.
6. Commit `sources.ts` and `data/youtube.json`, push, `bun run deploy`. Update the Courses guide entry (AGENTS.md section 15) if the list of providers changed.

Refresh everything (new videos, removed videos): `bun scripts/courses/import-youtube.ts` then the seed. To unpublish imported courses that are no longer in the data file: `seed-youtube.ts --prune` (sets them to DRAFT; never deletes progress).

## 2. Categories and topics

`TOPICS` in `import-youtube.ts` maps playlist titles to a category (first match wins, so specific topics come before broad ones). Categories must exist in `COURSE_CATEGORIES` (`src/lib/courses/format.ts`); each one gets a page at `/courses/category/<slug>`. Edition dedupe (`dedupeEditions`) keeps one playlist per course code (CS224N, 15-445, 6.006...), preferring the newest year, and Andrew Ng's CS229.

## 3. CS50

`bun scripts/courses/fetch-cs50.ts` then `bun --env-file=.env scripts/courses/seed-cs50.ts`. Pinned playlists and slugs are in those scripts.

## 4. One course by hand

Use the builder at `/courses/new` (signed in). It starts as an unlisted COMMUNITY course: shown in the feed's "Rising courses" slot, promoted to `/courses` at 3+ lectures, 150+ views, 10+ learners and a good rating. An admin can force-list a course by setting `is_featured = true`.

## 5. Schema changes

Manual SQL goes in `drizzle/manual/NNNN_*.sql` (idempotent `IF NOT EXISTS`) and the matching Drizzle columns in `src/db/schema/courses.ts`. Apply with a small bun script using `@neondatabase/serverless` and `DB_URL` from `.env`.

## Rules

- Official channels only; always keep `source_url` (original playlist) and the attribution line ("Lectures by X ... CampusLoop is not affiliated with X") which the course page, player and certificate render from `attributionNote()` / `courseProvider()`.
- Never fabricate ratings, reviews, learners or certificates. Ranking help goes through `rank_boost` only.
- Never commit secrets. `.env` is gitignored; Worker secrets are set with `wrangler secret put`.
- Run `bun run test src/lib/courses src/lib/guide` and `bun run typecheck` before deploying.
