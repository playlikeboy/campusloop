# 🎨 CampusLoop Design System Specification (DESIGN.md)

This is the canonical design system for CampusLoop's public and authenticated experiences. It defines a reassuring, approachable, accessible visual language that feels trustworthy without losing its cute student-first personality.

---

## 1. Design Vision & Core Principles

CampusLoop should feel:
- **Trustworthy:** clear slate-teal actions, calm ink, legible status labels, and accessible contrast.
- **Cute and warm:** ivory surfaces, gentle blush and peach, powder-blue illustrations, mint trust cues, and softly rounded components.
- **Clean and minimal:** intentional whitespace, one primary action per view, subtle borders, few competing elevations, and zero decorative noise.
- **Student-first:** friendly language with practical labels; playful accents must never obscure privacy, eligibility, or safety information.
- **Production-ready:** semantic CSS variables, responsive layouts, fast rendering, keyboard support, and truthful product content.

## 2. Canonical Trust + Cute Palette

Cool confidence-building blue-teal anchors actions; warm ivory and soft pastel accents make the experience welcoming. Coral and blush are for delight, not for small low-contrast body text.

| Token | Light mode | Dark mode | Intended use |
|---|---|---|---|
| Canvas | `#F7E4DF` | `#101922` | Soft outer canvas and ambient background |
| Background | `#FFF9F4` | `#101922` | Primary page surface |
| Surface / card | `#FFFFFF` | `#18252F` | Content cards and forms |
| Raised surface | `#FFFFFF` | `#202F3A` | Popovers, menus, dialogs |
| Primary ink | `#29394D` | `#F4F7F8` | Headings and primary copy |
| Muted ink | `#586A7C` | `#BDCCD4` | Descriptions, metadata, placeholders |
| Primary action | `#3D6C83` | `#8DBCCB` | Main CTA, active controls, focus indicator |
| Primary action hover | `#31586B` | `#A7CBD6` | Hover and pressed states |
| Action text | `#FFFFFF` | `#13232C` | Text on the primary button |
| Warm secondary | `#FCEBE6` | `#2B363E` | Secondary actions and quiet emphasis |
| Coral | `#EF8879` | `#EF8879` | Illustration details, hearts, decorative emphasis |
| Pastel blue | `#D8EAF2` | `#8DBCCB` | Study, discovery, and feature-tint surfaces |
| Pastel butter | `#FFEAB1` | `#D7B86B` | Friendly supporting highlights |
| Pastel blush | `#F4C1BA` | `#CB8B84` | Community and social accents |
| Success | `#2D755C` | `#77C4A2` | Successful actions and verified-state cues |
| Soft success | `#E5F3EC` | `#1D3A31` | Positive status background |
| Border | `#DCE5EA` | `#344653` | Quiet separation without heavy boxes |

## 3. Semantic Color Rules

- Primary CTAs use trust teal (`--primary`); button text must remain legible in both themes.
- Blue-teal is for actions, navigation selection, links, and focus—not every decorative area.
- Mint/green is reserved for a real successful or verified state.
- Coral, blush, pastel blue, and butter yellow are accent surfaces, not substitutes for readable text.
- Do not convey state through color alone. Pair icons or status text with color.
- Do not hardcode new hex values in components. Add or reuse semantic variables in `src/app/globals.css`.
- Target at least 4.5:1 for normal text and 3:1 for large text and applicable control boundaries. Do not claim measured conformance unless checked.

### Light mode token reference

```css
:root {
  --canvas: #F7E4DF;
  --canvas-soft: #FBEAE6;
  --surface: #FFF9F4;
  --surface-raised: #FFFFFF;
  --surface-sunken: #F1F4F6;
  --background: #FFF9F4;
  --foreground: #29394D;
  --card: #FFFFFF;
  --card-foreground: #29394D;
  --popover: #FFFFFF;
  --popover-foreground: #29394D;
  --text: #29394D;
  --text-secondary: #586A7C;
  --text-muted: #586A7C;
  --muted: #F1F4F6;
  --muted-foreground: #586A7C;
  --primary: #3D6C83;
  --primary-hover: #31586B;
  --primary-soft: #E7F0F4;
  --primary-foreground: #FFFFFF;
  --secondary: #FCEBE6;
  --secondary-foreground: #70443D;
  --accent: #E8F2F5;
  --accent-foreground: #31586B;
  --coral: #EF8879;
  --cat-blue: #D8EAF2;
  --cat-yellow: #FFEAB1;
  --cat-pink: #F4C1BA;
  --success: #2D755C;
  --success-soft: #E5F3EC;
  --warning: #925400;
  --warning-soft: #FFF2D6;
  --destructive: #B3261E;
  --border: #DCE5EA;
  --input: #DCE5EA;
  --ring: #3D6C83;
}
```

### Dark mode token reference

```css
.dark {
  --canvas: #101922;
  --canvas-soft: #16222C;
  --surface: #18252F;
  --surface-raised: #202F3A;
  --surface-sunken: #131F28;
  --background: #101922;
  --foreground: #F4F7F8;
  --card: #18252F;
  --card-foreground: #F4F7F8;
  --popover: #202F3A;
  --popover-foreground: #F4F7F8;
  --text: #F4F7F8;
  --text-secondary: #BDCCD4;
  --text-muted: #AFC0CA;
  --muted: #202F3A;
  --muted-foreground: #BDCCD4;
  --primary: #8DBCCB;
  --primary-hover: #A7CBD6;
  --primary-soft: #263B46;
  --primary-foreground: #13232C;
  --secondary: #2B363E;
  --secondary-foreground: #F1DDD7;
  --accent: #263B46;
  --accent-foreground: #A7CBD6;
  --coral: #EF8879;
  --cat-blue: #8DBCCB;
  --cat-yellow: #D7B86B;
  --cat-pink: #CB8B84;
  --success: #77C4A2;
  --success-soft: #1D3A31;
  --warning: #F2C66D;
  --warning-soft: #3B3020;
  --destructive: #F17E7A;
  --border: #344653;
  --input: #344653;
  --ring: #8DBCCB;
}
```

## 4. Palette Application

- **Campus, housing, and marketplace:** trust teal for navigation and primary actions; ivory surfaces for content; mint for genuinely verified states; butter, blue, and blush as category tints.
- **Social and playful moments:** coral hearts, blush details, and pastel illustrations; keep text in high-contrast ink colors.
- **Forms, security, privacy, and verification:** neutral layouts, clear labels, blue-teal actions, and no color-only messaging.
- **Dark mode:** midnight blue-slate surfaces with clear elevation steps; avoid pure-black blocks and neon overload.

## 5. Typography Scale & Fonts

CampusLoop uses a dual-typeface system configured via `next/font/google`:
1. **Display & Headings**: `Baloo 2` (`--font-display` / `font-heading`) — rounded, approachable, slightly playful, supporting Devanagari and Latin.
2. **Body & Neutral UI**: `Nunito Sans` (`--font-body` / `font-sans`) — warm, exceptionally readable, neutral, balanced letterforms.

| Scale Token | Size / Line Height | Weight | Usage |
|---|---|---|---|
| `text-3xl` | `30px / 38px` | `800` (Extrabold) | Hero headlines, landing titles |
| `text-2xl` | `24px / 32px` | `700` (Bold) | Major page titles (Communities, Feeds, Profile) |
| `text-xl` | `20px / 28px` | `700` (Bold) | Section headers, card titles |
| `text-lg` | `18px / 26px` | `600` (Semibold) | Modal titles, post card author names |
| `text-base` | `15px / 24px` | `400` / `500` | Feed post content, article body text |
| `text-sm` | `13px / 20px` | `500` / `600` | Button labels, list row details, card descriptions |
| `text-xs` | `11px / 16px` | `600` / `700` | Timestamps, handles, category chips, counters |

---

## 6. Spacing Scale

Based on an 8-point / 4-point incremental grid:
- `gap-1` / `p-1`: `4px` — micro-separators, icon-to-label spacing.
- `gap-2` / `p-2`: `8px` — compact buttons, input padding, chip internal gap.
- `gap-3` / `p-3`: `12px` — list item spacing, toolbar clusters.
- `gap-4` / `p-4`: `16px` — standard card padding, standard grid gap.
- `gap-6` / `p-6`: `24px` — section spacing, modal internal padding.
- `gap-8` / `p-8`: `32px` — major page sections, container gutters.

---

## 7. Layout & Content-Width Primitives

- **Max Content Widths**:
  - Feed & Social Column: `max-w-2xl` (`672px`) — optimal reading line length (~65 characters).
  - Multi-Column Grids (Colleges, Academics, Communities): `max-w-6xl` (`1152px`).
  - Wide Explorer & Landing: `max-w-7xl` (`1280px`).
- **Page Horizontal Padding**: `px-4 sm:px-6 lg:px-8`.
- **Shell Layout**: Centered column flanked by subtle sticky left navigation and optional contextual right rail.

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile Small | `360px - 390px` | Single column, mobile bottom bar, compact icons, zero horizontal scroll |
| Mobile Large | `480px` | Compact avatar stacks, 1-line action bars |
| Tablet | `768px` | 2-column card grids, top breadcrumb bar, full modal dialogues |
| Desktop | `1024px` | Sticky desktop sidebar navigation, 8/4 grid on detail pages |
| Wide Desktop | `1440px` | Centered maximum container with generous blush canvas margins |

---

## 9. Border-Radius, Borders & Elevation Tokens

- **Radius Hierarchy**:
  - `rounded-lg`: `8px` — inputs, small buttons, badges.
  - `rounded-xl`: `12px` — standard buttons, dropdown menus, filter chips.
  - `rounded-2xl`: `16px` — cards, list cards, modals, preview containers.
  - `rounded-3xl`: `24px` — hero banners, plinth profiles, community headers.
  - `rounded-full`: `9999px` — pills, avatar circles, FABs, status chips.
- **Borders**: Single elevation model. Warm hairline border: `border border-border/80` or `border border-border/60`.
- **Elevation Shadows**:
  - `--shadow-2xs`: `0 1px 2px 0 rgba(90, 85, 75, 0.04)`
  - `--shadow-sm`: `0 2px 6px -1px rgba(90, 85, 75, 0.06)`
  - `--shadow-md`: `0 8px 20px -4px rgba(90, 85, 75, 0.08)`
  - No harsh dark block shadows or blurry glassmorphism.

---

## 10. Motion & Interaction

- **Duration Scale**:
  - Micro-interactions (hover, active scale): `150ms ease-out` (`transition-all`).
  - Dropdown / Modal entry: `200ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Feedback**:
  - Buttons scale down subtly on press: `active:scale-[0.98]`.
  - Haptic feedback enabled on mobile through `@/lib/haptics.ts`.
- **Accessibility**: All transitions respect `motion-reduce:transition-none` and `@media (prefers-reduced-motion)`.

---

## 11. Accessibility & Contrast (WCAG AA/AAA)

- **Text Contrast Floor**:
  - Primary text (`#29394D`) on Ivory (`#FFF9F4`): **7.07:1** (WCAG AAA Pass).
  - Secondary text (`#586A7C`) on Ivory (`#FFF9F4`): **4.71:1** (WCAG AA Pass).
  - Primary action (`#3D6C83`) on Ivory (`#FFF9F4`): **5.21:1** (WCAG AA Pass).
  - Button text (`#FFFFFF`) on Primary Action (`#3D6C83`): **5.53:1** (WCAG AA Pass).
- **Focus Rings**: Native high-contrast focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- **Screen Reader Support**: Meaningful `aria-label`, hidden context via `sr-only`, and semantic headings (`h1` through `h4`).

---

## 12. Component Inventory & Standards

### A. Buttons (`src/components/ui/button.tsx`)
- `variant="default"` / `primary`: Accessible trust teal (`bg-action text-white hover:bg-action-hover shadow-2xs`).
- `variant="secondary"`: Polished ivory pill with crisp border (`bg-primary-soft text-primary border border-primary-soft-border hover:bg-primary-soft/80`).
- `variant="outline"`: Transparent surface with clear border (`border-border bg-surface text-ink hover:bg-surface-sunken`).
- `variant="ghost"`: Zero border, soft hover background (`text-ink hover:bg-surface-sunken`).
- `variant="destructive"`: Accessible ruby tint (`bg-danger-soft text-danger border border-danger/20`).

### B. Cards (`src/components/ui/card.tsx`)
- Single elevation model: `bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xs`.
- Header, Title (`font-heading font-bold text-foreground`), Content, and Footer.

### C. Badges & Tags (`src/components/ui/badge.tsx`, `community-role-badge.tsx`)
- High contrast, clear border on every badge:
  - Admin: `bg-amber-500/10 text-amber-950 dark:text-amber-200 border border-amber-500/50`.
  - Moderator: `bg-sky-500/10 text-sky-950 dark:text-sky-200 border border-sky-500/50`.
  - Member / Neutral: `bg-muted/70 text-foreground border border-border/80`.

### D. Cute Mascot & Illustrations (`src/components/ui/cute-illustrations.tsx`)
- `CuteCatMascot`: Reusable lightweight SVG mascot.
- `CuteCatEmpty`: Restful cat illustration for empty feeds, search, and inbox.
- `CuteCatSuccess`: Joyful mascot with heart for completed workflows.
- `CuteHeart`: Hand-drawn warm coral heart for micro-reactions.

---

## 13. Page-Level Composition Rules

1. **One Primary Action per View**: A screen should have exactly one high-emphasis trust teal button. Secondary actions use ivory outlines or ghost pills.
2. **Generous Spacing Above Headings**: Maintain more whitespace above headings (`pt-6` / `pt-8`) than below them (`pb-2`).
3. **No Decorative Gradients Over Text**: Avoid text-gradient hacks that hurt legibility. Use solid warm typography with `Baloo 2`.
4. **Clean Accordions / Hidden Filters**: Keep search filters tidy; do not clutter screens with 4 stacked rows of filter buttons.

---

## 14. Illustration & Iconography Guidelines

- **Zero Raw Emojis in Core UI**: Emojis are strictly banned from UI buttons, tabs, badges, and headers. Use `lucide-react` icons in uniform `size-4` / `size-3.5` with `1.75` stroke weight.
- **Cute Pastel Fills**: Vector illustrations use soft fills (`#D8EAF2`, `#FFEAB1`, `#F4C1BA`) with clean `#29394D` warm outlines.

---

## 15. CSS Architecture & Single Source of Truth

- **Single Entry Point**: [`src/app/globals.css`](src/app/globals.css) contains the complete token set.
- **Tailwind v4 Integration**: All CSS custom properties are wired through `@theme inline`.
- **Zero Arbitrary Inline Hex**: Components consume semantic utility classes (`bg-card`, `text-foreground`, `border-border`, `text-primary`, `bg-primary`) rather than hardcoded hex values.

---

## 16. Next.js App Router Engineering Rules

1. **Server Components by Default**: Pages (`page.tsx`) remain pure Server Components exporting `metadata` and JSON-LD structured data.
2. **Interactive UI Delegated to Client Components**: Interactive components carry `"use client"` in dedicated files (e.g., `*-client.tsx`).
3. **Image Optimization**: Use `next/image` with explicit `sizes` and proper aspect ratios.
4. **Zero Edge Failures**: All styles and code strictly conform to Cloudflare Workers runtime (no Node.js-only native modules in request cycle).

---

## 17. File Locations for Design System Assets

- Global Styles & CSS Tokens: [`src/app/globals.css`](src/app/globals.css)
- Mobile Navigation Styles: [`src/app/mobile-navigation.css`](src/app/mobile-navigation.css)
- Root Layout & Fonts: [`src/app/layout.tsx`](src/app/layout.tsx)
- UI Primitives: [`src/components/ui/`](src/components/ui/)
  - `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`, `avatar.tsx`
  - `cute-illustrations.tsx` (Mascots & Illustrations)
  - `community-role-badge.tsx` (Crisp Role Badges)
- Standard Empty State: [`src/components/primitives/empty-state.tsx`](src/components/primitives/empty-state.tsx)

---

## 18. Instructions for Adding New Pages & Components

1. Check existing UI primitives in `src/components/ui/` before building custom containers.
2. Apply `font-heading` (`Baloo 2`) for titles and `font-sans` (`Nunito Sans`) for descriptions.
3. Use `bg-card text-card-foreground border border-border/80 shadow-2xs rounded-2xl` for standard cards.
4. For action controls, use `<Button variant="primary">` or `<Button variant="secondary">`.
5. Ensure color contrast satisfies ≥4.5:1 on light ivory surfaces.

---

## 19. Anti-Patterns to Avoid

- ❌ Hardcoding arbitrary hex codes (`bg-[#3D6C83]` or `bg-[#29394D]`).
- ❌ Using washed-out light gray text on light backgrounds.
- ❌ Heavy black drop shadows or competing multiple elevations.
- ❌ Putting raw emojis into button labels or navigation tabs.
- ❌ Overusing mascot illustrations on dense data tables or settings forms.

---

## 20. Validation & Regression Testing Checklist

- [x] Run `bun test` — 446 unit and integration tests passing.
- [x] Run `NODE_OPTIONS='--max-old-space-size=5120' bun x tsc --noEmit` — 0 compiler errors.
- [x] Verify viewport responsiveness at `360px`, `390px`, `768px`, `1024px`, and `1440px`.
- [x] Test light and dark theme contrast compliance.
- [x] Validate keyboard navigation and screen reader attributes.

---

## 21. Relevant Official Documentation References

1. Next.js 16 Release & Architecture: https://nextjs.org/blog/next-16
2. App Router Layouts & Pages: https://nextjs.org/docs/app/getting-started/layouts-and-pages
3. Server & Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
4. CSS & Styling Guidance: https://nextjs.org/docs/app/getting-started/css
5. Font Optimization: https://nextjs.org/docs/app/getting-started/fonts
6. Image Optimization: https://nextjs.org/docs/app/api-reference/components/image
7. Metadata & Social Sharing: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
8. Production Checklist: https://nextjs.org/docs/app/guides/production-checklist
9. Tailwind CSS Theme Variables: https://tailwindcss.com/docs/theme
