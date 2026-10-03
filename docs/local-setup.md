# Local development

## Requirements

- Node.js 20.9 or later
- pnpm
- The Courier & Logistics Platform API running locally

## Start the frontend

From this directory, run:

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The API URL defaults to `http://localhost:4000/api/v1`; change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if needed. Restart Next.js after editing environment values.

Useful project commands:

```powershell
pnpm lint
pnpm build
pnpm start
```

The public tracking page can load without an account. Account workspaces need a running API, a verified user, and the correct role assignments in the backend.
