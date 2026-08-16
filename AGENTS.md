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
    doctorService.ts        # /auth/me (GET + PATCH self-update), /auth/register
    clinicService.ts        # /clinics create/join/me/members/update (works while `pending`)
    statsService.ts         # /stats/me — the doctor's own activity counts
    patientService.ts       # /patients CRUD + search (clinic-scoped by the backend)
    consultationService.ts  # create, get, multipart upload, process (retry), discard, transcript
    recordService.ts        # consultation record, update (new version), finalize, patient history
    adminService.ts         # /admin clinics + doctors + consultations + stats + access control
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
    note/                   # clinical note, split so BOTH renderings share one editor set:
      NotePanel.tsx         #   toolbar (identity, view switch, ops, primary actions) +
                            #   the 12-column grid view; owns record state + save/finalize
      SoapNoteView.tsx      #   S/O/A/P tabbed rendering; mounts the same editors
      NoteEditors.tsx       #   one editor per field group (symptoms, vitals, diagnosis,
                            #   prescriptions, follow-up, history, social, identity)
      NoteBits.tsx          #   presentational atoms: NSec, IRow, ChipList/ChipEditor,
                            #   ConfidenceRing, VitalIcon
      noteModel.ts          #   normalize(), noteHas(), patcher types — no JSX
  pages/ClinicPage.tsx      # clinic details/edit, invite code, member list, create-or-join
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
- **Never `overflow-x: hidden` on an ancestor** (html, body, `.page`, a card…).
  `hidden` makes the element a scroll container, and every `position: sticky`
  inside it stops sticking. Use `overflow-x: hidden; overflow-x: clip;` — the
  first line is the fallback, the second is what modern engines apply.
- **Rows of controls on a phone**: a toolbar that fits on a desktop will run off
  the side of a 375px screen. Either let the row become a full-width stack, or
  give the primary actions a docked bar (see `.note-actionbar`: sticky, offset by
  `--tabbar-h + --safe-bottom` so it clears the floating tab bar). Duplicating a
  control and letting CSS choose which copy is visible is the established pattern
  here — the sidebar and the tab bar already work that way.
- **Editor rows**: repeating field editors use `.nedit` / `.nedit__fields`, whose
  `auto-fit` track collapses to one column on a phone with no media query.

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

## Dashboard metrics (don't invent numbers)
Every card on the doctor dashboard is backed by `GET /stats/me`, which the
backend scopes to `Consultation.doctor_id == current doctor`. Rules:
- **Never** fall back to a clinic-wide number (e.g. the patient roster length)
  when the doctor-scoped stat hasn't loaded — render `—` (`.db-bento-pending`).
- **Patients in care** = `patients_seen` (distinct patients with a non-discarded
  consultation by this doctor), not the size of the patient list.
- **Time reclaimed** is an estimate and is labelled `EST.`: it multiplies
  `finalized + draft_ready` (notes the scribe actually produced — failed and
  in-flight consultations produced nothing) by `MINUTES_SAVED_PER_NOTE`, and
  the card states the per-note assumption. No floor, no fabricated baseline.
- The **sessions queue** is `lib/recents.ts` — the last 12 sessions from *this
  browser*, because the backend still has no list-consultations endpoint. The
  queue carries a footnote saying so; don't present its counts as totals.

## Patient visibility (roster vs clinic directory)
The backend widens `GET /patients` to the whole clinic for a **clinic admin**
(`app/scoping.py`). The UI deliberately does not follow that everywhere:
- **Patients page + dashboard roster** stay personal for everyone, including a
  clinic admin — `useMyPatients()` intersects the returned list with the
  patients that admin has actually consulted (patient ids from
  `GET /clinics/me/consultations`). It never falls back to the clinic-wide list
  while the log is loading, and the page links to the clinic directory rather
  than hiding colleagues' patients silently.
- **Clinic page** carries the full directory with complete detail (contact,
  language, do-not-call, registration date, consultation count, last visit, and
  which doctors saw them) — clinic admin only, since the endpoints 403 otherwise.

## Consultation provenance
`components/consultation/ConsultationProvenance.tsx` shows who conducted the
visit and who signed the note off. Names come from:
- **Conducted by** — `consultation.doctor_id`, resolved via
  `useClinicDirectory()`. `GET /clinics/me/members` is clinic-admin only, which
  matches the scoping: a regular doctor only ever sees their own consultations,
  so the only id they resolve is their own.
- **Signed off by** — `record.reviewed_by` + `finalized_at`. `reviewed_by` is
  also written on every save, so on a draft it means *last edited by* — the
  component labels it that way rather than implying a signature.

## Auth model (important)
`AuthProvider` computes a single `AuthStatus` used for all routing:
`loading | unauthenticated | unregistered | pending | rejected | approved`.
- `unregistered` = signed into Supabase but `GET /auth/me` returned 404.
- **`rejected` covers two different backend states** — check `doctor.approval_status`
  before offering account actions: `"rejected"` (admin declined; the doctor may
  `POST /auth/reapply`) vs `"approved"` with `active === false` (access revoked;
  re-applying 409s, only an admin can restore it).
- `approved` requires `approval_status === "approved"` AND `active === true`.
- Routing lives in `App.tsx`: each route renders only for allowed statuses,
  else redirects to that status's home path.
- After Google OAuth redirect, Supabase restores the session
  (`detectSessionInUrl: true`) and `onAuthStateChange` fires → profile is refetched.

## Access model (READ THIS BEFORE TOUCHING AUTH)
Signup is **auto-approved** — there is no approval queue, and no
`approve`/`reject`/`reapply` endpoints (they were removed; calling them 404s).
Access is controlled by three independent switches:

| Switch | Set by | Effect | Restored by |
|---|---|---|---|
| `doctor.active` | platform admin (`/admin/doctors/{id}/revoke`) | blocked in **every** clinic | `/admin/doctors/{id}/activate` |
| membership `active` | clinic admin (`/clinics/me/members/{id}/revoke`) | blocked in **that clinic only** | `/clinics/me/members/{id}/activate` |
| `clinic.active` | platform admin (`/admin/clinics/{id}/revoke`) | clinic closed for **everyone** | `/admin/clinics/{id}/activate` |

`AuthStatus` only knows the first (`/auth/me` carries no membership flags):
`revoked` = globally disabled, `no_clinic` = nothing selected yet. The other two
are detected by `ClinicGate` via `GET /clinics/mine`, which also offers a switch
to another clinic — a doctor blocked in one clinic may still work in others.
**There is no self-service re-request**; only an admin can restore access.

## Clinics & data scoping (important)
- A doctor can belong to **several clinics** (`ClinicMember`); `doctor.clinic_id`
  is merely the *currently-selected* one, changed with `POST /clinics/switch`.
- Within a clinic the membership `role` decides visibility: **clinic admin**
  (whoever created the clinic) sees every patient/consultation in it; a regular
  member sees only the records they created. Cross-scope reads return **404**,
  so the FE needs no filtering of its own.
- `Doctor` carries `clinic_id` + `clinic_name`; a doctor with `clinic_id === null`
  works against the shared "unassigned" pool until they create or join one.
- Onboarding is **self-service**: `POST /clinics` (create, returns a `join_code`)
  or `POST /clinics/join` (join by code). Both work while `approval_status` is
  still `pending`, which is why the registration wizard sets the clinic up right
  after `POST /auth/register` — `/clinics` needs the doctor row to exist first.
- **Adding a colleague = sharing the join code.** There is no invite endpoint;
  the Clinic page surfaces the code to copy.
- **Admin views never return patient PII** (DPDP): `ConsultationAdmin` has an
  opaque `patient_id` and no name/phone — don't try to display patient names there.

## Backend API contract (what the FE uses)
Base URL = `VITE_API_BASE_URL`. All authed requests send `Authorization: Bearer <supabase_jwt>`.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/auth/me` | current doctor profile | 404 = not registered yet |
| PATCH | `/auth/me` | doctor self-updates own profile | `{full_name?, phone?, address?, specialty?, registration_no?}`; email/role/approval not editable |
| POST | `/auth/register` | create profile for the signed-in user | body: `{full_name, phone?, specialty?, registration_no?, address?}` |
| POST | `/auth/reapply` | rejected doctor requests access again | → `pending` + re-activated; **409 unless `approval_status === "rejected"`** |
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
- `npm run preview` — serves `dist/` on :4173 (the only way to test the
  obfuscated production output; dev builds skip that step entirely)
- `npm run lint` — eslint, 0 warnings allowed
- `npm run format` — prettier

## Production build (vite.config.ts)
- **Every route is lazy.** The entry chunk is the shell + auth bootstrap +
  router; each page brings its own icons, and `landing.css` is imported by
  `LandingPage` so the marketing styles never load for a doctor.
- **Vendor split** by library (`react`, `supabase`, `gsap`, `vendor`) so a
  release doesn't evict them from the browser cache. `lucide-react` is
  deliberately NOT grouped — one icon chunk would drag every icon in the app
  into the first paint.
- **Filenames are hashes only** (`assets/[hash].js`), so the bundle stops
  advertising the page/component structure.
- **Obfuscation** (`medivaani:obfuscate-app-chunks`) runs on app chunks in
  `generateBundle`. Two ways to get this wrong, both already tried:
  obfuscating *source* rewrites `import("…")` specifiers so Rollup can't follow
  them and route splitting collapses to one chunk; obfuscating in `renderChunk`
  hides Rollup's `!~{007}~` placeholders inside the encoded string array, so
  every lazy route 404s. Vendor chunks are skipped.
- **Terser** mangles top-level names, strips comments, and drops
  `console.log/info/debug` — `console.warn`/`error` survive on purpose.
- After changing any of this, run `npm run build && npm run preview` and load a
  lazy route; a broken module graph only shows up at runtime.

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
