# Backend hardening report

Scope: `src/app/api/**`, `src/lib/**`, `src/db/schema/**` (indexes only), `src/hooks/**`, `src/test/**`, `vitest.config.ts`, `scripts/fix/**`. No commits, builds, migrations, or seeds were run. `src/middleware.ts` and all `.tsx` files were left untouched.

## 1. Test suite

The three suites that failed to load (`src/lib/r2-pipeline.test.ts`, `src/app/api/gaming/progression/route.test.ts`, `src/app/api/gaming/teammates/route.test.ts`) all died on `Cannot find module '.../@hexclave/next/.../next/navigation'`: `@hexclave/next` resolves `next/navigation` from inside pnpm's isolated store, which Vitest cannot see.

Fix: a shared setup file, registered in `vitest.config.ts` via `test.setupFiles`.

- `src/test/setup.ts` mocks `@/hexclave/server` with `hexclaveServerApp.getUser: vi.fn(async () => null)` (signed out by default) and stubs `server-only`. A test file's own `vi.mock("@/hexclave/server", ...)` still wins, so the gaming lobbies/tournaments and upload-route tests keep their per-test `mockResolvedValue` control.
- No `resolve.alias` for `next/navigation` was needed.

Verified: `bun run test src/lib/r2-pipeline.test.ts src/app/api/gaming` → 5 files, 15 tests pass. `bun run test src/lib` → 60 files, 453 tests pass. `bun run test src/app/api` → 4 files, 10 tests pass. `bun run test src/middleware.test.ts` → 7 pass.

## 2. Lint errors

`bun run lint` has 9 errors; none are inside backend ownership. All are `.tsx`/page files for other owners:

| File | Rule |
| --- | --- |
| `publish-21st/time-capsule-card-demo.tsx:8` | react-hooks/purity (impure call during render) |
| `src/app/(app)/(events)/events/events-client.tsx:177` (two findings) | react-hooks/purity |
| `src/app/(app)/(events)/events/my-tickets/my-tickets-client.tsx:62` | react-hooks/purity |
| `src/app/(dating)/components/DatingFooter.tsx:3` | @typescript-eslint/no-require-imports |
| `src/app/(dating)/components/DatingNavbar.tsx:3` | @typescript-eslint/no-require-imports |
| `src/app/oauth/authorize/page.tsx:44`, `:54`, `:76` | react-hooks/error-boundaries (JSX built inside try/catch) |

One pre-existing warning in ownership was cleaned up on the way: unused `gamingLobbyMembers` import in `src/app/api/gaming/lobbies/[id]/route.ts`. The refactored routes lint with zero errors and zero new warnings (remaining warnings are pre-existing `no-explicit-any`).

## 3. `requireProfile()` helper

New: `src/lib/require-profile.ts` (result-returning, non-throwing variant).

```ts
import { requireProfile } from "@/lib/require-profile";

const auth = await requireProfile();                     // 404 for a missing profile (default)
const auth = await requireProfile({ profileStatus: 403 }); // routes that historically answered 403
if (!auth.ok) return auth.response;                      // NextResponse: 401 { error: "Unauthorized" } or 40x { error: "Profile not found" }
const { user, profile } = auth;                          // user: Hexclave user (id, email, ...); profile: bare userProfiles row
```

- Built on `getCachedAuthUser` from `src/lib/server-cache.ts`; the profile lookup is a per-request `React.cache` of the bare `userProfiles` row (no `institution` join) so response payloads that spread `profile` are byte-for-byte what they were. Use `getCachedUserProfile` when the relation is needed.
- `rejectViewerWrite(profile)` is not folded in; every route that called it still calls it in the same position.
- Response bodies and status codes are unchanged per route (the codemod read the status of each original "Profile not found" branch and passed it through).

Refactor: 92 copy-pasted blocks across 71 route files under `src/app/api/**` now use the helper. Unused `hexclaveServerApp`, `userProfiles`, `eq`, `getDb`/`db` leftovers were removed per file.

Skipped on purpose (4 files) because an early `return` sits between the 401 check and the profile lookup, so moving the lookup would reorder which error wins: `src/app/api/ai/chat/route.ts`, `src/app/api/ai/feedback/route.ts`, `src/app/api/chat/search/route.ts`, `src/app/api/reels/[id]/comments/route.ts`. Routes whose profile lookup uses `columns:`/`with:` or a different not-found message were also left as they were.

## 4. Pagination and hard limits

New helper `src/lib/pagination.ts`: `parseLimit(searchParams, default, max)`, `parseBefore(searchParams)` (ISO `createdAt` cursor), `pageOf(rows, limit)` (fetch `limit + 1`, returns `{ page, hasMore, nextCursor }`).

Already paginated before this pass (no change needed): `chat/[id]/messages` (35 default, max 100, `?before=`), `posts/[id]/comments` (50 default, max 100, `?before=`), `posts/[id]/comments/[commentId]/replies`, `communities/feed` (every branch has a limit), `communities` list, `notifications`, `events/[id]/related`, search and explore routes.

Changed in this pass:

| Route | Default | Max | Cursor | Response shape |
| --- | --- | --- | --- | --- |
| `GET /api/posts/archived` | 50 | 100 | `?before=<createdAt ISO>` | unchanged (array). Pass the last item's `createdAt` as `before` to load more. |
| `GET /api/stories/archive` | 100 | 200 | `?before=` | unchanged (array); highlights lookup capped at 100 |
| `GET /api/marketplace/orders` | 50 | 100 | `?before=` | `{ orders, hasMore, nextCursor }` |
| `GET /api/academics/[id]/comments` | 100 | 200 | `?before=` | `{ comments, hasMore, nextCursor }` |
| `GET /api/marketplace/store/[id]/reviews` | 100 | 200 | `?before=` | `{ reviews, totalCount, averageRating, distribution, userReview, hasMore, nextCursor }`. `totalCount`/`averageRating`/`distribution` now come from a GROUP BY aggregate over all reviews, and `userReview` from a direct lookup, so they stay exact across pages. |
| `GET /api/capsules` | hard cap 100 (newest first) | | | unchanged |
| `GET /api/dating/crush` | sent crushes hard cap 50 | | | unchanged |
| `GET /api/highlights` | hard cap 100 highlights | | | unchanged |
| `GET /api/posts/[id]` | embedded comments hard cap 200 (oldest first; `/api/posts/[id]/comments` pages the rest) | | | unchanged |
| `GET /api/chat` | conversations hard cap 200, ordered by `updatedAt` desc | | | unchanged |
| `GET /api/stories` | active stories hard cap 500 (newest first) | | | unchanged |
| `GET /api/events` | DB fetch hard cap 500 before in-memory sort/filter; `?limit=` still applies | | | unchanged |
| `GET /api/birthdays` | profile scan restricted in SQL to the months that can appear in the response (now..+2 months, requested `date` month, requested `month`) and capped at 2000 | | | unchanged |

Frontend owners: `profile-client.tsx` (archived tab), `story-archive-modal.tsx`, `orders-client.tsx` / `food-orders-client.tsx` / `supermarket-orders-client.tsx`, `academic-detail-client.tsx`, `store-client.tsx` can wire "load more" with `?before=`.

Still unbounded but left alone (bounded by a per-user relation or admin/merchant scope; flagged for a later pass): `dating/matches` swipes, `stories` follows list, `profile/suggested` follows, all `admin/**` and `merchant/**` lists.

## 5. Indexes (AUDIT.md §3.1)

AUDIT §3.1 is stale: the Drizzle schema already declares `institutionId`/author indexes on all eight tables, and `drizzle/0004_content_query_indexes.sql` + `drizzle/0005_*.sql` carry them. One gap was found and added: `academic_resources_uploader_created_idx` on `academic_resources (uploader_id, created_at)` in `src/db/schema/academic-resources.ts`.

Because production is maintained with `db:push` and the live database may not match the migration folder, `scripts/fix/indexes.sql` contains `CREATE INDEX CONCURRENTLY IF NOT EXISTS` for all 20 indexes across the eight tables. It is idempotent; run it by hand with `psql "$DATABASE_URL" -f scripts/fix/indexes.sql` (not inside a transaction). `drizzle-kit generate` will also emit the new uploader index later. `db:generate`/`db:push` were not run.

## 6. `src/lib/feed.ts` `sql.raw` id lists

Already fixed upstream: `feed.ts` no longer contains `sql.raw` or hand-escaped id lists; the seen/candidate id filters use `inArray()` (lines ~439 and ~505). Nothing to change; `bun run test src/lib` is green.

## 7. Rate limits (`src/lib/rate-limits.ts`)

Before: everything mutating fell through to the generic `/api/` WRITE rule (120/min). Added explicit per-IP rules (all `store: "redis"`), listed before the defaults:

| Prefix | Methods | Budget |
| --- | --- | --- |
| `/api/colleges` | WRITE | 5 / 10 min |
| `/api/communities/hub/create` | WRITE | 5 / 10 min |
| `/api/dating/crush` | WRITE | 10 / min |
| `/api/dating/swipe` | WRITE | 90 / min |
| `/api/academics` | WRITE | 20 / min |
| `/api/articles` | WRITE | 30 / min |
| `/api/stories` | WRITE | 30 / min |
| `/api/capsules` | WRITE | 30 / min |
| `/api/highlights` | WRITE | 30 / min |
| `/api/reels` | WRITE | 60 / min |
| `/api/posts` (posts, comments, votes, reposts, reports, saves) | WRITE | 60 / min |
| `/api/chat` (messages, reactions) | WRITE | 60 / min |
| `/api/communities` (join/leave/chat/members) | WRITE | 60 / min |
| `/api/profile` (follow, me, dream campuses) | WRITE | 60 / min |

Already covered before: `/api/upload`, `/api/files` WRITE, `/api/ai`, `/api/payments`, `/api/college-index-requests`. `src/middleware.ts` was not touched; `src/middleware.test.ts` still passes.

## 8. Deletions

Verified with repo-wide import greps (zero importers in `src/`, `scripts/`, config):

- `src/hooks/index.ts` (barrel; every consumer imports hook files directly)
- `src/lib/post-detail.ts`
- `src/lib/profile.ts`
- `src/lib/search-engines.ts`

`src/lib/public-stats.ts` was excluded by brief (other agent). `load-env.ts` kept (loaded by convention).

## 9. `/@username` soft-404 diagnosis (AUDIT.md §2.4)

What was ruled out by reading: no `loading.tsx` at the root any more; the root layout renders `{children}` outside its only `<Suspense>`; `src/middleware.ts` does no rewrite for `/@...`; `[username]/page.tsx` calls `notFound()` before rendering anything (line ~150) and `generateMetadata` calls it too (line ~76).

Most likely cause: Next.js 15.2+/16 **streaming metadata**. For non-bot user agents `generateMetadata` no longer blocks the shell; it renders inside a metadata Suspense boundary and its `notFound()` is surfaced through the metadata outlet after the 200 shell has started streaming. The page body's own `notFound()` should still win, but both run concurrently and the metadata outlet error is what the stream reports, so the status is already committed. This also matches the audit's observation that removing `loading.tsx` changed nothing.

How to confirm in one command (no code change):

```
curl -s -o /dev/null -w "%{http_code}\n" -A "Googlebot" https://campusloop.space/@nonexistent_user_xyz   # bots get blocking metadata
curl -s -o /dev/null -w "%{http_code}\n" https://campusloop.space/@nonexistent_user_xyz                  # browsers get streamed metadata
```

A 404 for the bot UA and 200 for the default UA confirms it.

Exact fix (one line, in `src/app/[username]/page.tsx`, SEO agent's file): in `generateMetadata`, replace
`if (!profile || (!showSeeded && profile.isSeeded)) notFound();`
with
`if (!profile || (!showSeeded && profile.isSeeded)) return { title: "Profile not found", robots: { index: false, follow: false } };`
and let the page body's `notFound()` (which runs outside any Suspense boundary) set the 404. If the bot/UA test shows 200 for both, the fallback is `export const dynamic = "force-dynamic"` plus moving the lookup into a `getCachedProfileByUsername` (`React.cache`) shared by both functions so the page's throw is guaranteed to happen before the metadata boundary resolves.

## 10. Founder to-do

1. Run `scripts/fix/indexes.sql` against production (`psql "$DATABASE_URL" -f scripts/fix/indexes.sql`).
2. Rotate the Giphy API key at Giphy (the old one is in git history, AUDIT §1.2) and set the new value in `GIPHY_API_KEY`.
3. Rotate the demo account password and update the environment / Hexclave user it belongs to (the old value has been shared in docs and history).
4. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the Worker environment (and `.env.local` for dev) so analytics scripts render in production.
5. After the SEO agent applies §9, re-run the two `curl` checks above and confirm `/@nonexistent_user_xyz` returns 404.
