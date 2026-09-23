# CampusLoop UI/UX Design Principles

**Status: MANDATORY SOURCE OF TRUTH**

Every new screen, component, route, responsive state, and visual refactor MUST follow this document. Existing UI should be moved toward these rules whenever it is touched.

## 1. Product hierarchy

1. Content is the product; chrome supports it.
2. Every screen has one primary task.
3. Primary content > primary action > context > metadata > tertiary actions.
4. If everything is visually prominent, nothing is prominent.
5. Prefer removing UI over adding UI.
6. Never expose implementation details when a user-facing concept is clearer.

## 2. Mobile first

- Design the smallest practical viewport first.
- Never squeeze desktop layouts into mobile.
- Never leave accidental clipping or horizontal overflow.
- Important controls need approximately 44x44px touch areas.
- Keep the first viewport focused on the user's task.
- Sticky UI must collapse or stay compact while scrolling.
- Avoid control rows that require users to decode many simultaneous options.
- Respect safe-area insets.

## 3. Responsive behavior

Mobile, tablet and desktop may change layout, but MUST preserve the same mental model, terminology, destinations and actions.

Desktop may add:
- persistent navigation
- secondary context
- wider content
- multi-column layouts

Mobile should prioritize:
- content
- primary action
- simple navigation
- thumb-friendly interaction

## 4. Typography

Use a small, consistent hierarchy.

- Page title: strong, compact, one line where possible.
- Section title: clear and subordinate to page title.
- Content title: strongest element inside a content card.
- Body: comfortable reading size; do not use headline-sized body copy.
- Metadata: quiet and smaller.
- Captions: lowest visual priority.

Recommended starting scale:
- display: 32–40px
- h1: 24–30px
- h2: 20–24px
- card title: 18–22px
- body: 15–17px
- metadata: 12–14px
- caption: 11–12px

## 5. Spacing

Use a 4px base scale:
4, 8, 12, 16, 20, 24, 32, 40.

Do not introduce arbitrary one-off spacing without a documented reason.

## 6. Radius

Use radius semantically:
- 8–10px: controls
- 12–16px: cards
- 16–20px: large surfaces
- full radius: pills/tags only

Do not make every surface a pill.

## 7. Cards

Cards group meaningful content.

- Avoid nested cards unless structurally necessary.
- Avoid huge floating cards around ordinary feed posts.
- Avoid decorative borders.
- Use subtle tonal separation instead.
- Give text-heavy content enough horizontal width.
- Do not make every row a rounded container.
- Do not let card chrome compete with content.

## 8. Pills and badges

Pills are semantic.

Use them for:
- filters
- status
- category
- compact metadata

Do NOT use pills for:
- ordinary navigation
- long labels
- page titles
- every CTA
- arbitrary statistics

Bad: "Your Campus Syllabus"
Prefer: "Syllabus match".

## 9. Color semantics

Colors MUST communicate meaning.

- Primary accent: primary action and active state.
- Green: success, verification, completed state.
- Secondary accent: discovery/category.
- Warning/destructive: only for actual warning/destructive states.
- Neutral: metadata and supporting UI.

Never use saturated colors merely as decoration.

Never communicate an important state by color alone.

## 10. Effects

Gradients, glows, blur and shadows are enhancement layers.

They must never establish hierarchy by themselves.

Avoid:
- persistent button glow
- excessive backdrop blur
- decorative neon borders
- large shadows around every card
- animation that competes with reading

Respect prefers-reduced-motion.

## 11. Buttons

Every CTA must describe its action.

Prefer:
- Open
- Download
- Save
- Upload
- Read article
- View PYQs
- Create post

Avoid ambiguous labels such as "Get" when a precise action is available.

Each screen should have one visually dominant primary action.

## 12. Icons

Use one coherent icon family: Lucide/custom CampusLoop SVG icons.

- Consistent stroke weight.
- Consistent optical size.
- Icon-only controls need accessible labels.
- Do not use raw emoji characters in UI labels, badges, tabs, buttons or toasts.
- Active icons may use the semantic primary color; inactive icons stay neutral.

## 13. Navigation

Each destination must have one clear purpose.

Canonical mobile navigation:
1. Home — what is happening?
2. Explore — what can I discover?
3. Create — what can I publish?
4. Academics — what can I study?
5. Profile — what is mine?

A category should not also become a primary navigation destination without a strong information-architecture reason.

Example: Confessions can be a Home feed category; it should not be duplicated as a bottom-nav destination.

## 14. Headers

A mobile header should normally contain:
- page identity
- essential context
- essential actions

Do not put every possible action in the header.

Avoid oversized two-line titles when a compact title communicates the same meaning.

## 15. Tabs

Tabs are for closely related views.

- Keep labels short.
- Do not mix navigation and filtering.
- Do not allow accidental clipping.
- If tabs overflow, make horizontal scrolling intentional.
- Active state must be obvious without relying only on color.

## 16. Filters

Filters must have understandable dimensions.

Do not mix campus, branch, semester and sorting into an unexplained pill row.

Prefer:
- Campus
- Branch
- Semester
- Type
- Sort

On mobile, use a compact "Filters" control and a sheet for many filters.

## 17. Feed cards

A feed card should be scannable in seconds.

Recommended order:
1. author/source
2. content type
3. title
4. 2–4 line preview
5. essential metadata
6. lightweight engagement
7. primary action if necessary

Long posts must not consume the whole feed by default.

Use a detail page for complete content.

## 18. Feed previews

Feed previews should:
- show a useful excerpt
- preserve the original title
- avoid duplicate title/body text
- expose media when it materially helps scanning
- use "Read more" for long text

Do not render every engagement metric in the feed.

## 19. Academic resources

Academic cards prioritize:
1. course/subject
2. resource title
3. type
4. campus/semester/branch
5. precise trust signal
6. primary action

Example:

CS301 · PYQ

Data Structures & Algorithms

Solved PYQs & Exam Question Bank

BIT Mesra · Semester 3 · CSE

✓ Verified                         Open

Do not show uploader details, all metrics, every badge and every action at once.

## 20. Verification

Verification must be precise.

Avoid vague claims such as "100% Verified".

Prefer:
- Verified uploader
- University verified
- Syllabus match
- Source verified
- Community reviewed

Only claim what the underlying data actually verifies.

## 21. Search

Search must communicate its scope.

Examples:
- "Search campus, people and topics..."
- "Search notes, PYQs, subjects..."
- "Search courses, professors and resources..."

Search results need useful filtering, empty states and clear result types.

## 22. Progressive disclosure

Level 1: information needed to decide whether to open.

Level 2: complete metadata on the detail page.

Level 3: advanced actions/settings only when requested.

Never expose all available data simply because it exists.

## 23. Academic detail pages

Opening an academic resource must provide a complete reading destination.

When applicable, a topic/resource should support:
- readable article content
- Markdown
- headings
- lists
- tables
- code blocks
- formulas
- callouts
- diagrams/charts
- images
- related resources
- PPT/PDF attachment
- download/open action
- source and verification context

A topic must not dead-end at an attachment.

If a presentation exists, provide the associated readable article/explanation when the content model supports it.

## 24. Visualizations

Use diagrams, charts, tables, timelines, process flows and concept maps when they improve comprehension.

Never add a visualization merely for decoration.

Every visualization must answer: "What does this help the student understand?"

## 25. Loading, empty and error states

Every async surface needs intentional states.

Loading:
- use skeletons for content
- use spinners only for short actions

Empty:
- explain what is empty
- explain what the user can do next

Error:
- explain what failed
- provide Retry or another useful recovery action

Never show an unexplained blank page.

## 26. Accessibility

Minimum requirements:
- sufficient contrast
- semantic HTML
- visible focus states
- keyboard accessibility on desktop
- accessible labels
- adequate touch targets
- no color-only state
- sensible heading hierarchy
- reduced-motion support
- readable line length

## 27. Content density

Optimize for scanning, not maximum information density.

Ask:
"Can the user understand this screen quickly?"

not:
"How much information can fit here?"

## 28. Component reuse

Prefer shared primitives:
Button, IconButton, Card, Badge, Avatar, Tabs, SearchInput, Filter, Header, BottomNav, Sheet, Skeleton, EmptyState, ErrorState.

Do not create visually similar one-off components.

## 29. Tokens

Centralize:
- colors
- typography
- spacing
- radius
- shadows
- borders
- motion
- breakpoints

Avoid magic visual values scattered through feature components.

## 30. No one-off styling

Do not invent a new color, radius, shadow, button treatment or typography value for one component unless it represents a genuine semantic variant.

## 31. Desktop quality bar

Desktop layouts must use the available width intentionally.

Do not stretch a single mobile column unnecessarily.

Use:
- readable content width
- secondary panels where useful
- persistent filters when appropriate
- stable alignment

## 32. Pre-release checklist

### Structure
- [ ] One clear primary purpose
- [ ] Clear information hierarchy
- [ ] No duplicated navigation concepts
- [ ] No unnecessary controls

### Mobile
- [ ] No accidental clipping
- [ ] No horizontal overflow
- [ ] Touch targets are adequate
- [ ] Header is compact
- [ ] Bottom nav does not obstruct content

### Visual
- [ ] Consistent typography
- [ ] Consistent spacing
- [ ] Consistent radius
- [ ] Consistent icons
- [ ] Semantic colors
- [ ] Minimal unnecessary effects

### Content
- [ ] Titles are clear
- [ ] CTAs describe actions
- [ ] Metadata is secondary
- [ ] Long content is progressively disclosed
- [ ] Loading/empty/error states exist

### Accessibility
- [ ] Contrast checked
- [ ] Focus states work
- [ ] Icon buttons have labels
- [ ] Color is not the only state signal
- [ ] Reduced motion supported

### Responsive
- [ ] Small mobile
- [ ] Large mobile
- [ ] Tablet
- [ ] Desktop
- [ ] Wide desktop

## Absolute rules

1. Content beats chrome.
2. Clarity beats decoration.
3. Hierarchy beats density.
4. Consistency beats novelty.
5. Accessibility beats aesthetics.
6. Never add UI merely because there is space.
7. Never use ambiguous CTAs when a precise action exists.
8. Never allow accidental clipping.
9. Never let controls overpower content.
10. Never create a one-off visual system when an existing token/component works.
11. When in doubt, remove visual noise.
