# AGENTS.md — context for AI agents / LLMs working in this repo

This file orients an AI coding agent working on the **Dhanvantari frontend**.
Read it before making changes. Keep it updated when structure or conventions change.

## What this project is
Dhanvantari is an AI clinical-documentation product for doctors: record a
consultation → backend transcribes (ElevenLabs Scribe) → LLM extracts a
structured clinical note (Google Gemini) → doctor reviews/edits/finalizes.
**This repo is the doctor-facing React SPA.** It implements the full workflow:
auth + approval gating, dashboard, patients (search/create/detail), the
consultation capture → pipeline → note-review flow, and the admin approvals panel.

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
- `react-router-dom` v6 — routing (approved-area pages are `React.lazy` code-split)
- `gsap` — stagger reveals / count-ups; `lucide-react` — icons
- Plain-CSS design system (tokens in CSS custom properties). ESLint
  (`--max-warnings 0`) + Prettier.
- Path alias: `@/` → `src/` (configured in `vite.config.ts` + `tsconfig.json`).

## Directory map & responsibilities
```
src/
  config/env.ts            # reads + validates VITE_* env; throws if missing. Single source of env truth.
  lib/
    supabaseClient.ts       # the ONLY place createClient() is called
    apiClient.ts            # apiRequest<T>(path, opts): base URL + JWT + JSON body or FormData + typed ApiError
    format.ts               # dates/ages/initials/duration + consultationStatusMeta
    haptics.ts              # haptic(pattern) — Vibration API; no-ops off touch devices
    noteText.ts             # ClinicalNote -> plain text (copy to clipboard / EMR)
    recents.ts              # localStorage recent-sessions cache (backend has no list-consultations API)
  types/                    # doctor, patient, consultation, record — mirror backend Pydantic schemas
  services/                 # ALL backend/Supabase calls live here (no fetch/supabase in components)
    authService.ts          # supabase.auth wrappers
    doctorService.ts        # /auth/me, /auth/register
    patientService.ts       # /patients CRUD + search
    consultationService.ts  # create, get, multipart recording upload, process (retry), transcript
    recordService.ts        # consultation record, update (new version), finalize, patient history
    adminService.ts         # /admin/doctors list/approve/reject/make-admin
  context/
    authContext.ts          # createContext + types (AuthStatus). NO component here (fast-refresh).
    AuthProvider.tsx        # session + doctor state; derives AuthStatus; silent refreshes for polling
  hooks/                    # useAuth, useToast, useDebounce (search), useReveal (gsap stagger)
  components/
    ui/                     # design-system kit: Button, Field(Text/TextArea/Select/Check),
                            #   Badge, Avatar, Modal+Drawer, Tabs, Skeleton, EmptyState,
                            #   EcgLoader (brand loader), toast/ (provider + context)
    layout/AppLayout.tsx    # approved-area shell: auto-collapsing sidebar + <Outlet/>
    layout/MobileTabBar.tsx # mobile-only bottom tab bar + record FAB + account sheet
    patients/PatientFormDrawer.tsx   # create/edit patient incl. social history
    recorder/AudioRecorder.tsx       # MediaRecorder + live canvas waveform + pause/resume
    consultation/           # CaptureStage (record|upload tabs), PipelineStatus (4-step
                            #   animated stepper), TranscriptPanel (diarized segments)
    note/NotePanel.tsx      # clinical note: view sections, inline edit -> PUT new version,
                            #   finalize modal, confidence ring, copy-as-text
  pages/                    # one screen each: Login (split hero), RegisterProfile (wizard),
                            #   PendingApproval (auto-poll), Dashboard, Patients,
                            #   PatientDetail, NewConsultation (wizard), ConsultationSession
                            #   (pipeline poll + review), Admin
  App.tsx                   # status-driven routing; RouteFor guards; AdminRoute; lazy routes
  main.tsx                  # <BrowserRouter><AuthProvider><ToastProvider><App/>
  styles/                   # tokens.css (design tokens — edit colors HERE), base.css
                            #   (reset + keyframes), components.css (ui-kit classes),
                            #   layout.css (shell/auth), pages.css (per-page)
```

## Design system (keep it consistent)
- **One design language**: "evergreen & saffron". All colors/radii/shadows/motion
  come from CSS variables in `styles/tokens.css` — never hardcode hex values in
  component styles.
- **Class naming**: `.ui-<component>[__element][--modifier]` in `components.css`;
  page-specific classes live in `pages.css`.
- **Motion**: micro-interactions are pure CSS (keyframes in `base.css`); GSAP is
  used for stagger reveals (`useReveal`) and count-ups. Respect
  `prefers-reduced-motion` (handled globally in `base.css`).
- **New UI**: reuse `components/ui/*` (Button, Field, Badge, Modal…) instead of
  ad-hoc markup so every screen stays visually coherent.
- **Responsive**: one breakpoint drives the mobile shell — **820px**. Below it the
  sidebar is hidden, `MobileTabBar` appears, modals/drawers become bottom sheets,
  touch targets grow to 44px, inputs go to 16px (stops iOS zoom-on-focus), and
  note cards drop their height cap so the page scrolls instead of each card.
  Safe-area insets come from `--safe-top` / `--safe-bottom` in `tokens.css`.
- **Haptics**: `Button` and `Tabs` fire automatically; call `haptic()` directly
  only for non-button moments (recording start/stop, toasts). Never gate logic on
  it — it silently no-ops on desktop and iOS Safari.
- **Scroll containers**: don't add `overscroll-behavior: contain` to anything that
  isn't always scrollable — it swallows the wheel and freezes the page scroll.

## Coding conventions (follow these)
- **Layering:** components/pages → hooks/context → services → lib. Components must
  NOT call `fetch` or `supabase` directly; go through `services/` (which use
  `lib/apiClient` or `lib/supabaseClient`).
- **Types:** keep `src/types/*` in sync with backend Pydantic schemas. Prefer
  explicit interfaces over `any`.
- **Env:** never read `import.meta.env` outside `config/env.ts`.
- **Errors:** backend errors surface as `ApiError { status, message, detail }`;
  user-facing failures go through `useToast()`.
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

Clinical endpoints (all require an **approved** doctor; see backend AGENTS.md for
bodies): `/patients` CRUD+search, `POST /consultations`,
`POST /consultations/{id}/recording` (multipart `file`),
`POST /consultations/{id}/process` (retry), `GET /consultations/{id}` (+
`/transcript`, `/record`), `GET/PUT /records/{id}`, `POST /records/{id}/finalize`,
`GET /patients/{id}/records`. All are wired into `services/*`.
**There is no list-consultations endpoint** — the dashboard's "recent sessions"
come from `lib/recents.ts` (localStorage).

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
Implemented: auth (email/password + Google), onboarding wizard, approval gating
with auto-poll, dashboard (stats + recents), patients (search/create/edit/detail
+ record timeline), consultation flow (consent → record/upload → animated
pipeline with 3s polling → failure retry), clinical note review (view, inline
edit → new version, finalize, copy), diarized transcript panel, admin approvals.

TODO (likely next tasks):
1. **Backend list-consultations endpoint** — then replace `lib/recents.ts`
   localStorage cache with real data.
2. **Version history UI** — `GET /patients/{id}/records` already returns every
   version; expose a version picker on the note.
3. **Print/PDF prescription export** from the finalized note.

## Gotchas
- **`config/env.ts` throws** at startup if a `VITE_*` var is missing (by design).
- **CORS:** the backend must list the current origin in `CORS_ALLOW_ORIGINS`
  (localhost:5173 for dev, the Vercel URL for prod), or browser calls fail.
- **Google OAuth:** requires the Vercel URL in Supabase → Auth → URL
  Configuration (Site URL + Redirect URLs). Missing = "redirect not allowed".
- **Vercel env changes require a redeploy** to take effect.
- **`authContext.ts` must not export a component** (keeps React Fast Refresh happy);
  the provider lives in `AuthProvider.tsx`.
