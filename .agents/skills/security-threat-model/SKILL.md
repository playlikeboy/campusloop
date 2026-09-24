---
name: "security-threat-model"
description: "Use for repository-grounded threat modeling of CampusLoop post creation, anonymous content, uploads, embeds, notifications, and feed rendering."
---

# CampusLoop Post Threat Model

Model the post system as a set of trust boundaries:

User/device
→ browser composer
→ upload/storage service
→ post API
→ moderation
→ database
→ feed/cache
→ renderer
→ third-party embed provider

Also include:

notification services
OpenGraph preview fetcher
search/indexing
analytics
admin/moderation views

## Assets

- real user identity
- anonymous identity mapping
- post content
- media
- moderation state
- session/auth context
- notification metadata
- feed ranking signals
- community membership

## Attacker capabilities

Assume an internet user can:

- call public API endpoints directly
- bypass the UI
- alter JSON payloads
- replay requests
- paste arbitrary URLs
- upload malformed files
- submit crafted HTML
- trigger expensive parsing/fetching
- attempt cross-user/cross-community access

Do not assume the client UI is a security boundary.

## Abuse paths

Explicitly inspect:

- confession deanonymization
- unauthorized community posting
- SSRF through embed preview
- malicious remote OG images
- XSS through rich text
- upload abuse
- duplicate publish/replay
- notification amplification
- comment spam
- expensive embed storms
- feed poisoning through malformed content

For each threat, identify:

- boundary
- attacker input
- asset
- current mitigation
- missing mitigation
- detection/logging
- regression test

Keep assumptions explicit and separate verified controls from recommended controls.
