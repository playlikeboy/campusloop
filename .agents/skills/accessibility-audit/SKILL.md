---
name: accessibility-audit
description: "Perform a multi-page WCAG 2.2 accessibility audit of CampusLoop post, confession, community, and feed journeys. Assess; do not silently fix."
---

# Accessibility audit

Use WCAG 2.2 AA as the default target and sample representative pages and states rather than claiming a single-page scan proves whole-product conformance.

## CampusLoop sample

At minimum sample:

- Home feed
- New Post
- Confession composer
- Community detail
- Post detail
- Edit Post
- Comment interaction
- upload failure
- publish failure
- moderation/pending state
- mobile keyboard-open state

## Evaluate

### Operable

- keyboard navigation
- visible focus
- no keyboard traps
- editor selection and cursor movement
- dialog focus
- touch target size
- sticky controls do not cover focused content

### Understandable

- explicit labels
- clear validation errors
- clear publish states
- clear anonymous mode
- clear upload status
- consistent navigation

### Robust

- semantic buttons/links
- correct accessible names
- correct states
- no duplicate IDs
- native controls preferred over unnecessary ARIA

### Perceivable

- sufficient contrast
- text alternatives
- media alternatives
- no color-only status
- reduced-motion support

## Critical CampusLoop checks

- anonymous status must be announced without exposing identity
- upload progress should be announced
- publish success/pending/failure should be announced
- provider iframe must have a usable fallback
- GIF/sticker/image controls must have labels
- the editor must remain selectable
- the publish action must remain reachable with the keyboard and on-screen keyboard

## Evidence

Keep these separate:

- verified
- flagged for human decision
- human-required

Do not claim screen-reader or lived-experience validation unless it was actually performed.

## Output

For every finding include:

- WCAG success criterion
- severity
- evidence basis
- route/state
- location
- impact
- fix
- human validation needed
