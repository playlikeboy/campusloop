---
name: campusloop-post-experience
description: "Use for any CampusLoop work involving post creation, editing, publishing, confessions, comments, media uploads, embeds, feed rendering, or post UX."
---

# CampusLoop Post Experience

Treat posts as one end-to-end system.

## Lifecycle

Inspect:

entry → composer → draft → clipboard/upload → preview → publish → moderation → feed → detail → comments → share/edit

Do not fix one surface while leaving another parser, renderer, cache, or API contract inconsistent.

## Invariants

### Server truth

The server is authoritative for:

- identity
- anonymity
- publication state
- moderation
- membership
- upload ownership
- normalized URLs
- timestamps
- counts

Optimistic state exists only to reduce perceived latency.

### Anonymity

- CONFESSION must be anonymous at the API boundary.
- Anonymous posts must expose no real author relation to clients.
- Optimistic anonymous posts must also have authorId = null.
- No notification should reveal or imply the anonymous actor.
- No ranking affinity should use anonymous identity.

### Media

- Clipboard, picker, and drag/drop converge on one ingestion controller.
- Local object URLs are revoked.
- One URL has one render owner.
- Each attachment has queued/uploading/processing/ready/failed/cancelled states.
- Retry must preserve the draft.

### Embeds

- Every parsed embed has a renderer or explicit fallback.
- Normalize URLs before deduplication.
- Provider detection uses safe exact host rules.
- External preview fetching is SSRF-protected.
- Embed failures show a usable original-link fallback.
- Never line-clamp a container that contains embeds.

### Publishing

- Runtime-validate API input.
- Enforce length server-side.
- Enforce post-type invariants server-side.
- Make publishing idempotent with a client request ID.
- Distinguish published vs pending review vs failed.
- Replace optimistic objects with the full server-shaped post.

## UX

Use a simple hierarchy:

Intent → Write → Attach → Preview → Publish

Keep advanced controls contextual.

Confession is a mode with a persistent, obvious anonymous state.

Keep Publish reachable above the mobile keyboard.

Preserve text selection in the editor.

## Rendering

Use one content model/renderer for:

- composer preview
- feed
- post detail
- edit preview

Media should not be encoded in ways that require multiple independent regex render paths.

## Testing

Minimum regression families:

- max text boundaries
- every post type
- confession invariant
- malformed API payloads
- poll edge cases
- image paste
- rich HTML paste
- repeated paste
- drag/drop
- upload failure/retry/cancel
- canonical duplicate URLs
- all supported embeds
- missing renderer types
- direct media
- long text + embed
- publish double-click
- offline
- moderation pending
- feed cache reconciliation
- anonymous notifications
- comment pagination

Always report which tests were actually executed.
