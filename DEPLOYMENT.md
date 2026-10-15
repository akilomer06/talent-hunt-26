# Vercel frontend + Render backend + Supabase

The browser loads the static TanStack Start SPA from Vercel, calls the Node API
on Render, and the API reads/writes Supabase. No Supabase key is needed in Vercel.
The generated `dist/server` is used during the frontend build only; deploy
`dist/client` to Vercel. SPA mode requires JavaScript to display page content.

## Local development

Use Node 24. From the `talent-hunt-26` project directory:

```powershell
npm ci
Copy-Item .env.example .env.local
Copy-Item backend/.env.example backend/.env.local
```

In `.env.local`, set `VITE_API_URL=` (empty) to use the Vite proxy. In
`backend/.env.local`, set a private `ADMIN_PASSCODE` and random `SESSION_SECRET`.
These local files are ignored by Git. The current local setup is already configured;
do not overwrite it unless you intend to reset the values.

Run these in two terminals:

```powershell
npm run dev:backend
```

```powershell
npm run dev -- --host 127.0.0.1 --port 3000
```

Frontend: http://127.0.0.1:3000. API health: http://127.0.0.1:4000/api/health.
The development proxy forwards `/api` from port 3000 to port 4000.

## Production Supabase setup

The existing `registrations` and `site_content` tables already respond. Do not
rerun the imported `supabase-schema.sql` on the existing project: it grants public
access. Its public policies allow direct requests to bypass API authentication.

The original live registrations table lacks `section`. The API supports it by
preserving the registrant's section alongside team members in JSON metadata and
normalizing the admin response back to a section field and team-members array.
Optionally run `backend/registration-schema-upgrade.sql` to add the column and
promote that metadata into the column without losing existing registrations.

1. Obtain a **secret key** (or legacy `service_role` key) from Supabase project
   settings. Set it as `SUPABASE_SECRET_KEY` on Render only. Never prefix it with
   `VITE_` or put it in Vercel/browser code.
2. Run `backend/secure-policies.sql` in the Supabase SQL Editor. It revokes browser
   table access and removes the imported permissive policies while retaining API
   access via the server-only key. Existing rows are preserved.
3. Confirm `/api/health` returns `{"status":"ok","database":"connected"}`.

Until this migration is applied, the provided publishable key works with the
existing public policies for local development, but participant records remain
publicly accessible through Supabase. The migration has not been applied remotely.

## Render backend

Push the code to your repository, then create a Render Blueprint from `render.yaml`.
If this project is a subdirectory of the repository, select the Blueprint path
`talent-hunt-26/render.yaml` and set the service Root Directory to `talent-hunt-26`.
If it is the repository root, use `render.yaml` and leave Root Directory blank.

Alternatively create a Node Web Service with these settings:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --omit=dev` |
| Start command | `npm run start:backend` |
| Health check | `/api/health` |
| Node version | `24` |

Set these environment variables (the Blueprint supplies the Supabase URL and
publishable key and generates `SESSION_SECRET`):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://spowdisyvuvaicasewdf.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | The supplied publishable key |
| `SUPABASE_SECRET_KEY` | Supabase secret key, server only |
| `ADMIN_PASSCODE` | A private passcode of your choice |
| `SESSION_SECRET` | Long random secret; Blueprint generates it |
| `FRONTEND_URL` | `https://talent-hunt-2k26-five.vercel.app` |

Render supplies `PORT`; the server binds to `0.0.0.0`. `FRONTEND_URL` accepts
comma-separated exact origins, without trailing slashes. Add a custom domain or
an individual Vercel preview origin explicitly if needed. No wildcard is enabled.
If the frontend URL is unknown during setup, deploy Vercel first to obtain it,
then set `FRONTEND_URL` and redeploy Render.

## Vercel frontend

Import the same repository and set Root Directory to this project folder.
The committed `vercel.json` configures:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist/client` |
| Node version | 24.x |
| `VITE_API_URL` | Leave unset or empty to use the Vercel API proxy |

The committed Vercel API route forwards `/api/*` to
`https://talent-hunt-26.onrender.com/api/*` **before** the website fallback.
This allows both admin sign-in and registration to use same-origin requests.
Production builds always use the Vercel proxy, even if `VITE_API_URL` remains in
the Vercel environment. That override is supported only during local development.
Remove the variable from Vercel to avoid confusion. The static fallback
to `/_shell.html` supports refreshed deep links
such as `/register`, `/admin`, and `/events/code-break`.

Suggested order: create Vercel project to obtain its domain, deploy Render with
that `FRONTEND_URL`, then deploy Vercel with the included API proxy. Verify public
content, a registration, and admin sign-in after both services are deployed.

## Admin portals

`/admin` retains the full existing admin portal and uses Render's `ADMIN_PASSCODE`.
`/adminregistration` is a separate registration-team sign-in, limited to dashboard,
roster and CSV export. It cannot delete registrations, edit website content or
manage access, including through direct API calls.

In the main portal, open **Supabase Cloud Config → Registration-team access**.
Set a separate team passcode (at least eight characters) and enable access. The
**Revoke team access** control blocks existing team tokens immediately at the API;
the team page checks its session every 30 seconds. Updating access or changing
the team passcode also invalidates old team sessions. Access starts disabled.

Before enabling it, set `SUPABASE_SECRET_KEY` and a stable `SESSION_SECRET` in
Render and run `backend/secure-policies.sql` in Supabase. The existing database
has public policies; API roles alone cannot restrict direct database requests.
The enable control verifies anonymous access has been revoked. Disabling access
remains available even if database permissions are subsequently misconfigured.

Access configuration is encrypted in a separate `site_content` record and is
excluded from the public content API. Keep `SESSION_SECRET` unchanged across
deploys. If it changes, team access fails closed and must be configured again.
After this update, sign in again: older tokens are replaced with role-aware tokens.

## Verification commands

```powershell
npm test
npm run test:backend
npm run build
```

The API tests use a mock database and check authentication, CORS, validation,
registration writes and database failures without changing Supabase records.

Hosting references: [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite),
[Render web service setup](https://render.com/docs/deploy-node-express-app), and
[TanStack SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode).
