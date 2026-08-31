# API Key Saver — Web App Implementation Plan

## 1. Concept

A web app to store API keys with search, tags, and categories.
Single-user to start, built so invite/multi-user support can be added
later without a rearchitecture.

## 2. Architecture overview

```
┌─────────────────────────┐
│  Frontend (Next.js)      │
│  hosted on Vercel         │
└───────────┬───────────────┘
            │ HTTPS (authenticated API calls)
            ▼
┌─────────────────────────┐
│  API routes / server      │
│  (Next.js API routes or   │
│   separate backend)       │
└───────────┬───────────────┘
            │ encrypt / decrypt at this layer
            ▼
┌─────────────────────────┐
│  Hosted DB (Postgres)     │
│  → stores only ENCRYPTED  │
│    key values             │
└─────────────────────────┘
```

Because this is a website (not a local app with an OS keychain), the
encryption key has to live *somewhere* server-side or be derived from
your login. Two realistic options:

- **Server-side encryption (simpler):** the app encrypts key values
  with a secret stored in the hosting platform's environment variables
  (e.g. Vercel env vars). Anyone with DB access sees ciphertext, but
  the app server itself can decrypt. Good enough for a personal tool;
  not "zero-knowledge."
- **User-derived encryption (stronger):** derive an encryption key
  from your login password (e.g. via PBKDF2/Argon2) client-side, so
  the server only ever stores/receives ciphertext and never sees your
  master password or the derived key. More private, more work.

Given "invite others later" and "hosted DB," **start with server-side
encryption** — it's simpler to ship and easy to invite collaborators
into. You can move to user-derived encryption later if you want
true zero-knowledge.

## 3. Data model

```
users
 ├─ id
 ├─ email
 ├─ password_hash (if not using an auth provider)
 └─ created_at

keys
 ├─ id
 ├─ user_id (owner)
 ├─ name             (e.g. "Stripe - Production")
 ├─ value_encrypted
 ├─ category         (e.g. "Payments", "AI", "Infra")
 ├─ tags[]            (e.g. ["prod", "billing"])
 ├─ notes
 ├─ created_at / updated_at
 └─ last_viewed_at (optional)
```

Add a `key_shares` table later when you add invites (maps a key or
category to another user_id with a permission level).

**Row-level security (RLS):** with Supabase, enable RLS on the `keys`
table and add a policy like:

```sql
create policy "Users can only access their own keys"
on keys for all
using (auth.uid() = user_id);
```

This means even if there's a bug in the app's API code, the database
itself refuses to return another user's keys — a strong extra layer
of protection for a secrets app. When you add `key_shares`, add a
second policy that also allows access when a matching share row exists.

## 4. Tech stack recommendation

- **Framework**: Next.js (App Router) — deploys cleanly to Vercel,
  handles both frontend and API routes in one project.
- **Auth**: NextAuth.js (or Clerk/Auth.js) — handles login, sessions,
  and makes "invite others later" straightforward (just add
  users/roles).
- **Database & Auth**: **Supabase** (Postgres + built-in auth + row-level
  security). This replaces both the DB and most of the custom auth work —
  Supabase Auth handles login/signup/sessions, and Postgres RLS policies
  enforce "users can only see their own keys" (and later, shared keys)
  directly at the database level instead of hand-rolled permission checks
  in API routes.
- **Client**: `@supabase/supabase-js` from Next.js — can query directly
  from server components/API routes, or from the client for simple reads
  once RLS is in place.
- **Encryption**: Node's built-in `crypto` module, AES-256-GCM, key
  from an environment variable (e.g. `ENCRYPTION_KEY`), unique IV per
  entry. Encrypt/decrypt happens in a Next.js API route (server-side),
  never in the browser — Supabase only ever stores/receives ciphertext.
- **Search/tags/categories**: simple SQL `WHERE` filtering is enough
  at small scale — no need for a search engine like Algolia yet.

## 5. Frontend / UI — React Bits

Use [React Bits](https://reactbits.dev) for the animated UI pieces
instead of building them from scratch. It's not an npm package —
components are pulled into your project as source files via CLI, so
there's no extra runtime dependency beyond what each component itself
needs (e.g. GSAP for some animations).

**Setup (Tailwind + TypeScript variant, matching the Next.js stack):**

```bash
npx jsrepo init https://reactbits.dev/tailwind/
```

**Adding a component:**

```bash
npx jsrepo add ts/tailwind/<CategoryName>/<ComponentName>
# or via shadcn:
npx shadcn@latest add https://reactbits.dev/r/<ComponentName>-TS-TW
```

**Components worth using for this app:**

| Where | Component category to browse | Why |
|---|---|---|
| Landing/login page | Text Animations (e.g. `SplitText`, `BlurText`) | Nice touch on the app title/tagline |
| Landing/login page | Backgrounds (e.g. `Aurora`, `Particles`) | Gives the login screen some personality |
| Key list | Animations (e.g. `AnimatedList`) | Smooth add/remove transitions when keys are created or deleted |
| Buttons/cards | Components (e.g. animated buttons, cards) | Consistent hover/press feedback across the UI |
| Copy-to-clipboard action | Click Spark / micro-interaction components | Clear visual confirmation when a key is copied |

Keep it restrained for a security-sensitive tool — use React Bits for
polish on marketing/empty-state/login screens, but keep the actual key
list and forms fast, dense, and low-animation so the app still feels
trustworthy and efficient for daily use.

## 6. Milestones

1. **MVP (single user)**
   - Set up Supabase project, enable RLS, create `keys` table.
   - Wire up Supabase Auth (email/password or magic link) for login/signup.
   - Add/view/edit/delete keys, encrypt at rest via API route.
2. **Organization**
   - Categories, tags, search/filter UI, copy-to-clipboard with
     auto-clear.
3. **Invites**
   - Invite-by-email (Supabase Auth supports this natively), `key_shares`
     table + matching RLS policy, per-key or per-category sharing
     permissions (view-only vs edit), basic audit log (who viewed/
     copied what, when).
4. **Polish**
   - Key expiry reminders, dark mode, activity log page.

## 7. Key security considerations

- Always encrypt key values at rest — never store plaintext in the DB.
- Use HTTPS everywhere (Vercel gives you this by default).
- Rate-limit and log access to key values, since this becomes a juicy
  target if it's internet-facing.
- Keep `ENCRYPTION_KEY` out of source control — set it only via
  Vercel's environment variable settings.
- When you add invites, default new shares to **view-only** and make
  key rotation easy, in case a shared key needs to be revoked.
- Consider auto-masking key values in the UI (show only last 4
  characters) until the user explicitly clicks "reveal."
