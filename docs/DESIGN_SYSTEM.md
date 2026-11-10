# CampusLoop Design System v4

The single spec. `src/styles/tokens.css` is the source of truth; this file explains how to use it.

## Files

| What | Where |
| --- | --- |
| Tokens (primitives → semantic → component, light + dark) | `src/styles/tokens.css` |
| Browser floor (focus, selection, caret, scrollbars, reduced motion) | `src/styles/base.css` |
| Tailwind mapping, legacy aliases, shared utilities | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` |
| Primitives | `src/components/ui/` |
| Sticker primitives | `src/components/ui/stickers/` (import from the index) |
| Guard | `bun run check:design` (`--strict` fails, `--list` prints hits) |
| Contrast proof | `src/styles/contrast.test.ts` |

## Colour laws

| Colour | Means | Utilities |
| --- | --- | --- |
| Ink `#15131D` on white | Text and ground | `bg-bg`, `bg-surface`, `bg-surface-muted`, `bg-surface-raised`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `border-border-strong` |
| Loop Violet | The only action colour: things you press | `bg-brand`, `hover:bg-brand-hover`, `text-brand-fg`, `text-brand-text`, `bg-brand-subtle`, `ring-ring` |
| Violet story field | Full-bleed hero backgrounds on landing/marketing only | `bg-story-field`, `text-story-field-fg`, `.story-field` |
| Sticker Yellow | Loop Points and rewards only | `bg-reward`, `text-reward-fg`, `text-reward-text`, `bg-reward-subtle` |
| Crush Pink | Campus Match / Secret Crush only | `bg-crush`, `text-crush-fg`, `text-crush-text`, `bg-crush-subtle` |
| Mint | Verified, success, streak safe only | `bg-verified`, `text-verified-fg`, `text-verified-text`, `bg-verified-subtle` (`success*` aliases) |
| Status | Errors and warnings | `danger*`, `warning*` |

Dark mode is the night version: deep violet-black ground with every token redefined under `.dark`. Never hand-pick dark colours per component.

Legacy names (`bg-card`, `bg-primary`, `text-muted-foreground`, `text-ink`, `bg-canvas`, `coral`, `cat-*` …) still resolve to the tokens above. New code uses the canonical names.

## Type

- `font-display`: Bricolage Grotesque, for headings (h1–h4 get it automatically).
- `sticker-caption`: heavy, condensed caption for sticker and story text.
- `font-sans`: Figtree, for body and UI. This is the default.
- `font-mono`: JetBrains Mono, for real code only.
- Noto Sans Devanagari is the fallback in every stack.

## Shape, depth, motion

- Radii: `rounded-sm` 10, `rounded-md` 14 (fields), `rounded-lg` 20 (cards), `rounded-xl` 28 (dialogs/sheets), `rounded-sticker` 22, `rounded-full` (buttons, chips).
- Shadows always have an offset and a blur: `shadow-xs`, `shadow-sm`, `shadow-lg`, `shadow-sticker`, `shadow-sticker-lift`. A surface uses a border or a shadow, never both.
- Motion: `transition-ui` for state changes. `sticker-pop` is the one authored moment (scale and slight rotate settle, visible from frame one). `poll-fill` with `--fill: 0–100` is the poll bar. Use at most one sticker moment per screen. `prefers-reduced-motion` is respected globally; `keep-motion` opts out only for content timing such as story progress.

## Surfaces

- Operate (feed, chat, settings, admin, forms): calm. Use `Card` (hairline border, no shadow), plain rows, and stickers in `variant="flat"`.
- Persuade (landing, marketing): may use story fields, lifted stickers, and `tilt`.

## Bans (enforced by `check:design`)

Gradient text, decorative `backdrop-blur`, `transition-all`, thick coloured side stripes, Plus Jakarta Sans, raw hex or palette classes outside `src/styles` and `src/components/ui`, and emoji used as icons. Also banned: eyebrow labels above headings, 01/02/03 section numbers, identical icon-card grids as page structure, nested cards, hero-metric stat rows, and invented numbers or testimonials.

## Copy

Use short, plain student English. Buttons name the action ("Post", "Send", "Join with college email"). Errors say what went wrong and how to fix it. Empty states are one line plus one action. Never use hype words.
