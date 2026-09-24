---
name: web-quality-audit
description: "Run an evidence-led CampusLoop quality audit covering performance, accessibility, SEO, best practices, and browser interaction."
license: MIT
metadata:
  author: web-quality-skills
  version: "2.0"
---

# CampusLoop web quality audit

Combine browser evidence with source inspection.

## Scope

Always identify:

- representative post creation routes
- confession routes
- post detail/edit routes
- community posting
- mobile and desktop states
- authenticated and public states
- important error/loading states

## Evidence order

1. Run a browser baseline where possible.
2. Capture console/network/runtime failures.
3. Inspect the source responsible for the observed problem.
4. Separate verified runtime findings from source hypotheses.
5. Re-run the exact affected flow after fixes.

## Performance

Check:

- LCP < 2.5s target
- INP < 200ms target
- CLS < 0.1 target
- JS transferred
- TTFB
- API request count
- third-party iframe count
- media bytes

For CampusLoop specifically inspect:

- composer hydration
- TipTap and editor bundles
- GIF/sticker picker loading
- upload concurrency
- feed post hydration
- comment hydration
- OpenGraph preview fetches
- external iframes
- image dimensions/reservation

## Accessibility

Check:

- keyboard flow
- focus visibility
- accessible names
- form error association
- upload/publish announcements
- contrast
- screen-reader order
- dialog focus
- reduced motion
- touch target sizing
- media alternatives

The editor itself must remain selectable and keyboard accessible.

## Best practices

Check:

- no console errors
- no broken network requests
- secure external links
- safe iframe permissions
- clear failures
- meaningful button labels
- no misleading loading states
- consistent mobile navigation

## SEO/privacy

Check:

- page-specific metadata
- canonical URLs
- structured data
- sensitive anonymous content indexing policy
- duplicate post URLs
- public/private/community visibility alignment

## CampusLoop-specific red flags

Treat these as high-priority review candidates:

- parser type without renderer
- media detected by multiple render trees
- content clamp wrapping embeds
- anonymous author data in optimistic state
- client-only security invariants
- unbounded comment hydration
- arbitrary URL server fetching without SSRF controls
- ad-hoc API requests
- lost drafts after network failure

## Report shape

For each finding provide:

- severity
- verified vs hypothesis
- route/state
- source file
- user impact
- fix
- regression test
- verification state

Never use an aggregate score as proof that a post flow is healthy.
