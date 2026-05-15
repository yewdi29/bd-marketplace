# Black Diamond Marketplace — Design System
> Single source of truth for all UI decisions. Read this before touching any component.
> Last updated: May 2026 — v1.0

---

## 1. Brand Overview

Black Diamond Marketplace is a premium B2B heavy equipment marketplace for the oil and gas industry. The design must communicate:

- **Authority** — we know this industry
- **Trust** — buyers are spending $50K–$2M
- **Approachability** — our users skew older, yet easy to use and modern
- **Clarity** — specs and pricing front and center, no fluff

**What we are not:** A dark developer tool, a flashy startup, a consumer app.
**What we are:** A serious, clean, inviting business platform — like a premium real estate marketplace built for the oilfield.

---

## 2. Color Tokens

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F7F8F9` | Page background — warm off-white |
| `--white` | `#FFFFFF` | Card surfaces, navbar base, input fields |
| `--border` | `#E8E9EA` | Default borders, card outlines |
| `--border-2` | `#D4D5D7` | Emphasized borders, input focus rings |
| `--text` | `#1A1D20` | All headings, body text, icons |
| `--text-2` | `#4A4D52` | Secondary text, descriptions, nav links |
| `--text-3` | `#9A9DA2` | Placeholders, timestamps, meta labels |

### Brand Accent — Orange (Primary Action)

| Token | Hex | Usage |
|-------|-----|-------|
| `--orange` | `#FF6B35` | Primary CTAs, search button, filter apply, active states |
| `--orange-lt` | `#FF8855` | Hover states on orange elements |
| `--orange-bg` | `#FFF2ED` | Badge backgrounds, tint surfaces |
| `--orange-bdr` | `#FFD4C2` | Badge borders on orange tint |

### Accent — Neon Green (Secondary / Highlights)

| Token | Hex | Usage |
|-------|-----|-------|
| `--green` | `#A2FF9A` | New Listing badge dot, secondary button fill |
| `--green-text` | `#1A5C18` | Text on green surfaces |
| `--green-bg` | `#F0FFF0` | New Listing badge background |
| `--green-bdr` | `#C8F5C4` | New Listing badge border |

### Accent — Science Blue (Map Markers)

| Token | Hex | Usage |
|-------|-----|-------|
| `--blue` | `#0066CC` | Map pin default color, marker dot |
| `--blue-text` | `#004499` | Text on blue tint surfaces |
| `--blue-bg` | `#E6F0FF` | Map marker pill background |
| `--blue-bdr` | `#B3D1FF` | Map marker pill border |

### Accent — Gold (Premium)

| Token | Hex | Usage |
|-------|-----|-------|
| `--gold` | `#D4A017` | Premium badge dot |
| `--gold-text` | `#7A5C00` | Text on gold surfaces |
| `--gold-bg` | `#FDF6E3` | Premium badge background |
| `--gold-bdr` | `#F0D98A` | Premium badge border |

### ⚠️ Color Rules
- **Never** use pure black `#000000` — always use `--text` `#1A1D20`
- **Never** use pure white as a page background — always use `--bg` `#F7F8F9`
- **Never** put dark text on orange backgrounds — use white only
- **Never** use gold as a primary action color — orange only for CTAs
- **Never** use green for CTAs — green is for New Listing badge and highlights only
- Orange is the **only** primary action color. One accent, used consistently.

---

## 3. Typography

### Font Stack
- **Display / UI:** Aeonik (production) — fall back to `Inter` during development
- **Monospace:** Andale Mono — prices, specs, labels, timestamps

```css
--font: 'Aeonik', 'Inter', system-ui, sans-serif;
--mono: 'Andale Mono', monospace;
```

### Type Scale

| Role | Size | Weight | Tracking | Usage |
|------|------|--------|----------|-------|
| Hero | 42–48px | 800 | -0.03em | Homepage hero headline |
| H1 | 32px | 800 | -0.03em | Page titles |
| H2 | 24px | 700 | -0.02em | Section headings |
| H3 | 18px | 700 | -0.01em | Card titles, subsections |
| H4 | 15px | 600 | 0 | Labels, group headers |
| Body | 15px | 400 | 0 | Paragraphs, descriptions |
| Small | 13px | 400 | 0 | Secondary descriptions |
| Micro | 11px | 500 | 0 | Tags, meta info |
| Price | 16–22px | 500 | -0.02em | Andale Mono — all prices |
| Label | 10–11px | 500 | 0.08–0.1em | Andale Mono — uppercase spec labels |

### Typography Rules
- **Never** use font weights below 400
- **Never** use font weights above 800
- Hero headlines always use weight 800 with tight tracking
- Prices always use Andale Mono — never the display font
- Spec labels (drill pipe grade, size, API standard) always use Andale Mono uppercase
- Line height: 1.05 for headlines, 1.4 for UI text, 1.7 for body copy

---

## 4. Spacing & Layout

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r` | `10px` | Small elements — tags, inputs, small cards |
| `--r-lg` | `16px` | Cards, panels, filter sidebar |
| `--r-xl` | `20px` | Navbar, hero section, large containers |
| `--r-pill` | `100px` | All buttons, badges, markers, search bar |

### Spacing Scale
Use multiples of 4px:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

### Layout
- Max content width: `1280px`
- Page padding: `24px` mobile, `40px` tablet, `64px` desktop
- Card gap: `12–16px`
- Section padding: `64–96px` vertical

### Shadows
```css
/* Card default */
box-shadow: 0 1px 4px rgba(0,0,0,0.05);

/* Card hover */
box-shadow: 0 8px 28px rgba(0,0,0,0.10);

/* Navbar */
box-shadow: 0 2px 16px rgba(0,0,0,0.05);

/* Orange button glow */
box-shadow: 0 4px 16px rgba(255,107,53,0.30);

/* Search bar */
box-shadow: 0 2px 12px rgba(0,0,0,0.07);
```

---

## 5. Components

### Navbar
- Frosted glass effect — **navbar only**, nowhere else
- `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)`
- Border radius: `--r-xl` (20px)
- Height: 58px
- Position: fixed, top 0
- Active nav link: white pill with subtle shadow
- Right side: ghost "Sign in" button + orange "List Equipment" pill button

### Buttons

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| Primary CTA | `--orange` `#FF6B35` | White | List Equipment, Search, Apply Filters, Submit |
| Primary Dark | `--text` `#1A1D20` | White | Browse Equipment, secondary actions |
| Secondary | `--green` `#A2FF9A` | `--green-text` | BD Verified actions |
| Outline | White + `--border-2` | `--text` | Learn More, Cancel |
| Ghost | Transparent + `--border-2` | `--text-2` | Sign In, tertiary actions |

- All buttons: `border-radius: --r-pill` (fully rounded)
- All buttons: font-weight 700
- **Never** use square or slightly rounded buttons — always pill shape

### Cards
- Background: `--white`
- Border: `0.5px solid --border`
- Border radius: `--r-lg` (16px)
- Shadow: `0 1px 4px rgba(0,0,0,0.05)`
- Hover: `translateY(-2px)` + elevated shadow
- Image area: `--bg` `#F7F8F9` background

### Listing Cards
- Image top 40% of card
- Save/heart button top-right of image — white circle, subtle shadow
- Category label: Andale Mono, 10px, uppercase, `--text-3`
- Title + Price on same row — title left, price right
- Location + Condition below
- Tags row at bottom — pill shaped

### Badges

| Badge | Background | Text | Border | Dot Color |
|-------|-----------|------|--------|-----------|
| New Listing | `--green-bg` | `--green-text` | `--green-bdr` | `--green` |
| BD Verified | `--orange-bg` | `--orange` | `--orange-bdr` | `--orange` |
| Premium | `--gold-bg` | `--gold-text` | `--gold-bdr` | `--gold` |

- All badges: `border-radius: --r-pill`, Andale Mono, 11px, weight 700
- Always include colored dot before label text

### Map Markers
- Default pin: `--blue` `#0066CC` — Science Blue
- Selected/active pin: `--orange` `#FF6B35`
- Pill style: colored background tint + colored dot + location text
- Pin icon style: rotated square with white inner circle

### Form Inputs
- Background: `--white` — never gray, never dark
- Border: `1px solid --border-2`
- Border radius: `--r` (10px) for standard inputs, `--r-pill` for search
- Focus: border color changes to `--orange`
- Placeholder: `--text-3`
- Font: `--font`, 13–15px, weight 400

### Filter Sidebar
- Background: `--white`
- Width: 220px, sticky
- Checkboxes: orange fill `--orange` when checked
- "Clear all": `--orange` text, no background
- "Apply Filters" button: full width, `--orange`, pill shape

---

## 6. Traffic Light System — ADMIN ONLY

⛔ **This system is strictly internal. Never expose tier information to public users.**

The traffic light tier system is visible only in the `/admin` command center dashboard.

| Tier | Color | Price Range | Service |
|------|-------|-------------|---------|
| Green | `#2D7D46` | Under $100K | Self-service — seller contacts leads directly |
| Yellow | `#C8A020` | $100K–$500K | Assisted — BD offers logistics support |
| Red | `#B03030` | Over $500K | White glove — full brokerage service |

Public listing cards show **no tier indicators**. Tier routing happens invisibly in the backend.

---

## 7. Page-Specific Notes

### Homepage
- Hero on white card surface, lifted off the `--bg` page background
- Orange word in hero headline for emphasis — one word only
- Search bar: pill shaped, white fill, orange search button
- Category grid: white cards on `--bg` background

### Listings Browse Page
- Layout: filter sidebar left (220px) + card grid right
- Filter sidebar sticky on scroll
- Results count in bold above grid
- Card grid: `repeat(auto-fill, minmax(220px, 1fr))`
- No tier badges visible to public

### Login / Signup
- Centered card on `--bg` background
- White card surface, `--r-xl` radius
- Email/password inputs with white backgrounds
- Orange submit button full width
- No Google OAuth — email and password only

### Knowledge Base
- Clean editorial layout
- Article cards with category label, title, excerpt, read time
- Orange category accent on active filter

### Admin Command Center
- Linear-style dashboard (save for Phase 3)
- Traffic light system visible here only
- Dark sidebar with orange accent (different from public site)

---

## 8. What Never To Do

- ❌ Never use dark mode on the public site
- ❌ Never apply frosted glass outside of the navbar
- ❌ Never use serif fonts anywhere
- ❌ Never use square buttons — always pill shaped
- ❌ Never show traffic light tiers to public users
- ❌ Never use blue as a CTA color — blue is for map markers only
- ❌ Never use green as a CTA color — green is for New Listing badge only
- ❌ Never use gold as a CTA color — gold is for Premium badge only
- ❌ Never use pure black `#000000` or pure white `#FFFFFF` as page background
- ❌ Never put prices in the display font — always Andale Mono
- ❌ Never use Google OAuth — email and password only
- ❌ Never call Supabase directly from the browser — always use API routes

---

## 9. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.2 | May 2026 | Listing detail page — breadcrumb, full-width photo gallery with thumbnail strip, two-column layout (title card with pills/price, specs grid, description, sticky inquiry form, save+share). Related listings 4-col grid. JSON-LD Product schema. Dynamic OG metadata. |
| v1.1 | May 2026 | New Listing modal — 4-step flow (Describe, Review & Refine, Photos & Video, Publish). Full-screen overlay with backdrop blur, 720px white card, orange breadcrumb progress, discard confirmation overlay, drag-to-reorder photo grid, price visible toggle, preview card in step 4. |
| v1.0 | May 2026 | Initial design system established. Light mode, orange + green + science blue + gold palette, Aeonik/Inter typography, pill buttons, frosted glass navbar. |