<div align="center">
  <img src="public/brand/icon-192.png" alt="Keep logo" width="72" height="72" />

  <h1>Keep</h1>
  <p><strong>Your keys. One place.</strong></p>
  <p>An API key vault for organizing credentials, sharing access, and tracking activity.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&amp;logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&amp;logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&amp;logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&amp;logoColor=white" alt="Supabase" />
    <a href="https://github.com/eloooong/keep/actions/workflows/checks.yml"><img src="https://github.com/eloooong/keep/actions/workflows/checks.yml/badge.svg" alt="Checks" /></a>
  </p>

  <p>
    <a href="https://keep-umber-eta.vercel.app"><strong>Open Keep ↗</strong></a> ·
    <a href="#features">Features</a> ·
    <a href="#getting-started">Getting started</a> ·
    <a href="#configuration">Configuration</a> ·
    <a href="#documentation">Documentation</a>
  </p>
</div>

## Preview

![Keep workspace showing the key collection, search controls, and expiration tracking](docs/images/keep-vault.png)

_The current workspace with sample credentials. Key values remain masked until revealed._

## Features

| Area               | What it provides                                                          |
| ------------------ | ------------------------------------------------------------------------- |
| **Key vault**      | Store API credentials with server-side AES-256-GCM encryption.            |
| **Organization**   | Search by name, notes, or tags, with category and tag filters.            |
| **Sharing**        | Grant view or edit permissions and revoke access when needed.             |
| **Activity**       | Track key changes and access, with history retained after deletion.       |
| **Expiration**     | Surface upcoming expirations and optionally send email reminders.         |
| **Authentication** | Email/password, Google, and GitHub through configured Supabase providers. |
| **Interface**      | Responsive dark layouts, keyboard controls, and reduced-motion support.   |

## Technology

| Layer                       | Stack                                                   |
| --------------------------- | ------------------------------------------------------- |
| Application                 | Next.js App Router, React, TypeScript                   |
| Interface                   | Tailwind CSS, Hugeicons, Motion, React Bits adaptations |
| Database and authentication | Supabase PostgreSQL, Auth, row-level security           |
| Encryption                  | Node.js crypto, AES-256-GCM                             |
| Email                       | Resend, with scheduled expiry reminders                 |
| Testing                     | Node.js test runner, PGlite, Python Playwright          |
| Hosting                     | Vercel                                                  |

## Getting started

### Requirements

- Node.js **24** and npm
- Docker only if running the local Supabase stack

### 1. Clone and install

```sh
git clone https://github.com/eloooong/keep.git
cd keep
npm ci
```

### 2. Configure your environment

```sh
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local`.

To explore the application without external services, set this in `.env.local`:

```dotenv
NEXT_PUBLIC_DEMO_MODE=true
```

Sample data is shared in process memory and may reset on restart or redeployment. For persistent accounts and credentials, follow the [local development guide](docs/development.md).

### 3. Start the application

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Configuration

The complete variable list is in [`.env.example`](.env.example). For a persistent vault, set demo mode to `false` and configure the following:

| Variable                        | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public project key                                     |
| `ENCRYPTION_KEY`                | Server-only encryption key: 64 hexadecimal characters  |
| `NEXT_PUBLIC_AUTH_PROVIDERS`    | Configured OAuth provider IDs, such as `google,github` |

Missing configuration never enables demo mode automatically. Reminder delivery requires additional server-side settings; see [deployment](docs/deployment.md#expiry-reminders).

### Encryption and access

Key values are encrypted on the server before storage. Server-side authorization and PostgreSQL row-level security enforce access; owners control sharing and recipients receive view or edit permissions.

This is encryption at rest, not end-to-end encryption. The application server can decrypt values for authorized requests. Keep the encryption key private, stable across deployments, and securely backed up: losing or replacing it makes existing ciphertext unreadable.

## Development

| Command                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Start the development server                                |
| `npm run check`        | Lint, generate route types, check TypeScript, and run tests |
| `npm run format:check` | Verify source and documentation formatting                  |
| `npm run build`        | Create a production build                                   |
| `npm start`            | Serve the production build                                  |

GitHub Actions runs formatting, lint, type checks, tests, and a demo-mode production build on every push and pull request. Database tests use PGlite and do not require an external database. Browser and integration checks have separate setup in the [development guide](docs/development.md#automated-tests).

## Project structure

```text
src/
  app/           Routes, server actions, and styles
  components/    Vault, authentication, and shared UI
  utils/         Encryption, service clients, and demo data
supabase/        Database schema, migrations, and local configuration
tests/           Application, database, and browser tests
scripts/         Local backend and product-film tooling
docs/            Development, architecture, and deployment guides
```

## Documentation

- [Development](docs/development.md) — local setup, environment configuration, and testing
- [Architecture](docs/architecture.md) — data flow, permissions, and service boundaries
- [Deployment](docs/deployment.md) — hosting, database upgrades, and expiry reminders
- [Social sign-in](docs/social-sign-in.md) — OAuth provider configuration and callbacks

## Credits

Interface components include adaptations from [React Bits](https://reactbits.dev/) and icons from [Hugeicons](https://hugeicons.com/). Third-party code retains its respective terms; see the [animation attribution and licenses](src/components/react-bits/README.md).

Maintained by [eloooong](https://github.com/eloooong).
