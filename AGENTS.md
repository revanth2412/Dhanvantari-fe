# AGENTS.md — context for AI agents / LLMs working in this repo

This file orients an AI coding agent working on the **Dhanvantari frontend**.
Read it before making changes. Keep it updated when structure or conventions change.

## What this project is
Dhanvantari is an AI clinical-documentation product for doctors: record a
consultation → backend transcribes (ElevenLabs Scribe) → LLM extracts a
structured clinical note (Google Gemini) → doctor reviews/edits/finalizes.
**This repo is the doctor-facing React SPA.** It currently implements only
**auth + access gating**; the consultation workflow is not built yet.

## System context (where this repo sits)
```
[This repo: React SPA on Vercel]
        │  HTTPS + Bearer JWT
        ▼
[Backend: FastAPI on Railway]  ──►  Supabase Postgres + Storage
        │                          (raw audio, clinical records)
        ├─► ElevenLabs Scribe (STT)
        └─► Google Gemini (note extraction)

Auth: Supabase Auth issues JWTs (email/password + Google). The SPA sends the JWT
to the backend, which verifies it and maps the user to a `doctors` row.
```

## Live URLs & related repos
- Frontend (this app): https://dhanvantari-fe.vercel.app/
- Backend API (Swagger): https://web-production-a2bab.up.railway.app/docs
- Frontend repo: https://github.com/revanth2412/Dhanvantari-fe
- Backend repo: https://github.com/revanth2412/Dhanvantari-be
- Hosting: Vercel (FE), Railway (BE), Supabase (DB/Storage/Auth)

## Tech stack
- React 18, Vite 5, TypeScript 5 (strict; `noUnusedLocals`/`noUnusedParameters`)
- `@supabase/supabase-js` v2 — auth
- `react-router-dom` v6 — routing
- Plain CSS. ESLint (`--max-warnings 0`) + Prettier.
- Path alias: `@/` → `src/` (configured in `vite.config.ts` + `tsconfig.json`).

## Directory map & responsibilities
```
src/
  config/env.ts            # reads + validates VITE_* env; throws if missing. Single source of env truth.
  lib/
    supabaseClient.ts       # the ONLY place createClient() is called
    apiClient.ts            # apiRequest<T>(path, opts): base URL + JWT header + JSON + typed ApiError
  services/                 # all backend/Supabase calls live here (no fetch/supabase calls in components)
    authService.ts          # supabase.auth: signInWithPassword, signUp, signInWithGoogle, signOut
    doctorService.ts        # getMyProfile() -> Doctor|null (404->null), registerProfile(input)
  context/
    authContext.ts          # createContext + types (AuthStatus, AuthContextValue). NO component here (fast-refresh).
    AuthProvider.tsx        # owns session + doctor state; derives AuthStatus; subscribes to onAuthStateChange
  hooks/useAuth.ts          # useContext wrapper; throws if used outside provider
  components/               # presentational, reusable (GoogleButton, Spinner)
  pages/                    # one screen each (Login, RegisterProfile, PendingApproval, Dashboard)
  App.tsx                   # status-driven routing; RouteFor guards each route
  main.tsx                  # <BrowserRouter><AuthProvider><App/>
  types/doctor.ts           # Doctor, DoctorRegisterInput — mirror backend DoctorOut
  styles/index.css
```

## Coding conventions (follow these)
- **Layering:** components/pages → hooks/context → services → lib. Components must
  NOT call `fetch` or `supabase` directly; go through `services/` (which use
  `lib/apiClient` or `lib/supabaseClient`).
- **Types:** keep `src/types/*` in sync with backend Pydantic schemas. Prefer
  explicit interfaces over `any`.
- **Env:** never read `import.meta.env` outside `config/env.ts`.
- **Errors:** backend errors surface as `ApiError { status, message, detail }`.
- **New API calls:** add a function in the relevant `services/*.ts`, typed, using
  `apiRequest<T>()`. Don't inline URLs in components.
- **Keep it green:** `npm run build` (tsc + vite) and `npm run lint` must pass
  with zero errors/warnings before considering a change done.

## Auth model (important)
`AuthProvider` computes a single `AuthStatus` used for all routing:
`loading | unauthenticated | unregistered | pending | rejected | approved`.
- `unregistered` = signed into Supabase but `GET /auth/me` returned 404.
- `approved` requires `approval_status === "approved"` AND `active === true`.
- Routing lives in `App.tsx`: each route renders only for allowed statuses,
  else redirects to that status's home path.
- After Google OAuth redirect, Supabase restores the session
  (`detectSessionInUrl: true`) and `onAuthStateChange` fires → profile is refetched.

## Backend API contract (what the FE uses)
Base URL = `VITE_API_BASE_URL`. All authed requests send `Authorization: Bearer <supabase_jwt>`.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/auth/me` | current doctor profile | 404 = not registered yet |
| POST | `/auth/register` | create profile for the signed-in user | body: `{full_name, phone?, specialty?, registration_no?}` |
| GET | `/admin/doctors?approval_status=` | list doctors (admin only) | for the future admin UI |
| POST | `/admin/doctors/{id}/approve` | approve (admin only) | |
| POST | `/admin/doctors/{id}/reject` | reject (admin only) | |

`DoctorOut` shape (see `src/types/doctor.ts`):
`{ id, full_name, email, phone, specialty, registration_no, active, role ("doctor"|"admin"), approval_status ("pending"|"approved"|"rejected"), created_at, updated_at }`.

Clinical endpoints exist on the backend (`/patients`, `/consultations`,
`/consultations/{id}/recording`, `/consultations/{id}/record`, `/records/*`) and
require an **approved** doctor — the FE for these is not built yet.

## Environment variables
`.env` (see `.env.example`), all prefixed `VITE_`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — anon/public key (never the service_role key)
- `VITE_API_BASE_URL` — backend base (local `http://localhost:8000`, prod = Railway URL)

## Commands
- `npm run dev` — dev server on :5173
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint, 0 warnings allowed
- `npm run format` — prettier

## Implemented vs TODO
Implemented: Supabase auth (email/password + Google), profile registration,
approval gating, pending/rejected screens, approved dashboard placeholder.

TODO (likely next tasks):
1. **Consultation flow** in the Dashboard: patient search/create → start
   consultation → upload audio (`multipart` to `/consultations/{id}/recording`)
   → poll `GET /consultations/{id}` until `draft_ready` → view/edit/finalize the
   note (`/records/*`). Add `patientService.ts`, `consultationService.ts`,
   `recordService.ts` and matching pages/components.
2. **Admin panel** (role === "admin"): list pending doctors + approve/reject
   buttons calling `/admin/*`. Add `adminService.ts` + an admin route.

## Gotchas
- **`config/env.ts` throws** at startup if a `VITE_*` var is missing (by design).
- **CORS:** the backend must list the current origin in `CORS_ALLOW_ORIGINS`
  (localhost:5173 for dev, the Vercel URL for prod), or browser calls fail.
- **Google OAuth:** requires the Vercel URL in Supabase → Auth → URL
  Configuration (Site URL + Redirect URLs). Missing = "redirect not allowed".
- **Vercel env changes require a redeploy** to take effect.
- **`authContext.ts` must not export a component** (keeps React Fast Refresh happy);
  the provider lives in `AuthProvider.tsx`.
