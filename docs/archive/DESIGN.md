# 🎨 CampusLoop Neo-Pastel Vibe Design System Specification

This specification defines the exact design system, tokens, typography, component rules, and interaction patterns for CampusLoop, built on the modern **Neo-Pastel / Vibe mobile social visual language** (as demonstrated in the official reference mockup).

---

## 🏛️ Core Design Philosophy

1. **Airy, Cheerful & Floating**: Surfaces float smoothly with soft, multi-layered ambient drop shadows on a dreamy, luminous pastel mesh. We avoid harsh bounding borders and flat monotonous dividers.
2. **Generous Radii & Organic Shapes**: Cards use extra-curved rounded corners (`rounded-[28px]` / `rounded-[32px]`), pill buttons (`rounded-full`), and asymmetrical speech bubbles (`fab-bubble`).
3. **Vibrant & Harmonious Color Roles**:
   - **Primary Action (Neo-Emerald `#00D285`)**: Used for key conversion moments (Follow, FAB, Verified Badges, Online Presence dots).
   - **Playful Accent (Neo-Violet `#7C3AED`)**: Used for active segmented tabs (e.g. "Photos"), chat send buttons, call actions, badges.
   - **Warm Delights (Neo-Peach `#FFF8EE` & Coral `#FF5376`)**: Used for heart reactions, warm chat bubbles, and radiant story gradient rings (`from-amber-400 via-rose-500 to-purple-600`).
4. **Instant Scanability**: Distinct visual hierarchy:
   $$\text{Post Visual / Body} > \text{Author \& Campus Pill} > \text{Floating Reaction Capsule} > \text{Secondary Actions}$$
5. **Tactile Haptic Feedback**: Every tap triggers subtle micro-interactions: spring scaling (`active:scale-95`), soft audio pops, and smooth framer-motion transitions.

---

## 🎨 Semantic Color Tokens (CSS Variables)

Never hardcode arbitrary hex values. Always use semantic Tailwind classes backed by CSS variables in [`globals.css`](file:///Users/shaswatraj/Desktop/startups/campusloop/src/app/globals.css).

| Token | Light Mode (Pastel Mesh) | Dark Mode (Midnight Obsidian) | Primary Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `#F8F7FD` (with pastel radial mesh) | `#0B0C13` (with luminous ambient aura) | Main canvas and screen background |
| `--foreground` | `#101828` (deep navy-slate) | `#F1F5F9` | Primary text and headings |
| `--card` | `#FFFFFF` (gleaming white) | `#12131D` (elevated midnight) | Floating card containers (`neo-card`) |
| `--card-foreground`| `#101828` | `#F1F5F9` | Card headings and body text |
| `--muted` | `#F3F4F9` | `#1A1C2B` | Search bars, input pills, inactive tabs |
| `--muted-foreground` | `#64748B` | `#94A3B8` | Handles, timestamps, counters |
| `--border` | `#F0F1F7` | `#222436` | Hairline dividers when necessary |
| `--primary` | `#00D285` (Neo-Emerald) | `#00D285` | Follow button, FAB, active online dot |
| `--secondary` | `#7C3AED` (Neo-Violet) | `#8B5CF6` | Active tab pills, chat send, call actions |
| `--brand-peach` | `#FFF8EE` (Butter Cream) | `#2B2518` | Warm chat bubbles |
| `--brand-coral` | `#FF5376` (Warm Coral) | `#FF5376` | Like reactions, double-tap hearts |
| `--radius` | `1.25rem` (`20px`) | `1.25rem` (`20px`) | Base controls radius (cards use `28px`) |

---

## 🔤 Typography & Font Hierarchy

CampusLoop uses friendly, modern geometric sans-serif typography (`DM Sans` / `Outfit` / `Space Grotesk`):

| Element | Font Size | Weight | Color Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title / Feed Title** | `22px` - `26px` | `800` (Extra Bold) | `text-foreground font-black tracking-tight` | "News Feed", "Message", "Profile" |
| **Author Name** | `15px` | `700` (Bold) | `text-foreground font-bold` | Post header, Chat contact |
| **Campus / Handle Subtitle**| `12px` - `13px` | `500` (Medium) | `text-muted-foreground` | "Berkeley, California", "@hopeyoung" |
| **Post Body** | `15px` | `400` (Regular) | `text-foreground leading-relaxed` | Timeline thoughts and confessions |
| **Reaction Pill Counts** | `12px` | `700` (Bold) | `text-foreground/90 font-bold` | `1.2k`, `55`, `8K` |
| **Stat Numbers** | `18px` - `20px` | `800` (Extra Bold) | `text-foreground font-extrabold` | `42k`, `34k`, `25k` on Profile |
| **Stat Labels** | `12px` | `500` (Medium) | `text-muted-foreground` | Following, Followers, Likes |

---

## 📐 Layout & Component Anatomy

### 1. Freestanding Floating Feed Card (`.neo-card`)
- Generous outer rounding: `rounded-[28px]` or `rounded-[32px]`.
- Ambient shadow: `box-shadow: 0 10px 30px -8px rgba(35, 25, 75, 0.06)`.
- Author Header: Author avatar with gradient story ring, name, campus subtitle, and circular three-dots menu button.
- Media Preview: High-aspect curved visual preview (`rounded-2xl overflow-hidden`).
- Floating Reaction Capsule:
  ```tsx
  <div className="neo-reaction-pill">
    <button className="flex items-center gap-1.5"><Heart className="size-4 text-rose-500 fill-rose-500" /> 1.2k</button>
    <button className="flex items-center gap-1.5"><MessageCircle className="size-4 text-slate-500" /> 55</button>
    <button className="flex items-center gap-1.5"><Send className="size-4 text-slate-500" /> 8K</button>
  </div>
  ```

### 2. Stories Rail
- "You / Add story" avatar with plus icon.
- Student story avatars with radiant sunset gradient rings (`from-amber-400 via-rose-500 to-purple-600`).
- Clean user label and relative timestamp ("1 min ago") underneath.

### 3. Messenger & Chat Experience
- Active contacts story rail at top of inbox with active green status dots.
- Outgoing chat bubble: `.chat-bubble-peach` (warm butter-cream with curved corners).
- Incoming chat bubble: `.chat-bubble-lilac` (clean soft lilac-white).
- Message input bar: Pill container with paperclip, mic, and vibrant violet circular send button (`bg-[#7C3AED]`).
- Floating Green Action FAB: `.fab-bubble` with group icon in bottom right.

### 4. Student Profile
- Centered prominent avatar with vibrant circular ring/canvas.
- 3-column stats row: `Following`, `Followers`, `Likes`.
- Primary CTA: Neo-Emerald "Follow" pill button (`bg-primary text-white rounded-full px-8 py-3 shadow-md`).
- Quick message button: Amber/yellow direct message button.
- Segmented pill tabs: `Photos` (active violet `#7C3AED`), `Videos`, `Tagged`.
- Bento photo cards with `rounded-2xl`.

---

## 🌙 Dark Mode Transitions

In dark mode:
- Background becomes deep midnight `#0B0C13` with soft violet/emerald ambient glowing meshes.
- Cards elevate to rich graphite `#12131D` with subtle frosted rims (`border-white/5`).
- Reaction pills and chat bubbles maintain distinct soft contrast without harshness.
