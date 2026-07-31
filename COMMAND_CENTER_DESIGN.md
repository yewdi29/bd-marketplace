# Black Diamond Command Center — Design System

> **Required reading.** Claude Code must read this file before making any changes to command center components or pages under `/rigburrito`.

---

## Core Concept

The command center uses a **floating container layout**. The true background is near-black `#0A0B0E`. The entire dashboard content area is a single white `#FFFFFF` rounded container that sits elevated above the background, creating natural depth. The sidebar is part of the background layer. The content is part of the elevated layer.

---

## Color Palette

### Background layer (sidebar and page background)

| Token | Value |
|-------|-------|
| Page background | `#F8F9FA` |
| Sidebar surface | `#1C1C1C` |
| Sidebar hover | `#252525` |
| Sidebar active | `#2A2A2A` |
| Sidebar border / divider | `rgba(255,255,255,0.06)` |
| Sidebar shadow | `0 0 0 1px rgba(0,0,0,0.16), 0 8px 32px rgba(0,0,0,0.20)` |

### Elevated content container

| Token | Value |
|-------|-------|
| Container background | `#FFFFFF` |
| Container border radius | `20px` |
| Container shadow | `0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)` |
| Container margin | `16px` top, right, bottom — sits flush to sidebar on left |

### Content surface colors

| Token | Value |
|-------|-------|
| Page background inside container | `#F8F9FA` |
| Card background | `#FFFFFF` |
| Card border | `1px solid #F0F1F3` |
| Card border radius | `12px` |
| Card shadow | none — borders only, no shadows on cards |
| Table row hover | `#FAFAFA` |
| Table header background | `#F8F9FA` |

### Brand colors

| Token | Value |
|-------|-------|
| Orange accent | `#FF6B35` |
| Orange muted | `rgba(255, 107, 53, 0.08)` — badge backgrounds |
| Orange border | `rgba(255, 107, 53, 0.2)` — badge borders |

### Status colors

| Status | Text | Background | Border |
|--------|------|------------|--------|
| Active / Success | `#16A34A` | `#F0FDF4` | `#BBF7D0` |
| Warning | `#D97706` | `#FFFBEB` | `#FDE68A` |
| Danger | `#DC2626` | `#FEF2F2` | `#FECACA` |
| Neutral | `#6B7280` | `#F9FAFB` | `#E5E7EB` |

### Text colors

| Token | Value |
|-------|-------|
| Primary | `#0F1117` |
| Secondary | `#6B7280` |
| Tertiary | `#9CA3AF` |
| Disabled | `#D1D5DB` |
| Inverse (on dark) | `#FFFFFF` |
| Inverse muted (on dark) | `#6B7280` |

---

## Typography

**Font stack:** Inter for all UI text. DM Mono for all numerical values, IDs, prices, percentages, and code.

| Role | Size | Weight | Color | Notes |
|------|------|--------|-------|-------|
| Page title | 24px | 600 | `#0F1117` | |
| Section title | 16px | 600 | `#0F1117` | |
| Card label | 11px | 500 | `#6B7280` | letter-spacing: `0.06em`, all caps |
| Card value (large stat) | 32px | 700 | `#0F1117` | DM Mono |
| Card value (medium) | 20px | 600 | `#0F1117` | DM Mono |
| Body text | 14px | 400 | `#0F1117` | |
| Table header | 11px | 500 | `#6B7280` | Users & Listings data tables |
| Table cell | 12px | 400 | `#0F1117` | Users & Listings — Inter, `nowrap` |
| Caption / meta | 12px | 400 | `#9CA3AF` | |
| Trend indicator | 12px | 500 | — | DM Mono, colored per status |

### Text links

Use class `rigburrito-text-link` on inline text links (not buttons, nav items, or image-only links).

- Default: no underline
- Hover: dotted underline, `3px` offset
- Dashboard list-row links: primary text (`p.font-medium`) gets dotted underline on row hover
- Users table clickable rows: name cell (`td.font-medium`) gets dotted underline on row hover

---

## Sidebar

The sidebar is a **floating panel** elevated above the `#F8F9FA` page background.

| Property | Value |
|----------|-------|
| Width | `240px` |
| Height | `calc(100vh - 24px)` |
| Position | fixed, `12px` margin on all sides |
| Background | `#1C1C1C` |
| Border radius | `16px` |
| Box shadow | `0 0 0 1px rgba(0,0,0,0.16), 0 8px 32px rgba(0,0,0,0.20)` |

### Logo area

- Padding: `20px 20px 12px` (aligns with nav item inset: `8px` margin + `12px` padding)
- Min-height: `64px`
- Gap: `4px` between icon, wordmark, and subtitle
- Diamond icon: animated SVG, `50px` in sidebar / `64px` on auth screens, white stroke, inner facets rotate every 10s
- "Black Diamond": `13px`, white, font-weight `600`
- "Command Center": `11px`, `#6B7280`, below wordmark

### Nav section label

`10px` / font-weight `600` / `#6B7280` / all caps / letter-spacing `0.08em` / padding `16px 16px 6px`

### Nav item — default

- Height: `36px`
- Padding: `0 12px`
- Border-radius: `8px`
- Margin: `1px 8px`
- Icon: `16px`, `#6B7280`
- Label: `13px`, font-weight `500`, `#6B7280`

### Nav item — hover

- Background: `#252525`
- Icon: `#9CA3AF`
- Label: `#9CA3AF`
- Transition: `120ms ease`

### Nav item — active

- Background: `#2A2A2A`
- Border: `1px solid rgba(255,255,255,0.08)` on all sides
- Border-radius: `8px`
- Icon: `#FFFFFF`
- Label: `#FFFFFF`, font-weight `600`
- No orange accent — active state is a subtle lift via lighter charcoal and a barely visible border

### Bottom section

- Divider: `1px solid rgba(255,255,255,0.06)`
- "Back to Site" and "Sign Out": `#6B7280`, `12px`, hover `#9CA3AF`

---

## Stat Cards

Each stat card contains:

1. Card label in all-caps muted style (`11px`, `#6B7280`, letter-spacing `0.06em`)
2. Value row on one line: large DM Mono value (`32px`, `700`) + inline delta (`12px`, DM Mono) immediately to the right on the same baseline
3. Delta colors: green `#16A34A` for positive/favorable, red `#DC2626` for negative/unfavorable
4. No sparklines, no separate "vs last month" row — the card is label, number, and inline delta only

### Dashboard metric strip

- Six cards in a single horizontal row at desktop (`flex`, equal width via `flex: 1 0 0`)
- Horizontal scroll when the row does not fit (do not wrap at desktop/tablet)
- Below `lg` (`1024px`): stack vertically
- Cards are clickable; one selected at a time (`border-color: #FF6B35`, subtle orange tint)
- Selecting a time-series metric opens a trend chart below; selecting User Locations opens the geographic breakdown

### Sparklines (deprecated)

Inline sparklines are **removed** from stat cards. Trend visualization lives in the dashboard detail region only.

---

## Orange Sequential Scale (geographic choropleth only)

Used **only** for the Dashboard User Locations map — not listing tier badges.

| Step | Hex | Usage |
|------|-----|-------|
| 0 | transparent fill, `#E5E5E5` stroke | zero users |
| 50 | `#FEF6EC` | lowest non-zero band |
| 100 | `#FCE4C6` | |
| 200 | `#F8C88C` | |
| 300 | `#F2A555` | |
| 400 | `#E8801F` | |
| 500 | `#C96412` | system orange base (rescales if brand orange `#FF6B35` is adopted here later) |
| 600 | `#8F4508` | highest-density band |

Bucket non-zero countries by **quantile** across the current count distribution.

---

## Dashboard Tab Bar

- No card wrapper around the tab list
- Active tab: lifted pill (`border-radius: 999px`, white background, `box-shadow: 0 0 0 1px #F0F1F3`)
- Inactive tabs: transparent background, `#6B7280` text
- Tabs separated by a `1px` hairline divider (`#E5E7EB`, `16px` tall) — no full borders or boxes
- CSS classes: `rigburrito-tab-bar`, `rigburrito-tab-bar-trigger`, `rigburrito-tab-bar-divider`

> **Note:** Other command center pages still use the older bordered `rigburrito-tab` pattern until migrated.

---

## Expandable Data Table

Generic table for dashboard tab panels. One component, per-tab column/detail/action config.

| Element | Spec |
|---------|------|
| Container | `rigburrito-table-wrap` + `rigburrito-expandable-table` |
| Row click | Expands in place below the row |
| Expanded panel | White inset card on `#FAFAFA` row background |
| Detail fields | Grid of label (`rigburrito-card-label`) + value (`rigburrito-body`) |
| Actions | `rigburrito-btn` variants in a flex row |

---

## Buttons

### Primary

- Background: `#0F1117`
- Color: `#FFFFFF`
- Border-radius: `8px`
- Padding: `8px 16px`
- Font-size: `13px`
- Font-weight: `500`
- Hover: background `#1A1D23`
- Active: background `#000000`
- Transition: `120ms ease`

### Secondary

- Background: transparent
- Border: `1px solid #E5E7EB`
- Color: `#0F1117`
- Same sizing as primary
- Hover: background `#F8F9FA`
- Active: background `#F0F1F3`

### Danger

- Background: transparent
- Border: `1px solid #FECACA`
- Color: `#DC2626`
- Hover: background `#FEF2F2`

### Orange accent

- Background: `#FF6B35`
- Color: `#FFFFFF`
- Hover: background `#E55A25`

### Success (listing approve)

- Background: `#16A34A`
- Color: `#FFFFFF`
- Hover: background `#15803D`

### Muted (listing unpublish / view public)

- Background: transparent
- Border: `1px solid #E5E7EB`
- Color: `#6B7280`
- Hover: background `rgba(107, 114, 128, 0.08)`

### Warning (listing flag)

- Background: transparent
- Border: `1px solid rgba(217, 119, 6, 0.35)`
- Color: `#D97706`
- Hover: background `#FFFBEB`

### Icon button

- Size: `32px` × `32px`
- Border-radius: `8px`
- Background: transparent
- Hover: background `#F0F1F3`
- Icon: `16px`, `#6B7280`

---

## Table Design

| Element | Spec |
|---------|------|
| Container | white card, `1px solid #F0F1F3` border, `12px` border-radius, `overflow: hidden` |
| Header row | background `#F8F9FA`, border-bottom `1px solid #F0F1F3`, height `40px`, padding `0 16px` |
| Data row | height `52px`, padding `0 16px`, border-bottom `1px solid #F8F9FA` |
| Row hover | background `#FAFAFA`, transition `80ms ease` |
| Last row | no bottom border |
| Clickable rows | `cursor: pointer` |

---

## Badges / Pills

All badges use this pattern:

- Border-radius: `999px`
- Padding: `2px 8px`
- Font-size: `11px`
- Font-weight: `500`
- Colored background + border + text per status color system above

**Never use solid filled backgrounds** — always the muted background with colored border and text.

### Agent Activity tab (dashboard only)

Three separate color systems in the same table — do not conflate them:

| System | Element | Rules |
|--------|---------|-------|
| Confidence | Plain text percentage | ≥75 `#16A34A`, 55–74 `#D97706`, ≤54 `#DC2626` — not a pill |
| Agent pill | Agent name | Listing Verifier teal `#0E7490` / `#ECFEFF` / `#A5F3FC`; Lead Scorer purple `#7C3AED` / `#F5F3FF` / `#DDD6FE`; Red Alert coral `#E85D4A` / `#FFF1EE` / `#FACFC7` |
| Outcome pill | Outcome status | `pending_review` burnt orange `#C2410C` / `#FFF7ED` / `#FDBA74`; success (`approved`, `scored`, `alerted`) green; failure (`flagged`, `overridden`) red |

Expanded Listing Verifier rows include a Feedback section: five criterion scores (0–20) with the same confidence color thresholds applied per criterion, plus `flag_comment` or a clean-approval message.

---

## Form Inputs

### Text input

- Height: `36px`
- Border: `1px solid #E5E7EB`
- Border-radius: `8px`
- Padding: `0 12px`
- Font-size: `14px`
- Background: `#FFFFFF`
- Focus: border-color `#0F1117`, box-shadow `0 0 0 3px rgba(15,17,23,0.06)`
- Placeholder: `#9CA3AF`

### Textarea

Same border, radius, and focus treatment. Padding `10px 12px`, min-height `80px`, `resize: vertical`.

---

## Slide-over Panels (Radix Dialog)

| Property | Value |
|----------|-------|
| Width | `480px` default; listing moderation uses `580px` |
| Animation | slides in from right |
| Background | `#FFFFFF` |
| Left border | `1px solid #F0F1F3` |
| Header | `64px` height, title `16px` font-weight `600`, close icon button |
| Content | scrollable, `24px` padding |
| Footer | `min-height 64px`, action buttons in equal-width single row (`.rigburrito-slideover-actions`), border-top `1px solid #F0F1F3` |

---

## Spacing System

Base unit: `4px`.

Common values: `4` / `8` / `12` / `16` / `20` / `24` / `32` / `40` / `48px`

| Context | Padding |
|---------|---------|
| Section padding inside white container | `32px` |
| Card padding | `20px` |
| Table cell padding (horizontal) | `16px` |

---

## Hold-to-Confirm Interaction

Used for all destructive actions.

1. Button shows default state
2. On `mousedown` / `touchstart`, a circular SVG progress ring begins filling clockwise in `#FF6B35` over `2000ms`
3. If released before completion, ring resets instantly
4. On completion, action fires
5. No tooltip needed — the progress ring communicates the mechanic
6. Button label changes to **"Hold to delete..."** while in progress

---

## Loading States

Skeleton loaders:

- Background: `linear-gradient(90deg, #F0F1F3 25%, #F8F9FA 50%, #F0F1F3 75%)`
- Animation: `background-size: 200%` sliding left to right over `1.2s`
- Stat card skeletons match card dimensions
- Table row skeletons show 5 rows of gray bars matching column widths

---

## Empty States

Centered in the content area.

| Element | Spec |
|---------|------|
| Icon | Lucide, `40px`, `#D1D5DB` |
| Title | `16px`, font-weight `600`, `#0F1117` |
| Description | `14px`, `#6B7280` |
| CTA | optional button below |
| Container min-height | `240px` |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.10 | 2026-07-31 | Dashboard Feedback tab: ExpandableDataTable for site feedback; category/status pills; expand shows message, screenshot, page URL, tier/role; status actions (reviewed/resolved/dismiss) |
| 2.9 | 2026-07-10 | Agent Activity tab: Confidence column, agent/outcome pills, expanded feedback breakdown |
| 2.8 | 2026-07-10 | Dashboard restructure: metric strip, detail region, lifted-pill tab bar, expandable table, orange choropleth scale; stat card sparklines removed |
| 2.7 | 2026-07-04 | Listing slide-over: cursor-following image hover preview (320×240) |
| 2.6 | 2026-07-04 | Admin listings: always show price in table (bracketed when hidden); slide-over price visibility badge |
| 2.5 | 2026-07-04 | Listings price shows unit suffix; users table row-only navigation with hover underline |
| 2.4 | 2026-07-04 | Listing slide-over widened to 580px; color-coded action buttons in equal-width row |
| 2.3 | 2026-07-04 | Listing slide-over actions: full icon + text buttons |
| 2.2 | 2026-07-04 | Data tables: Inter font at 12px; listing actions moved to slide-over footer |
| 2.1 | 2026-07-04 | User support actions, locations block, table typography, icon listing actions |
| 2.0 | 2026-07-03 | Sidebar diamond left-aligned with wordmark and nav content |
| 1.9 | 2026-07-03 | Sidebar logo size set to 50px |
| 1.8 | 2026-07-03 | Logo sizes increased to 40px sidebar / 64px auth |
| 1.7 | 2026-07-03 | Text links: dotted underline on hover (`rigburrito-text-link`) |
| 1.6 | 2026-07-03 | Logo rotation slowed to 10s per revolution |
| 1.5 | 2026-07-03 | Logo: larger sizes (32px sidebar, 56px auth), slower 8s rotation |
| 1.4 | 2026-07-03 | Sidebar logo: animated diamond SVG with rotating inner facets |
| 1.3 | 2026-07-03 | Sidebar logo area: added top/side padding aligned with nav inset |
| 1.2 | 2026-07-03 | Sidebar: true charcoal palette (#1C1C1C), subtle active state (no orange indicator) |
| 1.1 | 2026-07-03 | Applied design system across all command center pages and shared components |
| 1.0 | 2026-07-03 | Initial command center design system |
