# 🎯 CampusLoop Product Specification: Streaks & Daily Missions

## 1. Product Vision & Philosophy
CampusLoop is a verified, student-only campus social network and utility operating system for 1,350+ universities across India.

### The Loop Engine:
$$\text{Daily Mission} \longrightarrow \text{Meaningful Campus Activity} \longrightarrow \text{Loop Points (LP)} \longrightarrow \text{Streaks \& Milestones} \longrightarrow \text{Long-Term Campus Retention}$$

### The Core Principle:
> **One meaningful campus action a day is enough to keep your loop alive.**

No spam, no guilt-tripping mechanics, no artificial cliffhangers.
Calm, motivating product tone:
- "Keep your loop going"
- "You're on a 12-day run"
- "One meaningful action keeps it alive"
- "Your streak is safe today"

---

## 2. Qualifying Streak Activities (`STREAK_QUALIFYING_EVENTS`)
Streaks reward authentic campus engagement, not empty clicks.

### Eligible Activities:
1. `POST_CREATE`: Creating a post, discussion, confession, or poll.
2. `POLL_VOTE`: Voting in a campus poll.
3. `COMMENT_CREATE`: Contributing a comment or answer to a peer.
4. `ACADEMIC_UPLOAD`: Sharing semester exam PYQs or verified notes.
5. `ACADEMIC_BOOKMARK`: Star/saving a study pack or lecture notes.
6. `COMMUNITY_JOIN`: Joining a club, tech chapter, or interest community.
7. `EVENT_RSVP`: Registering for a hackathon or campus fest.
8. `UTILITY_LIST`: Listing an item on Buy & Sell, listing a flat/room on Housing, reporting a Lost & Found item, or offering a Ride Share pool.
9. `DAILY_MISSION_COMPLETE`: Completing the active daily campus prompt.

### Strictly Disqualified:
- Opening the app / background refresh
- Visiting profiles or passive browsing
- Repeated upvoting/unvoting
- Self-reward / bot manipulation

---

## 3. Authoritative Streak Engine & Invariants
1. **Server-Side Authoritative**: Computed in `Asia/Kolkata` (IST) date boundaries. Browser clocks are never trusted.
2. **Strict Idempotency**: Exactly 1 streak event per `(userId, localDate)`. Subsequent qualifying actions on the same calendar day update today's activity log without double-incrementing.
3. **Streak States**:
   - `First Day`: `currentStreak = 1`
   - `Same Day`: Idempotent no-op on streak counter. `isSafeToday = true`.
   - `Consecutive Day`: `lastQualifiedDate === yesterday` $\to$ `currentStreak += 1`.
   - `Missed Day`: `lastQualifiedDate < yesterday` $\to$ Reset `currentStreak = 1`. `longestStreak = max(longestStreak, previous)`.
4. **Milestone Progression**:
   - 3 Days: +15 LP
   - 7 Days: +25 LP (`STREAK_7_DAY_BONUS`)
   - 14 Days: +50 LP
   - 30 Days: +100 LP (`STREAK_30_DAY_BONUS`)
   - 60 Days: +150 LP
   - 100 Days: +250 LP
   - 180 Days: +500 LP
   - 365 Days: +1000 LP
5. **Zero Duplicate Milestone Exploits**: Each milestone tier is tracked in `user_streak_milestones` ensuring bonus LP is awarded exactly once per milestone reached.

---

## 4. UI Surfaces & Impeccable Design Standard
- **Home / Feed (`src/components/streaks/streak-banner.tsx`)**: Asymmetric, airy card integrated above or beside feed. Displays current streak count with flame iconography, 7-day dot/ring tracker (`M T W T F S S`), status copy, and context-aware action CTA.
- **Feed Header & Navigation (`src/components/streaks/streak-badge.tsx`)**: Minimalist status pill with flame indicator and streak count.
- **Profile (`src/components/streaks/profile-streak-card.tsx`)**: High-trust streak summary displaying current streak, longest streak, total qualified days, and unlocked milestone badges.
- **Milestone Modal (`src/components/streaks/streak-milestone-modal.tsx`)**: Restrained celebratory confirmation when a student crosses a milestone.
