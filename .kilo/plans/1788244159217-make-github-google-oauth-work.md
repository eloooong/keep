# Make GitHub & Google OAuth Sign-In Work on /login

## Goal
Get the GitHub and Google OAuth buttons on `/login` to complete a real sign-in,
so a user is authenticated and lands on the dashboard.

## Context / Truth
- App-side OAuth wiring is already correct:
  - `src/app/login/page.tsx` calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: "<origin>/auth/callback" } })`.
  - `src/app/auth/callback/route.ts` exchanges the `code` for a session via `exchangeCodeForSession`, then redirects to `/` (or `?next=`).
  - `src/proxy.ts` already exempts `/auth` from the unauthenticated redirect, so the callback isn't bounced.
- Supabase project ref (from `.env.local`): `fweknktbymdyozvhbrnk`
  - Supabase auth callback URL: `https://fweknktbymdyozvhbrnk.supabase.co/auth/v1/callback`
- **External blocker (user has dashboard access and will do this):** GitLab/Google providers must be enabled in the Supabase dashboard with Client ID + Secret, and each provider's OAuth app must whitelist the Supabase callback URL. No repo env var is required — provider credentials live server-side in Supabase, not in the app.
- Current gap in code: when OAuth fails, `/auth/callback` redirects to `/login?error=auth_failed`, but the login page never reads that query param, so the user sees a silent failure.

## Decision (confirmed with user)
- User has Supabase dashboard access and will configure the provider Client IDs/Secrets and whitelist the redirect URIs themselves.
- Implementation agent's job: apply code polish to surface OAuth errors and verify the complete flow; include a precise external-config checklist for the user.

## Ordered Tasks

### 1. Surface OAuth failure errors on `/login`
- In `src/app/login/page.tsx`, read the `error` search param via `useSearchParams()` and, when present, render a message in the existing `oauthError` area (e.g. "GitHub sign-in failed. Please try again.").
- Because `/login` is statically prerendered, `useSearchParams()` must be used inside a `<Suspense>` boundary:
  - Extract the inner card/component that calls `useSearchParams()` into a separate client component (or wrap the existing usage) so the page still prerenders. Alternatively mark the page `dynamic` — prefer the `<Suspense>` wrapper to keep `/login` static.
  - Read the param via `searchParams.get("error")`; map `auth_failed` (and generic codes) to a friendly message.
- Keep the existing defensive try/catch in `handleOAuth` (already present).

### 2. Harden the callback (optional, low risk)
- `src/app/auth/callback/route.ts` already works. Optionally pass the actual error through instead of only `auth_failed` (e.g. `?error=<code>`), but keep a generic fallback. Do not change the success path (`redirect` to `next ?? "/"`).

### 3. Verify proxy does not block the flow
- Confirm `src/proxy.ts` unchanged logic: `/auth` path is excluded from the login redirect. No change expected; just verify.

### 4. External config checklist (add to this plan / README note; user executes)
- Supabase dashboard → Authentication → Sign In / Providers:
  - Enable **GitHub**: paste a GitHub OAuth App's Client ID + Client Secret.
  - Enable **Google**: paste a Google OAuth Client ID + Client Secret.
  - Provider defaults apply; ensure "Redirect URLs" include `https://fweknktbymdyozvhbrnk.supabase.co/auth/v1/callback`.
  - Set the dashboard "Site URL" to `http://localhost:3000` for local dev (add it in "Redirect URLs" too if needed).
- GitHub OAuth app settings: Authorization callback URL = `https://fweknktbymdyozvhbrnk.supabase.co/auth/v1/callback`.
- Google Cloud Console OAuth client: Authorized redirect URI = `https://fweknktbymdyozvhbrnk.supabase.co/auth/v1/callback` (and the login page origin if using proxy flows).
- Note: email-confirmation triggers (`on_auth_user_created` in `supabase/schema.sql`) auto-create the `profiles` row for OAuth users too, since the trigger fires on new `auth.users` insert. No schema change required.

### 5. Validate
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` → passes; `/login` remains statically prerendered (verify it is still `○ /login`).
- Manual `npm run dev` OAuth spot-checks (requires provider config from step 4):
  - Click GitHub → redirected to GitHub auth → returns to dashboard, `user.email` visible in header.
  - Click Google → same flow works.
  - Simulate failure (e.g. cancel at provider / misconfigure) → login page shows the error message from step 1 instead of silently bouncing.

## Out of Scope
- Adding OAuth buttons to `/signup` (not requested).
- Implementing password reset page (`/auth/reset-password` referenced in the forgot-password flow) — OAuth does not depend on it.
- Any changes to `src/utils/supabase/*`, `src/proxy.ts` beyond verification (none currently needed).

## Risks / Notes
- **Provider availability is gated on external config** — the code will not log the user in via OAuth until the Supabase dashboard + provider OAuth apps are correctly configured. The error-surfacing change makes this failure visible.
- `useSearchParams` in a statically-prerendered client page **must** be wrapped in `<Suspense>` (Next.js requirement); otherwise build fails with a "missing suspense boundary" error.
- The `/login` split-landing layout must be preserved while restructuring for the Suspense boundary.
