# Architecture

Keep uses the Next.js App Router. Pages fetch authorized metadata on the server; interactive components handle forms, filtering, menus, and feedback.

## Data flow

Server actions in `src/app/actions` handle vault changes, shares, and authentication. The request-scoped Supabase client carries the user's session, and PostgreSQL row-level security enforces access.

Key values are encrypted and decrypted on the server with AES-256-GCM. Lists receive metadata rather than plaintext values. The server encryption key is shared across the deployment and must remain stable.

## Access control

- Owners control a key's contents, deletion, and shares.
- Editors can change shared content but cannot transfer ownership or delete the key.
- Viewers can read permitted keys.
- Invitees must already have an account; owners look them up by exact email.

Profiles mirror Auth identities. Browser clients cannot enumerate the profile directory, edit profile email, or write arbitrary audit events. Triggers record mutations, and an authorization-checked function records key access. Audit records retain key names after deletion.

## Service boundaries

`src/utils/supabase` separates browser, request-scoped server, and privileged service clients. Service-role credentials are used only for server-side reminder delivery.

`/api/cron` requires its own bearer token. It sends reminders for upcoming expirations and tracks delivery by key, recipient, and expiry timestamp. Provider failures remain retryable.

`src/utils/demo` provides sample auth and an in-memory store when `NEXT_PUBLIC_DEMO_MODE=true`. Configuration errors in real mode fail explicitly.

## Interface

The application uses neutral dark surfaces, with color for statuses and provider identities. Tokens and layout rules live in `src/app/globals.css`. Hugeicons are imported through `src/components/ui/Glyph.tsx`.

The locally adapted React Bits components retain their [attribution and licenses](../src/components/react-bits/README.md). Motion respects reduced-motion preferences, background effects suspend when hidden or offscreen, and key values are never passed through decorative text effects.

## Database changes

`supabase/migrations` contains the schema history; `supabase/schema.sql` is the current setup snapshot. Apply upgrades before deploying application code that relies on them. Existing hosted migration identifiers require reconciliation before using CLI migration pushes; see [deployment](deployment.md).
