---
name: campusloop-design-qa
description: Audits, implements, and verifies CampusLoop frontend design changes across the Next.js App Router marketing site and authenticated application. Use for UX audits, brand and design-system consistency, responsive layouts, accessibility, trust and privacy copy, empty states, and visual regression review.
---

# CampusLoop Design QA

## Purpose

Apply CampusLoop-specific product, brand, accessibility, and implementation standards to frontend changes. This skill complements `.agents/skills/campusloop-guide/SKILL.md`, which remains the source of truth for product architecture and engineering conventions.

## When to use

Use whenever a task changes or reviews the homepage, marketing pages, application shell, navigation, feed, posts, academic resources, campus directory, communities, marketplace, chat, stories, profile, matching, authentication, forms, dialogs, loading states, or empty states.

## Mandatory workflow

1. Inspect the current files, route, and user journey before proposing or applying a change.
2. Read the relevant CampusLoop guide, brand/design-system documentation, and existing component implementation.
3. Check the actual Git status and preserve unrelated user changes.
4. Identify observed defects separately from assumptions that need browser testing.
5. Reuse established design tokens, UI primitives, routing patterns, and data-fetching helpers.
6. Preserve existing Next.js App Router conventions, authentication, authorization, APIs, database behavior, and product permissions.
7. Make the smallest maintainable change that solves the real problem; avoid broad redesigns unrelated to the request.
8. Test the changed route in a browser when tooling is available, at desktop and mobile widths.
9. Check success, loading, empty, error, permission-denied, and unavailable states relevant to the change.
10. Check keyboard operation, visible focus, accessible names, contrast, touch targets, and reduced-motion behavior.
11. Run relevant project checks using the actual package scripts.
12. Report changed files, evidence, tests actually run, and remaining limitations accurately.

## Brand and visual standards

CampusLoop's current visual identity is based on warm cream and neutral surfaces, terracotta primary actions, coral accents, and restrained pastel category tints. Inspect the current tokens before making changes; do not assume token values remain unchanged.

- Preserve the friendly, student-first personality without making core actions or critical information feel childish.
- Keep one obvious primary action per major screen; use secondary button styles for less important actions.
- Use typography, spacing, and layout to establish hierarchy instead of wrapping every piece of content in a card.
- Keep surfaces, borders, radii, shadows, icon styles, and interaction states consistent.
- Prefer semantic tokens over hardcoded near-duplicate colors and arbitrary spacing.
- Use animation to communicate state or add a purposeful moment of delight; respect reduced-motion preferences.
- Design information-dense areas such as feeds, chat, marketplace listings, and academic results for efficient scanning.
- Avoid introducing unrelated UI libraries or duplicating existing primitives.

## Trust, content, and privacy

- Never fabricate testimonials, student identities, profile images, colleges, live activity, review counts, academic resources, or product metrics.
- Distinguish indexed institutions from institutions with verified students or active communities.
- Ensure marketing copy reflects the actual authentication, privacy, anonymity, safety, and availability behavior.
- Do not make absolute security or anonymity guarantees unless the implementation supports them.
- Explain feature restrictions and verification requirements before users reach a dead end.
- Use real routes and actions; never create visual affordances that do nothing.
- Do not expose secrets, private user data, auth tokens, or test credentials in UI, logs, screenshots, or documentation.

## Responsive and accessibility checks

For important layouts, test representative widths including narrow mobile (~320–390 px), tablet (~768 px), and desktop (~1280–1440 px), using available browser tooling.

Check for horizontal overflow, clipped content, overlapping controls, distorted media, unsafe fixed positioning, dialogs outside the viewport, and unreadable line lengths.

Target WCAG 2.2 AA where applicable. Check normal text contrast (4.5:1), large text contrast (3:1), and relevant control boundaries (3:1 where required). Provide semantic controls and keyboard alternatives to gesture-only interactions. Do not claim conformance without testing.

## Campus-specific interaction patterns

- **Feed/posts:** make author, content, metadata, and actions legible without cluttering each post with badges and counters.
- **Academic resources:** prioritize subject, course, semester, institution, resource title, format, and actual availability.
- **Communities:** present real activity honestly; low activity is an opportunity for a useful empty state, not a reason to invent members or discussions.
- **Marketplace/utility hubs:** show real eligibility, campus availability, and access thresholds before users invest effort; preserve genuinely available functions.
- **Authentication/verification:** clearly explain what is required, keep validation errors actionable, and preserve user input when safe.
- **Chat/stories/matching:** preserve existing privacy controls and behavior; ensure mobile controls and gesture alternatives remain usable.
- **Demo:** label seeded or illustrative content accurately and provide a clear recovery path for unavailable flows.

## Review output

For each important finding, report: severity, route/component, direct evidence, user impact, implemented fix, and verification performed. Distinguish confirmed defects from unverified risks. Never claim that a test passed, a route was inspected, or an issue was fixed unless there is evidence.
