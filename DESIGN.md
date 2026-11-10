---
name: CampusLoop
description: A verified, student-only campus network that speaks the sticker language of Stories.
colors:
  loop-violet: "#6b3df5"
  loop-violet-deep: "#5a2be0"
  violet-mist: "#f2edff"
  violet-mist-border: "#d0c0ff"
  poll-fill: "#e4daff"
  sticker-yellow: "#ffd43b"
  sticker-yellow-text: "#7a5a00"
  sticker-yellow-subtle: "#fff6cc"
  crush-pink: "#d92a6a"
  crush-pink-text: "#b81d57"
  crush-pink-subtle: "#ffe4ee"
  mint: "#3ddc97"
  mint-text: "#0a6e4d"
  mint-subtle: "#ddf8ec"
  success-green: "#0b7a55"
  danger-red: "#b81d31"
  danger-subtle: "#ffe5e8"
  warning-amber: "#a84f05"
  warning-subtle: "#fff0d9"
  ink: "#15131d"
  ink-muted: "#57526a"
  ink-subtle: "#6c6780"
  paper: "#ffffff"
  paper-muted: "#f5f3fa"
  paper-sunken: "#ebe8f3"
  hairline: "#e2deec"
  hairline-strong: "#cbc6d9"
  night-ground: "#0d0a17"
  night-surface: "#120e1f"
  night-raised: "#211b30"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw + 1rem, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 88"
  display-small:
    fontFamily: "Bricolage Grotesque, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw + 0.75rem, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 88"
  headline:
    fontFamily: "Bricolage Grotesque, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 2.4vw + 1rem, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 88"
  sticker-caption:
    fontFamily: "Bricolage Grotesque, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 82"
  title:
    fontFamily: "Bricolage Grotesque, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Figtree, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.4vw + 1rem, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Figtree, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  caption:
    fontFamily: "Figtree, Noto Sans Devanagari, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  sticker: "22px"
  xl: "28px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  card-padding: "16px"
  control-x: "16px"
  control-h-sm: "36px"
  control-h-md: "44px"
  control-h-lg: "52px"
  nav-mobile-h: "64px"
  nav-desktop-w: "256px"
  container-feed: "640px"
  container-read: "720px"
  container: "1200px"
  container-marketing: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.loop-violet}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.loop-violet-deep}"
  button-secondary:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-sunken}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  button-on-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.loop-violet-deep}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "52px"
  button-on-field-hover:
    backgroundColor: "{colors.violet-mist}"
  chip:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.loop-violet}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "44px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  sticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sticker}"
    padding: "16px"
  sticker-header:
    backgroundColor: "{colors.loop-violet}"
    textColor: "{colors.paper}"
    typography: "{typography.sticker-caption}"
    padding: "12px 16px"
  mention-tag:
    backgroundColor: "{colors.violet-mist}"
    textColor: "{colors.loop-violet-deep}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "28px"
  loop-points-sticker:
    backgroundColor: "{colors.sticker-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  nav-row:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  nav-row-active:
    backgroundColor: "{colors.violet-mist}"
    textColor: "{colors.loop-violet-deep}"
  badge:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: CampusLoop

## Overview

**Creative North Star: "The Campus Story"**

CampusLoop speaks in the sticker language students already use on Instagram and Snapchat Stories. Polls, question boxes, @mentions and countdowns are the real controls of the product, not decoration laid over it. The ground is plain white with near-black ink. One violet, taken from the logo C, does every pressable job. Three other colours exist, and each one means exactly one thing.

The world has two registers. Persuade surfaces (landing, marketing) may flood a full-bleed violet story field, lift stickers with a soft shadow, tilt them a few degrees and let one pop into place. Operate surfaces (feed, chat, settings, admin, forms) stay calm: hairline-bordered cards, plain rows, and the same sticker primitives in their flat variant. Both registers share one token set and one dark "night" version, where every semantic token is redefined under `.dark` on a deep violet-black ground.

Density is phone-first. Controls are at least 44px tall on touch, everything is pill- or tile-shaped, and heavy condensed Bricolage captions carry the voice while Figtree does the reading.

**Key Characteristics:**
- White ground, ink text, Loop Violet as the single action colour.
- Colour by meaning: yellow is Loop Points, pink is Campus Match, mint is verified.
- Stickers are the component vocabulary: rounded tiles, violet header strips, filling poll bars, countdown tiles, @mention pills.
- Heavy, slightly condensed display type; quiet humanist body.
- Soft offset shadows with real blur; flat with a hairline when calm.
- One authored motion moment per screen: the sticker pop.

## Colors

A white-and-ink ground with one saturated violet for action and three meaning-locked accent families.

### Primary
- **Loop Violet** (`loop-violet`): The only action colour. Primary buttons, selected chips, the compose button, focus rings, caret, the violet header strip on question stickers, and the full-bleed story field on landing heroes. In night mode it lightens one step (#7650fa) to keep contrast on the dark ground.
- **Loop Violet Deep** (`loop-violet-deep`): Hover for violet fills, and violet text on white (active nav, links, mention text, on-field button label).
- **Violet Mist** (`violet-mist`) with **Violet Mist Border** (`violet-mist-border`): Quiet violet wash for active nav rows, mention pills and hovered poll options. **Poll Fill** (`poll-fill`) is the unchosen poll bar; the chosen bar uses Violet Mist Border.

### Secondary
- **Sticker Yellow** (`sticker-yellow`): Loop Points and rewards only. Text on it is always ink. **Sticker Yellow Text** (`sticker-yellow-text`) is the readable yellow-family text colour on white; **Sticker Yellow Subtle** (`sticker-yellow-subtle`) is its wash.

### Tertiary
- **Crush Pink** (`crush-pink`): Campus Match and Secret Crush only, with **Crush Pink Text** and **Crush Pink Subtle** for text and wash.
- **Mint** (`mint`): Verified, success and "streak safe" only, with ink text on the fill. **Mint Text** and **Mint Subtle** carry it as text and wash. **Success Green** (`success-green`) is the filled success button on white.

### Neutral
- **Ink** (`ink`): All primary text, and the countdown tile fill.
- **Ink Muted** (`ink-muted`) / **Ink Subtle** (`ink-subtle`): Secondary text, meta lines, placeholders.
- **Paper** (`paper`): Page ground, card surface, sticker tile.
- **Paper Muted** (`paper-muted`): Secondary buttons, unselected chips, poll track, chat bubbles from others.
- **Paper Sunken** (`paper-sunken`): Hover for muted fills; the story-frame screen.
- **Hairline** (`hairline`) / **Hairline Strong** (`hairline-strong`): Card and nav borders; field borders and unvoted poll options.
- **Night Ground / Night Surface / Night Raised** (`night-ground`, `night-surface`, `night-raised`): The dark-mode ground, surfaces and raised layers.
- **Danger Red / Warning Amber** with their subtle washes: Errors and warnings. These are status colours, never brand colours.

### Named Rules
**The One Action Colour Rule.** Anything you can press that is not a status action is Loop Violet or a neutral. No second action hue exists.

**The Colour Means One Thing Rule.** Yellow is Loop Points, pink is Campus Match, mint is verified or safe. A colour from these families never appears for decoration or category tinting.

**The Night Version Rule.** Dark mode redefines semantic tokens under `.dark`. Components never hand-pick their own dark colours.

## Typography

**Display Font:** Bricolage Grotesque (variable `wdth` and `opsz` axes), with Noto Sans Devanagari and system sans fallback
**Body Font:** Figtree, with Noto Sans Devanagari and system sans fallback
**Label/Mono Font:** JetBrains Mono, for real code only

**Character:** A heavy, slightly squeezed grotesque that reads like a Story caption, set against a friendly, open humanist sans that stays out of the way. Devanagari is in every stack so Hindi names and text never fall back to a system face.

### Hierarchy
- **Display** (800, `clamp(2.5rem, 6vw + 1rem, 5.5rem)`, 0.95, width 88%): The landing hero headline only, held to about 12ch.
- **Display Small** (800, `clamp(2rem, 4vw + 0.75rem, 3.5rem)`, 1.1): Secondary marketing heroes and big section openers.
- **Headline** (800, `clamp(1.75rem, 2.4vw + 1rem, 2.75rem)`, 1.1): Section headings on Persuade surfaces, held to about 18ch.
- **Sticker Caption** (800, 1.125rem to 2.75rem, line-height 1, width 82%): Sticker prompts, poll questions, story captions, countdown digits, Loop Points numbers.
- **Title** (700, 1.125rem, 1.375): Card titles and in-app headings (h3/h4 at weight 700).
- **Lead** (400, `clamp(1.0625rem, 0.4vw + 1rem, 1.25rem)`, 1.375): The paragraph under a hero headline, about 42ch.
- **Body** (400, 1rem, 1.5): All reading text and fields. Fields stay 16px on touch so iOS never zooms.
- **Label** (600, 0.875rem): Buttons, chips, nav rows (nav rows use 0.9375rem at 500).
- **Caption** (500 to 600, 0.75rem): Badges, poll footers, bottom-nav labels, meta.

### Named Rules
**The Caption Voice Rule.** Bricolage at 800 with negative tracking is the voice of the product. Headings h1 and h2 are 800 at 88% width; sticker captions are 800 at 82% width. Body copy is never set in the display face.

**The Tabular Numbers Rule.** Counts, timers, points and percentages use tabular figures.

## Layout

Phone-first. App surfaces use a 640px feed column, a 720px reading column and a 1200px container; marketing uses 1280px. Side gutters step 16px, 24px at 768px, 32px at 1024px. Below 1024px a 64px bottom tab bar carries navigation with a centred compose sticker; from 1024px a 256px persistent left rail replaces it and the drawer trigger is hidden. Landing sections use a 12-column grid at large widths; the hero splits roughly 7/5 with the phone-height story frame (max 400px, 9:16) on the right, and stacks the frame full-width under the headline on mobile. Rhythm is generous on Persuade surfaces (48 to 80px vertical hero padding, 80px row gaps in feature lists) and tight on Operate surfaces (16px card padding, 12px for small cards). Every touch target reaches 44px on coarse pointers, and safe-area insets pad the top and bottom bars.

## Elevation & Depth

A hybrid: Operate surfaces are flat and use hairline borders; Persuade surfaces and the few floating objects use soft, offset, blurred shadows. Night mode keeps the same geometry with black shadows at higher opacity.

### Shadow Vocabulary
- **Hairline lift** (`box-shadow: 0 1px 2px 0 rgb(21 19 29 / 0.06)`): The selected tab in a pill tab group.
- **Resting** (`box-shadow: 0 2px 8px -2px rgb(21 19 29 / 0.1), 0 1px 2px 0 rgb(21 19 29 / 0.05)`): Popovers and raised controls.
- **Floating** (`box-shadow: 0 16px 36px -12px rgb(21 19 29 / 0.24), 0 4px 10px -4px rgb(21 19 29 / 0.1)`): Dialogs and sheets.
- **Sticker** (`box-shadow: 0 6px 16px -6px rgb(21 19 29 / 0.26), 0 2px 4px -1px rgb(21 19 29 / 0.08)`): Lifted sticker tiles, the Loop Points pill, the compose button, the on-field button.
- **Sticker lift** (`box-shadow: 0 12px 26px -8px rgb(21 19 29 / 0.3), 0 3px 6px -2px rgb(21 19 29 / 0.1)`): The landing story frame.

### Named Rules
**The Border Or Shadow Rule.** A surface carries a hairline border or a shadow, never both. A sticker's `flat` variant swaps the shadow for a hairline.

**The Real Blur Rule.** Every shadow has an offset and a blur. No zero-blur block shadows, no zero-offset glows.

## Shapes

Everything is soft and pill-like. Buttons, chips, badges, mention tags, nav rows and the Loop Points pill are full pills (9999px). Fields are gently rounded (14px), cards rounder (20px), sticker tiles rounder still (22px), and dialogs, sheets and the story frame the roundest (28px). Poll bars and option buttons use 10px with a clip-path fill so the rounded end stays crisp as it grows. The chat compose bubble is the one asymmetric shape: three 22px corners and a 6px tail corner. Stickers may tilt 3 degrees left or right on Persuade surfaces.

## Components

### Buttons
Pill-shaped and confident, with a small press squeeze.
- **Shape:** full pill (9999px), 44px default height; 36px small (44px on touch), 28px extra-small, 52px large.
- **Primary:** Loop Violet fill, white label at 600, 16px side padding.
- **Hover / Focus:** Fill deepens to Loop Violet Deep over 180ms on the standard ease; press scales to 0.97; focus draws a 2px violet ring offset 2px from the ground.
- **Secondary / Outline / Ghost:** Paper Muted fill; white with a hairline; transparent with a muted hover. A selected state in a group turns them Violet Mist with violet text.
- **On field:** White sticker button with violet label and the sticker shadow, for use on a violet story field only.
- **Status:** Danger, Success and Crush variants exist for their meanings only.

### Chips
- **Style:** Borderless pill, Paper Muted fill, Ink Muted text, 40px tall (32px small; 44px on touch).
- **State:** Selected fills Loop Violet with white text, because a chip is a pressable choice. Counts sit in an inner pill. A removable chip is two sibling buttons inside one pill.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** Paper (Night Surface in dark mode).
- **Shadow Strategy:** None; cards are flat (see Elevation).
- **Border:** One hairline.
- **Internal Padding:** 16px, 12px for the small size.

### Inputs / Fields
- **Style:** White, Hairline Strong border, 14px radius, 44px tall, 14px side padding, 16px text, Ink Subtle placeholder.
- **Focus:** Border turns Loop Violet with a 3px violet ring at 25%.
- **Error / Disabled:** Danger border with a 2px danger ring at 20%; disabled drops to Paper Muted at 60% opacity.

### Navigation
- **Desktop rail:** 256px, white, hairline right edge. Rows are 44px pills, 0.9375rem at 500 in Ink Muted; hover is Paper Muted; active is Violet Mist with violet text at 600 and a heavier icon stroke. A full-width violet Post pill sits under the list.
- **Mobile bar:** 64px, white, hairline top edge, five slots with 24px icons over 0.75rem labels; active is violet text. The centre slot is a 48px violet sticker-shaped compose button with the sticker shadow.

### Stickers (signature)
The core vocabulary, from `src/components/ui/stickers`. Each has a `sticker` variant (lifted, Persuade, at most one popping per screen) and a `flat` variant (hairline, calm, in feeds).
- **Sticker tile:** 22px radius, Paper fill (or a meaning tone: violet, yellow, pink, mint), sticker shadow.
- **Poll sticker:** Caption question, option buttons with a Hairline Strong border that hover to Violet Mist; once voted, bars fill to the result over 700ms with an expo ease, chosen bar darker with a check and bold label.
- **Question sticker:** Violet header strip carrying the prompt in sticker caption type, white body below with a muted textarea and a Send button.
- **Countdown sticker:** Caption title with a timer icon, three ink tiles with white caption digits.
- **Mention tag:** Violet Mist pill with violet `@username`; hovers to full violet when it links.
- **Loop Points sticker:** Sticker Yellow pill with ink text, coin icon and caption-weight number.

### Motion
State changes use one transition set (colour, background, border, opacity, transform, shadow) at 180ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`; never width, height or position. The sticker pop is the one authored moment: a 460ms settle from 86% scale and a slight rotation, starting visible. Reduced motion is honoured globally; only story progress timing opts out.

## Do's and Don'ts

### Do:
- **Do** use Loop Violet for every pressable primary action and nothing decorative.
- **Do** keep yellow for Loop Points, pink for Campus Match, mint for verified or safe.
- **Do** build interactive moments from the sticker primitives (poll, question, countdown, mention, Loop Points) before inventing a new widget.
- **Do** use the `flat` sticker variant and hairline cards on Operate screens; reserve lift, tilt and pop for Persuade screens.
- **Do** keep every control at 44px or taller on touch, and fields at 16px text.
- **Do** label example content on marketing surfaces with the dashed Example badge.

### Don't:
- **Don't** use gradient text, decorative backdrop blur, glass panels, or `transition-all`.
- **Don't** put a border and a shadow on the same surface, or use zero-blur block shadows.
- **Don't** use emoji as icons; icons are line icons.
- **Don't** add thick coloured side stripes to cards or rows.
- **Don't** put eyebrow labels above headings or number sections 01/02/03.
- **Don't** build page structure from identical icon-card grids, nested cards, or hero metric rows.
- **Don't** use raw hex or palette classes outside `src/styles` and `src/components/ui`; use semantic tokens.
- **Don't** use the violet story field outside landing and marketing heroes.
