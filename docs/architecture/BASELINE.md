# CampusLoop architecture baseline

**Repository:** SH20RAJ/campusloop  
**Baseline ref:** main at 26239cadb3c8c7fa9847d6bccd3be3f550a7ea36  
**Collected:** 2026-10-11

## Repository inventory

The recursive Git tree contained 3,584 entries: 694 .tsx files and 507 .ts files. The tree also contains 190 App Router page.tsx files, 188 API route.ts files, 12 actions.ts files, and the existing Drizzle database layer at src/db/.

The repository already has useful modular pieces (src/db/schema/, src/lib/server-cache.ts, domain utilities, and dedicated client components), so this change preserves the existing Next.js/Drizzle/Neon/Hexclave/Cloudflare stack.

## Confirmed high-priority examples

These examples were fetched and inspected on the recorded baseline:

| File | Observed concern | First refactor boundary |
|---|---|---|
| src/app/[username]/page.tsx | 878 lines; mixes metadata and route logic with nine database query references and inline page rendering | Extract server queries/data preparation; keep route metadata and rendering |
| src/app/(app)/(main)/profile/page.tsx | 159 lines; directly authenticates, issues Drizzle queries, hydrates external media, formats poll/vote values, and renders UI | Refactored in this change into a server repository/service and thin page adapter |
| src/app/api/communities/feed/route.ts | 520 lines and 16 database query references | Extract repositories/services while preserving current API payload |
| src/app/api/posts/route.ts | Post persistence mixed with validation, moderation, notification, gamification, and indexing orchestration | Extract a posts service and preserve side-effect order |
| src/lib/feed.ts | 869 lines; feed queries, ranking, and result formatting are colocated | Separate repository, domain/ranking logic, and DTO formatting |

These are representative confirmed findings, not a claim that every legacy violation has already been enumerated.

## Baseline verification status

The following commands were NOT executable in the current API-only editing environment. A local Git clone was attempted, but network DNS resolution for github.com was unavailable; no local project checkout or installed dependencies were available. They must be run by CI or in a real repository checkout before merge:

- bun run typecheck — NOT RUN
- bun run lint — NOT RUN
- bun run test — NOT RUN
- bun run build — NOT RUN

Do not treat any of these as passing based on the source inspection.

## Migration policy

The repository has existing direct database access in legacy entry points. The architecture checker therefore has two explicit modes:

- bun run check:architecture checks added/modified TypeScript source files. This blocks new violations and requires any touched legacy entry point to be migrated before it can pass.
- bun run check:architecture:full scans all src/**/*.ts(x) files and reports legacy violations. It is an audit command and is expected to fail until each domain has been migrated.

This is a transitional enforcement step, not completion of the requested whole-repository migration. As phases finish, the full-scan violation count must be reduced to zero and the changed-file mode should remain in CI.
