
# CampusLoop Post Experience — Master UX, Reliability & Embed Plan

Status: Draft specification
Scope: post creation, editing, publishing, rendering, embeds, feeds, confessions, comments, post detail, sharing, and all related state transitions.

> This draft is based on source inspection of the current repository, existing tests, and the repository's architecture guidance. Browser/build execution is not available in this environment, so runtime findings below are marked as regression cases where they still need execution.

---

## 1. North star

A student should be able to go from thought to published post with almost no cognitive load:

**Intent → Write → Attach → Preview → Publish → Confirm → Engage**

The UI should never leave the student wondering:

- Where will this post appear?
- Am I anonymous right now?
- Did the image actually upload?
- Is this link a preview or just a URL?
- Did publishing succeed or only look successful?
- Why is the post missing from the screen I came from?
- Why is an embed clipped?
- Why did the same media appear twice?
- Why did my confession retain an identity-related state?
- Why did leaving the composer lose the draft?

Product priority:

**Trust → clarity → speed → delight**

---

# 2. One posting model for the whole product

Normal posts, questions, polls, memes, confessions, and community posts should all use one underlying composer.

Visible intent modes:

- Post
- Question
- Poll
- Confession
- Meme

Only expose controls relevant to the selected mode.

The dedicated full-page composer should remain the main complex-creation surface. Quick composition can exist on feeds, but heavy controls belong on the full page.

## Target composer

~~~
┌─────────────────────────────────┐
│ ← New post                 Post │
│                                 │
│ [avatar] What's on your mind?   │
│                                 │
│ Write something...              │
│                                 │
│ [image] [video] [GIF] [poll] ⋯ │
│                                 │
│ Audience • My College           │
│                                 │
│                         Publish │
└─────────────────────────────────┘
~~~

Advanced tools such as formatting, stickers, voice, and secondary options should live behind a More action rather than permanently competing with writing.

---

# 3. Confession must be a true mode

Confession is not merely a purple label.

When selected:

~~~
┌─────────────────────────────────┐
│ ← Confession               Post │
│                                 │
│ Anonymous to students           │
│ Your real identity is hidden    │
│                                 │
│ Write what you need to say...   │
│                                 │
│ [image] [GIF] ⋯                 │
│                                 │
│ Scope • My College              │
│                                 │
│                         Publish │
└─────────────────────────────────┘
~~~

The anonymity state must remain visually obvious through the entire journey.

Server rules must enforce the same invariant; a malicious client must not be able to convert a confession into a non-anonymous post.

---

# 4. System map

Primary files and surfaces:

- "src/app/app/(main)/post/new/post-composer.tsx"
- "src/app/app/(main)/post/new/page.tsx"
- "src/app/app/(main)/post/[id]/edit/post-edit-client.tsx"
- "src/app/app/(main)/confessions/confessions-feed.tsx"
- "src/app/app/(post)/post/[id]/page.tsx"
- "src/components/ui/feed-card.tsx"
- "src/components/ui/rich-text.tsx"
- "src/components/embeds/post-embed-renderer.tsx"
- "src/lib/embeds.ts"
- "src/components/embeds/link-preview-embed.tsx"
- "src/app/api/embed/preview/route.ts"
- "src/app/api/posts/route.ts"
- "src/app/api/posts/[id]/route.ts"
- "src/app/api/posts/[id]/comments/route.ts"
- "src/lib/feed.ts"
- "src/hooks/use-feed.ts"
- "src/lib/feed-mutations.ts"
- "src/lib/html-sanitize.ts"
- "src/lib/anonymity.ts"
- "src/lib/moderation/rules.ts"
- "src/lib/notifications.ts"

---

# 5. P0 — correctness and trust blockers

## P0.1 Duplicate clipboard handling

The TipTap editor and the parent form both handle paste events.

Likely failure sequence:

1. clipboard image enters editor
2. editor handler sees it
3. event bubbles
4. parent handler sees it
5. same image can be uploaded twice

Impact:

- duplicate uploads
- duplicate attachment cards
- duplicate progress notifications
- unnecessary bandwidth
- inconsistent ordering

Fix with one ClipboardMediaController shared by:

- paste
- file picker
- drag/drop
- rich HTML paste

One event must produce one ingestion transaction.

---

## P0.2 Confession anonymity must be server-enforced

The current API accepts type and anonymous state from the client.

Required invariant:

type = CONFESSION => anonymous = true

Also enforce:

- anonymous post => authorId is null
- no user-facing author relation
- no user-facing notification actor derived from real author
- no author-affinity ranking
- community anonymous-post policy checked server-side

---

## P0.3 Optimistic state must not leak anonymous authorId

The optimistic client post should have exactly the same privacy shape as the server-facing object:

~~~
anonymous:
  authorId: null
  author: null
  pseudonym: generatedHandle
~~~

Never construct an optimistic anonymous post with a real author ID and expect the server response to clean it up later.

---

## P0.4 Publication state is richer than success/failure

The UI needs a real publication state machine:

~~~
DRAFT
  ↓
VALIDATING
  ↓
UPLOADING
  ↓
PUBLISHING
  ├── PUBLISHED
  ├── PENDING_REVIEW
  └── FAILED_RETRYABLE
~~~

The UI must not call something "posted" before server confirmation.

For moderation review:

"Submitted for review. Your post is saved and will appear after moderation."

For failure:

"Couldn’t publish. Your draft is safe. Retry or keep editing."

---

## P0.5 Runtime API validation is missing

TypeScript annotations do not validate JSON received over HTTP.

The API should reject malformed payloads as 400 errors rather than producing internal 500 errors.

Validate:

- body type
- body length
- title
- type enum
- scope enum
- anonymous state
- community ID
- poll options
- media references
- client request ID

Return structured field-level errors.

---

# 6. P0 — embed correctness

## P0.6 Parser/renderer mismatch

The parser declares embed types that do not all have renderers, notably:

- X/Twitter
- internal college
- internal post

A parser hit that silently disappears is a broken UX contract.

Every recognized type needs one of:

1. real renderer
2. explicit fallback card

Never return nothing after successfully classifying a user link.

---

## P0.7 Direct media has two render paths

RichText can recognize direct video/audio URLs while PostEmbedRenderer also recognizes direct media.

A bare MP4 or MP3 can therefore render twice.

Fix by giving media exactly one rendering owner.

Preferred content pipeline:

~~~
body
 ↓
content tokenizer
 ├─ text
 ├─ attachment
 └─ embed token
 ↓
shared renderer
~~~

---

## P0.8 Text line-clamping must never wrap embeds

FeedCard truncation currently operates around rich post content.

Embed and media containers must never be children of a text line-clamp region.

Correct structure:

~~~
PostBody
 ├─ Title
 ├─ TextBlock
 │    └─ clamp text only
 ├─ Attachments
 └─ Embeds
~~~

Otherwise long posts containing an iframe, image, or preview can be visually clipped.

---

## P0.9 Post detail eagerly hydrates all comments

The post detail data path loads the comments relation for the full post.

A high-comment post can create excessive server response size and database work.

Target:

1. post core
2. comment count
3. first comment page
4. cursor-based additional comments

Comments should be an independent progressive surface.

---

# 7. P1 — composer UX

## P1.1 Split the giant composer

The composer has become too large to reason about as one component.

Refactor into:

~~~
PostComposerShell
PostIntentPicker
PostIdentityBar
PostAudiencePicker
PostEditor
AttachmentTray
EmbedPreviewTray
PollEditor
PublishBar
PublishState
DraftController
ClipboardMediaController
~~~

The shell owns orchestration; leaf components own specific behavior.

---

## P1.2 Reduce choice overload

Current composer behavior exposes too many concerns at the same time:

- intent
- scope
- community
- formatting
- image
- video
- GIF
- sticker
- voice
- hashtags
- anonymity
- character count
- embed previews
- publish

First-level actions should be limited to:

**Media + GIF + Poll/Question + More**

Advanced actions stay contextual.

---

## P1.3 Do not disable text selection

The composer currently applies broad selection suppression.

The editor must support:

- selecting text
- copying
- cutting
- long press
- precise cursor movement

No editor-wide select-none styling.

---

## P1.4 Publishing should use the shared request abstraction

Publishing should follow the repository's centralized request/fetch conventions rather than using a bespoke request path.

That gives consistent:

- errors
- auth handling
- timeout behavior
- telemetry
- retry handling

---

## P1.5 Uploads need a real queue

Sequential upload is slow when multiple images are attached.

Use bounded concurrency:

~~~
A ──┐
B ──┼─> upload queue, max 2–3 active
C ──┘
~~~

Each attachment should expose:

queued → uploading → processing → ready

and:

failed → retry

and:

cancelled → removed

---

## P1.6 Revoke local object URLs

Every URL created using URL.createObjectURL must eventually be revoked.

Do it:

- after replacing the preview with the remote URL
- when removing the attachment
- when leaving the composer

This prevents repeated posting sessions from leaking browser memory.

---

## P1.7 All media entry points must share one controller

File picker, clipboard, mobile attachment picker, and drag/drop should all feed the same ingestion pipeline.

Drag/drop should support the same accepted media classes as the picker.

---

## P1.8 HTML image paste should import, not hotlink

When pasted HTML contains an external image:

1. show a temporary importing state
2. download through controlled ingestion
3. validate
4. store a stable CampusLoop media object
5. replace the temporary reference
6. revoke the local object URL

Do not silently store an expiring or tracking-heavy third-party asset URL as a permanent attachment.

---

# 8. P1 — server-side publish contract

## Body

Validate:

- required string
- normalized content
- maximum length
- safe control characters
- UTF-8 consistency

Client MAX_CHARS is UX only; the server must enforce the actual limit.

## Title

- optional
- hard maximum
- normalized
- sanitized

## Type

Strict enum.

## Scope

Strict enum.

## Poll

Validate:

- at least two options
- maximum option count
- maximum option length
- no blank options
- normalized duplicates

## Media

Every uploaded asset must be validated for:

- ownership
- type
- size
- MIME
- dimensions
- duration
- ordering

Never trust a client-provided remote URL as proof of upload ownership.

---

# 9. P1 — draft and recovery system

A draft should survive:

- accidental navigation
- browser refresh
- app switching
- keyboard dismissal
- offline state
- failed upload
- failed publish
- temporary server errors

Draft state:

~~~
{
  version,
  clientRequestId,
  type,
  body,
  title,
  scope,
  communityId,
  anonymous,
  attachmentRefs,
  updatedAt
}
~~~

Do not store large binary files in localStorage/sessionStorage.

Autosave should be debounced and non-blocking.

Visible state can be:

- Saving
- Saved
- Offline — saved locally

---

# 10. P1 — idempotent publishing

Generate a clientRequestId for every publish attempt.

Send it to the server.

The server must treat repeated requests with the same ID as the same logical publish.

This prevents:

- double-click duplicate posts
- duplicate retry posts
- mobile re-submit duplicates
- reload race conditions

---

# 11. P1 — feed/cache reconciliation

New posts currently originate from multiple contexts:

- global feed
- campus feed
- confessions
- communities
- hashtags
- profile
- post detail

Optimistic insertion must not blindly inject the same post into every feed.

Create a single post cache reconciliation layer which knows:

- where the post belongs
- where it must not appear
- whether it is pending moderation
- whether the current viewer can see it

Server confirmation should replace the optimistic object with the full server-shaped object, not only merge a new ID and timestamp.

---

# 12. P1 — embed normalization

Do not treat parsing as a giant sequence of regex checks.

Target:

~~~
raw text
 ↓
URL tokenizer
 ↓
URL normalization
 ↓
provider classification
 ↓
canonical identity
 ↓
renderer contract
~~~

Example:

~~~
https://youtu.be/VIDEO?si=tracking
        ↓
provider: youtube
id: VIDEO
canonical identity: youtube:VIDEO
~~~

Different URLs for the same resource must collapse into one embed.

---

# 13. P1 — parser edge cases

Test URL punctuation:

~~~
Check (https://example.com).
https://example.com,
https://example.com!
https://example.com)
~~~

Trailing punctuation must not become part of the URL.

Test equivalent links:

~~~
https://youtu.be/ID
https://www.youtube.com/watch?v=ID
https://www.youtube.com/watch?v=ID&utm_source=x
~~~

They should produce one canonical embed.

Provider detection must use exact hostnames or safe suffix logic, not broad hostname substring checks.

---

# 14. P1 — provider coverage contract

| Provider | Parse | Render | Fallback |
|---|---|---|---|
| YouTube | yes | yes | yes |
| Instagram | yes | yes | yes |
| Spotify | yes | yes | yes |
| SoundCloud | yes | yes | yes |
| Apple Music | yes | yes | yes |
| Vimeo | yes | yes | yes |
| Loom | yes | yes | yes |
| CodePen | yes | yes | yes |
| 9GAG | yes | yes | yes |
| X/Twitter | yes | missing | required |
| Internal profile | yes | yes | n/a |
| Internal community | yes | yes | n/a |
| Internal college | yes | missing | required |
| Internal post | yes | missing | required |
| OpenGraph | yes | yes | yes |
| Direct image | yes/media | yes | yes |
| Direct video | yes/media | one owner | yes |
| Direct audio | yes/media | one owner | yes |

---

# 15. P1 — embed rendering states

Every embed needs:

**Loading**

Reserve dimensions so the page does not jump.

**Ready**

Render provider content.

**Error**

Explain that the provider could not load.

**Fallback**

Give the original destination.

Example:

~~~
YouTube

Preview unavailable

Open on YouTube ↗
~~~

Never show an unexplained blank box.

---

# 16. P1 — third-party iframe strategy

For heavy providers:

- lazy-load below the fold
- reserve dimensions
- prefer click-to-load when practical
- avoid autoplay
- keep sandbox/permissions narrow
- stop iframe events from navigating the feed
- show provider name and original-link action

A long feed should not create dozens of live third-party documents.

---

# 17. P1 — OpenGraph preview endpoint

The current preview API fetches a user-supplied URL server-side.

That endpoint is a security-sensitive URL fetcher and requires strong SSRF defenses.

Required:

- http/https only
- block loopback
- block private networks
- block link-local ranges
- validate resolved IP
- re-check redirect destinations
- limit redirects
- strict connect timeout
- strict total timeout
- response size cap before full parsing
- HTML content-type gate
- safe HTML/meta extraction
- canonical-URL cache
- short negative cache for repeated failures

Remote OG image URLs must be treated as untrusted resources and have a failure fallback.

---

# 18. P1 — HTML sanitization

Separate ingestion sanitation from display normalization.

Target:

~~~
sanitizeImportedHtml()
normalizePostContent()
~~~

Sanitization should be deterministic and idempotent:

~~~
sanitize(sanitize(input)) == sanitize(input)
~~~

Regression cases:

- nested tags
- malformed tags
- comments
- Reddit table wrappers
- entities
- script tags
- iframe tags
- event-handler attributes
- images
- markdown
- HTML + markdown mixtures

---

# 19. P1 — one shared content renderer

Create a shared token/content model so create-preview, feed, detail, and edit do not each implement their own URL/media logic.

Target:

~~~
post.body
 ↓
parsePostContent()
 ↓
ContentNode[]
~~~

Example:

~~~
paragraph
link(provider=youtube)
attachment(image)
paragraph
~~~

Then a single renderer owns the visual output.

This is the cleanest way to eliminate duplicate media detection.

---

# 20. P2 — first-class media data

The long-term architecture should move important media state out of markdown-only encoding.

Suggested model:

~~~
post_media
  id
  post_id
  media_type
  url
  thumbnail_url
  mime_type
  width
  height
  duration_ms
  alt_text
  position
  status
~~~

Optional normalized embed table:

~~~
post_embeds
  id
  post_id
  provider
  canonical_url
  external_id
  metadata_json
  status
~~~

Keep markdown support for old data during migration.

Benefits:

- no repeated regex parsing
- reliable ordering
- captions and alt text
- retryable media
- stable metadata
- safer validation
- simpler renderer

---

# 21. P1 — confession UX

Before publish, show:

- anonymous state
- where it appears
- scope
- community anonymous policy where relevant

Do not over-warning every confession.

After publish:

~~~
Your confession is published anonymously.
~~~

or:

~~~
Your confession was submitted for review.
~~~

Individual anonymous posts should have a deliberate privacy/SEO policy. Sensitive anonymous content may need noindex; this is a product privacy decision rather than a blanket SEO rule.

---

# 22. P1 — anonymity and notifications

Mentions in anonymous content require explicit product rules.

Audit:

- mention notifications
- comment notifications
- repost notifications
- push
- email
- activity feeds
- analytics
- recommendations
- structured data
- moderation UI

The user-facing notification actor should never expose or strongly imply the real author of anonymous content.

---

# 23. P1 — post detail

The first screen should be content-first:

~~~
← Back

Author / Anonymous
Type / Community
Title
Body
Media / embeds

[upvote] [comments] [share] [save]

Comments
~~~

Do not make users pass through unrelated recommendations before reading the post.

Progressive sequence:

1. post
2. comments
3. related posts
4. recommendations
5. optional academic content

---

# 24. P1 — comments

Comments need the same reliability quality as posts:

- optimistic submit
- rollback
- retry
- pagination
- mention autocomplete
- image paste
- GIF support if intended
- keyboard submit
- draft preservation
- character limits
- anonymous behavior if supported

Comment input should remain near the user's interaction point.

---

# 25. P2 — edit flow

Editing should use the exact same content parser and renderer as publishing.

Requirements:

- attachments preserved
- preview identical to feed/detail
- dirty-state detection
- failure-safe saving
- back confirmation only when dirty
- no duplicated parser implementation

Write and Preview are useful, but they should be views over the same content model.

---

# 26. P1 — media validation before upload

### Image

Validate type, bytes, dimensions, and animated status where relevant.

### Video

Validate type, size, duration, dimensions, and supported codecs where practical.

### Audio

Validate type, size, duration.

### Documents

Validate extension, MIME, size, and ideally file signatures on the server.

Never trust extensions alone.

---

# 27. P2 — accessibility

Every post journey should support:

- keyboard navigation
- visible focus
- accessible labels
- screen-reader upload progress
- screen-reader publish result
- sufficient contrast
- icon buttons with names
- correct dialog focus
- keyboard submit
- reduced motion
- fallback links for third-party embeds

---

# 28. P2 — mobile keyboard behavior

Test at:

- 320 × 800
- 360 × 800
- 390 × 844
- 430 × 932

Journey:

1. open composer
2. focus editor
3. keyboard appears
4. cursor stays visible
5. toolbar does not cover the publish action
6. paste media
7. preview inserts without destructive scroll jumps
8. keyboard closes
9. publish remains accessible

Use safe-area insets for the fixed bottom action area.

---

# 29. P2 — motion

Use animation only where it communicates state:

- attachment insertion
- upload completion
- publish confirmation
- reaction feedback
- tab changes

Avoid animation on:

- every keystroke
- every embed load
- large feed transitions

Respect prefers-reduced-motion.

---

# 30. Exact regression suite

## Text

- empty
- whitespace only
- 1 character
- exactly max
- max + 1
- Unicode
- combining characters
- long URLs
- punctuation around URLs
- pasted HTML

## Types

- normal
- meme
- poll
- question
- confession
- invalid type
- confession with anonymous=false sent directly to API

## Poll

- zero options
- one option
- two options
- too many options
- duplicate options
- blank option
- very long option
- Unicode

## Clipboard

- plain text
- PNG
- JPEG
- GIF
- HTML image
- rich text + image
- Android/Gboard image
- repeated paste

## Drag/drop

- image
- video
- audio
- PDF
- unsupported file
- mixed files

## Upload

- first file failure
- second file failure
- timeout
- offline mid-upload
- retry
- cancel
- remove while uploading
- navigate away

## Embeds

- YouTube watch
- Shorts
- Live
- youtu.be
- Spotify track
- Spotify playlist
- Apple Music track
- album
- SoundCloud track
- set
- Instagram post
- reel
- Vimeo
- Loom
- CodePen
- 9GAG
- X/Twitter
- internal profile
- community
- college
- post
- event
- arbitrary OpenGraph
- duplicate canonical URLs
- malicious lookalike hostname

## Rendering

- loading
- blocked provider
- 404 provider
- unavailable provider
- missing thumbnail
- broken image
- iframe failure
- direct MP4
- direct MP3
- many embeds
- embed + long text
- embed + clamp
- embed + repost
- embed + anonymous post

## Publishing

- double click
- slow network
- offline
- 400
- 401
- 403
- 429
- 500
- moderation pending
- delayed response after optimistic state
- refresh immediately after publish
- publish from community
- publish from confessions

## Privacy

- anonymous normal post
- confession
- anonymous community post
- mentions
- notifications
- email
- push
- repost
- profile
- saved content
- search
- detail page
- related feed
- recommendations
- metadata / structured data

---

# 31. Browser journeys

Use Playwright for real browser validation.

### A. Normal post

Home → New Post → Write → Publish → Feed → Open → Comment

### B. Image paste

Composer → Paste image → Preview → Upload → Publish → Feed image

### C. Embed

Composer → Paste YouTube URL → Preview → Publish → Feed → Detail → Provider

### D. Confession

Confessions → Confess → Verify anonymous state → Write → Publish → Anonymous feed result

### E. Offline recovery

Composer → Draft → Disable network → Publish → Failure state → Reconnect → Retry → Success

---

# 32. Performance budgets

## Composer

- first interactive UI must not wait for trending hashtag data
- heavy GIF/sticker UI loaded on demand
- voice/video tooling loaded when requested

## Feed

- first visible post before recommendations
- avoid eager third-party iframes
- avoid full comment hydration

## Post detail

- post first
- comments second
- related content third

## Embed preview

- strict timeout
- strict response size
- normalized URL cache
- failed-preview negative cache

Measure:

- TTFB
- LCP
- INP
- CLS
- JS transferred
- API request count
- iframe count
- media bytes

---

# 33. API shape

Publish request:

~~~
{
  clientRequestId,
  type,
  body,
  title,
  scope,
  isAnonymous,
  communityId,
  media,
  embedHints
}
~~~

Publish response:

~~~
{
  post,
  publicationState
}
~~~

publicationState:

- PUBLISHED
- PENDING_REVIEW
- FAILED

The server response becomes the single source of truth.

---

# 34. Target architecture

~~~
                    Post Draft
                        │
                 Intent + Editor
                        │
          ┌─────────────┼─────────────┐
          │             │             │
      Clipboard      Picker        Drag/Drop
          └─────────────┼─────────────┘
                        │
                Attachment Queue
                        │
                URL/Embed Normalizer
                        │
                Server Validation
                        │
                 Moderation Check
                        │
                Idempotent Publish
                        │
            ┌───────────┼───────────┐
            │           │           │
        Published     Pending     Failed
            │         Review       │
            └───────────┼───────────┘
                        │
               Server-shaped Post
                        │
          ┌─────────────┼─────────────┐
          │             │             │
        Feed        Confessions   Communities
          └─────────────┼─────────────┘
                        │
                 Shared Renderer
~~~

---

# 35. Implementation order

## Phase 1 — trust

- runtime publish schema
- server confession invariant
- anonymous optimistic invariant
- single clipboard handler
- single media render owner
- full embed coverage/fallback
- server length enforcement
- comment pagination
- publish idempotency

## Phase 2 — composer

- split component
- unified attachment controller
- bounded upload queue
- object URL cleanup
- autosave
- offline draft
- contextual actions
- publish state machine

## Phase 3 — rendering

- canonical URL normalization
- content-token parser
- structured media model
- one renderer across create/feed/detail/edit
- embed loading/error/fallback

## Phase 4 — social sync

- unified cache reconciliation
- community/confession immediate visibility
- server-shaped optimistic replacement
- comment optimistic flow

## Phase 5 — quality

- Playwright journeys
- accessibility audit
- performance profiling
- mobile keyboard testing
- chaos/network testing
- regression suite in CI

---

# 36. Immediate source-level findings to verify first

1. Editor and form both handling image paste.
2. Direct video/audio being recognized by multiple render paths.
3. Parser types without renderers.
4. Rich embed inside line-clamped FeedCard content.
5. Anonymous optimistic object carrying real author identity.
6. Confession anonymity enforced only by client state.
7. Runtime API validation gaps.
8. Server-side max-length enforcement gap.
9. Object URL lifecycle.
10. HTML pasted images being stored as remote URLs.
11. Sequential uploads.
12. Missing retry/cancel states.
13. Optimistic cache scope not covering community/confession-specific feeds.
14. Post detail eager comment hydration.
15. Anonymous mention notifications.
16. OpenGraph URL-fetch SSRF surface.
17. Broad hostname substring detection.
18. Canonical URL deduplication.
19. Anonymous individual-post SEO/privacy policy.
20. MEME deep-link type support.
21. Raw emoji in UI copy where repository rules prohibit it.
22. Composer-wide text-selection suppression.
23. Ad-hoc publish request implementation.
24. Optimistic/server object reconciliation.
25. Error states with no preserved draft.

---

# 37. Definition of done

The post system is finished only when:

- drafts survive interruption
- one attachment is ingested once
- every provider has a working renderer or explicit fallback
- embeds never duplicate
- embeds never get clipped by text truncation
- publishing is idempotent
- server truth replaces optimistic state
- anonymous identity cannot leak through client or notification paths
- comments paginate
- new posts reconcile into the correct feed contexts
- failed operations are retryable
- create/feed/detail/edit use one renderer
- keyboard behavior is correct
- accessibility checks pass
- browser journeys pass
- typecheck passes
- unit tests pass
- production build passes

---

# 38. Final product feel

The finished CampusLoop post experience should feel:

**Immediate like messaging, discussion-rich like a community forum, media-simple like a modern social app, and extremely clear about campus scope and anonymity.**

The student should spend their attention on what they want to say.

CampusLoop should handle the complexity underneath:

**validate → upload → normalize → moderate → publish → reconcile → cache → render.**
