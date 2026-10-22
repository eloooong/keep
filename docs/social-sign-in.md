# Google, GitHub, and Apple sign-in

Keep's login and signup pages share one Supabase OAuth flow and the existing PKCE callback at `/auth/callback`. Social signup creates a real Supabase user and an empty vault through the existing database profile trigger. Production now reuses the Google and GitHub providers already configured in the restored Supabase project. Their buttons are enabled at https://keep-umber-eta.vercel.app; Apple is currently removed from the interface and provider registry. Local buttons remain disabled until their separate local providers are configured and listed in `NEXT_PUBLIC_AUTH_PROVIDERS`.

## Two different callbacks

| Where configured                                  | Local Keep value                          | Hosted value                                         |
| ------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Google/GitHub OAuth app: provider callback        | `http://127.0.0.1:55321/auth/v1/callback` | `https://<project-ref>.supabase.co/auth/v1/callback` |
| Supabase Auth redirect allow-list: return to Keep | `http://127.0.0.1:3000/auth/callback`     | `https://<your-keep-domain>/auth/callback`           |

The provider returns to **Supabase**, which then returns to **Keep**. Do not put the Next.js callback in the provider's callback field. The local development ports are specific to this project. Copy the actual callback displayed by Supabase when using a hosted project or custom auth domain.

## Google

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview), create/select a project, and configure Keep's branding, audience, and consent screen. Add test users if the app is in testing.
2. Create an OAuth client with application type **Web application**. Add `http://127.0.0.1:3000` as an authorized JavaScript origin and `http://127.0.0.1:55321/auth/v1/callback` as an authorized redirect URI.
3. Add the client ID and client secret to the existing `.env.local` as `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`.
4. Set `enabled = true` in `[auth.external.google]` in `supabase/config.toml`. Leave nonce verification enabled.

[Official Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

## GitHub

1. Open [GitHub OAuth Apps](https://github.com/settings/developers) and select **New OAuth App**.
2. Set the application name to Keep, homepage to `http://127.0.0.1:3000`, and authorization callback to `http://127.0.0.1:55321/auth/v1/callback`. Leave Device Flow disabled.
3. Generate a client secret. Add the client ID and secret to `.env.local` as `SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET`.
4. Set `enabled = true` in `[auth.external.github]`. Use separate OAuth apps for local and production callbacks.

[Official Supabase GitHub setup](https://supabase.com/docs/guides/auth/social-login/auth-github)

## Apple (future setup)

Restore Apple to the application’s provider registry before enabling it in the future. Apple web sign-in requires an Apple Developer account with the relevant Sign in with Apple capabilities and a registered HTTPS domain/return URL. The current loopback HTTP Supabase backend cannot serve as Apple's web callback. A hosted Supabase project is the straightforward next step for Apple. Provisioning that project and migrating this local vault are separate work; do not replace the existing local configuration or database volume casually.

1. In [Apple Developer](https://developer.apple.com/account/resources/identifiers/list), create/configure an App ID with **Sign in with Apple**, then a **Services ID** associated with that primary App ID. The Services ID is the web OAuth client ID.
2. Configure the Services ID's website domain as `<project-ref>.supabase.co` and return URL as `https://<project-ref>.supabase.co/auth/v1/callback` (or the actual hosted auth domain).
3. Create a Sign in with Apple signing key; retain its `.p8` file, Key ID, and Team ID securely. Generate the Apple client-secret JWT using the tool in the official Supabase guide. Its lifetime is at most six months; rotate it before expiry. Never commit the `.p8` file or generated secret.
4. In hosted Supabase **Authentication → Sign In / Providers → Apple**, enter the Services ID first in Client IDs and the generated JWT in Secret Key, then enable the provider. The raw `.p8` file is not the client secret.
5. Configure Keep's canonical URL and callback allow-list in hosted Supabase. If using a deliberately configured HTTPS local-auth setup instead, the prepared `[auth.external.apple]` block reads `SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` from `.env.local`; the redirect URI must match the registered HTTPS callback.
6. If sending mail to Apple's private relay addresses, register your email sources in Apple Developer and configure actual email delivery. Keep uses the email returned by Supabase, including private relay addresses, as the profile email.

[Official Supabase Apple setup](https://supabase.com/docs/guides/auth/social-login/auth-apple) · [Apple web setup](https://developer.apple.com/documentation/signinwithapple/configuring-your-webpage-for-sign-in-with-apple)

## Activate and verify

For local Google/GitHub, add only completed providers to `.env.local`, for example:

```dotenv
NEXT_PUBLIC_AUTH_PROVIDERS=google,github
```

Restart only Keep's backend to apply its Auth configuration, then restart Next.js to load the public provider list:

```powershell
npm run backend:stop
npm run backend:start
npm run dev -- --hostname 127.0.0.1
```

The startup helper reads `.env.local` into the CLI's environment and binds Keep's services to loopback. Existing process environment variables take precedence. Do not delete volumes or reset the database to enable OAuth. For a hosted Supabase project, enter credentials in that project's provider settings instead of the local TOML file, then set `NEXT_PUBLIC_AUTH_PROVIDERS=google,github` for the configured providers and rebuild Keep. Secrets must never use a `NEXT_PUBLIC_` prefix.

Check each enabled provider in a private browser window: choose it on `/login` or `/signup`, complete consent, verify the return to Keep, log out, and sign in again to the same vault. Verify cancellation returns an error with an email fallback. These external consent and account flows cannot be fully tested before the real provider apps exist.
