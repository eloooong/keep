# Deployment

The hosted application is [keep-umber-eta.vercel.app](https://keep-umber-eta.vercel.app). It currently runs in demo mode. Production accounts and encrypted data remain in the hosted Supabase project for returning to real mode.

## Environment

Set environment variables before building. Public variables are compiled into the client bundle, so changes require a rebuild.

| Variable                        | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_DEMO_MODE`         | `true` for the sample workspace; `false` for real accounts |
| `NEXT_PUBLIC_SUPABASE_URL`      | Hosted Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public project key                                         |
| `NEXT_PUBLIC_AUTH_PROVIDERS`    | Enabled provider IDs, such as `google,github`              |
| `ENCRYPTION_KEY`                | Stable server-only key: 64 hexadecimal characters          |
| `APP_URL`                       | Canonical HTTPS application origin                         |

Retain the existing encryption key when deploying over an existing vault. A replacement key does not migrate ciphertext. Keep `.env.local` out of deployment uploads; configure hosted secrets through the platform's environment settings.

## Database setup

For a new hosted project, apply `supabase/schema.sql` through the SQL editor. A fresh local stack uses the migration files automatically.

To upgrade a database with the original schema, back it up and apply these files in order before deploying the application:

1. `202610220001_permissions.sql`
2. `202610220002_reminder_expiry.sql`
3. `202610220003_share_profiles.sql`
4. `202610220004_audit.sql`
5. `20261022034322_restrict_profile_trigger.sql`

Files are in `supabase/migrations`. The ownership constraint rejects shares with incorrect or missing owners; correct those records before retrying. New audit events retain key names after deletion; previously deleted names cannot be recovered. Existing reminder records are associated with the key's expiry at migration time.

If an older installation used a fallback encryption key for real credentials, plan controlled re-encryption and rotate the affected provider credentials before returning it to service.

### Existing hosted migration history

The hosted project originally used a manually applied baseline. Later upgrades were recorded by the connected migration tool under different timestamps:

| Hosted version   | Local migration                               |
| ---------------- | --------------------------------------------- |
| `20261022034214` | `202610220001_permissions.sql`                |
| `20261022034217` | `202610220002_reminder_expiry.sql`            |
| `20261022034220` | `202610220003_share_profiles.sql`             |
| `20261022034223` | `202610220004_audit.sql`                      |
| `20261022034347` | `20261022034322_restrict_profile_trigger.sql` |

Reconcile this history before a future CLI `db push`. Do not replay the baseline or reset the existing database.

## Authentication

Set Supabase Auth's Site URL to the canonical application origin. Allow these redirect paths for every supported origin:

- `/auth/callback`
- `/auth/callback?next=/auth/reset-password`

Configure email delivery and a minimum password length of 12 characters. Password recovery exchanges a PKCE code before opening the reset form. Keep uses the `keep-auth` cookie name to avoid collisions with other local Supabase applications.

Google and GitHub are configured on the existing hosted project. OAuth credentials belong in Supabase provider settings; `NEXT_PUBLIC_AUTH_PROVIDERS` only controls which configured providers the application enables. Actual consent and return still require an account-level check. Apple is currently absent from the interface.

See [social sign-in](social-sign-in.md) for provider registration and callbacks.

## Expiry reminders

Set all of these server-only values to enable delivery:

| Variable                    | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Supabase credential             |
| `CRON_SECRET`               | Random bearer token protecting `/api/cron` |
| `RESEND_API_KEY`            | Email provider credential                  |
| `EMAIL_FROM`                | Sender on a verified Resend domain         |

`vercel.json` schedules reminders daily at 08:00 UTC. Keys expiring within seven days are eligible. Delivery is tracked per key, recipient, and expiry timestamp; renewing an expiry makes it eligible again. Provider failures remain retryable and partial failures return HTTP 502. Stable idempotency keys reduce duplicate sends within the provider's idempotency window.

Emails display expiry timestamps in UTC. Use consistent server timezone settings when entering date-only expirations.

## Release checks

Run `npm run check` and a production build before deployment. Use a separate database for previews that accept writes.

Verify signup, login/logout, an empty new vault, encrypted-key persistence, account isolation, and sharing/revocation in real mode. Check OAuth consent and email delivery separately. Demo browser tests do not verify these integrations.

`tests/browser_hosted.py` creates and removes temporary users. It requires `KEEP_HOSTED_TEST=1` and `KEEP_HOSTED_TEST_URL` pointing to a Keep HTTPS deployment in real mode. It reads credentials from an authenticated Supabase CLI without printing them. For protected previews, `KEEP_PROTECTION_HEADERS` can point to an ignored Vercel bypass-header file.

The existing hosted project has leaked-password screening disabled. Its service-only reminders table intentionally has no browser policy. Privileged functions used for sharing and access auditing enforce their own authorization; review those boundaries when changing them.

References: [Vercel deployments](https://vercel.com/docs/cli/deploying-from-cli), [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations).
