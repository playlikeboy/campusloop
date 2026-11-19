# Analytics

CampusLoop measures two things in two places:

- **Google Analytics 4** (property `properties/552908204`, measurement id `G-3546ZQ6HB1`): traffic, pages and product events from the browser.
- **Admin analytics** (`/admin/analytics`): numbers computed from our own database (real students only), plus a GA4 traffic section.

## Code

| What | Where |
| --- | --- |
| gtag wrapper, user properties, event helpers | `src/lib/analytics/ga4.ts` |
| Script tag, SPA page views, user properties, user_id, inferred sign_up/login | `src/components/analytics/google-analytics.tsx` |
| Admin page | `src/app/admin/analytics/` |
| Product SQL (real users = `user_profiles.is_seeded = false`) | `src/app/admin/_lib/analytics-queries.ts` |
| GA4 live fetch (Composio) and stored snapshot | `src/app/admin/_lib/ga4-report.ts` |
| Store a snapshot by hand | `scripts/analytics/store-ga4-snapshot.ts` |

Every event goes through `gtagEvent(name, params)`, which adds `is_pwa`, `theme` and `timestamp`. Call helpers only after the action succeeded on the server. There is no cookie banner or consent mechanism in the app today; if one is added, gate `GoogleAnalyticsScripts` on it and send `gtag('consent', ...)` before `config`.

## Events

GA4 recommended events keep their standard names so GA4 reports pick them up.

| Event | Type | Parameters | Fired when | Helper |
| --- | --- | --- | --- | --- |
| `page_view` | auto | `page_path`, `page_title`, `content_group` | Every client route change | `trackPageView` |
| `sign_up` | recommended, **key event** | `method` (`hexclave`) | Profile loads and was created < 15 min ago, first time on this browser | `trackAuthFromProfile` |
| `login` | recommended | `method` (`hexclave`) | A profile id this browser has not reported yet (new device or after sign-out) | `trackAuthFromProfile` |
| `tutorial_complete` | recommended | `feature` (`onboarding`) | Onboarding form saved | `trackOnboardingComplete` |
| `post_create` | custom, **key event** | `content_type` (`post`/`confession`/`poll`), `anonymous`, `feature` | Post, confession or poll published | `trackPostCreate` |
| `vote` | custom | `content_type`, `item_id`, `direction` (`up`/`down`/`remove`) | Vote on post, poll, comment, article | `trackVote` |
| `comment_create` | custom | `content_type`, `item_id`, `anonymous` | Comment posted | `trackCommentCreate` |
| `share` | recommended | `method` (`native`, `copy_link`, `whatsapp`, ...), `content_type`, `item_id` | Share sheet or link copied | `trackShare` |
| `search` | recommended | `search_term`, `scope` | Search submitted / result opened | `trackSearch` (academics: `trackAcademicSearch`) |
| `select_content` | recommended | `content_type`, `item_id` | Content picked from a list | `trackSelectContent` |
| `event_register` | custom, **key event** | `event_id`, `content_type` | Event registration confirmed | `trackEventRegister` |
| `course_enroll` | custom, **key event** | `course_id` (course slug), `content_type` | Course enrolled | `trackCourseEnroll` |
| `lecture_complete` | custom | `course_id`, `lecture_id`, `content_type` | Lecture marked done | `trackLectureComplete` |
| `chat_send` | custom | `scope` (`dm`/`group`/`story_reply`), `content_type` | Chat message sent | `trackChatSend` |
| `community_join` | custom | `community_id`, `content_type` | Joined a community | `trackCommunityJoin` |
| `streak_qualify` | custom | `streak`, `feature` | First qualifying action of the day | `trackStreakQualify` |
| `follow` | custom | `content_type` (`user`), `item_id` (username) | Followed a student | `trackFollow` |
| `apk_download` | custom, **key event** | `placement` (`download_page`, ...), `method` (`github_release`) | Android beta download clicked | `trackApkDownload` |
| `crush_send` | custom | `feature` (`secret_crush`) | Secret crush sent | `trackCrushSend` |
| `notification_open` | custom | `content_type` (notification type) | Notification clicked | `trackNotificationOpen` |
| `board_view` | custom | `tab` (`rides`/`housing`/`lost-found`/`sell`), `content_group` | Campus board tab shown | `trackBoardView` |

Older events that still fire: `academic_material_view`, `academic_download`, `academic_guest_limit_reached`, `academic_vote`, `academic_source_engagement`, `feed_filter_change`, `post_engagement`, `dating_swipe`, `dating_match_unlocked`, `auth_modal_prompted`, `auth_modal_action`, `pwa_install_prompt_outcome`, plus GA4 enhanced measurement (`scroll`, `video_*`, `file_download`, `form_*`, `click`).

## User properties

Set on every profile load by `GoogleAnalyticsTracker`.

| Property | Values |
| --- | --- |
| `cl_user_type` | `guest`, `student`, `admin` |
| `cl_institution` | College name |
| `cl_institution_id` | College id |
| `cl_branch` | Branch |
| `cl_semester` | `year × 2` (approximate) |
| `cl_points_tier` | `bronze`, `silver` (200+), `gold` (500+), `campus_legend` (1000+) |
| `cl_anon_mode` | `all`, `no_anon` |
| `cl_verified` | `yes` / `no` (college email verified) |
| `cl_grad_year` | Estimated: academic year end + (4 − year of study) |
| `cl_platform` | `web`, `pwa` (display-mode standalone), `android` (user agent contains `CampusLoopApp`) |
| `cl_signup_week` | ISO week of profile `createdAt`, e.g. `2026-W47` |

`user_id` is set to the CampusLoop **profile id** (never email or name) with `gtag('config', ..., { user_id })` for signed-in students, and cleared on sign-out.

## Manual steps in GA4 Admin

Composio's GA connection is read-only, so a human has to do these once in GA4 → Admin → property `552908204`.

1. **Custom definitions → Create custom dimension**, scope **User**, user property name = dimension name:
   `cl_user_type`, `cl_institution`, `cl_branch`, `cl_semester`, `cl_points_tier`, `cl_anon_mode`, `cl_verified`, `cl_grad_year`, `cl_platform`, `cl_signup_week`.
2. **Custom definitions → Create custom dimension**, scope **Event**, event parameter = dimension name:
   `content_type`, `method`, `feature`, `content_group`, `anonymous`, `scope`, `placement`, `tab`.
3. **Key events → New key event** (or star the event once it has fired): `sign_up`, `post_create`, `event_register`, `course_enroll`, `apk_download`.
4. Optional: **Data streams → Web → Configure tag settings → Define internal traffic** for your own IP, and **Data filters** to exclude it.
5. Optional: **Data settings → Data collection → User-ID** reporting identity "Blended" so `user_id` merges devices.

Custom dimensions only show data from the moment they are created; nothing is backfilled.

## Admin analytics page

`/admin/analytics` (admin only, linked as "Analytics" in the admin nav).

- **Real users** = `user_profiles.is_seeded = false`. Seed/demo accounts have `is_seeded = true` and are left out everywhere.
- **Active** = `user_profiles.last_seen_at` (presence heartbeat) in the last 1 / 7 / 30 days. Stickiness = DAU ÷ MAU.
- **Activation**: signed up → onboarding done → first post, comment, vote, poll vote, course enroll or event registration within 7 days of signup.
- **Retention**: signup-week cohorts (last 8 weeks, India time), share active in weeks 1–4 after signup. Active = any recorded action (content, votes, enrolls, lecture progress, messages, streak days, community joins, swipes, stories, behaviour events). Visits without an action do not count.
- **Feature usage**: distinct real students and total actions over 30 days per feature.
- All SQL runs in parallel; the payload is cached 5 minutes per worker isolate (`IsolateCache`).

### GA4 section

- If `COMPOSIO_API_KEY` and `COMPOSIO_GA_ACCOUNT_ID` are set, the page calls Composio `POST https://backend.composio.dev/api/v3/tools/execute/GOOGLE_ANALYTICS_BATCH_RUN_REPORTS` (two batches of ≤ 5 reports, 8 s timeout, cached 15 minutes). The **Refresh from GA4** button fetches live and stores the result as the snapshot.
- Otherwise it reads `platform_settings` key `ga4_snapshot`. Store one by hand:

  ```sh
  bun run scripts/analytics/store-ga4-snapshot.ts path/to/ga4-snapshot.json
  ```

  The script upserts that one key only. Snapshot shape is documented at the top of `src/app/admin/_lib/ga4-report.ts`.
- Bot note: most "Direct" desktop traffic from Singapore, Brazil, the US and China is bots. India is the real audience, so the page shows India users, India landing pages and India devices first.
