# CampusLoop Design Plan & Token Architecture (Phase 1)

**Target Aesthetic:** Intuitive, Clean, Minimal, Cute, Trustworthy, and Bright.  
**Audience:** Indian undergraduates aged 17–23 on mid-range smartphones and patchy Wi-Fi; faculty and parents evaluating trust.

---

## 1. Five Guiding Principles

1. **Intuitive Above All:** Max 7 navigation destinations. Plain words students actually use (*"Notes & PYQs"* instead of *"Vault"*, *"Marketplace"* instead of *"Campus Market + Buy & Sell"*). One primary action per screen.
2. **Clean & Minimal:** Flat surfaces, 1px subtle borders, no decorative drop shadows or faux-glassmorphism. At most 3 meta points per card item.
3. **Cute & Friendly:** Rounded headings (`Baloo 2`), soft pastel category tints (`--tint-*`), cheerful voxel illustrations reserved for empty states and hero, warm conversational empty copy.
4. **Trustworthy & Transparent:** 100% verified student badges with one design, zero fake testimonials or simulated counts, plain-language privacy disclosures.
5. **Bright by Default:** A crisp, cool-white canvas (`#F7F8FC`) with pure white elevated surfaces (`#FFFFFF`) in light mode. Dark mode (`#0E1020` / `#161933`) respects system preference without turning the platform into a nightclub aesthetic.

---

## 2. Token Palette (Exact Values & Contrast Ratios)

### Light Theme (Default)
```css
--canvas:               #F7F8FC;   /* Page background (cool near-white, 16.4:1 contrast with text) */
--surface:              #FFFFFF;   /* Cards, sheets, inputs */
--surface-sunken:       #EFF1F8;   /* Wells, skeletons, segmented control track */
--border:               #E3E6F1;   /* Subtle divider */
--border-strong:        #CDD2E4;   /* Active / focused borders */
--text:                 #1B1B3A;   /* Deep ink text (WCAG AAA ≥14.2:1 contrast against surface) */
--text-secondary:       #4B4F6B;   /* Secondary meta (WCAG AA ≥7.1:1 contrast) */
--text-muted:           #6B6F8A;   /* Smallest meta text (WCAG AA ≥4.8:1 contrast) */

--primary:              #5B4BFF;   /* Single authoritative action color (Neo-Indigo) */
--primary-hover:        #4A3BE6;
--primary-soft:         #EEEDFF;   /* Secondary button / chip fill */
--primary-soft-border:  #D9D6FF;
--on-primary:           #FFFFFF;

--sun:                  #FFC83D;   /* Mascot, streak highlight */
--success:              #067647;   /* Verified badges & confirmed status */
--success-soft:         #E6F6EE;
--warning:              #B54708;
--warning-soft:         #FFF4E0;
--danger:               #B42318;
--danger-soft:          #FDECEA;

/* Category Icon Background Tints (Restricted to icon chips & empty state illustrations) */
--tint-notes:           #E5F0FF;
--tint-communities:     #EEEDFF;
--tint-events:          #FFE8F1;
--tint-housing:         #E3F7EC;
--tint-market:          #FFF1D6;
--tint-safety:          #E0F4F5;
```

### Dark Theme (System Preference)
```css
--canvas:               #0E1020;   /* Tinted navy obsidian */
--surface:              #161933;   /* Slate navy cards */
--surface-sunken:       #1D2142;
--border:               #262A4A;
--border-strong:        #3B416E;
--text:                 #F2F3FF;   /* Crisp white-ink text */
--text-secondary:       #B8BCDC;
--text-muted:           #868BA8;
--primary:              #8C80FF;   /* Lightened accessible primary */
--primary-hover:        #9D93FF;
--primary-soft:         #252254;
--primary-soft-border:  #3D3788;
```

---

## 3. Typography Hierarchy

- **Headings & Page Titles:** `Baloo 2` (Google Fonts), weights 600–800. Soft rounded friendly letterforms.
- **Body & UI Elements:** `Figtree` (Google Fonts), weights 400, 500, 600. High x-height, clear digits.
- **Monospace:** `DM Mono`, weights 400, 500.

| Level | Size / Line-Height | Weight | Font Family | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | `32px / 40px` (sm: `40px / 48px`) | 700 / 800 | Baloo 2 | Hero headers, major hubs |
| **H2 Section** | `24px / 32px` | 700 | Baloo 2 | Page titles, card group headers |
| **H3 Subsection** | `20px / 28px` | 600 | Baloo 2 | Card titles, modal headers |
| **Body Large** | `16px / 24px` | 400 / 500 | Figtree | Feed post content, articles |
| **Body Default** | `14px / 20px` | 400 / 500 | Figtree | Buttons, inputs, card meta |
| **Caption / Timestamp** | `12px / 16px` | 500 | Figtree | Timestamps, status pills |

---

## 4. Layout Architecture & ASCII Wireframes

### Desktop App Shell (1280px Viewport)
```
+-----------------------------------------------------------------------------------------+
| [CampusLoop Logo]     [Scope: BIT Mesra v]      [Search Cmd+K]     [Notifications] [Me] |
+-----------------------------------------------------------------------------------------+
| [SIDEBAR (240px)]      | [PAGE CONTAINER: FEED (640px)]             | [RIGHT RAIL (320px)] |
|                        |                                            |                      |
| - Home                 | +----------------------------------------+ | +------------------+ |
| - Notes & PYQs         | | Composer: "What's happening on campus?"| | | Trending at      | |
| - Communities          | +----------------------------------------+ | | BIT Mesra        | |
| - Events               | | [For you]  [Latest]  [Confessions]     | | | - #Endsem2026    | |
| - Campus               | +----------------------------------------+ | | - #HostelNight   | |
| - Messages             | | PostCard                               | | +------------------+ |
|                        | | [Avatar] Shaswat [Verified] - 2h       | | | Student Clubs    | |
| ---------------------- | | "Does anyone have the CS301 solved PYQ | | | - ACM Chapter    | |
| [Profile / Settings]   | | from last semester?"                   | | | - IEEE BITM      | |
|                        | | [Notes Tag]                            | | +------------------+ |
|                        | | [Upvote 24]  [Reply 6]  [Save]         | |                      |
|                        | +----------------------------------------+ |                      |
+-----------------------------------------------------------------------------------------+
```

### Mobile Layout (375px Viewport)
```
+---------------------------------------+
| [Logo]   [Scope: BIT Mesra v]  [Search|
+---------------------------------------+
| [PAGE CONTENT (Single Column)]        |
|                                       |
| +-----------------------------------+ |
| | What's happening?        [Post +] | |
| +-----------------------------------+ |
| | [For you] [Latest] [Confessions]  | |
| +-----------------------------------+ |
| | PostCard                          | |
| | [Avatar] Shaswat [Verified] · 2h  | |
| | CS301 Notes question...           | |
| | [Upvote 24]  [Reply 6]  [Save]    | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
| [Home]  [Notes]  [+]  [Clubs]  [Campus] | <- Floating 5-tab dock
+---------------------------------------+
```

---

## 5. Design Critique & Differentiation

**Question:** *Could a student mistake this for a generic B2B SaaS template?*  
**Answer & Refinement:**
- Generic SaaS products use rigid geometric grotesks (`Inter`, `Geist`), cold slate monochrome palettes, and corporate table layouts.
- CampusLoop avoids this through:
  1. **Friendly Warmth:** `Baloo 2` font brings playful rounded character to titles without looking juvenile.
  2. **Tactile Campus Vibe:** Cute pastel category chips (`--tint-notes`, `--tint-communities`) give instant collegiate recognition.
  3. **Voxel Mascots:** Dedicated 3D voxel empty-state illustrations that evoke campus life.
  4. **Focused Mobile Ergonomics:** Floating 5-tab dock designed for one-handed thumb navigation.
