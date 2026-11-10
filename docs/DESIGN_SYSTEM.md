# CampusLoop Design System v3

The single spec. `src/styles/tokens.css` is the source of truth; this file explains it. Every other design document lives in `docs/archive/` and is history, not rule.

Direction: bright, clean, minimal, friendly, trustworthy. One accent per screen. Generous white space. Nothing that reads as generated: no mesh gradients, gradient text, glass, neon, eyebrows, emoji icons, nested cards, or purple-to-blue gradients.

## 1. Files

| What | Where |
| --- | --- |
| Tokens (primitives → semantic → component) | `src/styles/tokens.css` |
| Floor rules the browser needs (focus, overflow, reduced motion, scrollbars) | `src/styles/base.css` |
| Tailwind utility mapping + legacy aliases + shared utilities | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` (Plus Jakarta Sans, Noto Sans Devanagari fallback, JetBrains Mono for code) |
| Primitive components (the only primitive layer) | `src/components/ui/` |
| Shells | `src/components/shells/` (`MarketingShell`, `AppShell`, `AdminShell`) |
| Navigation config | `src/constants/navigation.ts` |
| Guard | `bun run check:design` (`--strict` fails; `--list` prints every hit) |
| Contrast proof | `src/styles/contrast.test.ts` |

## 2. Tokens

Use the semantic layer. Primitives (`--n-*`, `--b-*`, `--y-*`, `--p-*`, status) are for `tokens.css` only.

| Role | Token | Utility | Light | Dark |
| --- | --- | --- | --- | --- |
| Page canvas | `--bg` | `bg-bg` | n-25 `#FCFBF8` | n-950 `#12110F` |
| Card, sheet, nav | `--surface` | `bg-surface` | n-0 | n-900 |
| Input, inactive tab, quiet band | `--surface-muted` | `bg-surface-muted` | n-50 | n-800 |
| Popover, dialog | `--surface-raised` | `bg-surface-raised` | n-0 | n-800 |
| Primary text | `--fg` | `text-fg` | n-900 | n-50 |
| Secondary text | `--fg-muted` | `text-fg-muted` | n-600 | n-400 |
| Timestamps, placeholders | `--fg-subtle` | `text-fg-subtle` | n-500 | n-400 |
| Hairline | `--border` | `border-border` | n-200 | n-800 |
| Primary action fill | `--brand` | `bg-brand` | b-500 `#3B5BFD` | b-500 |
| Hover / pressed fill | `--brand-hover` | `bg-brand-hover` | b-600 | b-600 |
| Text on brand | `--brand-fg` | `text-brand-fg` | white | white |
| Links, active nav | `--brand-text` | `text-brand-text` | b-600 | b-300 |
| Selected chip, active row | `--brand-subtle` | `bg-brand-subtle` | b-50 | b-900 |
| Rewards, streaks, Loop Points | `--reward` / `--reward-fg` / `--reward-text` / `--reward-subtle` | `bg-reward` … | y-500 / n-900 / y-800 / y-100 | y-500 / n-900 / y-300 / y-900 |
| Campus Match only | `--crush` / `--crush-fg` / `--crush-text` / `--crush-subtle` | `bg-crush` … | p-600 / white / p-700 / p-100 | p-500 / n-950 / p-500 / p-900 |
| Status | `--success`, `--danger`, `--warning` (+ `-fg`, `-subtle`) | `text-success`, `bg-danger-subtle` … | g-600, r-700, o-700 | g-400, r-400, o-400 |
| Focus ring | `--ring` | `ring-ring` | b-500 | b-400 |

Every pair in `contrast.test.ts` passes WCAG AA in both themes. Add a pair there when you add a token.

Legacy utilities (`bg-card`, `text-muted-foreground`, `bg-primary`, `text-ink`, `bg-canvas`, `text-coral`, `bg-cat-blue` …) and legacy variables (`var(--text)`, `var(--primary)` …) still resolve to these tokens so old markup renders coherently. They are a migration layer, not an API: new code uses the canonical names above.

### Shape

`rounded-sm` 8px (inputs, chips) · `rounded-md` 12px (buttons) · `rounded-lg` 16px (cards) · `rounded-xl` 24px (sheets, hero cards) · `rounded-full` (avatars, pills). `rounded-2xl` aliases `xl`. Never `rounded-[Npx]`.

### Depth

`shadow-xs` (hover lift) · `shadow-sm` (cards) · `shadow-lg` (popovers, dialogs). A surface takes a border **or** a shadow, never both. `shadow-2xs/md/xl/2xl` alias onto these three.

### Type

One family, Plus Jakarta Sans (`font-sans`, `font-display` and `font-heading` are the same face). Noto Sans Devanagari falls back for Hindi. `font-mono` (JetBrains Mono) only for code, keys and measured values.

| Class | Size / line | Use |
| --- | --- | --- |
| `text-xs` | 12 / 16 | timestamps, counters |
| `text-sm` | 14 / 20 | labels, meta, buttons |
| `text-base` | 16 / 24 | body (inputs ≥ 16px on mobile) |
| `text-lg` | 18 / 28 | card titles |
| `text-xl` | 20 / 28 | section titles |
| `text-2xl` | 24 / 32 | page titles |
| `text-3xl` | 30 / 36 | hero titles (app) |
| `text-4xl` | 36 / 44 | marketing section heads |
| `--text-display` | fluid 44–80 | marketing hero only |

Headings 600–700, `tracking-tight` from 2xl up. Counts use `tabular-nums`. Labels are the body face, one step smaller, sentence case, never tracked capitals.

### Space and layout

4px base. Gutters 16 / 24 / 32 (mobile / tablet / desktop) via `--gutter`. Widths: feed 640, reading 720, app 1200, marketing 1280 (`max-w-[var(--container-feed)]` etc. or `max-w-2xl/3xl/6xl/7xl`). Touch targets ≥ 44px. Mobile bottom nav 64px + safe-area inset. More space above a heading than below it.

### Motion

`--dur-fast` 120 · `--dur-base` 180 · `--dur-slow` 280, `--ease-standard` `cubic-bezier(0.2,0.8,0.2,1)`. Press feedback `active:scale-[0.98]`. Animate `transform` and `opacity`; never `transition-all`, never `width`/`height`/`top`/`left`. One authored moment per screen. `base.css` disables everything under `prefers-reduced-motion`.

### Icons

`lucide-react`, 20px default, stroke 1.75. Never an emoji as an icon.

## 3. Components

`src/components/ui/` is the only primitive layer. Feature components compose it and semantic utilities; they never carry raw colours.

Button (`primary` default, `secondary`, `ghost`, `danger`, `crush`, `link`; `sm/md/lg`, `icon*`; `loading`) · Input · Textarea · Select · Combobox · Checkbox · Switch · RadioGroup · Label · FormField · Badge (`neutral`, `brand`, `success`, `warning`, `danger`, `verified`, `anonymous`, `example`, `reward`, `crush`) · Avatar (verified ring, anonymous) · Card · Tabs · SegmentedControl · Dialog · Sheet · DropdownMenu · Popover · Tooltip · Toast · Banner (`info`, `preview`, `warning`) · EmptyState · Skeleton · Spinner · PageHeader · Section · Stat · ListItem · Pagination · Divider · Chip.

Every control ships eight states: default, hover, active, focus-visible, disabled, loading, error, selected. Every view ships loading (Skeleton), empty (EmptyState with one action), error and disabled.

## 4. Shells

Exactly three. `MarketingShell` (one navbar, one footer) for `/`, `/about`, `/privacy`, `/terms`, `/safety`, `/help`, `/contact`, `/pitch`, `/aspirants`, `/products`, `/sitemap`, public articles. `AppShell` (desktop sidebar ≥ 1024px, top bar, mobile bottom nav: Home, Colleges, Post, Chat, Match; preview banner for guests) for every `(app)` and `(dating)` route. `AdminShell` for `/admin`. Navigation config lives only in `src/constants/navigation.ts`.

## 5. Rules

1. No hex, no `-[#…]`, no raw palette class (`zinc-500`, `rose-400` …), no `rounded-[Npx]`, no inline colour outside `src/styles` and `src/components/ui`. `// ds-allow: <reason>` exempts one line and is reported.
2. One primary button per view. Secondary actions are `secondary` or `ghost`.
3. Reward yellow only for Loop Points, streaks, milestones. Crush pink only inside Campus Match. Status colours only for status.
4. No gradient text, mesh or aurora backgrounds, glass panels, neon glows, hard offset shadows, nested cards, eyebrows above headings, tracked-caps labels, middle-dot meta strings, decorative status dots, section numbers.
5. `focus-visible` on every interactive element; keyboard reachable; labels on every field; alt on every image.
6. Pages (`page.tsx`, `layout.tsx`) stay server components when they export metadata; interaction lives in `*-client.tsx`.
7. Never invent a number, quote, logo or testimonial. Live counts come from `getPublicStats()` and show only above threshold.

## 6. Migration map (codemod + hand review)

| From | To |
| --- | --- |
| `bg-white`, `bg-{zinc,neutral,slate,gray,stone}-50` | `bg-surface` (card) or `bg-bg` (page) |
| `bg-{zinc,neutral,slate,gray,stone}-{100,200}` | `bg-surface-muted` |
| `text-{zinc,neutral,slate,gray,stone}-{800,900,950}` | `text-fg` |
| `text-{zinc,neutral,slate,gray,stone}-{500,600,700}` | `text-fg-muted` |
| `text-{zinc,neutral,slate,gray,stone}-{300,400}` | `text-fg-subtle` |
| `border-{zinc,neutral,slate,gray,stone}-{100,200,300,800}` | `border-border` |
| violet / indigo / purple / blue / sky / emerald used as brand | `bg-brand text-brand-fg`, `text-brand-text`, `bg-brand-subtle` |
| rose / pink | `crush` inside Campus Match, otherwise `danger` |
| red / green / amber / orange / yellow as status | `danger` / `success` / `warning`; rewards → `reward` |
| `dark:` colour overrides | delete where the semantic token already switches |
| `rounded-[Npx]` | nearest of `rounded-sm/md/lg/xl/full` |
| `shadow-[…]` | `shadow-xs/sm/lg` |
| `transition-all` | `transition-colors`, `transition-transform`, or `transition-[opacity,transform]` |

## 7. Checks

`bun run typecheck && bun run lint && bun run test && bun run check:design && bun run build`. `check:design` reports today; it switches to `--strict` in CI once the count is zero.
