# Dhanvantari — Frontend

React + Vite + TypeScript SPA for the Dhanvantari doctor app. Handles auth
(Supabase email/password + Google) and gates access behind admin approval.
The clinical workflow (patients → consultation → upload → review) is added later.

## Stack
- **React 18 + Vite + TypeScript**
- **Supabase JS** — auth (email/password + Google OAuth)
- **React Router** — routing driven by auth status
- Plain CSS (design to be revisited)

## Project structure
```
src/
  config/env.ts           # validated env vars (fails fast if missing)
  lib/
    supabaseClient.ts      # single Supabase client
    apiClient.ts           # fetch wrapper; attaches Supabase JWT, typed ApiError
  services/
    authService.ts         # Supabase auth calls (password + Google)
    doctorService.ts       # backend /auth/register, /auth/me
  context/AuthContext.tsx  # session + doctor profile + derived AuthStatus
  hooks/useAuth.ts
  components/
    ProtectedRoute is expressed in App.tsx (RouteFor); GoogleButton, Spinner
  pages/
    LoginPage.tsx          # email/password + Google, sign in / sign up
    RegisterProfilePage.tsx# first-time profile creation (-> pending)
    PendingApprovalPage.tsx# awaiting / rejected
    DashboardPage.tsx      # approved home (placeholder)
  App.tsx                  # status-driven routing
  main.tsx                 # providers + router
  styles/index.css
```

## Auth flow
1. **Sign in / up** via Supabase (email/password or Google).
2. Backend `GET /auth/me`:
   - `404` → no profile yet → **Register profile** screen → `POST /auth/register`.
   - profile `pending`/`rejected` → **Pending approval** screen.
   - profile `approved` → **Dashboard**.
3. An admin approves the doctor (backend `/admin/doctors/{id}/approve`); the
   doctor clicks **Refresh status** and gets in.

## Setup
```bash
npm install
cp .env.example .env    # fill in the values below
npm run dev             # http://localhost:5173
```

`.env`:
```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_API_BASE_URL=http://localhost:8000      # or the Railway URL in prod
```

## Backend requirements
- The backend must allow this origin via `CORS_ALLOW_ORIGINS`
  (e.g. `http://localhost:5173` for dev).
- Google login requires the **Google provider** enabled in Supabase, with the
  callback `https://<ref>.supabase.co/auth/v1/callback` registered in Google Cloud.

## Scripts
- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run lint` — eslint
- `npm run format` — prettier

## Deploy (Vercel)
Import the repo in Vercel, set the three `VITE_*` env vars, framework preset
**Vite**. Add the deployed Vercel URL to the backend's `CORS_ALLOW_ORIGINS`.
