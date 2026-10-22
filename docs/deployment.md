# Keep deployment

**Current public mode:** demo, enabled temporarily with `NEXT_PUBLIC_DEMO_MODE=true`. The interface intentionally has no demo banner. Public visitors see the built-in sample workspace; its data is shared in process memory and may reset across server instances or redeployments. The existing hosted accounts, ciphertext, and production encryption key are preserved for returning to real mode. The hosted verification notes below describe the real-account deployment before this temporary switch.

Keep is live at **https://keep-umber-eta.vercel.app** on the existing `arc-reactor1/keep` Vercel project (`prj_bmLoA18ePLlEdT0BC6eKqI2xdEgU`). The promoted deployment is `dpl_CwgGdvhG29TVC4wSrhBWqaacWYTj` (`https://keep-j34egqurp-arc-reactor1.vercel.app`), built with Next.js and Node.js 24. This production build was uploaded through the Vercel CLI; project source is maintained in this repository.

## Hosted database

The existing Supabase `keep` project (`fweknktbymdyozvhbrnk`) was restored in the Arc Reactor free organization. Its completed restoration brought back **two accounts and four encrypted keys**. They were preserved throughout the upgrade. The existing Vercel `ENCRYPTION_KEY` was retained without replacement or disclosure. The Docker database and `.env.local` remain separate local development resources.

After restoration reached `ACTIVE_HEALTHY`, the four schema upgrades and the internal-trigger restriction were applied and verified. Hosted migration versions differ from the local filenames because the connected migration tool assigns timestamps:

| Hosted version   | Migration name           | Corresponding local migration                 |
| ---------------- | ------------------------ | --------------------------------------------- |
| `20261022034214` | permissions              | `202610220001_permissions.sql`                |
| `20261022034217` | reminder_expiry          | `202610220002_reminder_expiry.sql`            |
| `20261022034220` | share_profiles           | `202610220003_share_profiles.sql`             |
| `20261022034223` | audit                    | `202610220004_audit.sql`                      |
| `20261022034347` | restrict_profile_trigger | `20261022034322_restrict_profile_trigger.sql` |

The restored database already had the original schema. Do not replay the baseline, reset the database, or replace its encryption key. Reconcile migration history before using a future CLI `db push`. Local Supabase received the trigger restriction through `migration up --local`.

## Vercel environment

Set these values for the target deployment environment before building. Use a separate test database for preview environments if previews will accept account writes.

| Variable                        | Hosted value                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DEMO_MODE`         | `true` for the temporary public demo; restore `false` for real accounts                                                     |
| `NEXT_PUBLIC_SUPABASE_URL`      | The actual hosted Supabase HTTPS project URL                                                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its public/publishable API key                                                                                              |
| `NEXT_PUBLIC_AUTH_PROVIDERS`    | `google,github`; Apple is removed from the interface                                                                        |
| `ENCRYPTION_KEY`                | Existing working server encryption key; generate a new 64-hex key only if the hosted vault has no existing encrypted values |
| `APP_URL`                       | `https://keep-umber-eta.vercel.app`                                                                                         |

Keep `ENCRYPTION_KEY` server-only and stable across deployments. If intentionally migrating ciphertext later, use a controlled encryption-key and data migration; generating a replacement key does not migrate existing encrypted values. `.env.local` remains the local development environment and must not be uploaded as production configuration.

The existing daily reminder schedule additionally needs `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, and `EMAIL_FROM`. Leave reminder delivery inactive until these are configured. OAuth client secrets belong in hosted Supabase provider settings, not in Vercel's public variables.

## Verification and remaining setup

The production build was staged without assigning the live domain. Hosted checks used temporary users to verify login/logout, empty new vaults, encrypted-key save/reveal, persistence, isolation, view-only sharing, and revocation. All test users and their data were removed; the original two accounts and four keys remained. All 28 automated tests passed. The staged runtime error scan returned zero records, and the promoted public domain was checked on desktop and mobile.

Google and GitHub were already enabled in restored Supabase Auth. Their authorization endpoints were verified to redirect to the expected provider domains, and their buttons are now enabled in production. Actual provider consent and return should be checked with your own account. Apple is removed for now; restoring it requires an Apple Developer membership, Services ID, signing key, and HTTPS return URL are configured. Follow [social sign-in setup](social-sign-in.md); the hosted provider callback is `https://fweknktbymdyozvhbrnk.supabase.co/auth/v1/callback`.

Hosted Auth now has the canonical Site URL, exact callback and password-reset return URLs, and a 12-character minimum. Existing email confirmation, MFA settings, and Google/GitHub credentials were preserved. End-to-end email delivery was not tested; the deployment check confirmed temporary accounts through the Admin API without sending mail.

The final security advisor still reports the intentional service-only reminders table with no browser policy and the two authorization-checked functions used for sharing and key-access auditing. Public execution of the profile trigger was revoked. Leaked-password screening remains disabled on the existing project. References: [service-only RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [privileged function review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

To repeat hosted integration checks deliberately, set `KEEP_HOSTED_TEST=1`, `KEEP_HOSTED_TEST_URL` to the Keep HTTPS deployment, and run `tests/browser_hosted.py` with the Playwright interpreter. For a protected staging URL, first obtain a bypass cookie through authenticated `vercel curl` and provide its ignored header file through `KEEP_PROTECTION_HEADERS`. Never commit that file or credentials. Vercel deployment protection was retained throughout testing.

Documentation: [Vercel CLI deployments](https://vercel.com/docs/cli/deploying-from-cli), [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations).
