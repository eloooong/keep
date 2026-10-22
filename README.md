# Keep

A personal API-key vault built with Next.js 16, React 19, Supabase Auth/Postgres, and Resend. Store encrypted key values, organize them with tags and categories, share view/edit access, track activity, and receive expiry reminders.

## Local setup

Use Node.js 24 and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
```

For a disposable demo, set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`, then run `npm run dev`. The interface omits a demo banner; check the explicit environment flag to identify this mode. All demo data lives in process memory, is shared between demo visitors, and may reset on restart or deployment. Use sample credentials and keys only. Demo mode does not authenticate users or send email.

For a real vault, keep `NEXT_PUBLIC_DEMO_MODE=false` and configure:

| Variable                        | Purpose                                              |
| ------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/publishable project key; RLS enforces access |
| `ENCRYPTION_KEY`                | Exactly 64 hexadecimal characters (32 random bytes)  |

Generate the encryption key once:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep it in your deployment's secret store and retain a secure backup. Changing or losing it makes existing encrypted values unreadable. Missing configuration causes startup to fail; it never activates demo mode. Encryption happens on the server using AES-256-GCM, so this is encryption at rest, not end-to-end encryption.

### Real accounts on this computer

The configured development instance uses local Supabase in Docker Desktop. Start Docker Desktop, then run:

```powershell
npm run backend:start
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000/signup` to create your own account. New accounts have an empty vault. Accounts and encrypted keys persist in the `supabase_db_keep` Docker volume; they are local to this computer, with no hosted Supabase project connected. Keep `.env.local` and its encryption key backed up securely. Do not overwrite the existing file when restarting.

Keep's API runs on port 55321, database on 55322, Studio on 55323, and local email inbox on 55324. The startup helper explicitly binds Keep's published services to `127.0.0.1` because Docker Desktop can ignore the bridge network's default binding. It operates only on Keep's containers and retains the database volume. Use `npm run backend:stop` to stop this stack while preserving data; avoid `supabase stop --no-backup`, `supabase db reset`, or deleting its volume unless intentionally erasing the local vault.

For a fresh checkout, `backend:start` applies the baseline and subsequent migrations automatically. Configure `.env.local` from the local CLI's `supabase status` output and generate `ENCRYPTION_KEY` once. Local email confirmation is disabled so signup opens the vault immediately. Password-reset messages are captured at `http://127.0.0.1:55324`, not sent to external email. Hosted deployment still needs a hosted project, configured email delivery, and confirmation settings.

## Database setup and upgrades

For a new Supabase project, run `supabase/schema.sql` in its SQL editor. For a project using the previous schema, apply these migration files in order:

1. `supabase/migrations/202610220001_permissions.sql`
2. `supabase/migrations/202610220002_reminder_expiry.sql`
3. `supabase/migrations/202610220003_share_profiles.sql`
4. `supabase/migrations/202610220004_audit.sql`
5. `supabase/migrations/20261022034322_restrict_profile_trigger.sql`

Back up the database before upgrading. Migrations run transactionally. The ownership constraint intentionally fails if an existing share has a false or missing `owner_id`; inspect and correct those records before retrying. Old delivery records are associated with the key's expiry at migration time. Earlier deleted-key names cannot be recovered; new events preserve their name and owner after deletion.

The database binds every share to its real key owner. Editors can change content but cannot transfer ownership or delete keys. Profiles mirror Auth identities; browser clients cannot edit profile email or enumerate the directory. Owners can look up an exact invitee email, and invites require an existing account. Delivery records are service-only. Audit entries are written by database triggers and a permission-checked access function, never by arbitrary browser inserts.

Deploy the migrations before the new application version: the app expects the new functions and audit columns. If the old application ever stored real keys using its fallback encryption key, plan a controlled re-encryption and rotate those provider credentials before returning the vault to use.

## Authentication

In Supabase Auth, set the Site URL to your app's canonical origin and allow these redirect URLs for each environment:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/callback?next=/auth/reset-password`
- The equivalent HTTPS URLs for your deployment.

Enable email/password authentication and configure its email delivery. Google and GitHub buttons appear on login and signup. Apple sign-in is currently removed. They remain disabled until the corresponding Supabase providers are configured and `NEXT_PUBLIC_AUTH_PROVIDERS` includes their IDs (`google,github`). See [the social sign-in setup guide](docs/social-sign-in.md) for provider registration, credentials, exact callbacks, and Apple’s HTTPS requirements. Rebuild or restart after changing public environment variables. Password reset exchanges a PKCE code at the callback and then opens `/auth/reset-password` for an authenticated user. Signup and reset forms require at least 12 characters; configure the same minimum in Supabase Auth. Keep uses its own `keep-auth` cookie name so other local Supabase apps do not overwrite its session.

## Expiry reminders

Set these server-only deployment values in addition to the vault configuration:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role credential; never expose it to the browser.
- `CRON_SECRET`: a strong random bearer token for `/api/cron`.
- `RESEND_API_KEY`: the email provider credential.
- `EMAIL_FROM`: a sender on a verified Resend domain.
- `APP_URL`: your canonical HTTPS origin, used in reminder links.

`vercel.json` schedules `/api/cron` daily at 08:00 UTC (16:00 Manila). The endpoint authenticates its bearer token independently of browser sessions. It sends for keys expiring in the next seven days and tracks delivery per key, recipient, and expiry timestamp. A renewed expiry is eligible again. Provider errors remain retryable; partial failure returns HTTP 502. Stable Resend idempotency keys reduce duplicates when runs overlap or a database write must be retried (the provider's idempotency window is finite).

Expiry dates are stored as timestamps. The reminder email displays UTC explicitly. Keep server and deployment timezone settings consistent when entering date-only expirations.

## Checks

```sh
npm run check
npm run build
```

`npm test` uses Node's test runner and PGlite (an embedded PostgreSQL engine). It exercises real RLS, grants, triggers, ownership constraints, audit retention, rate limits, encryption, and reminder failures. No external database is needed. `npm run typecheck` and `npm run lint` run independently. `npm run format` formats application code and tests. GitHub Actions runs these checks and a demo-mode build on pushes and pull requests.

For browser smoke checks, install Python Playwright with Chromium in a virtual environment and set `KEEP_TEST_DEMO_MODE=true` and run `python tests/browser_smoke.py` against a running explicit demo at `http://localhost:3000` (override with `KEEP_TEST_URL`). This checks create/edit/delete, sharing, search, keyboard focus, the neutral dark theme, reduced-motion counters, account-recovery form, mobile overflow, and the cron authorization boundary. Screenshots are written to the OS temporary directory. Live Supabase login, OAuth, and real email delivery require separate integration verification with configured services.

Run `python tests/browser_auth.py` against the configured real local instance to verify signup, empty new vaults, key reveal/copy/edit, logout, rejected passwords, persistent saved keys, and account isolation. It refuses hosted targets and removes only the temporary users it creates. On this Windows installation, use `C:/Users/angel/.codex/tools/webapp-testing/Scripts/python.exe` for Playwright.

## Interface

Keep uses a neutral dark theme throughout, with white actions and gray surfaces. Color is reserved for statuses and provider identities. Theme tokens live in `src/app/globals.css`; the root layout renders dark mode directly, regardless of system settings or older saved theme preferences.

Interface icons use the installed Hugeicons Stroke Rounded family through `src/components/ui/Glyph.tsx`, with consistent weight and direct imports of individual assets. Key badges use known service marks when the key name identifies GitHub, OpenAI, or Stripe, and category symbols otherwise. Activity events have action-specific icons; adjacent text and accessible control labels carry their meaning. Google's sign-in mark retains its existing brand colors.

React Bits components are incorporated individually as source: Threads, Decrypted Text, Spotlight Card, and Star Border compose the account-access panel, with automatic reduced-motion handling and static fallbacks. Vault totals use CountUp; lists and panels use short Motion-based adaptations of Animated List and Animated Content. Selection indicators slide between views. Animation respects reduced motion, suspends background rendering offscreen or in hidden tabs, and keeps screen-reader text stable. Attribution, local adaptations, and upstream licenses are documented in `src/components/react-bits/README.md`.

The main dashboard combines these effects in a compact vault header with live totals. Key rows have pointer lighting, Add key uses a Glare Hover sweep, and copy/reveal and inline panels provide short state feedback. The original keyboard paths, native buttons, and permission checks remain in place.

Set `KEEP_TEST_DEMO_MODE=true` and run `python tests/browser_effects.py` against the demo to check shader rendering, live reduced-motion changes, responsive account pages, navigation cleanup, and WebGL/JavaScript fallbacks. This requires Python Playwright and Chromium, and uses the same `KEEP_TEST_URL` override as the main browser smoke script.

## Deployment

See [the deployment notes](docs/deployment.md) for the existing Vercel project, hosted database preparation, environment values, and the sequence for enabling social sign-in after publication.

Configure the environment variables, apply migrations, configure Auth redirects, then deploy with `npm run build` and `npm start` (or Vercel). Build-time public variables must match the deployed environment. Set demo mode explicitly to false for a real vault. Do not put real secrets in a demo deployment.

The optional product film is at `/showcase/`. Media-generation intermediates are ignored by Git and ESLint; committed showcase scripts remain linted as CommonJS.
