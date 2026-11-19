# CampusLoop mobile API (Android app)

Shapes below come from the route code. Errors are `{ "error": string }` unless noted. Timestamps are ISO strings. IDs are text.

Every `/api/*` route that works with the web cookie also works with the app's bearer token: auth goes through `getCachedAuthUser()` / `requireProfile()` (`src/lib/server-cache.ts`). Common auth errors: 401 `{error:"Unauthorized"}`; 404 or 403 `{error:"Profile not found"}`; 403 `{error, viewerMode:true}` for read-only (VIEWER) accounts on writes.

Base URL: `https://campusloop.space` (local dev: `http://localhost:<port>`).

## 1. Auth: OAuth 2.0 authorization code + PKCE

The app signs in through CampusLoop's own OAuth server. It is a public client (no secret) and must use PKCE (S256).

| Setting | Value |
| --- | --- |
| `client_id` | `campusloop-android` |
| `redirect_uri` | `campusloop://oauth` |
| scopes | `openid profile offline_access app` |
| authorize URL | `https://campusloop.space/oauth/authorize` |
| token URL | `https://campusloop.space/oauth/token` |
| revoke URL | `https://campusloop.space/oauth/revoke` |
| userinfo URL | `https://campusloop.space/oauth/userinfo` |
| discovery | `https://campusloop.space/.well-known/openid-configuration` |

The `app` scope is first-party only. It is what lets the access token call `/api/*` as the signed-in student. Only `campusloop-android` can get it. Without `app`, `/api/*` answers 401.

### 1.1 Authorize (open in a browser tab, e.g. `expo-auth-session` / `WebBrowser.openAuthSessionAsync`)

```
GET /oauth/authorize
  ?response_type=code
  &client_id=campusloop-android
  &redirect_uri=campusloop%3A%2F%2Foauth
  &scope=openid%20profile%20offline_access%20app
  &state=<random>
  &code_challenge=<base64url(sha256(verifier)), 43 chars>
  &code_challenge_method=S256
```

- Not signed in on the web: the page sends the student to `/sign-in` and comes back.
- Profile not onboarded: the page shows "Finish setting up CampusLoop". The app should tell the student to finish onboarding on the web (or open `https://campusloop.space/onboarding`).
- First-party app: no consent screen. The browser redirects straight to
  `campusloop://oauth?code=<code>&state=<state>&iss=https%3A%2F%2Fcampusloop.space`.
- Errors come back as `campusloop://oauth?error=<code>&error_description=<text>&state=<state>`.
- The code lives 60 seconds and works once.

### 1.2 Token exchange

`POST /oauth/token`, `Content-Type: application/x-www-form-urlencoded`

```
grant_type=authorization_code
code=<code>
redirect_uri=campusloop://oauth
client_id=campusloop-android
code_verifier=<verifier>
```

Response 200:

```json
{
  "access_token": "<JWT, typ at+jwt>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile offline_access app",
  "id_token": "<JWT>",
  "refresh_token": "cl_rt_..."
}
```

Errors (400/401): `{ "error": "invalid_grant" | "invalid_client" | "invalid_request" | "invalid_scope" | "unsupported_grant_type", "error_description": "..." }`.

### 1.3 Refresh (rotating)

`POST /oauth/token` (form-encoded)

```
grant_type=refresh_token
refresh_token=<refresh_token>
client_id=campusloop-android
```

Same response shape, with a NEW `refresh_token`. Store it and drop the old one. Reusing an old refresh token revokes the whole session family, so never refresh twice in parallel (serialize refreshes behind one promise). Refresh tokens last 30 days. Access tokens last 1 hour.

### 1.4 Calling the API

Send `Authorization: Bearer <access_token>` on every `/api/*` call. On a 401, refresh once and retry. If the refresh fails with `invalid_grant`, sign the student out locally.

The server checks signature, issuer, expiry, `client_id == campusloop-android`, the `app` scope, and that the grant is not revoked (cached for up to 30 seconds). If the request also carries a web session cookie, the cookie wins.

### 1.5 Sign out

1. `DELETE /api/push/devices` with this device's Expo token (see below).
2. `POST /oauth/revoke` (form-encoded): `token=<refresh_token>&client_id=campusloop-android`. Always 200.
3. Delete the tokens from SecureStore.

The access token stays valid until it expires (max 1 hour). Revoking the app under web Settings > Connected apps cuts access tokens off within 30 seconds.

## 2. Push notifications (Expo)

### `POST /api/push/devices`

Body: `{ "token": "ExponentPushToken[...]", "platform": "android" }` (`platform`: `android` | `ios`, default `android`).
Response 200: `{ "ok": true }`. Call it after sign-in and whenever the Expo token changes. Calling it again with the same token is fine (it moves the token to the current account and bumps `last_seen_at`).

### `DELETE /api/push/devices`

Body: `{ "token": "ExponentPushToken[...]" }`. Response 200: `{ "ok": true }`. Only removes the token if it belongs to the caller.

Errors: 400 `{error:"Invalid Expo push token"}` (must match `ExponentPushToken[...]` or `ExpoPushToken[...]`), 401, 503 `{error:"Push is not available yet"}` until the server table exists (retry on next launch).

Push message: Android channel `default`, `priority` `high` for messages and matches. `title`/`body` are generic text (never the message or comment itself). `data`:

```json
{ "url": "/post/<id>" | "/chat/<id>" | "/events/<id>" | "/@<username>" | "/story/<id>" | "/articles/<slug>" | "/dating" | "/notifications",
  "type": "LIKE" | "COMMENT" | "REPLY" | "MENTION" | "MESSAGE" | "MATCH" | "FOLLOW" | "...",
  "referenceId": "<id or null>" }
```

The app maps `url` to a screen and falls back to the notifications list.

## 3. Endpoints

## Feed

### GET /api/feed
Auth optional. Response is a **bare JSON array** (no wrapper and no cursor).

Query:
| param | default | notes |
|---|---|---|
| `scope` | none | `CAMPUS` filters to viewer's institution (or `targetInstitutionIds` for VIEWER role). Any other value applies no campus filter. Not `GLOBAL`, so campus affinity is still used in ranking. |
| `type` | all | `MEME`/`memes` -> type MEME; `MEDIA`/`media` -> body ILIKE image patterns; `ALL`/`all` -> none; else exact post type enum: `NORMAL, ANONYMOUS, CONFESSION, POLL, QUESTION, MEME, EVENT, LOST_FOUND` (invalid enum value -> 500) |
| `sort` | `latest` | `for_you, reels, latest, trending, viral, memes, spicy, top_voted, most_discussed, random`; `top` -> `trending`; unknown -> `latest`. A ranked sort that takes over 5s falls back to `latest`. |
| `visibility` | from profile | `anonymous` -> only isAnonymous=true; `public`/`non_anonymous`/`NON_ANONYMOUS` -> only isAnonymous=false; `all` -> none. With no param, uses the profile's `feedVisibility` (`NON_ANONYMOUS` hides anon). **Ignored when `type=CONFESSION`.** |
| `page` | 1 | min 1 |
| `limit` | 20 | 1..50 |
| `before` | none | ISO timestamp. Gives `createdAt < before` and is used as a **scroll-session snapshot**. Web sets it once per session. |
| `seed` | none | int; stable order for `sort=random` |
| `hashtag` | none | `#` optional; body ILIKE match |
| `authorId` / `authorUsername` | none | author's posts, non-anonymous only |
| `excludeIds` / `seenIds` (or header `x-seen-ids`) | none | comma list, `[A-Za-z0-9_-]`, max 500 ids excluded |

**Confessions filter: `type=CONFESSION`**, as used by the web `ConfessionsFeed` with `useFeed(scope,"CONFESSION",sort,"all",tag,seed)`. Web sorts are `latest|trending|top_voted`. There is no `tab`/`filter` param. `visibility=anonymous` is a broader "all anonymous posts" filter.

**Pagination**: offset-based. Request `page=N&limit=L&before=<sessionStartISO>`. The end is reached when a page returns fewer than `limit` items. There is no `nextCursor`.

Logged-out responses with no seen/exclude ids are edge-cached for 30s (`X-Feed-Cache` header).

Item shape (`formatApiFeedPosts`, `src/lib/feed.ts:678`):
```json
[{
  "id":"str","authorId":"str|null","pseudonym":"str|null","institutionId":"str",
  "type":"NORMAL|CONFESSION|POLL|...","scope":"CAMPUS|STATE|INDIA|GLOBAL",
  "title":"str|null","body":"markdown str","isAnonymous":false,"isEdited":false,
  "repostOfId":"str|null","repostComment":"str|null","status":"PUBLISHED",
  "riskScore":0,"communityId":"str|null","isSeeded":false,"createdAt":"iso","updatedAt":"iso",
  "author":{"id","username","displayName","avatarUrl","points":0,"role","isCollegeVerified":false},
  "institution":{"id","name","slug","logoUrl"},
  "community":{"id","name","avatarUrl"} ,
  "pollOptions":[{"id":"str","text":"str","votesCount":0,"userVoted":false}],
  "hasVotedPoll":false,"totalPollVotes":0,
  "votesCount":0,"commentsCount":0,"userVote":0,
  "topComment":{"id","body","createdAt","isAnonymous","pseudonym","author":{"id","username","displayName","avatarUrl","points"}|null}|null,
  "repostOf":{ "...raw post row + author{...}/institution{...}; author key removed if anonymous" }|null,
  "externalPost":{"id","source","externalId","subreddit","externalAuthor","permalink","canonicalUrl","score","commentCount","contentType",
                  "media":[{"id","mediaType","mediaUrl","previewUrl","thumbnailUrl","hlsUrl","dashUrl","width","height","duration","isGif","position"}]}|null,
  "socialContext":{"actors":[{"id","username","displayName","avatarUrl","actions":["LIKE|COMMENT|REPOST"],"latestAt"}],"totalActors":0}|null,
  "_counts":{"commentCount":0,"voteScore":0}
}]
```
- The `author` key is **absent** (not null) on anonymous posts; anon posts have `authorId: null` and carry `pseudonym`.
- `pollOptions` is `[]` for non-polls (or undefined if the relation is missing).
- **Media is not a field.** It is embedded in `body` as markdown: `![Image](url)`, `![video:Title](url)`, `![voice:Title](url)`, `![document:name:size](url)`.
- Errors: 500.

---

## Posts

### POST /api/posts
Auth: requireProfile(403) and viewer-write block. Content-Type JSON.
| field | type | rules |
|---|---|---|
| `body` | string | **required**, trimmed non-empty, max 2000 (`MAX_POST_CHARS`). Media goes inline as markdown (see feed). |
| `title` | string | optional, max 200 |
| `type` | string | default `NORMAL`; upper-cased; allowlist as in feed enum |
| `scope` | string | default **`GLOBAL`**; `CAMPUS|STATE|INDIA|GLOBAL` |
| `isAnonymous` | bool | default false. A **confession = `type:"CONFESSION"`**. The server always stores confessions as anonymous, whatever `isAnonymous` says. |
| `options` | string[] | required when `type=POLL`: 2..6 distinct non-empty trimmed strings |
| `communityId` | string | optional; checked by `assertCanCreateCommunityPost` (404 not found / 403 banned, not member, anon not allowed) |

There is no media/attachments field. Anon posts store `authorId:null` and `pseudonym = profile.anonymousUsername ?? HMAC handle`.

Response 201: the raw inserted `posts` row. It has no author/institution relations and no pollOptions.
```json
{"id","authorId":null,"pseudonym","institutionId","type","scope","title","body","isAnonymous","isEdited":false,"repostOfId":null,"repostComment":null,"status":"PUBLISHED|PENDING_REVIEW","riskScore":0,"communityId","isSeeded":false,"createdAt","updatedAt"}
```
Errors: 400 (validation, or safety block `{error,messages[],riskScore}`), 401, 403, 404 (community), 500. Side effects: author +5 points, streak, mentions, follower notifications.

### GET /api/posts/:id
Auth optional. 404 if missing, DELETED, or non-PUBLISHED and the viewer is not the author or staff.
```json
{"id","type","scope","title","body","isAnonymous","pseudonym","isEdited","repostOfId","repostComment","status","createdAt","updatedAt",
 "institutionId","institution":{"id","name","slug","state"}|null,
 "communityId","community":{"id","name","slug","avatarUrl"}|null,
 "authorId":"str|null","author":{"id","username","displayName","avatarUrl","branch","year","institutionId"}|null,
 "votesCount":0,"upvotesCount":0,"downvotesCount":0,"voteScore":0,"userVote":-1|0|1,
 "commentsCount":0,
 "pollOptions":[{"id","text","voteCount":0,"selectedByViewer":false}],
 "comments":[{"id","postId","body","createdAt","isAnonymous","pseudonym","likesCount","repliesCount","parentId","imageUrl","isPinned","authorId","author":{"id","username","displayName","avatarUrl","branch","year"}|null}]}
```
Note: the poll option keys **differ from feed** (`voteCount`/`selectedByViewer` vs `votesCount`/`userVoted`). `comments` holds the first 200 published comments, oldest first, flat (replies included, keyed by `parentId`). `commentsCount` is capped at 200.

### PATCH /api/posts/:id
Auth: requireProfile(403) and viewer block. Owner (incl. anon owner via vault) or ADMIN/MODERATOR.
Body: `body` string **required** (non-empty, max 2000), `title` string|null (empty -> null; omitted keeps old), `scope` (any string, not validated).
Response: `{ "success":true, "message":"Post updated successfully", "post": <raw posts row> }`. Sets `isEdited:true`.
Errors: 400 (empty/too long/deleted/safety), 401, 403, 404, 500.

### DELETE /api/posts/:id
Auth as PATCH. Soft delete (`status=DELETED`). Response `{ "success":true, "message":"Post deleted successfully" }`. Errors 401/403/404/500.

### POST /api/posts/:id/vote
Auth: requireProfile(403) and viewer block. Body `{ "value": 1 | -1 | 0 }` (0 = remove).
Response (post): `{ "message":"Vote cast|Vote updated|Vote confirmed|Vote removed", "userVote": -1|0|1 }`. There is **no new count**, so the client must adjust it locally.
Response (id is a reel): `{ "message", "userVote":0|1, "votesCount": likes }`.
Errors: 400 invalid value, 401, 403, 404, 500.

### GET /api/posts/:id/comments
Auth optional (adds `hasLiked`).
Query: `limit` default 50, range 1..100; `before` = ISO createdAt (returns older comments).
Returns the newest `limit` comments, re-sorted **oldest first**. The list is **flat**: top-level and replies, no `parentId` filter. The response is a bare array. To get the next page, pass `before = items[0].createdAt`.
```json
[{"id","postId","authorId":"str|null","parentId":"str|null","replyToUserId":"str|null","pseudonym","body","imageUrl","isAnonymous","isPinned":false,
  "likesCount":0,"repliesCount":0,"status","createdAt","updatedAt","hasLiked":false,
  "author":{"id","username","displayName","avatarUrl","points","institutionId"}|null,
  "replyToUser":{"id","username","displayName"}|null}]
```
For a reel id the item shape is reduced (no parentId or replyToUser), oldest first, with no limit. Errors: 500.

### POST /api/posts/:id/comments
Auth: requireProfile(403) and viewer block.
Body: `body` string **required** (non-empty; no max length), `isAnonymous` bool, `parentId` string (must belong to the post and not be deleted), `replyToUserId` string, `imageUrl` string.
Response 201: the raw comment row plus `{hasLiked:false, likesCount:0, repliesCount:0, isPinned:false, author:{id,username,displayName,avatarUrl,points,institutionId}|null}`.
Errors: 400 (empty, safety, post deleted/unpublished, bad parent), 401, 403, 404 (post/parent), 500.

### GET /api/posts/:id/comments/:commentId/replies
Auth optional. Query: `limit` default 10, range 1..30; `cursor` = ISO createdAt (returns newer replies). Oldest first.
```json
{"replies":[ /* same item shape as comments GET, author null if anon */ ],"nextCursor":"iso|null"}
```
Errors: 500.

### POST /api/posts/:id/save · DELETE /api/posts/:id/save · GET /api/posts/:id/save
Auth: getCachedAuthUser (401 / 404 profile). Post or reel id.
- POST -> `{ "success":true, "saved":true }` (idempotent); 404 if no post/reel.
- DELETE -> `{ "success":true, "saved":false }`.
- GET -> `{ "saved": bool }`. Never errors; returns false when signed out.

### POST /api/posts/:id/report
Auth: requireProfile(403). Body: `reason` string **required** (trimmed, stored up to 500 chars), `details` string optional (up to 2000).
Response 201 `{ "message":"Post reported successfully" }`. Errors: 400, 401, 403, 404, **409 duplicate report**, 500. At 5 or more distinct reporters the post becomes PENDING_REVIEW.

---

## Media upload

### POST /api/upload
Auth: Hexclave session cookie (or server `UPLOAD_API_KEY`). Rate limit 30/min. **multipart/form-data**:
| field | notes |
|---|---|
| `file` | **required** File. Extension allowlist: jpg jpeg png webp gif avif heic mp4 webm mov m4v mp3 wav ogg m4a aac pdf docx doc pptx ppt xlsx xls txt csv zip epub. SVG, HTML and scripts are rejected. |
| `category` | `image|video|audio|document|file|academic_html|private|student_doc|id_card|verification`. Default `auto` (detected from MIME). |
| `storage`/`provider` | `r2` forces R2 (skips imgbb for images) |
| `isPrivate`=`"true"` / `privacy`=`"private"` | private document path |

Limits: image 15MB, video 75MB, audio 30MB, document 50MB, html 3MB, other 30MB.
Response 200:
```json
{"url":"str","displayUrl":"str (image only)","thumbUrl":"str (image only)","type":"image|video|audio|document|html|file","name":"sanitized filename","size":123,"provider":"imgbb|r2","isPrivate":false}
```
(`isPrivate` is returned for documents only.) Errors: 400 (none/empty/type/size), 401, 503 (R2 unavailable), 500.
The web post composer (`post-composer.tsx:226-316, 512-535`) uploads images via `uploadImageToImgBB` (direct imgbb, falling back to `/api/upload`) and video/docs via `/api/upload`. It then appends markdown to `body` before calling `POST /api/posts`.

---

## Events

### GET /api/events
Auth optional. Query:
| param | default | values |
|---|---|---|
| `category` | ALL | slug mapped to eventType (`hackathon(s)`, `coding`, `quiz`, `fest(s)`, `cultural`, `workshop(s)`, `bootcamp`, `competition(s)`, `case-study`, `seminar(s)`, `conference(s)`, `hiring`, `sports`, `gaming`, `contest(s)`, `internship(s)`, `scholarship(s)`, `fellowship(s)`, `grant(s)`, `job(s)`, `meetup(s)`). Otherwise the value is upper-cased as-is. |
| `scope` | ALL | `MY_CAMPUS`, `REGISTERED` (guest -> empty), `HOSTED`/`ORGANIZED`/`MY_EVENTS` (401 if guest; includes drafts) |
| `mode` | ALL | `ONLINE`, `OFFLINE` (incl. IN_PERSON), `HYBRID` |
| `status` | ALL | `ACTIVE`, `LIVE`, `CLOSING_SOON` (deadline ≤3d), `UPCOMING`, `CLOSED` |
| `participationType` | ALL | `SOLO`, `TEAM` (both include `BOTH`) |
| `fee` | ALL | `FREE`, `PAID` |
| `hasPrizes` | false | `true` |
| `q` | "" | ILIKE on title/clubName/description/venue/tagline |
| `sort` | trending | `trending`, `closing_soon`, `highest_prize`, `upcoming`, `latest` (else newest start) |
| `limit` | 500 | 1..500 |
| `offset` | 0 | |
```json
{"events":[{"id","slug","title","tagline","description","bannerUrl","clubName",
  "organizer":{"id","username","displayName","avatarUrl"},"institution":{"id","name","slug","logoUrl"},
  "eligibleInstitutionIds":["ALL"],"eventType","mode","venue","meetingUrl","startDate","endDate","registrationDeadline",
  "participationType","minTeamSize","maxTeamSize","maxParticipants","isPaid","entryFee","prizesDescription","perks":["str"],
  "loopPointsReward":25,"status","attendeeCount":0,"attendedCount":0,"confirmedCount":0,
  "recentAttendees":[{"id","username","displayName","avatarUrl"}],
  "isRegistered":false,"userRegistration":{"id","profileId","reminderSet","status","registrationType","teamName","teamMembers","contactPhone","createdAt","profile":{...}}|null,
  "reminderSet":false,"isLiveNow":false,"isClosingSoon":false,"isClosed":false,"createdAt"}],
 "metrics":{"totalOpportunities":0,"liveHackathons":0,"cashPrizeCount":0,"totalPrizePool":"₹15,00,000+","totalRegistrations":0}}
```
Errors: 401 (organizer scopes), 500.

### GET /api/events/:idOrSlug
Auth optional. Query `manage=true` or `includeRegistrations=true` (organizer/admin only) adds `registrations[]`.
```json
{"event":{ "...all events columns (id, slug, title, tagline, description, bannerUrl, clubName, organizerProfileId, institutionId, eligibleInstitutionIds, eventType, mode, venue, meetingUrl, startDate, endDate, registrationDeadline, participationType, minTeamSize, maxTeamSize, maxParticipants, isPaid, entryFee, prizesDescription, perks, loopPointsReward, status, visibility, createdAt, updatedAt)",
  "organizer":{"id","username","displayName","avatarUrl"},"institution":{"id","name","slug","logoUrl"},
  "attendeeCount":0,"isRegistered":false,"userRegistration":{ "raw event_registrations row" }|null,"reminderSet":false}}
```
Here `attendeeCount` counts **people**: a team counts as 1 plus its teamMembers, and cancelled registrations are excluded. The list endpoint's `attendeeCount` counts registration rows. Errors: 404 (missing/draft), 403 (PRIVATE event, other campus), 500.

### POST /api/events/:idOrSlug/register
Auth: getCachedAuthUser (401/404) and capability `CREATE_POST` (403).
Body (JSON, all optional): `registrationType` `"SOLO"|"TEAM"` (default SOLO), `teamName` (required for TEAM), `teamMembers` array of `{name,email,rollNo,username}` (team size = 1 + length, within minTeamSize..maxTeamSize), `contactPhone`, `notes`.
Success:
```json
{"success":true,"message":"Successfully registered for event!","registration":{"id","eventId","profileId","registrationType","teamName","teamMembers","contactPhone","notes","status":"CONFIRMED","reminderSet":true},"pointsEarned":25}
```
Already registered -> 200 `{ "message":"Already registered", "registration":{...} }`.
Errors: 400 (cancelled/ended/not open/deadline passed/started/wrong participation type/team size), 403 (campus not eligible), 404, **409 `{error, code:"CAPACITY_EXCEEDED", currentParticipants?, maxParticipants?, spotsRemaining?}`**, 500.

### DELETE /api/events/:idOrSlug/register
Auth: getCachedAuthUser. Hard-deletes the registration. `{ "success":true, "message":"Registration cancelled" }`. Errors 401/404/500.

---

## Chat

### GET /api/chat
Auth: requireProfile(403). Bare array, up to 200 conversations, sorted pinned first, then by last activity.
```json
[{"id","type":"DIRECT|GROUP|COMMUNITY|<category>","isCommunity":false,"isGroup":false,"title":"str|null","createdAt","updatedAt",
  "otherParticipant":{"id","userId","username","displayName","avatarUrl","bio","institutionId","course","branch","year","points","lastSeenAt","isCollegeVerified"},
  "unreadCount":0,"isArchived":false,"isMuted":false,"isPinned":false,"lastClearedAt":"iso|null",
  "lastMessage":{"id","body","senderId","readAt","createdAt"}|null}]
```
For groups and communities, `otherParticipant` is synthetic: `{id,userId,displayName,username,avatarUrl,bio,points,isGroup:true,isCommunity?,category?,membersCount,participants?[]}`.

### POST /api/chat
Auth: requireProfile(403) and viewer block. Body:
- DM: `participantId` or `recipientId` (profile id) **required**. Optional `content`/`body` sends an opening message. Response **200 `{ "id": conversationId }`** (finds the existing DM or creates one).
- Group: `type:"GROUP"` or a non-empty `participantIds[]`; plus `title` (default "Campus Study Pod"), `avatarUrl`, `category`, `content`/`body` (welcome text). Response **201** in the full inbox-item shape above; `otherParticipant.participants` holds full profile rows.

Errors: 400 (no target / group < 2), 401, 403, 404 (target), 500.

### GET /api/chat/:id
Auth: requireProfile(403) and participant check (404).
```json
{"id","type","title","isGroup":false,"isCommunity":false,"otherParticipant":{...},"isArchived":false,"isMuted":false,"isPinned":false}
```
For a DM, `otherParticipant` carries public fields only: `id, userId, username, displayName, avatarUrl, bio, institutionId, course, branch, year, points, lastSeenAt, isCollegeVerified`.

### GET /api/chat/:id/messages
Auth: requireProfile(403) and participant check (404). Side effect: marks the peer's unread messages read.
Query: `limit` default 35, range 1..100; `before` = ISO createdAt (returns older messages). Bare array, **oldest first** (the newest `limit` messages, reversed). Next page: `before = arr[0].createdAt`.
```json
[{"id","conversationId","senderId","body","readAt":"iso|null","reactions":[{"emoji","userId","userDisplayName"}],"createdAt","updatedAt","sender":{"id","userId","username","displayName","avatarUrl","bio","institutionId","course","branch","year","points","lastSeenAt","isCollegeVerified"}}]
```

### POST /api/chat/:id/messages
Auth: as above, plus viewer block. Body `{ "body": string }` **required**, trimmed, max 4000 characters. Text only: no attachment field, so media goes in as a URL in the text.
Response 201: the message row plus `sender` (same public fields as above). 403 `{error:"You can't message this person"}` when a block exists between the two people in a DM. Errors 400/401/403/404/500.

---

## Notifications

### GET /api/notifications
Auth: requireProfile(404). Query `tab` (default `all`): `mentions` (MENTION), `replies` (COMMENT, ARTICLE_COMMENT, REPLY, STORY_REPLY), `reactions` (LIKE, REPOST, STORY_LIKE), `crushes` (CRUSH_ALERT, MATCH), `messages` (MESSAGE), `posts` (NEW_POST), `verified` (actor points ≥150 or ADMIN; filtered in JS). **Fixed limit of 60, newest first, no pagination.**
```json
{"notifications":[{"id","userId","type":"LIKE|COMMENT|...","actorId","referenceId":"str|null","previewText":"str|null","isRead":false,"createdAt",
   "actor":{"id","username","displayName","avatarUrl","points","institutionId","role","institution":{"id","name","slug"}|null}}],
 "unreadCount":0}
```
`referenceId` is usually a post id. For FOLLOW and FRIEND it is the actor's username. For CRUSH_ALERT, `actor` is replaced by a placeholder whose `id` is `"hidden"`.

### PATCH /api/notifications (mark read)
Body: `{ "all": true }` marks all read, or `{ "id": "<notificationId>" }` marks one. Anything else is a no-op. Response `{ "success":true }`.

### DELETE /api/notifications
Query: `id=<id>` -> `{success:true,deleted:"one"}`; `scope=read` -> deletes read notifications; `scope=all[&tab=<tab>]` -> deletes all (or one tab). No params -> 400.

### GET /api/notifications/unread-count
Auth: getCachedAuthUser. Always 200 `{ "unreadCount": 0 }`; returns 0 when signed out or on error.

---

## Profile

### GET /api/profile/me
Auth: getCachedAuthUser (401/404). Returns the **full user_profiles row** plus `institution` (full row):
```json
{"id","userId","username","displayName","officialName","email","avatarUrl","bannerUrl","headline","institutionId","course","branch","year","bio","gender","dob","isDobPrivate","interests":[],"photos":[],"targetInstitutionIds":[],"datingPreferences":{},"onboardingCompleted":true,"role":"STUDENT|VIEWER|ADMIN|MODERATOR","status":"ACTIVE","referralCount":0,"referredById","points":0,"anonymousUsername","feedVisibility":"ALL|NON_ANONYMOUS","socialLinks":{"platforms":{},"custom":[]},"lastSeenAt","isSeeded","isCollegeVerified","createdAt","updatedAt","institution":{...}}
```

### PATCH /api/profile/me
Auth: requireProfile(404). All fields are optional. Response: the updated full row, **without** `institution`.
| field | validation |
|---|---|
| `displayName` | 2..50 chars; must contain letters; letters/spaces/`-`/`.`/`'` only; no doubled spaces or punctuation |
| `username` | 3..30, `^[a-z0-9_]+$` (lower-cased), reserved names blocked, unique |
| `anonymousUsername` | null or "" clears it; else `@` stripped, lower-cased, `^[a-z0-9_]{3,24}$`, unique |
| `feedVisibility` | `"NON_ANONYMOUS"`, else stored as `"ALL"` |
| `gender` | `MALE|FEMALE|OTHER` |
| `dob` | string or null (not validated) |
| `isDobPrivate` | bool |
| `course`, `branch` | string, trimmed |
| `year` | number (`Number()` cast) |
| `bio` | max 300 |
| `headline`, `avatarUrl`, `bannerUrl` | string; empty becomes null |
| `photos` | string[]; first 6 kept, empties dropped |
| `interests` | array (not validated) |
| `socialLinks` | `{platforms:{<knownKey>:handleOrUrl}, custom:[{label≤30,url≤300}] (max 4)}`; unknown keys dropped |

Errors: 400 (all validation errors, including taken usernames), 401, 404, 500.

### GET /api/profile/:username
No auth. Exact-match username.
```json
{"id","username","displayName","avatarUrl","bio","institution":{ "full institutions row" },"course","branch","year","referralCount":0,"points":0,"createdAt"}
```
No follower counts and no `isFollowing`. Separate routes exist: `profile/[username]/followers|following|friends`. Errors 404/500.

### POST /api/profile/:username/follow · DELETE same
Auth: getCachedAuthUser. Response:
```json
{"isFollowing":true,"isFriend":false,"followersCount":0,"followingCount":0,"friendsCount":0}
```
Counts are the **target's**. DELETE returns `isFollowing:false, isFriend:false`. Errors: 400 (following yourself), 401, 403 (target not ACTIVE), 404 (viewer profile or target), 500.

---

## Streaks

### GET /api/streaks/me
Auth: getCachedAuthUser (401). Query `profileId` (optional) reads **any** profile's streak. Without it, uses the caller's (404 if no profile). Creates a streak row if missing.
```json
{"currentStreak":1,"longestStreak":1,"totalQualifiedDays":1,"isSafeToday":true,"lastQualifiedDate":"YYYY-MM-DD|null",
 "weeklyTracker":[{"date":"YYYY-MM-DD","dayLabel":"M","isToday":false,"isCompleted":true}],
 "historyDates":["YYYY-MM-DD"],
 "nextMilestone":{"days":7,"points":0,"title","badge","iconName":"Seedling|Flame|Zap|Star|Award|Crown|Trophy|Sparkles","description"}|null,
 "unlockedMilestones":[{...same}],
 "todayMission":{"dayOfWeek":0,"title","instruction","ctaLabel","ctaHref","qualifyingEvent":"POST_CREATE|COMMENT_CREATE|..."}}
```
Dates are in Asia/Kolkata local time.

---

## Communities

### GET /api/communities
Auth optional. Query: `limit` (default 24; if given, 1..50, and a non-numeric value gives 20), `page` (default 1), `sort` (`popular` = by points, anything else = newest), `category` (`All` = none), `q` or `search` (ILIKE on name/description). UNLISTED communities are excluded. Bare array. **Errors return `[]` with 200.**
```json
[{"id","name","slug","description","avatarUrl","bannerUrl","privacy":"PUBLIC|PRIVATE","category","rules","allowAnonymousPosts":true,"points":0,"inviteCode":"str|null","creatorId","createdAt","updatedAt",
  "creator":{"id","username","displayName","avatarUrl"},"membersCount":0,"memberCount":0,"isPrivate":false,"isMember":false}]
```

### GET /api/communities/:idOrSlug
Auth optional.
```json
{"...all community columns incl. inviteCode","creator":{"id","username","displayName","avatarUrl"},
 "members":[{"id","communityId","userId","role":"ADMIN|MEMBER|...","status":"ACTIVE|PENDING|BANNED","createdAt","user":{"id","username","displayName","avatarUrl","points"}}],
 "membersCount":0,"postsCount":0,"isMember":false,"memberRole":"str|null","memberStatus":"ACTIVE|PENDING|...|NONE","isAdmin":false}
```
`members` is **unbounded** and includes every status. Errors: 404 `{error:"Not Found",message}`, 500.

### POST /api/communities/:idOrSlug/join
Auth: getCachedAuthUser (401 `{error,message}`). No body. PRIVATE communities create a PENDING membership.
Response `{ "success":true, "joined":true|false, "status":"ACTIVE|PENDING" }`. Already a member -> `{success:true, alreadyMember:true, joined, status}`. Errors 401/404/500.

### POST /api/communities/:idOrSlug/leave (DELETE is an alias)
Auth: getCachedAuthUser. Response `{ "success":true, "joined":false }`. The creator cannot leave: **400** `{error:"Forbidden",message}`. Errors 401/404/500.

---

## 4. Safety and account (store requirements)

### POST /api/users/:idOrUsername/block · DELETE same
Auth required. `:idOrUsername` is a profile id or username (`@` optional).
Response 200: `{ "ok": true, "blocked": true|false, "userId": "<profile id>" }`. Errors: 400 (yourself), 404 (no such user).
Effect: the two people's posts drop out of each other's feed (both directions), and neither can start or continue a DM.

### GET /api/users/blocked
Response 200: `{ "users": [{ "id", "username", "displayName", "avatarUrl", "blockedAt" }] }` (newest first, max 200).

### POST /api/users/:idOrUsername/report
Body: `{ "reason": string (required, max 500), "details"?: string (max 2000) }`.
Response 201: `{ "message": "User reported" }`. Errors: 400, 404, 409 (already reported).

### POST /api/posts/:id/report
See the Posts section. Same body shape.

### DELETE /api/profile/me (delete account)
Body: `{ "confirm": "DELETE" }` (anything else is 400).
Response 200: `{ "ok": true }`. The profile and everything that hangs off it (posts, comments, chats, follows, OAuth grants, push tokens) is deleted, then the sign-in account. Admin accounts get 403.
After 200: clear SecureStore and go to the sign-in screen. Do not call `/oauth/revoke` (the grant is already gone).

## 5. Known gaps

1. Feed has no cursor: page/offset plus a `before` snapshot. It returns a bare array with no `hasMore`; stop when `length < limit`.
2. Media has no structured field on posts or chat. URLs live in the markdown `body` (`![kind:...](url)`). Upload with `POST /api/upload` first.
3. Poll options are `votesCount/userVoted` in the feed but `voteCount/selectedByViewer` in post detail. The feed omits `author` on anonymous posts; detail sends `author:null`. Vote POST returns no updated count.
4. Comments GET is flat (replies mixed in). Thread with `parentId` or the replies endpoint.
5. No posts-by-community listing (`/api/feed` has no `communityId`).
6. Notifications are capped at 60 with no paging.
7. `/api/profile/:username` has no follow state or counts.
8. `/api/upload` reads the session with `hexclaveServerApp.getUser()` directly, so it does NOT accept the bearer token yet (owner: whoever owns `src/app/api/upload`).
