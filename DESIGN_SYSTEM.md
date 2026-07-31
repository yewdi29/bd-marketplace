# Black Diamond Marketplace — Design System
> Single source of truth for all UI decisions. Read this before touching any component.
> Last updated: July 2026 — v2.39

---

## 1. Brand Overview

Black Diamond Marketplace is a premium B2B heavy equipment marketplace serving any industry that relies on capital-intensive machinery — including oil & gas, construction, mining, and agriculture. The design must communicate:

- **Authority** — we know these industries
- **Trust** — buyers are spending $50K–$2M
- **Approachability** — our users skew older, yet easy to use and modern
- **Clarity** — specs and pricing front and center, no fluff

**What we are not:** A dark developer tool, a flashy startup, a consumer app.
**What we are:** A serious, clean, inviting business platform — like a premium real estate marketplace built for heavy industry.

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
| H2 | 24px | 700 | -0.02em | Dashboard section headings, legacy section titles |
| Homepage section H2 | `clamp(28px, 4vw, 40px)` | 700 | -0.03em | Featured Equipment, Browse by Industry, How It Works, Newsletter — fluid headline |
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
- Max content width: `1450px` inner cap on navbar, homepage, search, listing detail, business directory, business profile, `/dashboard`, and footer; `1600px` global page shell retained on remaining public pages
- Page padding: `px-4` mobile, `px-6` tablet, `px-10` desktop
- Card gap: `12–16px` (`gap-3` to `gap-4`)
- **Listing card grid:** `.listing-card-grid` — fixed columns: 1 / 2 / 3 / 4 / 5 at 480 / 768 / 1024 / 1280px breakpoints; gap `16px` (dashboard variant: `14px`)
- Section padding: `py-16 lg:py-20` (64px mobile / 80px desktop) between homepage sections; newsletter section uses `py-10` on its outer wrapper

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
- Right side (logged in, desktop ≥1024px): `ProfileDropdown` component (avatar pill → dropdown panel)
- **Mobile/tablet (<1024px), homepage (`/`):** full wordmark logo + search icon button (opens `MobileSearchTakeover`) + hamburger/avatar trigger (opens `MobileMenu`)
- **Mobile/tablet (<1024px), every other page:** icon-only logo (`/bd_logo-icon.svg`, 28px) + full-width inline search bar look-alike (`SearchBarTrigger` — tapping it also opens `MobileSearchTakeover`, it never accepts typed input itself) + the same hamburger/avatar trigger
- The homepage/non-homepage split is route-based (`pathname === '/'`), not a separate breakpoint — both apply uniformly across the whole <1024px range

### Mobile Menu (`src/components/layout/MobileMenu.tsx`)
- **Portal required:** backdrop and panel render via `createPortal` to `document.body` — the navbar's `backdrop-filter` creates a containing block that traps `position: fixed` children inside the 64px header
- **Backdrop:** `fixed inset-0`, `rgba(0,0,0,0.3)` + `backdrop-filter: blur(4px)`, `z-[100]`; tap or `Escape` closes
- **Panel animation:** slides in from right, `translate-x-full` → `translate-x-0`, `duration-300`
- **Width — unified across all of <1024px:** `min(75vw, 400px)` — never wider than 400px, scales down proportionally on narrow phones. (Superseded the old "full-screen mobile / 340px tablet" split — single rule now.)
- Panel: `border-left: 1px solid #E8E9EA`, `box-shadow: -8px 0 32px rgba(0,0,0,0.10)`, `z-[110]`
- Close button: top-right, 44×44px tap target
- Scrollable content: `pb-[max(1.5rem,env(safe-area-inset-bottom))]` for notched phones
- Body scroll locked while open
- **Accessibility:** when closed, panel uses the `inert` attribute (removes all descendants from tab order and assistive tech); when open, focus traps inside the panel (`src/lib/focusTrap.ts`) and returns to the hamburger/avatar trigger on close
- **Logged-in layered panel:** shell `#F7F8F9`; account block is a seamless white card (flush top, `20px` rounded bottom corners, `box-shadow: 0 4px 16px rgba(0,0,0,0.06)`) containing close + profile + account actions; shared nav links sit on the gray layer below
- Logged-out: white panel — Create Account (ghost pill) + Sign In (orange) + shared nav links
- Shared nav links (both auth states, plain text rows): Browse Equipment (`/search`), Business Directory, Pricing, About, Contact, hairline separator, Feedback (opens feedback panel)
- Mutually exclusive with `MobileSearchTakeover` — opening either always closes the other first

### Mobile Search Takeover (`src/components/layout/MobileSearchTakeover.tsx`)
- Full-screen white overlay (`fixed inset-0 bg-white`, `z-[120]`), portaled to `document.body`
- Input row pinned to top, `height: 64px`, `padding-top: env(safe-area-inset-top)`, close icon (44×44) + search icon + text input
- Suggestion results capped at `max-height: 50vh`, scrollable — leaves the bottom half of the screen empty so the on-screen keyboard never covers results
- Matching logic, live counts, and keyboard navigation are shared with the desktop nav `SearchBar` dropdown via the `useSearchSuggestions` hook (`src/hooks/useSearchSuggestions.ts`) — one fetch/keyboard-nav implementation, two presentations
- Opens from either the homepage's search icon or the non-homepage `SearchBarTrigger`; closes via the close icon, `Escape`, or selecting/submitting a search (then navigates)
- Body scroll locked while open

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
- Card: `border-radius: 12px`, `overflow: hidden`, design base width `225px`
- Thumbnail: height = 60% of card width (`padding-bottom: 60%`, 135px at base), `border-radius: 12px 12px 0 0`, `object-cover`
- Content padding: `10px` all sides
- Title: `13px`, `font-weight: 500`, `line-height: 1.35`
- Price: `14px`, `font-weight: 500`, `#FF6B35`
- Category label + location pill + save button: unchanged (location pill flag: `20×20px` circle, `5px` gap to text)
- Grid wrapper: `ListingCardGrid` → `.listing-card-grid` in `globals.css`
- **Save/heart button:** top-right of image, `w-8 h-8` white circle — browse cards only (`showSave` prop)
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

### Newsletter Section (`src/components/NewsletterSection.tsx`)
Canonical newsletter signup block for all public pages. Do not build one-off newsletter layouts — import this component and pass a `source` string for analytics.

- **Outer wrapper:** `py-10 w-full` (`className` prop for page-specific spacing overrides)
- **Card:** white `rounded-[20px] px-8 py-12 shadow-card border border-[#E8E9EA]`, full width of parent
- **Layout:** two-column split on `md+` (copy left, form right); stacks on mobile
- **Label:** `STAY INFORMED` — `font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3`
- **Headline:** shared homepage section H2 (`clamp(28px, 4vw, 40px)`, `-0.03em` tracking) — "Stay Ahead of the Market."
- **Subtext:** `mt-4 font-sans text-ink-3 text-base leading-relaxed`
- **Form:** `NewsletterForm` via deferred `NewsletterFormLazy` — pill input + orange Subscribe button (`shadow-orange-glow`); side-by-side on tablet/desktop (`730px+`, `40px` height); stacked full-width on mobile (`<730px`, `48px` min-height)
- **Used on:** homepage (`source="homepage"`), business/seller profile (`source="seller_profile"`)

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

**Mobile/tablet flow (<1024px) — `NewListingMobileFlow.tsx`:**
- Full-screen white overlay (`z-[130]`), slides up from bottom on open — no backdrop blur, no modal card, covers navbar
- Fixed header on all steps: left = back chevron (steps 2–4) or close X (step 1); center = four-segment progress bar (active `#FF6B35`, completed `#D4D5D7`, upcoming `#E8E9EA`); right = close X
- Step transitions: horizontal slide (`nl-step-forward` / `nl-step-back` keyframes in `globals.css`)
- Exit confirmation: inline banner below header ("Are you sure you want to exit? Your progress will be lost") with Cancel / Exit — never `window.confirm`
- Step 1: large heading + tall flex textarea + character counter; fixed bottom "Generate Listing →" with `visualViewport` keyboard inset
- Step 2: single-column scrollable fields (no side-by-side grids)
- Step 3: full-width "Add Photos" tap zone; `accept="image/*"` (no `capture` — iOS shows Take Photo + Library); horizontal thumbnail strip with always-visible remove X
- Step 4: compact summary card + membership line (`Starter plan · N of M listings remaining`) + "Back to Edit" text link (jumps to step 2) + fixed "Publish Listing" CTA
- Desktop (≥1024px): unchanged floating modal — see above

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

#### Homepage section header (shared pattern)
Used by Featured Equipment, Browse by Industry, How It Works, and Newsletter.

| Element | Style |
|---------|-------|
| **Optional label** | `font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3` — e.g. `HOW IT WORKS`, `STAY INFORMED` |
| **Headline (H2)** | `font-sans font-bold text-ink`, `font-size: clamp(28px, 4vw, 40px)`, `letter-spacing: -0.03em`, `line-height: 1.1` |
| **Subtext** | `mt-4 font-sans text-ink-3 text-base leading-relaxed` |
| **"View all →" link** | `text-sm font-semibold text-orange hover:text-orange-lt` — right-aligned in header row on `sm+`; below title/subtext on mobile (`< sm`) via `HomeSectionHeader` |

Header row layout: `flex items-end justify-between mb-6` when a side link is present; label + headline + subtext stack in the left column.

#### Section-specific notes
- Hero on frosted glass card surface inside hero grid (see §8 glassmorphism exception)
- Orange word in hero headline for emphasis — one word only (currently "Equipment")
- Hero badge: orange pill `bg-orange-bg border-orange-bdr` with pulsing dot
- **Hero CTAs:** below 730px (mobile) — stacked full-width column, `min-h-12` (48px) tap targets, `text-sm`; tablet/desktop — side-by-side row, compact `py-2` / `text-[13px]` pills (`heroCtaClasses.ts`)
- **Featured Equipment:** 3-column listing grid (`.listing-card-grid--featured`), up to 9 cards; header uses shared section header pattern (no orange label)
- **Browse by Industry:** 3×2 grid of horizontal industry cards (`md:grid-cols-2 lg:grid-cols-3`); 55×55px orange-tint icon box; header uses shared section header pattern (no orange label); "Browse all →" links to `/search`
- **How It Works:** centered header with `HOW IT WORKS` orange label; step cards in 3-column desktop row
- **Newsletter:** see `NewsletterSection` component (§6) — two-column split on `md+`; not homepage-only
- **Operator Journal:** retains legacy `text-2xl` header until migrated

### Listings Browse Page
- Layout: sidebar `w-[220px]` + flex-1 grid right (`gap-6`)
- Filter sidebar sticky at `top-[82px]`
- Results count: `font-sans font-bold text-sm text-ink mb-5`
- Card grid: `repeat(auto-fill, minmax(220px, 1fr))` with `gap-4`
- Empty state: white card `rounded-[16px] py-24`, emoji icon, ink heading, orange "view all" link
- No tier badges visible to public

### Listing Detail Page
- Two-column gallery + info panel: `max-width: 1450px` page body wrapper (`margin: 0 auto`) including breadcrumb, gallery/info grid, and related listings; page background full viewport
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

### Careers (`/careers`)
- Dark hero (`#1A1D20`, `64px 32px` padding): `CAREERS` orange mono label, 44px/800 H1, 17px muted subtext (`opacity: 0.7`, max `720px`)
- Open positions: centered prose block (`max-width: 720px`, `page-shell`, `py-16 md:py-20`); 32px section H2; orange primary CTA mailto `careers@blackdiamondmkt.com`
- Culture cards: `#F7F8F9` section, 3-column grid on `md+` (`max-width: 1100px`); white cards `rounded-[16px] shadow-card border border-[#E8E9EA]`, 24px padding — same pattern as How It Works feature cards
- Static content only; dynamic job listings deferred (comment placeholder in page source)

### Dashboard (Seller)
- Page padding: `px-6 py-8`, max-width `1280px`
- Header: H2 `font-bold text-2xl -0.02em` + orange "New Listing" button right
- Plan usage line (free plan only): `font-mono` fraction in `text-ink-3`
- Filter tab pills row (All / Active / Drafts / Sold) with count chips
- Card grid: `.listing-card-grid` / `ListingCardGrid` — fixed 1–5 columns by breakpoint, 225px card design base
- Dashboard listing cards: shared `ListingCard` with status badge overlay + Manage footer, same 4:3 thumbnail
- Status badge colors: Active = green, Draft = neutral gray, Unpublished = gold, Sold = red
- "Manage" button below each card: outline pill `text-xs font-semibold text-ink-2`
- On-card manage overlay: frosted white glass + action pills
- Skeleton loading: `animate-pulse` gray blocks at card proportions

### Knowledge Base / Operator Journal
- Clean editorial layout on `/journal` index and article detail
- **Article cards** (`ArticleCard`): shared component on homepage preview and `/journal` index — `min-h-[340px]`, full-bleed `featured_image` background (`object-cover`), bottom-weighted gradient overlay (`transparent` → `rgba(0,0,0,0.88)`), white title/excerpt/meta text, orange category badge + CTA; fallback background `bg-ink` (`#1A1D20`) when no image
- Card content: category badge, title, excerpt/caption, published date, read time, "Read article →"
- Orange category accent on active filter pill

### Admin Command Center
- Phase 3 — not yet built
- Traffic light system visible here only
- Dark sidebar with orange accent (different from public site)

---

## 8. Special Effects

> Effects are opt-in and tightly scoped. If a surface isn't listed below, it gets **none** of these treatments.

### Glassmorphism
- **Applied to:** navbar only
- **CSS:** `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)`
- **Exception:** dashboard card manage overlay uses a lighter frosted variant — `rgba(255,255,255,0.50)` + `backdrop-filter: blur(8px)` — documented in Components § Dashboard Card Manage Overlay
- **Exception:** listing detail page gallery Save/Share pills (`.gallery-action-pill` in `globals.css`) — `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)` + `1.5px solid rgba(255,255,255,0.6)`, matching navbar treatment, overlaid top-right of the photo gallery
- ❌ Never apply to listing cards, modals, page overlays, or any other surface

### Moving Glow (Animated Gradient Border)
- **Applied to:** AI prompt field in New Listing modal; hero search bar (on focus only)
- **CSS:** animated gradient border cycling through the orange palette, `3s ease infinite`
- **Trigger:** always-on for AI prompt field; focus state only for hero search bar
- ❌ Never use as a general hover effect or on non-input elements

### Glass Button
- **Applied to:** "New Listing" button in dashboard nav; Search button in hero / navbar
- **CSS:**
  ```css
  background: rgba(255,107,53,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,107,53,0.3);
  ```
- **Hover:** `background: rgba(255,107,53,0.25)` + subtle orange glow shadow
- ❌ Never apply to standard CTA buttons, form submit buttons, or any button outside these two specific placements

### What Gets Nothing
| Surface | Effect |
|---------|--------|
| Listing cards | Flat white only — no blur, no gradients, no glow |
| Modals | Flat white + standard `shadow` only |
| Page overlays (e.g. modal backdrop) | `rgba(0,0,0,0.30–0.55)` solid — no blur |
| Section backgrounds | Solid `--bg` only |
| Regular CTA buttons | Solid orange only — no glass, no blur |

**Explicitly deferred (do not implement):**
- Gradient flow animations on any surface
- Pulse glows on cards or buttons
- Dark glass (dark background + blur)
- Full-page overlay blur effects

---

## 9. What Never To Do

- ❌ Never use dark mode on the public site
- ❌ Never apply frosted glass outside of the navbar (and the dashboard card manage overlay exception) — see §8 Special Effects
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

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v2.39 | July 2026 | **Mobile menu signed-in layering.** Signed-in drawer shell `#F7F8F9`; account info + actions in a white card with rounded bottom corners and light drop shadow; site nav sits on the gray layer beneath. |
| v2.38 | July 2026 | **Mobile menu nav refresh.** Logged-out: Create Account ghost pill + Sign In. Shared nav for all users (plain text rows): Browse Equipment, Business Directory, Pricing, About, Contact, separator, Feedback. Peeking feedback tab desktop-only; mobile Feedback opens from hamburger. |
| v2.37 | July 2026 | **Site-wide feedback tab.** Orange peeking tab fixed to the right viewport edge (desktop: vertically centered; mobile: above bottom safe area). Opens a right slide-over form (category, message, optional bug screenshot). Mounted in root layout; hidden on `/rigburrito/*`. |
| v2.36 | July 2026 | **Operator Journal cards + excerpt field.** Shared `ArticleCard`: full-bleed featured image, bottom gradient overlay, white typography, 340px min-height, ink fallback when no image. Admin editor adds plain-text "Excerpt / Caption" field (150 chars recommended) saved to existing `excerpt` column. Homepage preview and `/journal` index use the same card component. |
| v2.34.5 | July 2026 | **Newsletter form mobile layout.** Shared `NewsletterForm` stacks email input + Subscribe button below 730px (full-width, 48px min-height); tablet/desktop keep inline 40px row. Applies globally via `NewsletterSection`. |
| v2.34.4 | July 2026 | **Hero CTA mobile tap targets.** Homepage hero buttons stack vertically below 730px only with full-width 48px-min-height pills; tablet and desktop keep compact side-by-side layout. Shared classes in `heroCtaClasses.ts`. |
| v2.34.3 | July 2026 | **Hero globe refresh.** Arcs use shader-based GL lines with facing fade and 5-pass screen-space thickness (replaces Line2 addon). Faster arc timing (4.2s grow/hold, 1.5s spawn). Initial globe rotation `y: -1.92`. Labels expanded to 8 items with updated card shadow/border styling. |
| v2.34.2 | July 2026 | **Hero globe arc color.** Homepage WebGL globe connection arcs switched from orange HSL (~38°) to purple HSL (~274–292°) in `heroGlobeArcs.ts`. Globe labels and map dots unchanged. |
| v2.34.1 | July 2026 | **Enterprise tier block.** Shared `EnterpriseTierBlock`: eyebrow "Teams & organizations" (science blue), "Enterprise" as 22px card title, feature checklist (no public pricing), wide row below tier grids on `/pricing` and `/dashboard/upgrade`. |
| v2.35 | July 2026 | **Homepage section header mobile links.** `HomeSectionHeader` component: Featured Equipment, Browse by Industry, and Operator Journal "View all" / "Browse all" links visible on mobile (below title stack); desktop unchanged (right-aligned in header row). Removed duplicate Operator Journal mobile-only footer link. |
| v2.34 | July 2026 | **Public pricing page + Enterprise intake.** New `/pricing` route: Free + Starter/Pro/Max tier cards (monthly/annual toggle, 2-months-free badge), wide Enterprise row beneath with science-blue accent border and "Contact us" modal intake form. Footer Pricing link points to `/pricing`. |
| v2.33 | July 2026 | **Transactional email design system.** Shared `EmailLayout` now uses correct logo aspect ratio (244×29 SVG → 227×27 display), unified typography (22px heading, 15px body, 11px uppercase meta labels), spacing rhythm, and bordered content cards. `NewInquirySeller` merges buyer contact + message into one card with FROM/MESSAGE sections. |
| v2.32 | June 2026 | **Careers page.** New static `/careers` route (footer link target): dark hero, open-positions block with mailto CTA (`careers@blackdiamondmkt.com`), 3-column culture cards on `#F7F8F9` — patterns match How It Works and Contact. Added to sitemap. |
| v2.31 | June 2026 | **Global newsletter section.** Extracted homepage newsletter into shared `NewsletterSection` + `NewsletterFormLazy` (`src/components/`). Business/seller profile page now uses the same two-column card layout, copy, and form styling as the homepage — no one-off newsletter blocks. Documented canonical component in §6. |
| v2.30 | June 2026 | **Homepage section header unification.** Featured Equipment and Browse by Industry headlines upgraded to shared fluid H2 (`clamp(28px, 4vw, 40px)`, `-0.03em` tracking) with `text-base` subtext — matching How It Works and Newsletter. Documented shared homepage section header pattern in §7; section padding updated to `py-16 lg:py-20`; newsletter card spec updated (`rounded-[20px]`, `shadow-card`, full `.page-shell` width, two-column layout). |
| v2.29 | June 2026 | **Browse by Industry redesign + Forestry.** Homepage `CategoryBrowse`: 6 industries (added Forestry with Lucide `Trees`), 3×2 grid (1 col mobile / 2 tablet / 3 desktop). Cards are thin horizontal rows (~68px): 40×40px orange-tint icon box (`rounded-lg`) + bold 14px title + muted 12px subtitle. Links use `/search?industry=` slug. Skeleton updated to match. |
| v2.28 | June 2026 | **Dashboard publish actions + photo drag + featured cap.** Draft/unpublished manage overlay: "Publish" uses light orange accent (`bg-orange-bg`, `border-orange-bdr`, `text-orange`); unpublished action order is Publish → Edit → Archive. Photo sortable tiles: full-tile drag on desktop (grip visual only); `cursor-grab` on hover, `cursor-grabbing` while pressed/dragging. Homepage Featured Equipment capped at 5 listings (one row at ≥1280px). |
| v2.27 | June 2026 | **Edit listing mobile flow + photo UX.** Below 1024px, `EditListingModal` renders full-screen `EditListingMobileFlow` (2 steps: Photos → Details) matching new-listing mobile shell. Edit desktop + both flows use `ListingPhotoSortableList`; mobile reorder via full-tile overlay (blocks iOS image callout). Photo remove uses optimistic UI — tile disappears immediately, rolls back on API failure. |
| v2.26 | June 2026 | **Dashboard nav parity + browse card behavior.** `DashboardNav` shell matches public navbar (64px height, frosted `rgba(255,255,255,0.20)` background, translucent border). Upgrade page body capped at `1450px`; duplicate Pro-tier "Current Plan" pill removed (corner badge only). Listing cards on homepage, search, seller profile, and related listings open in a new tab via `openInNewTab` prop. |
| v2.25 | June 2026 | **New listing Step 4 desktop preview.** Desktop modal publish step preview replaced with shared `ListingCard` (`preview` mode) — live form/photo/taxonomy data, identical to marketplace cards. Removed legacy preview layout (pin icon, condition pill, description excerpt). |
| v2.24 | June 2026 | **New listing photo reorder (mobile).** Step 3 photo thumbnails use `@dnd-kit/sortable` with a bottom grip handle and 200ms touch activation — reorder works on mobile without iOS long-press image preview. Shared `ListingPhotoSortableList` used on desktop grid and mobile horizontal strip. |
| v2.23 | June 2026 | **Listing detail gallery interaction model.** Main image click opens lightbox at the active photo index (not masonry). Bottom-right pill is now camera + "View all (N)" — sole entry to masonry grid. Lightbox close/back respects entry origin: direct → listing page, grid → masonry overlay. Applies to desktop and mobile (PhotoSwipe). |
| v2.22 | June 2026 | **iOS input zoom fix.** Global `input`, `textarea`, `select` rule: `font-size: max(16px, 1em)` in `globals.css` to prevent iOS Safari auto-zoom on focus. Root viewport meta adds `maximum-scale=1`. Form elements only — no change to labels, buttons, body text, or navigation. |
| v2.21 | June 2026 | **1450px content cap — public surfaces.** Navbar, homepage (hero + all sections), search page (+ FilterBar via prop), listing detail (replaces prior `1300px` inner cap), business directory, and business profile inner content constrained to `1450px`. Footer and dashboard unchanged from v2.20. Global `1600px` shell retained on other pages. |
| v2.20 | June 2026 | **Dashboard + footer max-width.** `/dashboard` page body constrained to `1450px` (`margin: 0 auto`). Footer inner content (sitemap, settings, legal, copyright) constrained to `1450px`; footer `#1A1D20` background remains full viewport. Global `1600px` shell and navbar unchanged. |
| v2.19 | June 2026 | **Listing detail two-column max-width.** Gallery + info panel grid capped at `1300px` (`margin: 0 auto`) inside the global `1600px` page container; breadcrumb and related listings unchanged at `1600px`. |
| v2.18 | June 2026 | **Listing card share button.** Shared `ListingCard` thumbnail now shows a frosted-glass share circle (`.gallery-action-pill`, `32×32px`) left of the save/heart button, opening the same 6-option share popover as listing detail (Copy Link, Email, Facebook, Messenger, WhatsApp, LinkedIn) via extracted `ListingSharePopover` component. Share visible on all card locations without login; save button updated to matching frosted-glass styling. |
| v2.17 | June 2026 | **Listing card location flag size.** Flag icon in location pill increased to `20×20px` circle with `5px` gap to text. |
| v2.16 | June 2026 | **Unified listing card grid + size.** All five card locations use fixed 1–5 column grid and single 225px-base card (10px padding, title 13px, price 14px). Removed dashboard compact variant and `size="sm"` prop. |
| v2.15 | June 2026 | **Dashboard listing card compact variant.** My Listings + Saved Equipment tabs: fixed grid columns (1/2/3/4/5 by breakpoint), `ListingCard size="sm"` (225px base, 10px padding, title 13px, price 14px). Public grids unchanged at 282px. |
| v2.14 | June 2026 | **Listing card price size.** Price font reduced from `16px` to `13px` on shared `ListingCard`. |
| v2.13 | June 2026 | **Listing card design tokens.** Card `12px` radius; grid min column `282px`; thumbnail `60%` of card width with top corners `12px`; body padding `12px`; title `15px/500/1.35`; price `16px/500/#FF6B35`. Applied via shared `ListingCard` across all five grid locations. |
| v2.11 | June 2026 | **Listing card grid size reduction.** Grid column min reduced from `clamp(260px, 22vw, 320px)` to `clamp(220px, 18vw, 280px)` — ~5 cards across at 1440px instead of 4 oversized cards. Applies globally via `.listing-card-grid`. |
| v2.10 | June 2026 | **Listing card grid + thumbnail system.** Unified fluid grid (`.listing-card-grid`: `repeat(auto-fill, minmax(clamp(260px, 22vw, 320px), 1fr))`) across Featured Equipment, search, saved listings, My Listings, seller profile, and related listings. `ListingCard` thumbnail switched to fixed `aspect-[4/3]`; content area uses fixed `12px 14px` padding; title/price use `clamp()` for fluid typography. Consolidated seller profile `ActiveCard`/`SoldCard` and dashboard `MyListingCard` onto shared `ListingCard` with mode/overlay props. |
| v2.9 | June 2026 | **New Listing modal — mobile/tablet full-screen step flow.** Below 1024px, `NewListingModal` renders `NewListingMobileFlow`: full-screen white overlay sliding up from bottom (`z-[130]`), fixed header with back/close + four-segment progress bar + close X, horizontal step slide animations (`nl-step-forward` / `nl-step-back`), inline exit confirmation (no browser dialog), keyboard-aware fixed bottom CTAs via `visualViewport`, single-column review fields, camera-roll-friendly photo upload (`accept="image/*"`), horizontal photo strip, publish summary with membership remaining count. Desktop (≥1024px) modal unchanged. Added `useIsBelowLg` hook. |
| v2.8 | June 2026 | **How It Works mobile overflow fix + DashboardNav adopts the mobile navbar pattern.** (1) Homepage "How It Works" step cards (`(public)/page.tsx`) switched from a hardcoded `repeat(3, 1fr)` grid to `grid-cols-1 lg:grid-cols-3` — single full-width column below 1024px (was overflowing/cut off), unchanged 3-up at desktop. The decorative connecting line between cards is now `hidden lg:block` since it only makes sense between side-by-side cards. (2) Extracted the <1024px navbar pieces (`LogoIcon`, `SearchIcon`, `SearchBarTrigger`, `MobileNavTrigger`, tap-target constants) out of `Navbar.tsx` into a shared `src/components/layout/MobileNavParts.tsx` so they aren't duplicated. (3) `DashboardNav.tsx` (used by every page under `(dashboard)/layout.tsx` — My Listings, Saved Equipment, Account Settings, Upgrade) now renders the same non-homepage mobile/tablet pattern below 1024px: icon-only logo, full-width inline `SearchBarTrigger` (opens `MobileSearchTakeover`), and `MobileNavTrigger` (always the avatar branch, since every dashboard page requires auth and `user` is never null) opening the same `MobileMenu` slide-in. Desktop (≥1024px) dashboard nav — the pill-shaped `ProfileDropdown` with name/chevron — is unchanged, just wrapped in `hidden lg:grid`. |
| v2.7 | June 2026 | **Homepage vs. non-homepage mobile/tablet navbar split, full-screen search takeover.** Below 1024px, the navbar now branches on route: homepage (`/`) shows the full wordmark + a search icon button; every other page shows the icon-only logo (`/bd_logo-icon.svg`) + an always-visible full-width search bar look-alike (`SearchBarTrigger`). Both trigger the identical `MobileSearchTakeover` — a full-screen white overlay with the input pinned to top and suggestions capped at 50vh so the keyboard has room. Suggestion fetching/matching/keyboard-nav logic was extracted from `SearchBar.tsx` into a shared hook (`useSearchSuggestions`) so the desktop dropdown and the new takeover behave identically rather than duplicating logic. `MobileMenu`'s width is now a single `min(75vw, 400px)` rule across all of <1024px, replacing the old full-screen-mobile/340px-tablet split. **Bug fixes (not design changes, but required for the above to render correctly):** added the missing `<meta name="viewport">` (`export const viewport` in `app/layout.tsx`) — without it mobile browsers laid out against a wider assumed viewport, pushing right-aligned navbar icons outside the visible screen; added `overflow-x: hidden` to `html`/`body` in `globals.css` to contain the homepage globe's intentional edge-bleed, which was breaking `position: fixed` viewport anchoring on narrow screens. |
| v2.6 | June 2026 | **Mobile menu fix.** `MobileMenu` portaled to `document.body` so the slide-in panel escapes the navbar `backdrop-filter` containing block and renders above page content. Mobile (<768px): full-screen slide-in from right. Tablet (768–1023px): unchanged 340px side panel. Added `Escape` to close and safe-area bottom padding. Documented in new §5 Mobile Menu subsection. |
| v2.5 | June 2026 | **Brand scope broadened.** Updated Brand Overview (§1) to position Black Diamond as a multi-industry heavy equipment marketplace — oil & gas, construction, mining, and agriculture — not oil & gas only. No visual token or component changes. |
| v2.4 | June 2026 | **Homepage section rebuild.** (1) `/listings` browse page renamed to `/search`; 308 permanent redirect added in `next.config.mjs`; all internal links updated. (2) Featured Equipment carousel (7 cards, horizontal scroll + arrow nav, swipeable): non-free seller listings only, tier-weighted (max→pro→starter), seeded shuffle resets every 5 days via `Math.floor(Date.now()/(5×86400000))`. (3) Browse by Category: 5 blocks (Oil & Gas/Construction/Mining/Agriculture/Trucks & Trailers) with Lucide icons, desktop 5-col, tablet 2-col, mobile 1-col, linking to `/search?category=`. (4) How It Works: unchanged. (5) "Knowledge Base" renamed to "The Operator Journal" across all nav, footer, and page labels (route/table unchanged); homepage section shows 3 most recent published articles with stub fallback. (6) SEO text section: 800px centered prose, 3-paragraph copy. (7) Newsletter section: updated headline to "Stay Ahead of the Market." (8) Footer rebuilt: black background (#1A1D20), 4 sitemap columns (Company/Industries/Resources/Business) + settings block (Language/Currency placeholder dropdowns), legal row (Privacy Policy/Terms of Service), bottom bar (diamond icon + copyright left; Instagram/LinkedIn/Facebook/X icons right). |
| v2.3 | June 2026 | **Globe desktop positioning unified (≥1000px).** Removed separate sm-desktop (1000–1280px) and lg-desktop (1280–1500px) breakpoints entirely. All desktop widths now use one mode: globe **centered in the right half of the 1280px content container** using pure viewport math — `boundW = min(viewportWidth, 1280)`, `left = max(0, (w−1280)/2) + boundW×0.75 − size/2`. At sub-1280px viewports `boundW` adapts to the actual container width; at ≥1280px `boundW×0.75 = 960` (center of the right half of the 1280px container). Globe **top is aligned to the content card top** on every resize by reading `data-hero-card` via `getBoundingClientRect()` relative to `data-hero-section` (function `readCardTop()`). Globe size remains `max(h×1.2, 960)`. Hero section remains full viewport width at all sizes (no max-width constraint). Mobile (<730px) and tablet (730–1000px) flow layouts unchanged. `GlobeMode` type simplified to `'mobile' | 'tablet' | 'desktop'`. |
| v2.2 | June 2026 | **Three UI improvements.** (1) Hero search bar glow amplified: `useGlowBorder` gains `glowIntensity` option (multiplier on all `shadowBlur` values); `HeroSearchForm` passes `arcLen: 78` (+30% arc length) and `glowIntensity: 1.4` (+40% spread) for a more expansive focus glow — all other callers (NavSearchBar, AI textarea) are unchanged. (2) Listings browse grid updated to 4-col at `xl` (1280px+), 3-col at `lg` (1024–1280px), 2-col at `md` (768–1024px), 1-col on mobile; `ListingCard` thumbnail container changed from `aspect-[4/3]` to `padding-bottom: 60%` (ratio trick) ensuring all thumbnails use a consistent height equal to 60% of the card width, object-cover, regardless of source image dimensions. (3) Globe component now self-manages positioning via a `resize` useEffect with 5 breakpoints. Flow modes — mobile (<730px) and tablet (730–1000px) — render the globe as an in-flow element below the content card (360px / 440px tall container, `overflow:hidden`, globe horizontally centered with its top anchored to the container so only the top hemisphere shows; sizes `innerWidth × 1.35` / `× 1.05`). Desktop modes — small (1000–1280px), large (1280–1500px), XL (1500px+) — position the globe `absolute` anchored to the **content card's right edge**, read live from the DOM via `data-hero-section` + `data-hero-card`: `left = cardRight − 60` (60px overlap into the card) and `top = cardTop − 60`, so the globe hugs the card at every width and never drifts into empty space on ultrawide monitors. Desktop sizes scale with viewport height (`×1.0 / ×1.1 / ×1.2`, min 760/860/960) and bleed off the right and bottom edges (clipped by the hero section's `overflow:hidden`). **Homepage hero breakpoint moved from `md` (768px) to `min-[1000px]`** so the layout stacks (card over globe) until 1000px, matching the globe's flow→absolute switch; globe wrapper div removed — `<Globe />` renders directly in the hero section and self-positions. |
| v2.1 | June 2026 | **Listing detail Save/Share.** Added `ListingActions` component overlaying two frosted-glass pills (`.gallery-action-pill`, see §8 Glassmorphism exceptions) top-right of the photo gallery: heart "Save" pill (outline default, filled `#CC0000` when saved with a `.heart-pop` scale animation on toggle) and "Share" pill opening a flat-white popover (`rounded-[16px]`, `shadow: 0 8px 28px rgba(0,0,0,0.12)`) with 6 single-column options — Copy Link, Email, Facebook, Messenger, WhatsApp, LinkedIn. Save state persists via `saved_listings` table. Dynamic OG/Twitter metadata extended with `og:url`, `twitter:card: summary_large_image`, and a structured `og:description` ("Available on Black Diamond Marketplace · City, State · Price"), falling back to the BD logo for `og:image` when no listing photo exists. Dashboard Saved tab empty state copy updated to "No saved listings yet. Browse equipment and hit Save to build your list." |
| v2.0 | June 2026 | **Homepage hero redesign — glassmorphism exception.** Hero section now uses a two-column grid (1.1fr / 0.9fr) with a WebGL globe (cobe, 860×860px) positioned in the right column at bottom: -220px, right: -100px so it overflows and bleeds off the bottom edge. Left column content is wrapped in a frosted glass card: `background: rgba(255,255,255,0.75)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.6)`, `border-radius: 20px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.06)`, `padding: 40px 44px`. **Design system exception:** glassmorphism is normally restricted to the navbar. This hero card is the single explicitly approved exception — do not apply elsewhere without product-owner sign-off. Z-index stack: globe z-1, glass card z-2, section-level bottom fade z-3 (220px white→transparent, full hero width). |
| v1.9 | June 2026 | Canvas glow border effect (src/hooks/useGlowBorder.ts) — reusable hook powering animated orange arc that traces the border of focused inputs. On focus: speed bursts to 1.2 then settles at 0.18 (perimeter pts/frame); on blur: arc fades out (opacity −0.03/frame). Drawing: 300 sampled perimeter points on a rounded-rect path, faint full-outline pass (rgba 255,107,53 × 0.12 × opacity) + moving arc of 60 pts with power-2.2 falloff — outer glow pass (shadowBlur 10, rgba 255,120,60) + inner bright pass when falloff > 0.7 (shadowBlur 6, rgba 255,220,180). Canvas is container+20px, positioned −10px/−10px absolute behind the input (z-index 0); input border goes transparent on focus (z-index 1). Applied to: (1) SearchBar both variants — default options, focus/blur activated; (2) HeroSearchForm on homepage — burstSpeed 1.5 / settleSpeed 0.15; (3) AI prompt textarea in NewListingModal Step 1 — always-on (active=true on mount, never blurred), arcLen 80, burstSpeed 0.8, settleSpeed 0.12, borderRadius 10. Old CSS `.search-glow-border` / `glow-rotate` keyframe retained in globals.css for reference but no longer applied. |
| v1.8 | May 2026 | Universal SearchBar component (src/components/marketplace/SearchBar.tsx) — variant="nav": 40px pill, rgba(255,255,255,0.85) glass bg + blur(8px), 1.5px #E8E9EA border, orange focus ring + 3px glow ring. variant="hero": white bg, moving glow border on focus (glow-rotate keyframe, 3s ease infinite, #FF6B35→#FFB347→#FF4500 gradient, 2px padding border trick). Submit arrow right edge, clear X when value present. Navbar.tsx: height 56px→64px, 3-column grid (Logo | NavLinks+SearchBar | Auth), glassmorphism stays, "List Equipment" button converted to glass-btn-orange class. DashboardNav.tsx: height 56px→64px, 3-column grid (Logo | SearchBar | NavLinks+NewListing+Profile), "+ New Listing" button glass-btn-orange. Layout offsets updated: public pt-[82px]→pt-[88px], dashboard pt-14→pt-16, listings filter sidebar top-[82px]→top-[88px]. Added globals.css: @keyframes glow-rotate, .search-glow-border, .glass-btn-orange with hover state. Installed: @radix-ui/react-popover, @radix-ui/react-checkbox, @radix-ui/react-select, lucide-react; shadcn components: popover, checkbox, select. |
| v1.7 | May 2026 | Company logo containers: changed from circular to rounded rectangle (border-radius 12px) across all surfaces — Business Directory cards (64×64px), seller profile header (80×80px), listing detail Listed By block, and account settings preview. Logo containers use #F7F8F9 background, 1px solid #E8E9EA border, 6px padding, object-fit: contain. Initials fallback retains #1A1D20 background, no padding. Business Directory sort updated to tier-priority order (platinum → gold → silver → bronze → free), tiebroken by active listing count desc. Business Directory link added to Footer Marketplace column between Browse Listings and List Equipment. |
| v1.6 | May 2026 | Seller profile page full rebuild (/sellers/[slug]) — breadcrumb "Business Directory → Company Name", white header card (72px circular logo, 22px company name, BDVerifiedBadge md, location 13px #9A9DA2, MEMBER SINCE mono 11px uppercase #B0B0B8, stats strip, Send Message orange pill button). SellerContactModal client component — trigger button opens 440px modal with backdrop rgba(0,0,0,0.30)+blur(4px), form posts to /api/leads without listing_id, success state, ESC/backdrop close. SellerListingsSection client component — Active/Sold tab pills (ink active / white inactive, count chips), sort dropdown (Newest/Price asc/desc), 3-col grid with ActiveCard (link, hover scale, orange price) and SoldCard (grayscale+sold overlay badge), 9/page pagination with orange current page pill + prev/next arrows. Sellers directory at /sellers — Business Directory page with grid of seller cards (48px logo, company name, BD Verified badge, location, active listing count), force-dynamic. Updated /api/leads to accept seller_id without listing_id (Path B: direct seller contact). |
| v1.5 | May 2026 | Seller profile page (/sellers/[slug]) — white header card with 80px circular logo/initials, company name + BDVerifiedBadge, location, member since, stats row, active listings grid, sold listings grid with grayscale+sold overlay. BDVerifiedBadge component — orange brilliant-cut diamond SVG, three sizes (sm/md/lg), tooltip, premium-only. Company logo upload in Account Settings — circular 72px preview, upload button, immediate POST to /api/users/logo. Seller card on listing detail page showing logo, company name, badge, view-all link. |
| v1.4 | May 2026 | Account Settings page — 680px centered layout, three labeled sections (Personal Info, Company Info, Change Password), divider separators, read-only email field, US state dropdown, orange pill save buttons, error banners, success toast. API routes GET/PATCH /api/users/me. |
| v1.3 | May 2026 | Documentation sync — audited all components and pages against actual implementation. Corrected font (Inter not Aeonik), navbar position (floating with margins, not flush top-0), button variants (danger added, secondary/green removed, size variants documented), filter sidebar (radio buttons for category), listing card (aspect-[4/3] not 40%, save button hover-only, price in ink not orange), listing detail (1200px max-width, price in orange, blue location badge, green condition badge). Added: Tailwind alias table for all color tokens, logo mark spec, scrollbar and selection styles, error banner pattern, toast patterns, dashboard filter pills, card manage overlay, profile dropdown, subscription panel, upgrade modal, New Listing modal full spec. |
| v1.2 | May 2026 | Listing detail page — breadcrumb, full-width photo gallery with thumbnail strip, two-column layout (title card with pills/price, specs grid, description, sticky inquiry form, save+share). Related listings 4-col grid. JSON-LD Product schema. Dynamic OG metadata. |
| v1.1 | May 2026 | New Listing modal — 4-step flow (Describe, Review & Refine, Photos & Video, Publish). Full-screen overlay with backdrop blur, 720px white card, orange breadcrumb progress, discard confirmation overlay, drag-to-reorder photo grid, price visible toggle, preview card in step 4. |
| v1.0 | May 2026 | Initial design system established. Light mode, orange + green + science blue + gold palette, Aeonik/Inter typography, pill buttons, frosted glass navbar. |