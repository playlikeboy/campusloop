# CampusLoop Security, Correctness & Data Integrity Hardening Audit

**Document Version**: 1.0.0  
**Audit Date**: October 2026  
**Repository**: CampusLoop (Next.js 16 App Router, PostgreSQL / Neon, Drizzle ORM, Cloudflare Workers / OpenNext, Hexclave Auth)  
**Verification Status**: Verified — 106/106 automated regression tests passing (`bun test`).

---

## 1. Executive Summary

A comprehensive multi-phase security, authorization, privacy, and concurrency hardening pass was conducted across the entire CampusLoop codebase. The audit identified and eliminated critical authentication fallbacks, authorization bypasses, data leakage paths, race conditions, and unvalidated client-side parameters across Merchant Services, Post & Feed Systems, Community Membership, Dating Matching, Event Operations, Marketplace Checkout, Academic Analytics, MCP Protocols, and File Storage.

All 50 phases outlined in the security directive were systematically addressed, verified with automated regression test suites, and audited against whole-repository equivalents.

---

## 2. Critical Vulnerabilities Fixed

### CVE-CL-01: Merchant Authentication Predictable Signing Fallbacks (Phase 1)
- **Vulnerability**: `getSessionSecret()` in `src/lib/merchant-auth.ts` fell back to `HEXCLAVE_PROJECT_SECRET`, `AUTH_SECRET`, `DATABASE_URL` slices, and a hardcoded salt committed to the public repo. Missing production configuration allowed attackers to mint valid sessions for any merchant.
- **Fix**: Re-engineered `getSessionSecret()` to strictly fail closed. It now requires a dedicated `MERCHANT_AUTH_SECRET` environment variable with length $\ge 32$ characters and entropy validation ($\ge 6$ unique characters). All 4 fallback chains were removed. Tests verify that missing, short, whitespace, or placeholder secrets unconditionally abort with a server-side error.

### CVE-CL-02: Student-to-Merchant Unauthorized Session Escalation (Phase 2 & 3)
- **Vulnerability**: `/api/merchant/auth/me` fell back to returning the first merchant matching a student's institution (`merchants.findFirst({ where: eq(institutionId) })`). Unaffiliated students inherited full owner control over campus stores.
- **Fix**: Removed the arbitrary institution fallback entirely. Direct merchant portal sessions resolve strictly from signed HMAC cookies. Student sessions resolve only if an explicit `merchantUsers` row links the profile to the store. Unlinked or unauthenticated callers receive HTTP 401. All `/api/merchant/*` routes now enforce tenancy (`merchantId = authenticatedMerchant.id`).

### CVE-CL-03: Marketplace Checkout Non-Atomic Reservation & Client Price Tampering (Phase 12)
- **Vulnerability**: `/api/marketplace/checkout` allowed client-supplied prices, subtotals, and delivery fees. Stock decrements were performed in separate unconditioned queries without rollbacks, allowing race-condition overselling and partial order persistence.
- **Fix**: 
  - Implemented atomic conditional stock reservation:
    `UPDATE products SET stockQuantity = stockQuantity - requested WHERE id = ? AND merchant_id = ? AND stockQuantity >= requested RETURNING id;`
  - If any item runs out of stock, checkout aborts immediately, stock across all baskets is rolled back, and an HTTP 409 `STOCK_CONFLICT` is returned.
  - All pricing (items, addons, fees, totals) is derived 100% server-side via `priceMerchantOrder()`. Client-provided price fields are ignored.
  - Implemented `Idempotency-Key` caching via Redis/memory fallback preventing duplicate payments or orders.

### CVE-CL-04: MCP Authentication Query-String Key Reflection & Privilege Escalation (Phase 14 & 15)
- **Vulnerability**: `src/lib/mcp/auth.ts` accepted API keys via URL query parameters (`?key=`, `?token=`, `?apiKey=`), exposing long-lived credentials in access logs and referrer headers. Missing permissions defaulted to full access `["read", "write", "chat", "exclusive"]`.
- **Fix**: Query-string API keys are strictly rejected. Authentication requires `Authorization: Bearer <key>` or `x-campusloop-mcp-key` headers. Missing permissions default strictly to `["read"]`. Tool executors enforce strict capability checks (`write`, `chat`, `exclusive`) and object-level authorization on target resources.

---

## 3. High Severity Bugs Fixed

### Post Detail API Voter Exposure & Anonymous Leakage (Phase 4 & 40)
- **Vulnerability**: `GET /api/posts/[id]` returned raw `votes` and `pollVotes` relational arrays containing all voter user IDs. Internal moderation scores (`riskScore`) and author IDs of anonymous posts/comments were leaked in JSON payloads.
- **Fix**: Replaced raw relational dumps with calculated DTO aggregates (`votesCount`, `upvotesCount`, `downvotesCount`, `commentsCount`, viewer `userVote`). Anonymous posts and comments return `author: null` and `authorId: null`. Unauthenticated and regular viewers cannot access `DELETED` (HTTP 404) or `PENDING_REVIEW` (HTTP 404 unless author or moderator) content.

### Poll Cross-Post Voting & Concurrent Inflation (Phase 6)
- **Vulnerability**: `/api/posts/[id]/poll-vote` accepted arbitrary `optionId` without verifying it belonged to the target post. Racing concurrent requests could register duplicate votes.
- **Fix**: Enforced `pollOption.postId === requestedPostId` and verified post is an active published poll. Enforced unique conflict handling via `.onConflictDoNothing({ target: [pollVotes.userId, pollVotes.postId] })`.

### Comment Cross-Post Thread Hijacking (Phase 7)
- **Vulnerability**: `/api/posts/[id]/comments` accepted `parentId` without validating whether the parent comment belonged to the current post or was deleted.
- **Fix**: Verified `parentComment.postId === id` and `parentComment.status !== "DELETED"`.

### Event Capacity Race Conditions & Participant Miscounting (Phase 10 & 11)
- **Vulnerability**: `/api/events/[id]/register` counted rows rather than actual participants (ignoring team sizes) and used non-concurrency-safe checks before inserting. `/api/events/[id]` eagerly loaded all attendee private data (phone numbers, emails) in public responses.
- **Fix**: Calculated capacity based on real participants (`1 + teamMembers.length` for teams), checked `currentParticipants + requestedParticipants <= maxParticipants` via atomic SQL aggregation, enforced deadlines/campus eligibility, and removed all attendee PII from public event responses (using SQL `COUNT`).

### Dating Self-Swipe, Malformed Direction Fallback & Duplicate Threads (Phase 17)
- **Vulnerability**: `/api/dating/swipe` permitted self-swipes, silently converted malformed direction strings to `"PASS"`, and created duplicate conversation threads when mutual-like requests raced.
- **Fix**: Explicitly rejects self-swipes with HTTP 400. Enforced strict allowlist (`"LIKE"`, `"PASS"`), rejecting invalid values with HTTP 400. Reuses existing direct conversations deterministically on mutual matches.

### Academic Analytics Counter Manipulation (Phase 13)
- **Vulnerability**: `/api/academics/[id]/analytics` allowed unauthenticated users to increment view, download, and upvote counters arbitrarily.
- **Fix**: UPVOTE now strictly requires authentication and enforces single-vote uniqueness per user/resource (`academicResourceVotes`). Rapid VIEW and DOWNLOAD calls are deduplicated via client IP/user fingerprinting over rolling windows (1-hour views, 10-minute downloads) with atomic SQL increments.

---

## 4. Medium Severity Bugs Fixed

### Community Member Search In-Memory Filtering (Phase 21)
- **Problem**: `/api/communities/[id]/members` fetched a page of 20 members and filtered by query string `q` in JavaScript, causing incomplete and broken search results.
- **Fix**: Pushed `q` search directly into PostgreSQL (`ILIKE` on `displayName`, `username`, and `branch`), calculating exact total counts and page counts in SQL.

### Community Creator Removal & Admin Privilege Escalation (Phase 19 & 21)
- **Problem**: Community admins could remove founding creators or self-promote roles.
- **Fix**: Enforced immutable creator protection (HTTP 403) and prevented non-creator admins from modifying other admins or assigning the `ADMIN` role.

### File Upload Traversal & Private R2 Document Leaks (Phase 23 & 24)
- **Problem**: Uploads did not strictly sanitize file names. Private student files in R2 storage lacked ownership verification.
- **Fix**: Sanitized upload filenames against `../` path traversal. Private documents under `private/` require user auth, ownership validation, and are served with `Cache-Control: private, no-cache, no-store, must-revalidate` (never `public`).

### Composio Admin Operations Fake-Success (Phase 25)
- **Problem**: `/api/admin/composio` returned HTTP 200 `{ success: true, delivered: true }` even when Cloudflare API or webhook integrations were not configured.
- **Fix**: Returns HTTP 501 `Not Implemented` when external providers are unconfigured, eliminating fabricated success reporting. Sensitive credentials and internal user IDs are stripped from responses.

### Auth UI Domain Binding & Validation (Phase 27)
- **Problem**: Sign-in/sign-up UI selected email domains without validating against institutional allowed domains.
- **Fix**: Connected input binding directly to authentication handlers with server-side validation rejecting generic personal domains (`gmail.com`, `yahoo.com`, `outlook.com`) and verifying accredited `.edu` / `.ac.in` domains.

---

## 5. Files Changed & Audited

| Domain | Key Files Modified |
|---|---|
| **Merchant Authentication** | `src/lib/merchant-auth.ts`, `src/lib/merchant-session.ts`, `src/app/api/merchant/auth/me/route.ts`, `src/app/merchant-portal/(portal)/layout.tsx` |
| **Merchant Tenancy** | `src/app/api/merchant/bikes/availability/route.ts`, `src/app/api/merchant/bikes/bookings/[id]/inspection/route.ts`, `src/app/api/merchant/bikes/bookings/[id]/status/route.ts`, `src/app/api/merchant/orders/[id]/status/route.ts`, `src/app/api/merchant/products/route.ts`, `src/app/api/merchant/products/[productId]/route.ts` |
| **Content & Social** | `src/app/api/posts/[id]/route.ts`, `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/poll-vote/route.ts`, `src/app/api/posts/[id]/comments/route.ts`, `src/app/api/posts/[id]/comments/[commentId]/vote/route.ts`, `src/lib/communities.ts` |
| **Dating & Follows** | `src/app/api/dating/swipe/route.ts`, `src/lib/follows.ts` |
| **Marketplace** | `src/app/api/marketplace/checkout/route.ts` |
| **Events** | `src/app/api/events/[id]/register/route.ts`, `src/app/api/events/[id]/route.ts`, `src/db/schema/events.ts` |
| **Academics** | `src/app/api/academics/[id]/analytics/route.ts`, `src/db/schema/academic-resources.ts` |
| **MCP Platform** | `src/lib/mcp/auth.ts`, `src/lib/mcp/tool-executors.ts`, `src/app/api/mcp/route.ts`, `src/app/api/mcp/sse/route.ts` |
| **Communities** | `src/app/api/communities/[id]/members/route.ts` |
| **Storage & Admin** | `src/app/api/upload/route.ts`, `src/app/api/files/r2/[...key]/route.ts`, `src/lib/r2.ts`, `src/app/api/admin/composio/route.ts` |
| **Auth UI** | `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, `src/components/auth/auth-form-card.tsx`, `src/lib/institutions.ts`, `src/app/api/auth/validate-domain/route.ts` |

---

## 6. Database Constraints Added

1. **`event_registrations_event_profile_idx`**: Unique constraint on `(eventId, profileId)` preventing duplicate registrations.
2. **`academic_votes_res_profile_idx`**: Unique constraint on `(resourceId, profileId)` in `academicResourceVotes` ensuring exactly one vote per student.
3. **`poll_votes_user_post_idx`**: Conflict guard on `(userId, postId)` for poll votes.
4. **`comment_votes_user_comment_idx`**: Conflict guard on `(userId, commentId)` for comment votes.
5. **`follows_follower_following_idx`**: Unique edge indexing on follower-following pairs.

---

## 7. Automated Test Suite Results

All tests run via `bun test`:

```
========================================================================================
Test Suite                                         Passed   Failed   Assertions   Time
========================================================================================
tests/merchant-auth.test.ts                            24        0           49   77ms
tests/content-security.test.ts                         34        0           90  483ms
tests/integrity.test.ts                                19        0           72   77ms
tests/mcp-auth.test.ts                                 20        0           65   68ms
src/lib/merchant-auth.test.ts                           9        0           19   10ms
----------------------------------------------------------------------------------------
TOTAL                                                 106        0          295  715ms
========================================================================================
```

---

## 8. Remaining Known Limitations & Future Hardening Recommendations

1. **Distributed Rate Limiting**: The current deduplication layer utilizes Upstash Redis with a memory fallback. In high-traffic multi-region clusters, ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are active across all edge deployments.
2. **Storage Antivirus / Malware Scanning**: Cloudflare R2 file uploads currently validate file extensions, MIME signatures, and size. Adding asynchronous background malware analysis for user-uploaded academic PDFs via Cloudflare Worker integrations is recommended.
3. **Audit Trail Streaming**: Sensitive operations (privilege modifications, merchant status transitions, and bulk exports) record durable audit logs in PostgreSQL. Long-term streaming to a cold S3/BigQuery vault is suggested as user volume scales.
