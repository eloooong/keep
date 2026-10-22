# Development

Use Node.js 24 and the committed npm lockfile. Start from `.env.example`; keep credentials in `.env.local`.

## Sample workspace

Set `NEXT_PUBLIC_DEMO_MODE=true`, then run `npm run dev`. The sample workspace uses a process-local store, accepts sample sign-in details, and sends no email. Its records are shared between visitors on the same server instance and may reset on restart.

## Persistent local accounts

Docker is required for the local Supabase stack.

1. Set `NEXT_PUBLIC_DEMO_MODE=false`.
2. Start Docker and run `npm run backend:start`.
3. Run `npx supabase status` and copy the API URL and public key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Generate `ENCRYPTION_KEY` once, then run `npm run dev -- --hostname 127.0.0.1`.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The encryption key must be 64 hexadecimal characters. Retain it and a secure backup: changing it makes existing ciphertext unreadable.

Open `http://127.0.0.1:3000/signup`. New accounts start with an empty vault. The database persists in the `supabase_db_keep` Docker volume.

| Service     | Local address            |
| ----------- | ------------------------ |
| API         | `http://127.0.0.1:55321` |
| PostgreSQL  | `127.0.0.1:55322`        |
| Studio      | `http://127.0.0.1:55323` |
| Email inbox | `http://127.0.0.1:55324` |

The startup helper binds only Keep's services to loopback and preserves the database volume. Stop them with `npm run backend:stop`. Database resets and deleting the volume erase local data.

On a fresh checkout, startup applies the migrations. Local signup does not require email confirmation; password-reset messages appear in the local inbox. Hosted authentication has separate provider, redirect, and email settings.

## Commands

| Command                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start the development server                          |
| `npm run check`        | Lint, generate route types, type check, and run tests |
| `npm run build`        | Build for production                                  |
| `npm run format`       | Format source, JavaScript tests, and documentation    |
| `npm run format:check` | Check formatting without changing files               |

Type checking runs `next typegen` first so it works on a fresh checkout without an existing build.

## Automated tests

`npm test` uses Node's test runner and PGlite, an embedded PostgreSQL engine. It covers RLS, grants, triggers, ownership constraints, audit retention, rate limits, encryption, and reminder failures. It does not require a running database.

For browser checks, install Python Playwright and Chromium in a virtual environment:

```sh
python -m venv .venv
# Activate .venv using your shell's activation script.
python -m pip install playwright
python -m playwright install chromium
```

Run the application in demo mode and set `KEEP_TEST_DEMO_MODE=true` in the test process before running:

```sh
python tests/browser_smoke.py
python tests/browser_effects.py
```

Use `KEEP_TEST_URL` to override the default local address. The smoke suite covers key operations, sharing, search, keyboard focus, mobile layout, reduced motion, account recovery, and cron authorization. The effects suite checks rendering and motion fallbacks. Screenshots go to the OS temporary directory.

`tests/browser_auth.py` requires a local real-mode instance. It creates temporary accounts, checks persistence and isolation, and removes only those accounts. Hosted verification requires a separate explicit opt-in; see [deployment](deployment.md).

OAuth consent and email delivery require configured services and separate integration checks.
