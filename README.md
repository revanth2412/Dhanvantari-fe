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
Implemented: the **full doctor workflow**, with a consistent design system
("evergreen & saffron") across every screen.
- **Auth**: email/password **and** Google sign-in (Supabase), 3-step onboarding
  wizard, admin-approval gate with auto-polling pending screen.
- **Dashboard**: greeting hero, animated stats, recent sessions & patients.
- **Patients**: debounced search, create/edit drawer (incl. lifestyle/social
  history), patient detail with clinical-record timeline.
- **Consultations**: patient → DPDP consent → capture wizard; record in-browser
  (MediaRecorder + live waveform) or drag-drop upload; animated 4-step pipeline
  view that polls until the AI draft is ready; failure recovery (re-process).
- **Clinical note review**: structured note UI (chief complaint, symptoms,
  history, vitals, diagnosis, prescriptions table, tests, advice, follow-up,
  red flags, unclear segments, AI-confidence ring), inline editing (saves a new
  version), finalize flow, copy-as-text, and the diarized transcript side-by-side.
- **Admin panel**: approve / reject / promote doctors (pending/approved/rejected tabs).

## Stack
- **React 18 + Vite + TypeScript** (strict)
- **@supabase/supabase-js** — auth (email/password + Google OAuth)
- **react-router-dom** — status-driven routing; approved area is code-split (lazy)
- **gsap** — stagger reveals, count-ups (micro-interactions are plain CSS)
- **lucide-react** — icons
- Design system in plain CSS custom properties (`src/styles/tokens.css`)
- ESLint + Prettier (lint runs at `--max-warnings 0`)

## Project structure
```
src/
  config/env.ts              # validated env vars (throws if missing)
  lib/
    supabaseClient.ts        # single Supabase client
    apiClient.ts             # fetch wrapper: JWT + JSON + FormData + typed ApiError
    format.ts                # dates, ages, initials, status metadata
    noteText.ts              # ClinicalNote -> plain text (copy/EMR paste)
    recents.ts               # localStorage recent-sessions cache (no list API yet)
  types/                     # doctor, patient, consultation, record (mirror backend)
  services/                  # ALL backend/Supabase calls (auth, doctor, patient,
                             #   consultation incl. multipart upload, record, admin)
  context/                   # authContext + AuthProvider (derives AuthStatus)
  hooks/                     # useAuth, useToast, useDebounce, useReveal (gsap)
  components/
    ui/                      # design-system kit: Button, Field, Badge, Avatar,
                             #   Modal/Drawer, Tabs, Skeleton, EmptyState,
                             #   EcgLoader, toast/
    layout/AppLayout.tsx     # sidebar + topbar shell for the approved area
    patients/                # PatientFormDrawer
    recorder/                # AudioRecorder (MediaRecorder + waveform)
    consultation/            # CaptureStage, PipelineStatus, TranscriptPanel
    note/NotePanel.tsx       # clinical note view/edit/finalize
  pages/                     # Login, RegisterProfile (wizard), PendingApproval,
                             #   Dashboard, Patients, PatientDetail,
                             #   NewConsultation, ConsultationSession, Admin
  App.tsx                    # status-driven routing; lazy approved-area routes
  main.tsx                   # providers + router
  styles/                    # tokens.css, base.css, components.css, layout.css, pages.css
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
`POST /auth/register` → **pending** → admin approves (in-app `/admin` or backend)
→ **approved**.

## Consultation flow (approved doctors)
1. **New consultation** (`/consultations/new`): pick/create the patient →
   confirm recording **consent** (DPDP) → `POST /consultations`.
2. **Capture**: record in-browser or upload audio → multipart
   `POST /consultations/{id}/recording` (starts the backend pipeline).
3. **Pipeline** (`/consultations/{id}`): polls `GET /consultations/{id}` every 3s
   through `uploaded → transcribing → extracting`; `failed` offers one-click
   `POST /consultations/{id}/process` retry.
4. **Review**: on `draft_ready`, the structured note (`GET .../record`) and the
   diarized transcript (`GET .../transcript`) render side-by-side. Edits `PUT` a
   **new version**; **Finalize** locks the record and the consultation.

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

## Approving a doctor
Sign in as an **admin** (a doctor whose email is in the backend's
`BOOTSTRAP_ADMIN_EMAILS`) and use the in-app **Approvals** page (`/admin`).
Swagger remains an alternative:
`GET /admin/doctors?approval_status=pending` → `POST /admin/doctors/{id}/approve`.
