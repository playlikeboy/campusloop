# CampusLoop Gaming Ecosystem — Product Plan & Build Prompt

## Product direction

Make /gaming the default home for campus gaming: discover a match, recruit a squad, organize a scrim or campus cup, coordinate with verified students, then share results and return for the next session. The goal is to keep the coordination layer inside CampusLoop—not to pretend CampusLoop replaces the games themselves.

## What this implementation establishes

- A real gaming-mode filter for open, persisted lobby records: all open lobbies, competitive, casual, scrims, and campus cups.
- Search aliases that correctly map the “EA FC” shortcut to the existing FIFA / EA Sports FC game values.
- An editable lobby format and squad size in the create flow.
- Persistent lobby join/leave actions stored server-side, scoped to the same campus, with database-level checks for capacity and duplicate membership.
- Correct share links back to /gaming instead of a stale /app/gaming path.
- Clear loading, full-lobby, host, error, and joined states; no invented tournament counts, active players, ranks, or match results.

## North-star journey

1. Discover: game search and mode filters show only currently open lobbies.
2. Join: a student joins a lobby once; the server persists membership and updates the seat count.
3. Coordinate: players can see the host, game tag, schedule, roster count, and any host-provided voice link.
4. Organize: a student creates a competitive lobby, casual game, scrim, or campus-cup listing with a chosen squad size.
5. Return: upcoming events, match results, teams, saved games, and reputation make the next session easier to find.

## Recommended product roadmap

### P0 — Reliability and trust

- Add host controls to close a lobby, edit details, or mark a match complete.
- Add report, block, spam throttling, and host moderation controls.
- Test competing requests against a full lobby and verify join/leave idempotency.
- Consider a dedicated gaming_lobby_members table with a unique (lobby_id, profile_id) key as membership outgrows the current JSON roster.
- Add notifications for lobby joins, cancellations, start times, and filled squads.

### P1 — Player identity and squad discovery

- Add a player gaming profile with per-game handles, preferred roles, rank (optional), platform, availability, voice preference, and visibility settings.
- Add a “Looking for teammates” profile mode and filters for game, rank, role, platform, availability, and campus.
- Let students save preferred games and search alerts; keep preferences private by default.
- Add internal conversation entry points for lobby hosts and members, using existing CampusLoop chat and permission rules.

### P2 — Campus esports and tournaments

- Build a native tournament lifecycle: draft, registration, team roster, check-in, bracket, match schedule, score submission, dispute window, and final standings.
- Support solo, duo, and squad formats; enforce roster size and same-campus eligibility on the server.
- Let authorized campus clubs host recurring cups and publish event pages that can be shared and indexed.
- Add an audit trail for result edits and organizer actions; do not let a client-only score decide rankings.

### P3 — The social gaming layer

- Create game-specific campus channels for LFG, tactics, highlights, setup help, and looking for a coach.
- Add link-safe clips/screenshots, post-match recaps, guides, polls, and community challenges.
- Integrate existing notifications, comments, posts, and chat instead of building duplicate messaging systems.
- Show real upcoming events and current lobbies only; use useful empty states when a campus has little activity.

### P4 — Progress and campus identity

- Build verified participation history, season badges, fair-play acknowledgements, and opt-in leaderboards.
- Segment rankings by game, mode, season, campus, friends, and skill band so new players are not locked out by top-ranked regulars.
- Make rewards cosmetic or community-oriented; do not reward spam or raw time online.
- Measure activation, join-to-play conversion, return-to-lobby rate, time to fill squads, tournament completion, reports, and cancellation rate.

## Non-goals and guardrails

- Do not claim real-time game presence unless a supported platform integration exists.
- Do not invent active-user totals, ratings, tournament dates, player ranks, or match outcomes.
- Never expose private game handles or availability without the user's chosen visibility.
- Do not promise native voice/video game streaming; keep external game sessions external while CampusLoop owns discovery and coordination.
- Do not bolt on payments or betting as part of this gaming build.
- Preserve the existing Next.js App Router, Hexclave auth, Drizzle schema, Cloudflare/Neon architecture, and mobile shell.

## Detailed implementation prompt

~~~text
You are the senior product engineer for CampusLoop, a verified college-student social platform. Build a production-quality Gaming Ecosystem at https://campusloop.space/gaming. The experience should make students want to return to CampusLoop to find teammates, organize matches, join campus tournaments, discuss games, and follow community progress.

Before coding:
1. Inspect the actual repository, /gaming route, gaming-lobby feed/API, schema, existing community creation flow, auth, chat, notifications, styles, and test scripts.
2. Follow AGENTS.md, DESIGN.md, and the CampusLoop design QA skill. Preserve Next.js App Router, Hexclave authentication, Drizzle/Neon, Cloudflare deployment, semantic design tokens, and mobile navigation.
3. Audit current flows for fake client-only state, broken links, unsafe authorization, inconsistent game aliases, missing loading/empty/error states, and mobile overflow.
4. Separate verified data and working integrations from future features; never invent user identities, activity, ranks, tournament data, or metrics.

Ship the foundation in small, testable slices:
A. Gaming home
- Create a polished, minimal, responsive gaming home with game search, mode filters, open lobbies, concise match metadata, and one clear primary action to host a lobby.
- Offer the modes All Open, Competitive, Casual, Scrims, and Campus Cups. Apply filters on the server, preserve them in URL query parameters, reset pagination when filters change, and ensure empty states are useful.
- Normalize search aliases for real stored game names, including EA FC / FIFA. Use the real database, not illustrative lobby cards.
- Design for 320–390px mobile, tablet, and desktop; check keyboard focus, contrast, touch targets, horizontal overflow, and reduced motion.

B. Lobby creation
- Let the host choose game, match format, squad size, in-game tag, description, and scheduled time.
- Support competitive, casual, scrim, and tournament/campus-cup listings.
- Validate title, allowed mode, capacity, campus eligibility, and input length on the server; make success and failure states actionable.
- Reuse the existing creation API and schema where sound; add migrations only when the data model genuinely requires them.

C. Persistent lobby membership
- Make Join and Leave real authenticated server operations, not React-only toggles.
- Scope discovery and membership actions to the student's institution.
- Enforce capacity and duplicate-member checks at the database update so concurrent requests cannot overfill a lobby.
- Return explicit conflict states for full, closed, or unavailable lobbies. Prevent a host from accidentally leaving their own lobby.
- Render server membership and seat counts correctly after refresh and revalidation. Include pending, success, disabled, and failure states.
- Share canonical /gaming links.

D. Native competition and social roadmap
- First verify what infrastructure already exists before adding tournaments, rankings, gamer profiles, saved games, internal chat entry points, notifications, clubs, clips, guides, or achievements.
- Implement every additional feature end-to-end: schema, API authorization/validation, responsive UI, loading/empty/error states, tests, and docs. Do not ship UI controls that do nothing.
- Tournament progression should cover registration, team rosters, check-in, brackets, schedules, score reporting, disputes, final standings, and organizer permissions. Never use client-only state as an official result.
- Use existing CampusLoop chat, feed, notifications, community and moderation systems rather than creating parallel systems.

E. Quality and delivery
- Add focused tests for mode filtering, join/leave permissions, capacity limits, duplicate requests, and roster consistency.
- Run the relevant lint, typecheck, and test scripts; inspect their actual output and fix regressions.
- Review desktop and mobile behavior with available browser tooling. Report anything that cannot be verified.
- Update documentation with shipped behavior, API contracts, schema decisions, remaining risks, and a prioritized roadmap.
- Prefer atomic, well-described commits. Do not claim the website is live unless deployment status and the live route have been checked.

Acceptance criteria:
- A student can find an open lobby by game and mode.
- A student can join a same-campus lobby, refresh, and still appear as joined.
- The seat count and roster cannot be overfilled by duplicate or concurrent joins.
- A student can leave a lobby unless they are its host.
- A host can create each supported match format and select squad size.
- Filters, search, pagination, all actions, and all visible links work at narrow mobile widths.
- No fake metrics, seeded fake players, dead controls, or unsupported claims appear in production.
~~~ 
