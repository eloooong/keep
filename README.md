# Keep

[![Checks](https://github.com/eloooong/keep/actions/workflows/checks.yml/badge.svg)](https://github.com/eloooong/keep/actions/workflows/checks.yml)

A personal API key vault. Store credentials, find them quickly, and share access with the people who need them.

[Open Keep](https://keep-umber-eta.vercel.app) · [Setup](docs/development.md) · [Deployment](docs/deployment.md)

## Features

- Encrypted key storage with tags, categories, and search
- View or edit permissions for shared keys
- Activity history for changes and key access
- Expiration tracking and optional email reminders
- Email/password, Google, and GitHub authentication

Built with Next.js, React, TypeScript, and Supabase. Key values are encrypted on the server with AES-256-GCM; this is encryption at rest, not end-to-end encryption.

## Getting started

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
```

For a sample workspace, set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`:

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). Sample data is shared in process memory and resets when the server restarts.

For persistent accounts and keys, follow the [development guide](docs/development.md). Demo mode is opt-in; missing credentials never enable it automatically.

## Development

```sh
npm run check
npm run build
```

Checks run ESLint, TypeScript, and database/application tests. GitHub Actions runs them and a demo build on every push and pull request.

| Directory        | Contents                                              |
| ---------------- | ----------------------------------------------------- |
| `src/app`        | Routes, server actions, and styles                    |
| `src/components` | Vault, authentication, and shared UI                  |
| `src/utils`      | Encryption, service clients, reminders, and demo data |
| `supabase`       | Database schema, migrations, and local configuration  |
| `tests`          | Unit, database, and browser checks                    |
| `scripts`        | Local backend and product-film tooling                |

## Documentation

- [Local development and testing](docs/development.md)
- [Application architecture](docs/architecture.md)
- [Deployment and database upgrades](docs/deployment.md)
- [Social sign-in configuration](docs/social-sign-in.md)
- [Third-party animation attribution](src/components/react-bits/README.md)
