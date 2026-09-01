# Improve /login (Split Landing + Login) & Rebrand Project to "Keep"

## Goal
1. Turn the plain centered auth card on `/login` into a branded split "landing + login" page: a "Keep" hero column (wordmark, tagline, 3 value props) on the left with the login form card on the right, stacking on mobile.
2. Rebrand the whole app from "API Key Saver" to **Keep** across all user-facing surfaces.

## Design Decisions (confirmed with user)
- **Login page role:** Split landing + login on one page (no separate marketing `/?` page).
- **Rename scope:** All app surfaces — metadata, dashboard header, activity header, cron email footer — plus a "Keep" wordmark/tagline on the new login hero.
- **Login form additions (all selected):** tagline + 3 value props, forgot-password link, stay-signed-in checkbox, social/OAuth sign-in, brand wordmark at top of card.

## Current State
- `/login` (`src/app/login/page.tsx`) and `/signup` (`src/app/signup/page.tsx`) are identical structured centered cards over `<GradientWaves className="" />` (now monochrome zinc/black from prior work).
- Branding "API Key Saver" appears in:
  - `src/app/layout.tsx:17-18` (metadata `title`, `description`)
  - `src/app/page.tsx:44` (dashboard header)
  - `src/app/activity/page.tsx:27` (activity header)
  - `src/app/api/cron/route.ts:91` (reminder email footer)
- Only email/password auth exists (`signInWithPassword`). No password reset or OAuth code yet. `.env.local` has only SUPABASE URL + anon key (no OAuth provider env).
- Available react-bits: `SplitText`, `GradientWaves`, `ShinyText`, `SpotlightCard`, `GradientText`, `Magnet`, `CountUp`, `ClickSpark`, `Aurora`, `AnimatedList`, `AnimatedContent`.

## Implementation Plan

### 1. Rebrand "API Key Saver" -> "Keep" (all surfaces)
- `src/app/layout.tsx`: `title: "Keep"`, `description` -> e.g. "Securely store, share, and expiring-manage your API keys." (align wording; keep zinc/simple tone).
- `src/app/page.tsx:44`: header wordmark text -> "Keep".
- `src/app/activity/page.tsx:27`: header wordmark text -> "Keep".
- `src/app/api/cron/route.ts:91`: email footer text -> "This is an automated reminder from Keep."

### 2. Rewrite `/login` page into split landing + login
Rewrite `src/app/login/page.tsx` (`"use client"` kept). Structure:
- Outer `<main>`: full-height flex with `<GradientWaves className="" />` as absolute background, `relative z-10` content grid.
- **Desktop:** `grid grid-cols-2` (or `lg:grid-cols-2`). Left hero column, right form column.
- **Left hero column ("Keep"):**
  - "Keep" wordmark (bold, `text-zinc-900 dark:text-zinc-50`, large; can wrap in `GradientText`/`SplitText` if using react-bits).
  - One-line tagline (e.g. "Keep your API keys safe, shared, and expired on time.").
  - 3 short value props with lucide icons (e.g. `Lock` = encrypted storage, `Share2` = secure sharing, `Clock` = expiry reminders) — uses existing `lucide-react` dependency.
- **Right login card:** reuse existing form fields/styling, plus:
  - "Keep" wordmark at top of the card (for stacked/mobile view).
  - Stay-signed-in checkbox toggling a `remember` state passed to `supabase.auth.signInWithPassword({ email, password, options: { ... } })`.
  - **Forgot-password link:** triggers `supabase.auth.resetPasswordForEmail(email)` (guard empty email), show inline confirmation message.
  - **Social/OAuth sign-in:** `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: ... } })` buttons. NOTE: requires the provider (Google/GitHub) to be enabled in the Supabase dashboard; env has no provider keys. Implement defensively and note this external dependency — buttons should not break if provider is unconfigured (catch errors / show message).
  - Keep existing error/handling, loading states, and the "Don't have an account? Sign up" `Link`.
- `onSubmit` also calls `router.refresh()` and `router.push("/")` as current.

### 3. Keep `/signup` page as-is (optionally light-touch)
- No required changes. If desired for consistency, the same "Keep" wordmark could be added at top of the signup card, but it's out of scope unless requested. Leave unchanged by default.

### 4. Validation
- `npm run lint` -> 0 errors / 0 warnings.
- `npm run build` -> passes, `/login` and `/signup` still prerender (static).
- Manual `npm run dev` spot-check: `/login` shows two-column layout on desktop, stacked on mobile; "Keep" branding present; form still logs in; dark/light themes intact with the monochrome gradient.

## Out of Scope
- Any separate marketing/landing page at `/`.
- Changes to dashboard/keys UI beyond the header wordmark text.
- Configuring OAuth providers in the Supabase dashboard (external requirement; flagged as a dependency).

## Risks / Notes for Implementer
- **OAuth dependency:** `signInWithOAuth` only works if a provider is enabled in Supabase. Wrap in try/catch, render buttons gracefully, and don't block the rest of the page if unconfigured.
- `GradientWaves` default colors are monochrome (from earlier task); no color prop overrides needed for the new hero.
- Match existing Tailwind/zinc conventions (rounded-2xl cards, `border-black/[.08]` / `dark:border-white/[.1]`, `bg-white dark:bg-zinc-900`).
- `router.refresh()` + `router.push("/")` after successful login must be preserved to match current auth behaviour.
