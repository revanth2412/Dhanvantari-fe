# Dhanvantari — Frontend

Doctor-facing web app for **Dhanvantari**, an AI clinical-documentation product:
a doctor records a consultation, the backend transcribes it (ElevenLabs Scribe)
and extracts a structured clinical note (Google Gemini), and the doctor reviews,
edits, and finalizes it. This repo is the **React SPA** the doctor logs into.

## Live URLs
| | URL |
|---|---|
| **Frontend (this app)** | https://dhanvantari-fe.vercel.app/ |
| **Backend API (Swagger)** | https://web-production-a2bab.up.railway.app/docs |

- Frontend hosting: **Vercel** · Backend hosting: **Railway** · DB/Storage/Auth: **Supabase**
- Backend repo: https://github.com/revanth2412/Dhanvantari-be

## Current scope
Implemented: **authentication + access gating** only.
- Email/password **and** Google sign-in (via Supabase).
- First-time **profile registration** for a signed-in user.
- **Admin-approval gate** (accounts start `pending`; a dashboard appears once approved).

Not yet built (planned): the consultation workflow (patients → consultation →
audio upload → poll status → review/edit/finalize) and an in-app admin approval
panel. Approvals are currently done through the backend API (Swagger).

## Stack
- **React 18 + Vite + TypeScript** (strict)
- **@supabase/supabase-js** — auth (email/password + Google OAuth)
- **react-router-dom** — routing driven by auth status
- Plain CSS (styling intentionally minimal; to be revisited)
- ESLint + Prettier (lint runs at `--max-warnings 0`)

## Project structure
```
src/
  config/env.ts             # validated env vars (throws if missing)
  lib/
    supabaseClient.ts        # single Supabase client
    apiClient.ts             # fetch wrapper: attaches Supabase JWT, throws typed ApiError
  services/
    authService.ts           # Supabase auth (password + Google)
    doctorService.ts         # backend /auth/me, /auth/register
  context/
    authContext.ts           # React context + AuthStatus type
    AuthProvider.tsx         # holds session + doctor profile, derives status
  hooks/useAuth.ts
  components/
    GoogleButton.tsx, Spinner.tsx
  pages/
    LoginPage.tsx            # email/password + Google; sign in / sign up
    RegisterProfilePage.tsx  # first-time profile creation -> pending
    PendingApprovalPage.tsx  # awaiting approval / rejected
    DashboardPage.tsx        # approved home (placeholder for the flow)
  App.tsx                    # status-driven routing (each route self-guards)
  main.tsx                   # providers + router
  styles/index.css
```

## Auth & routing flow
The app routes on a single derived `AuthStatus`:

| Status | Meaning | Screen |
|---|---|---|
| `loading` | resolving session/profile | spinner |
| `unauthenticated` | no Supabase session | `/login` |
| `unregistered` | signed in, no doctor profile (`GET /auth/me` → 404) | `/register-profile` |
| `pending` | profile awaiting approval | `/pending` |
| `rejected` | profile rejected / inactive | `/pending` |
| `approved` | good to go | `/` (Dashboard) |

Sequence: **Supabase login** → `GET /auth/me` → (404) **register profile** via
`POST /auth/register` → **pending** → admin approves (backend) → **approved**.

## Setup & run
```bash
npm install
cp .env.example .env      # fill in the values below
npm run dev               # http://localhost:5173
```

### Environment variables (`.env`, all prefixed `VITE_`)
```
VITE_SUPABASE_URL=https://wgkertcelaumvhldcjoj.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>     # NOT the service_role key
VITE_API_BASE_URL=http://localhost:8000       # or the Railway URL in prod
```
`src/config/env.ts` validates these at startup and throws a clear error if any
is missing.

## Scripts
- `npm run dev` — dev server (port 5173)
- `npm run build` — type-check (`tsc -b`) + production build
- `npm run lint` — eslint (0 warnings allowed)
- `npm run format` — prettier

## Deploy (Vercel)
1. Import the repo in Vercel (framework preset **Vite**, auto-detected).
2. Set the three `VITE_*` env vars (use the Railway URL for `VITE_API_BASE_URL`).
3. Deploy.

**Required wiring after deploy:**
- **Backend CORS** (Railway `web` service): add the Vercel origin to
  `CORS_ALLOW_ORIGINS`, e.g. `http://localhost:5173,https://dhanvantari-fe.vercel.app`.
- **Supabase → Authentication → URL Configuration**: set **Site URL** to the
  Vercel URL and add `https://dhanvantari-fe.vercel.app/**` to **Redirect URLs**
  (needed for Google OAuth + email links).
- **Google Cloud**: no change — the OAuth redirect stays the Supabase callback
  `https://<ref>.supabase.co/auth/v1/callback`.

## Approving a doctor (until the admin UI exists)
With an **admin** token (a doctor whose email is in the backend's
`BOOTSTRAP_ADMIN_EMAILS`) in Swagger:
`GET /admin/doctors?approval_status=pending` → `POST /admin/doctors/{id}/approve`.
