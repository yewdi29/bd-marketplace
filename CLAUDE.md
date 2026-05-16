# Black Diamond Marketplace — Claude Code Instructions

> Read this file at the start of every session. These rules are non-negotiable.

---

## Project Overview

Black Diamond Marketplace is a Next.js 14 / TypeScript / Supabase heavy equipment marketplace for the oil and gas industry. It competes with EquipmentShare and TradeQuip — connecting buyers and sellers of drill pipe, rigs, BOP, and completion equipment.

**Stack:**
- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS
- Database: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Hosting: Vercel (production) / localhost:3000 (development)
- Payments: Stripe (Phase 2)
- AI Agents: Anthropic Claude via Paperclip AI (Phase 4)

---

## Critical Working Rules
- Never create git worktrees under any circumstances
- Never create new branches without explicit user instruction
- Always work directly on the main branch
- All changes go directly to the actual project files
- Never create nested folders or duplicate file structures
- Push to GitHub only when explicitly instructed by the user

---

## Before Touching Any UI

1. **Read `DESIGN_SYSTEM.md` first** — every color, font, spacing, and component decision is documented there. Do not deviate from it.
2. **Never invent design decisions** — if something isn't in `DESIGN_SYSTEM.md`, ask before proceeding.
3. **Never use dark mode** on any public-facing page.
4. **Never apply frosted glass** outside of the navbar or AI input components.

---

## Architecture Rules

### Database
- **Never call Supabase directly from the browser** for mutations
- All writes go through `/src/app/api/*` routes using the service role key server-side
- The browser client uses the anon key for reads only
- RLS is enabled on all tables — do not disable it

### Auth
- Email and password only — no Google OAuth, no social login
- Auth is handled via Supabase Auth
- Protected routes: `/dashboard/*` and `/admin/*`
- Middleware at `src/middleware.ts` handles route protection

### API Routes
- All API routes live in `src/app/api/`
- Always validate input before hitting the database
- Always return consistent `{ success: true }` or `{ error: 'message' }` responses
- Use service role client for admin operations, anon client for public reads

### Admin Routes
- `/admin/*` is strictly for internal use
- Admin role is enforced in middleware via `users.role = 'admin'` check
- Traffic light tier system (green/yellow/red) is visible **only** in admin routes
- Never expose tier information on public-facing pages

---

## Traffic Light System — Admin Only

⛔ This is internal only. Never show on public pages.

- Green (< $100K): self-service
- Yellow ($100K–$500K): assisted
- Red (> $500K): white glove brokerage

Tier is set automatically by a Supabase trigger on `listings.price`.

---

## File Structure

```
src/
├── app/
│   ├── api/              # Server-side API routes only
│   ├── (public)/         # Public pages
│   ├── (auth)/           # Login, signup
│   ├── (dashboard)/      # Seller/buyer authenticated pages
│   └── (admin)/          # Admin command center — role protected
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── listings/         # Listing cards, filters, detail
│   ├── home/             # Homepage sections
│   └── ui/               # Shared primitives
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser client (anon key)
│       └── server.ts     # Server + service role client
├── middleware.ts          # Auth + admin route protection
└── types/
    └── database.ts       # TypeScript types matching schema
supabase/
└── schema.sql            # Full DB schema — source of truth
```

---

## Phase Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| 1 | ✅ Complete | Foundation, schema, auth, public site, listings browse |
| 2 | 🔨 Next | Seller dashboard, listing submission, Stripe membership |
| 3 | Planned | Admin command center, traffic light dashboard |
| 4 | Planned | AI agents — listing verification, routing, marketing |
| 5 | Planned | Brokerage layer, BD Verified, logistics |

---

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary and commented
- Use `async/await` not `.then()` chains
- Always handle errors with try/catch in API routes
- Component files: PascalCase (`ListingCard.tsx`)
- Utility files: camelCase (`formatPrice.ts`)
- Always add loading and error states to data-fetching components
- Never hardcode colors — always use CSS variables from the design system

---

## Git Commit Convention

```
feat: add listing submission form
fix: resolve newsletter checkbox not saving
design: update listing card to match DESIGN_SYSTEM v1.0
refactor: extract price formatting to utility function
docs: update DESIGN_SYSTEM changelog
```

---

## When Making Design Changes

1. Read `DESIGN_SYSTEM.md` first
2. Make the change
3. Update the changelog section in `DESIGN_SYSTEM.md` with version, date, and what changed
4. Commit both the code change and the design system update together

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   — Public anon key (browser safe)
SUPABASE_SERVICE_ROLE_KEY       — Service role key (server only, never expose)
NEXT_PUBLIC_APP_URL             — App URL (http://localhost:3000 in dev)
```

Never commit `.env.local`. Never log environment variables. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.