---
target: landing page
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 4
target_identity: "file:/home/user/campusloop/src/components/landing/campusloop-homepage-refresh.tsx"
target_fingerprint: "sha256:c4ea1423719fa4fda7bbd43a1f112d1414890762785a410ab18bb502eb9516b1"
target_path: /home/user/campusloop/src/components/landing/campusloop-homepage-refresh.tsx
timestamp: 2026-10-16T06-50-25Z
slug: s-landing-campusloop-homepage-refresh-tsx-5426a8cb
---
DEGRADED: single-context (session policy: no sub-agents unless the user asks). Browser inspection skipped: no node_modules/.env, and page.tsx calls Hexclave getUser() before render.

Score 21/32 (H7, H10 n/a), Acceptable.
H1 2 fake "Live" dot / static "Campus is talking"; H2 3; H3 3; H4 2 palette off DESIGN.md, three different join labels; H5 3; H6 3; H8 2 tiny type, eyebrow on every section; H9 3.

Specificity: category-interchangeable SaaS template (eyebrow + two-tone H1 + 2 buttons + trust row + illustration with floating chips, stat bar, 2 feature cards, 3 steps, FAQ, CTA band). Real product (feed, confessions, polls, streaks, Campus Match, India college search) is absent from the first viewport.
Detector: 0 findings.

P1 Hero shows a voxel illustration, not the product. Fix: real feed/streak UI composite + inline college search.
P1 Type scale too small: 8-13px for most body/meta text; mobile 9-10px. Fix: 16px body floor, 13px meta floor.
P1 Contrast: footer © 3.13, footer tagline 3.77, quicklink small 3.84, imageNote 4.17, footer links 4.18, h1 accent 4.15 (fine large), primary btn 4.49 (13px bold, borderline).
P1 Brand drift: landing is cool blue (#eaf4fc, #2f7fa2) and hardcoded hex; DESIGN.md is ivory/blush/teal (#FFF9F4, #3D6C83). Forced light color-scheme, no dark mode.
P2 Unverified claims: 45,000+ notes, "Live" dot. Missing core loop (streaks/daily mission), confessions/polls, social proof, Instagram/socials in footer, "✦" glyph in brand.
P2 Mobile: 3 simultaneous join CTAs (header button, sticky bar, hero) + chip nav duplicating header.
