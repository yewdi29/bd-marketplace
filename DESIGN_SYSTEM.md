# Black Diamond Marketplace — Design System
> Single source of truth for all UI decisions. Read this before touching any component.
> Last updated: May 2026 — v1.3

---

## 1. Brand Overview

Black Diamond Marketplace is a premium B2B heavy equipment marketplace for the oil and gas industry. The design must communicate:

- **Authority** — we know this industry
- **Trust** — buyers are spending $50K–$2M
- **Approachability** — our users skew older, yet easy to use and modern
- **Clarity** — specs and pricing front and center, no fluff

**What we are not:** A dark developer tool, a flashy startup, a consumer app.
**What we are:** A serious, clean, inviting business platform — like a premium real estate marketplace built for the oilfield.

### Logo Mark
- Small square icon: `28×28px`, `border-radius: 7px`, `background: --text (#1A1D20)`
- Interior: white diamond/kite SVG `14×14px`
- Wordmark: `font-sans font-bold text-sm tracking-tight text-ink` — "BLACK DIAMOND" in all-caps

---

## 2. Color Tokens

### Core Palette

CSS variables are declared in `globals.css`. Tailwind aliases are what you use in class names.

| CSS Token | Tailwind Class | Hex | Usage |
|-----------|---------------|-----|-------|
| `--bg` | `bg-bg` | `#F7F8F9` | Page background — warm off-white |
| `--white` | `bg-white` | `#FFFFFF` | Card surfaces, navbar base, input fields |
| `--border` | `border-[#E8E9EA]` | `#E8E9EA` | Default borders, card outlines |
| `--border-2` | `border-[#D4D5D7]` | `#D4D5D7` | Emphasized borders, input focus rings |
| `--text` | `text-ink` | `#1A1D20` | All headings, body text, icons |
| `--text-2` | `text-ink-2` | `#4A4D52` | Secondary text, descriptions, nav links |
| `--text-3` | `text-ink-3` | `#9A9DA2` | Placeholders, timestamps, meta labels |

**Note:** Tailwind extends `--text` as the `ink` color scale (`ink`, `ink-2`, `ink-3`). Always use `text-ink` / `bg-ink` in class names, not `text-text`.

### Brand Accent — Orange (Primary Action)

| CSS Token | Tailwind Class | Hex | Usage |
|-----------|---------------|-----|-------|
| `--orange` | `bg-orange` / `text-orange` | `#FF6B35` | Primary CTAs, search button, filter apply, active states |
| `--orange-lt` | `bg-orange-lt` | `#FF8855` | Hover states on orange elements |
| `--orange-bg` | `bg-orange-bg` | `#FFF2ED` | Badge backgrounds, tint surfaces |
| `--orange-bdr` | `border-orange-bdr` | `#FFD4C2` | Badge borders on orange tint |

### Accent — Neon Green (Badge / Highlights)

| CSS Token | Tailwind Class | Hex | Usage |
|-----------|---------------|-----|-------|
| `--green` | `bg-badge-green` | `#A2FF9A` | New Listing badge dot, condition badge dot |
| `--green-text` | `text-badge-green-text` | `#1A5C18` | Text on green surfaces |
| `--green-bg` | `bg-badge-green-bg` | `#F0FFF0` | New Listing / Condition badge background |
| `--green-bdr` | `border-badge-green-bdr` | `#C8F5C4` | New Listing / Condition badge border |

### Accent — Science Blue (Location Badges)

| CSS Token | Tailwind Class | Hex | Usage |
|-----------|---------------|-----|-------|
| `--blue` | `bg-badge-blue` | `#0066CC` | Location badge dot, map marker |
| `--blue-text` | `text-badge-blue-text` | `#004499` | Text on blue tint surfaces |
| `--blue-bg` | `bg-badge-blue-bg` | `#E6F0FF` | Location badge background |
| `--blue-bdr` | `border-badge-blue-bdr` | `#B3D1FF` | Location badge border |

### Accent — Gold (Premium)

| CSS Token | Tailwind Class | Hex | Usage |
|-----------|---------------|-----|-------|
| `--gold` | `bg-badge-gold` | `#D4A017` | Premium badge dot |
| `--gold-text` | `text-badge-gold-text` | `#7A5C00` | Text on gold surfaces |
| `--gold-bg` | `bg-badge-gold-bg` | `#FDF6E3` | Premium badge background |
| `--gold-bdr` | `border-badge-gold-bdr` | `#F0D98A` | Premium badge border |

### ⚠️ Color Rules
- **Never** use pure black `#000000` — always use `--text` / `ink` `#1A1D20`
- **Never** use pure white as a page background — always use `--bg` `#F7F8F9`
- **Never** put dark text on orange backgrounds — use white only
- **Never** use gold as a primary action color — orange only for CTAs
- **Never** use green for CTAs — green is for New Listing / condition badges only
- Orange is the **only** primary action color. One accent, used consistently.

---

## 3. Typography

### Font Stack
- **UI / Display:** Inter — loaded via Next.js `next/font/google`, mapped to `font-sans` / `var(--font-inter)`. Inter is the production font; "Aeonik" is aspirational but not loaded.
- **Monospace:** Andale Mono — prices, specs, labels, timestamps — mapped to `font-mono`

```css
--font: var(--font-inter), system-ui, sans-serif;  /* globals.css */
--mono: 'Andale Mono', monospace;
```

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  mono: ['Andale Mono', 'monospace'],
}
```

Inter is loaded with weights 400, 500, 600, 700, 800.

### Type Scale

| Role | Size | Weight | Tracking | Usage |
|------|------|--------|----------|-------|
| Hero | 42px | 800 | -0.03em | Homepage hero headline |
| H1 | 32px | 800 | -0.03em | Page titles (login, auth pages) |
| H2 | 24px | 700 | -0.02em | Section headings (dashboard, homepage sections) |
| H3 | 18–22px | 700 | -0.02em | Modal headings, card titles |
| H4 | 15px | 600 | 0 | Labels, group headers |
| Body | 15px | 400 | 0 | Paragraphs, descriptions |
| Small | 13–14px | 400 | 0 | Secondary descriptions, card body text |
| Micro | 11px | 500–700 | 0 | Tags, badges, meta info |
| Price (card) | 15px | 500 | -0.02em | Andale Mono — listing cards |
| Price (detail) | 20px | 500 | -0.02em | Andale Mono — listing detail page, shown in `--orange` |
| Label | 12px | 500–700 | 0.08em | Andale Mono — uppercase spec labels, category labels |

### Typography Rules
- **Never** use font weights below 400
- **Never** use font weights above 800
- Hero headlines always use weight 800 with tight tracking
- Prices always use `font-mono` (Andale Mono) — never `font-sans`
- Spec labels always use `font-mono` uppercase
- Line height: 1.05 for headlines, 1.4 for UI text, 1.7–1.8 for body copy
- Card titles use `font-semibold` (600), not bold

---

## 4. Spacing & Layout

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r` | `10px` | Standard inputs, tags, error banners, small containers |
| `--r-lg` | `16px` | Cards, panels, filter sidebar, dropdowns, modals |
| `--r-xl` | `20px` | Navbar, hero card, modal overlay, large containers |
| `--r-pill` | `100px` | All buttons, badges, markers, search bar, filter pills |
| `7px` | literal | Logo mark square only |
| `14px` | literal | Photo drop zone in New Listing modal |

### Spacing Scale
Use multiples of 4px:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

### Layout
- Max content width: `1280px` (most pages) / `1200px` (listing detail page)
- Page padding: `px-4` mobile, `px-6` tablet, `px-10` desktop
- Card gap: `12–16px` (`gap-3` to `gap-4`)
- Dashboard card grid gap: `14px`
- Section padding: `py-10` between homepage sections

### Shadows

```css
/* Card default — Tailwind: shadow-card */
box-shadow: 0 1px 4px rgba(0,0,0,0.05);

/* Card hover — Tailwind: shadow-card-hover */
box-shadow: 0 8px 28px rgba(0,0,0,0.10);

/* Navbar — Tailwind: shadow-navbar */
box-shadow: 0 2px 16px rgba(0,0,0,0.05);

/* Orange button glow — Tailwind: shadow-orange-glow */
box-shadow: 0 4px 16px rgba(255,107,53,0.30);

/* Search bar — Tailwind: shadow-search */
box-shadow: 0 2px 12px rgba(0,0,0,0.07);

/* Inquiry card (detail page) */
box-shadow: 0 4px 16px rgba(0,0,0,0.08);

/* Dropdown panel */
box-shadow: 0 8px 28px rgba(0,0,0,0.12);

/* New Listing modal */
box-shadow: 0 32px 80px rgba(0,0,0,0.20);

/* Upgrade modal */
box-shadow: 0 24px 64px rgba(0,0,0,0.18);
```

### Global UI Details
- **Scrollbar:** 6px width, `--bg` track, `--border-2` thumb, `--orange` thumb on hover
- **Text selection:** `background: --orange-bg`, `color: --orange`

---

## 5. Components

### Navbar
- Frosted glass effect — **navbar only** (exception: card manage overlay in dashboard uses frosted glass on white)
- `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)`
- Border radius: 20px (`--r-xl`)
- Height: 58px
- Position: `fixed top-3 left-4 right-4` — floats 12px from top, 16px from sides (not flush to viewport edge)
- Active nav link: white pill `bg-white shadow-card` with no border
- Inactive nav link: `text-ink-2 hover:text-ink hover:bg-white/70` — transparent hover
- Right side (logged out): ghost "Sign In" border-pill + orange "List Equipment" pill
- Right side (logged in): `ProfileDropdown` component (avatar pill → dropdown panel)
- Mobile: hamburger toggle → dropdown panel below navbar, `borderRadius: 16px`, `shadow-card-hover`

### Buttons (`src/components/ui/Button.tsx`)

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `primary` | `--orange` | White | none | Primary CTAs — List Equipment, Search, Apply, Submit, Publish |
| `dark` | `ink (#1A1D20)` | White | none | Secondary dark actions |
| `outline` | White | `ink` | `--border-2` | Cancel, Learn More — hover turns orange |
| `ghost` | Transparent | `ink-2` | `--border-2` | Sign In, tertiary — hover turns orange |
| `danger` | `red-600` | White | none | Destructive actions (not exposed in public UI) |

- All buttons: `rounded-pill`, `font-bold`, `transition-all duration-200`
- Loading state: shows animated spinner SVG inline before label text
- **There is no "secondary" (green) button variant in the component.** Green is badge-only.

**Size variants:**

| Size | Padding | Font |
|------|---------|------|
| `sm` | `px-4 py-1.5` | `text-sm` |
| `md` (default) | `px-6 py-2.5` | `text-sm` |
| `lg` | `px-8 py-3` | `text-base` |

- **Never** use square or slightly rounded buttons — always pill shape

### Cards
- Background: `bg-white`
- Border: `border border-[#E8E9EA]` (0.5px visual weight)
- Border radius: 16px (`--r-lg`)
- Shadow: `shadow-card` (`0 1px 4px rgba(0,0,0,0.05)`)
- Hover: `hover:-translate-y-0.5` + `shadow-card-hover`
- Image placeholder area: `bg-[#F0F0F0]` (neutral gray, slightly darker than `--bg`)

### Listing Cards (`src/components/ListingCard.tsx`)
- Image area: `aspect-[4/3]` ratio, `bg-bg`, `overflow-hidden`; image scales on hover with `group-hover:scale-105`
- **Save/heart button:** top-right of image, `w-7 h-7` white circle, subtle shadow — **only visible on hover** (`opacity-0 group-hover:opacity-100`)
- Badges overlay top-left of image: only "BD Verified" badge appears (when `listing.featured = true`), using orange badge styling
- **No "New Listing" badge on public listing cards** — it appears on the detail page only
- Category label: `font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3`
- Title: `font-sans text-[15px] font-semibold text-ink` — note semibold not bold
- Price: `font-mono text-[15px] font-medium text-ink` — in `--text` (dark), not orange
- "Contact for price": `text-[12px] font-sans text-ink-3 italic`
- Location + Condition: `text-[13px] font-sans text-ink-3`, separated by `·` divider in `#E8E9EA`
- Tags row: `px-2 py-0.5 bg-bg border border-[#E8E9EA] rounded-pill text-[11px] font-sans text-ink-3` — shows manufacturer, year, "Negotiable"

### Badges

| Badge | Background | Text | Border | Dot |
|-------|-----------|------|--------|-----|
| New Listing | `--green-bg` `#F0FFF0` | `--green-text` `#1A5C18` | `--green-bdr` `#C8F5C4` | `--green` `#A2FF9A` |
| Condition (detail) | `--green-bg` | `--green-text` | `--green-bdr` | `--green` |
| BD Verified | `--orange-bg` | `--orange` | `--orange-bdr` | `--orange` |
| Location (detail) | `--blue-bg` | `--blue-text` | `--blue-bdr` | 📍 emoji |
| Premium plan | `--gold-bg` | `--gold-text` | `--gold-bdr` | `--gold` |
| Free plan (profile) | `--orange-bg` | `--orange` | `--orange-bdr` | `--orange` |

- All badges: `rounded-pill`, `font-mono`, `text-[11px]`, `font-bold`
- Always include colored dot (1.5px × 1.5px circle) before label — except location badge which uses 📍

### Map Markers
- Default pin: `--blue` `#0066CC` — Science Blue
- Selected/active pin: `--orange` `#FF6B35`
- Pill style: colored background tint + colored dot + location text

### Form Inputs (`src/components/ui/Input.tsx`)
- Background: `bg-white`
- Border: `border border-[#D4D5D7]` (`--border-2`)
- Border radius: 10px (`--r`)
- Focus: `focus:border-orange focus:ring-2 focus:ring-orange/20` — border + subtle orange ring
- Error state: `border-red-500 focus:border-red-500 focus:ring-red-500/20`
- Placeholder: `text-ink-3`
- Font: `font-sans text-sm`
- Label: `text-sm font-medium text-ink`; required asterisk in `text-orange`
- Error message: `text-xs text-red-500 font-sans` below input

**Sidebar search/sort inputs** use `bg-bg` (not white) since they're embedded in the white sidebar.

### Filter Sidebar
- Background: `bg-white`
- Container: `rounded-[16px] p-5 sticky top-[82px] shadow-card`
- Width: `w-[220px]` on desktop, full-width on mobile
- Section labels: `text-[11px] font-sans font-semibold text-ink uppercase tracking-wider`
- **Category filter:** radio buttons (`accent-orange`) — one selection at a time
- **Condition filter:** checkboxes (`accent-orange`) — multiple allowed
- **Sort By:** `<select>` dropdown, `bg-bg border border-[#E8E9EA] rounded-[10px]`
- "Apply Filters": full-width orange pill button with `shadow-orange-glow`
- "Clear all": `text-orange font-semibold`, no background, centered below apply button

### Error Banners
- Container: `rounded-[10px] border border-red-200 bg-red-50 px-4 py-3`
- Text: `text-sm font-sans text-red-600`
- Used in: form pages (auth), modal steps, API failure states

### Toast Notifications
- Positioned: `fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none`
- Style: `bg-ink text-white font-sans text-sm px-5 py-3 rounded-pill shadow`
- Icon: green checkmark SVG (`text-[#A2FF9A]`) for success toasts
- Duration: 4 seconds auto-dismiss

### Loading / Action Toast
- Small pill at `fixed bottom-6 center`: `bg-ink text-white text-xs font-mono px-4 py-2 rounded-pill`
- Used for in-flight PATCH actions on dashboard cards

### New Listing Modal (`src/components/listings/NewListingModal.tsx`)
- Overlay: `rgba(0,0,0,0.55)` + `backdrop-filter: blur(6px)`
- Card: `max-width: 720px`, `border-radius: 20px`, `max-height: 90vh`, scrollable content area
- Shadow: `0 32px 80px rgba(0,0,0,0.20)`
- Structure: fixed header (breadcrumb), scrollable body, fixed footer (navigation buttons)

**Progress breadcrumb (4 steps: Describe → Review & Refine → Photos & Video → Publish):**
- Step circle: 28px, `rounded-full`
- Inactive: `background: #F0F0F0`, `border: #D4D5D7`, number in `#9A9DA2`
- Active: `background: #FF6B35` (orange), `border: #FF6B35`, number in white
- Completed: `background: #1A1D20` (ink), `border: #1A1D20`, checkmark in white
- Label below: active = orange, completed = ink, inactive = `#9A9DA2`
- Connector line: 48px wide, ink for completed, `#E8E9EA` for incomplete

**Discard confirmation overlay:**
- Semi-opaque white: `rgba(255,255,255,0.96)` + `backdrop-filter: blur(4px)` over the modal
- Icon: red circle `bg-[#FEE2E2]`, trash SVG `text-[#DC2626]`
- "Discard" button: `bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-pill`
- "Keep Editing" button: outline pill

**Photo grid:**
- Drop zone: `border-2 border-dashed border-[#D4D5D7] rounded-[14px]` — hover turns orange border
- Thumbnail grid: `repeat(auto-fill, minmax(100px, 1fr))`, `gap-2`, square `aspect-square rounded-[10px]`
- Primary photo marker: orange filled circle star icon top-left
- Drag-to-reorder with visual drop indicator (orange border on target)
- Video field: YouTube URL input, validated client-side

**Price visibility toggle:** custom toggle switch (36×20px pill), orange when on, `--border-2` when off.

**Footer buttons:**
- Steps 1–3: Back (outline pill) left + optional "Save as Draft" (outline) + primary Next/Generate button right
- Step 4 (Publish): Back (outline) left + "Save as Draft" (outline) + "Publish Listing" (orange primary) right

### Profile Dropdown (`src/components/ui/ProfileDropdown.tsx`)
- Trigger: pill button `px-3 py-1.5 bg-white border border-[#E8E9EA] rounded-pill shadow-card`
- Avatar: `w-6 h-6 rounded-full bg-orange` with white initials `text-[10px] font-bold`
- Dropdown: `240px` wide, `border-radius: 16px`, `shadow: 0 8px 28px rgba(0,0,0,0.12)`
- Header: larger avatar `w-9 h-9`, user name `text-sm font-semibold`, company name `text-xs text-ink-3`
- Plan badge: gold styling for premium, orange styling for free
- Listing usage meter (free plan only): progress bar `h-1.5 rounded-full bg-orange` over `bg-[#F0F0F0]` track
- Menu items: `text-sm text-ink-2 hover:text-ink hover:bg-bg`

**Subscription side panel:**
- Slides in from right: `position: fixed`, `width: 340px`, `border-left: 1px solid #E8E9EA`, `box-shadow: -8px 0 32px rgba(0,0,0,0.10)`
- Backdrop: `rgba(0,0,0,0.3)` + `backdrop-filter: blur(4px)`
- Plan cards: `border-radius: 16px`, active plan gets tinted border + background (orange tint for free, gold tint for premium)

### Upgrade Modal
- Overlay: `rgba(0,0,0,0.4)` + `backdrop-filter: blur(4px)`
- Card: `380px` wide, `border-radius: 20px`, `shadow: 0 24px 64px rgba(0,0,0,0.18)`, `padding: 32px`
- Icon: `bg-orange-bg` square `rounded-[10px]` with orange lightning bolt SVG
- CTA: full-width orange pill with `shadow-orange-glow`

### Dashboard Filter Pills
- Active tab: `bg-ink text-white border-ink`
- Inactive tab: `bg-white text-ink-2 border-[#E8E9EA] hover:border-[#D4D5D7] hover:text-ink`
- Count chip inside pill: active = `bg-white/20 text-white`, inactive = `bg-[#F0F0F0] text-ink-3`

### Dashboard Card Manage Overlay
- Frosted glass exception: `rgba(255,255,255,0.50)` + `backdrop-filter: blur(8px)` over the listing card
- Action buttons: white bg, `border-[#D4D5D7]`, pill shape, `text-sm font-semibold`
- Danger action: `bg-[#FFF0F0]`, `color: #CC0000`, `border: #FFCCCC`
- Cancel button: `bg-[#F7F8F9]`, `color: #4A4D52`, `border-[#E8E9EA]` — visually separated from action buttons by a `border-t border-[#E8E9EA]` divider with `mt-2 pt-2`

---

## 6. Traffic Light System — ADMIN ONLY

⛔ **This system is strictly internal. Never expose tier information to public users.**

The traffic light tier system is visible only in the `/admin` command center dashboard (Phase 3 — not yet built).

| Tier | Color | Price Range | Service |
|------|-------|-------------|---------|
| Green | `#2D7D46` | Under $100K | Self-service — seller contacts leads directly |
| Yellow | `#C8A020` | $100K–$500K | Assisted — BD offers logistics support |
| Red | `#B03030` | Over $500K | White glove — full brokerage service |

Public listing cards show **no tier indicators**. Tier routing happens invisibly in the backend.

The `TierBadge` component exists at `src/components/ui/TierBadge.tsx` but Tailwind `tier-*` color classes are not in `tailwind.config.ts` — the component is Phase 3 placeholder code.

---

## 7. Page-Specific Notes

### Homepage
- Hero on white card surface: `bg-white rounded-[20px] px-8 py-16 text-center shadow-card`
- Orange word in hero headline for emphasis — one word only (currently "Equipment")
- Hero badge: orange pill `bg-orange-bg border-orange-bdr` with pulsing dot — "Heavy Equipment Marketplace"
- Stats row: 3-col grid below search bar — `font-bold text-2xl text-ink` value, `text-xs text-ink-3` label
- Search bar: pill shaped `rounded-pill`, white fill, orange search button, `shadow-search`; includes category `<select>` + text input separated by `bg-[#E8E9EA]` divider
- Category grid: `grid-cols-2 sm:grid-cols-4`, white cards `rounded-[16px]`, emoji icon + label, `hover:text-orange`
- Section "View all →" links: `text-sm font-semibold text-orange hover:text-orange-lt`
- Newsletter block: white card `rounded-[20px] px-8 py-12 text-center shadow-card`

### Listings Browse Page
- Layout: sidebar `w-[220px]` + flex-1 grid right (`gap-6`)
- Filter sidebar sticky at `top-[82px]`
- Results count: `font-sans font-bold text-sm text-ink mb-5`
- Card grid: `repeat(auto-fill, minmax(220px, 1fr))` with `gap-4`
- Empty state: white card `rounded-[16px] py-24`, emoji icon, ink heading, orange "view all" link
- No tier badges visible to public

### Listing Detail Page
- Max content width: `1200px` (not 1280px)
- Breadcrumb: `font-sans text-[12px]`, `text-ink-3` links → `text-ink` current — at `py-3` above gallery
- Full-width photo gallery (PhotoGallery component) — see component file
- Two-column layout: `1fr 320px`, `gap: 24px`, padding `24px 32px`
- **Left column:** title card → specs card → description card (all `bg-white rounded-[16px] p-5px shadow-card`)
- **Right column:** sticky at `top: 72px` — inquiry card (heavier shadow) + save+share actions
- Title: `font-bold text-ink`, `20px`, `-0.02em` tracking
- **Price on detail page:** `font-mono font-medium` `20px`, shown in `color: #FF6B35` (orange) — unlike listing cards where price is ink
- "Contact for price": `font-sans font-semibold italic 15px color: #FF6B35`
- Pills row (detail title card): Condition = green badge, Location = blue badge, New Listing = green badge
- Specs grid: 2-column, `font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3` label, `font-mono text-sm font-bold text-ink` value
- Description: `font-sans text-ink-2 14px line-height: 1.8`
- Related listings: 4-column fixed grid `repeat(4, 1fr) gap-4` — uses standard ListingCard
- JSON-LD Product schema injected via `<script type="application/ld+json">`
- Dynamic OG metadata via `generateMetadata`

### Login / Signup
- Page: `min-h-[calc(100vh-82px)] flex items-center justify-center` on `bg-bg`
- Card: `bg-white rounded-[20px] p-8 shadow-card`, max-width `md` (448px)
- Logo mark above heading, centered
- H1: `font-extrabold text-[32px]` with `-0.03em` tracking
- Orange submit button: full width, `py-3`
- Footer links: `text-ink-3 hover:text-ink` and `text-orange hover:text-orange-lt`
- No Google OAuth — email and password only

### Dashboard (Seller)
- Page padding: `px-6 py-8`, max-width `1280px`
- Header: H2 `font-bold text-2xl -0.02em` + orange "New Listing" button right
- Plan usage line (free plan only): `font-mono` fraction in `text-ink-3`
- Filter tab pills row (All / Active / Drafts / Sold) with count chips
- Card grid: `repeat(auto-fill, minmax(220px, 1fr))` with `gap-14px`
- Dashboard listing cards: `h-[140px]` image, `p-3` info, status badge top-left
- Status badge colors: Active = green, Draft = neutral gray, Unpublished = gold, Sold = red
- "Manage" button below each card: outline pill `text-xs font-semibold text-ink-2`
- On-card manage overlay: frosted white glass + action pills
- Skeleton loading: `animate-pulse` gray blocks at card proportions

### Knowledge Base
- Clean editorial layout (Phase 1 stub — not fully built)
- Article cards with category label, title, excerpt, read time
- Orange category accent on active filter

### Admin Command Center
- Phase 3 — not yet built
- Traffic light system visible here only
- Dark sidebar with orange accent (different from public site)

---

## 8. What Never To Do

- ❌ Never use dark mode on the public site
- ❌ Never apply frosted glass outside of the navbar (and dashboard card manage overlay — documented exception)
- ❌ Never use serif fonts anywhere
- ❌ Never use square buttons — always pill shaped
- ❌ Never show traffic light tiers to public users
- ❌ Never use blue as a CTA color — blue is for location badges only
- ❌ Never use green as a CTA color — green is for New Listing / condition badges only
- ❌ Never use gold as a CTA color — gold is for Premium badge only
- ❌ Never use pure black `#000000` or pure white `#FFFFFF` as page background
- ❌ Never put prices in `font-sans` — always `font-mono` (Andale Mono)
- ❌ Never use Google OAuth — email and password only
- ❌ Never call Supabase directly from the browser for mutations — always use API routes

---

## 9. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.6 | May 2026 | Seller profile page full rebuild (/sellers/[slug]) — breadcrumb "Business Directory → Company Name", white header card (72px circular logo, 22px company name, BDVerifiedBadge md, location 13px #9A9DA2, MEMBER SINCE mono 11px uppercase #B0B0B8, stats strip, Send Message orange pill button). SellerContactModal client component — trigger button opens 440px modal with backdrop rgba(0,0,0,0.30)+blur(4px), form posts to /api/leads without listing_id, success state, ESC/backdrop close. SellerListingsSection client component — Active/Sold tab pills (ink active / white inactive, count chips), sort dropdown (Newest/Price asc/desc), 3-col grid with ActiveCard (link, hover scale, orange price) and SoldCard (grayscale+sold overlay badge), 9/page pagination with orange current page pill + prev/next arrows. Sellers directory at /sellers — Business Directory page with grid of seller cards (48px logo, company name, BD Verified badge, location, active listing count), force-dynamic. Updated /api/leads to accept seller_id without listing_id (Path B: direct seller contact). |
| v1.5 | May 2026 | Seller profile page (/sellers/[slug]) — white header card with 80px circular logo/initials, company name + BDVerifiedBadge, location, member since, stats row, active listings grid, sold listings grid with grayscale+sold overlay. BDVerifiedBadge component — orange brilliant-cut diamond SVG, three sizes (sm/md/lg), tooltip, premium-only. Company logo upload in Account Settings — circular 72px preview, upload button, immediate POST to /api/users/logo. Seller card on listing detail page showing logo, company name, badge, view-all link. |
| v1.4 | May 2026 | Account Settings page — 680px centered layout, three labeled sections (Personal Info, Company Info, Change Password), divider separators, read-only email field, US state dropdown, orange pill save buttons, error banners, success toast. API routes GET/PATCH /api/users/me. |
| v1.3 | May 2026 | Documentation sync — audited all components and pages against actual implementation. Corrected font (Inter not Aeonik), navbar position (floating with margins, not flush top-0), button variants (danger added, secondary/green removed, size variants documented), filter sidebar (radio buttons for category), listing card (aspect-[4/3] not 40%, save button hover-only, price in ink not orange), listing detail (1200px max-width, price in orange, blue location badge, green condition badge). Added: Tailwind alias table for all color tokens, logo mark spec, scrollbar and selection styles, error banner pattern, toast patterns, dashboard filter pills, card manage overlay, profile dropdown, subscription panel, upgrade modal, New Listing modal full spec. |
| v1.2 | May 2026 | Listing detail page — breadcrumb, full-width photo gallery with thumbnail strip, two-column layout (title card with pills/price, specs grid, description, sticky inquiry form, save+share). Related listings 4-col grid. JSON-LD Product schema. Dynamic OG metadata. |
| v1.1 | May 2026 | New Listing modal — 4-step flow (Describe, Review & Refine, Photos & Video, Publish). Full-screen overlay with backdrop blur, 720px white card, orange breadcrumb progress, discard confirmation overlay, drag-to-reorder photo grid, price visible toggle, preview card in step 4. |
| v1.0 | May 2026 | Initial design system established. Light mode, orange + green + science blue + gold palette, Aeonik/Inter typography, pill buttons, frosted glass navbar. |