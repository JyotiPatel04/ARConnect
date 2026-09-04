# ARConnect

A job portal connecting candidates and employers, with an internal admin console for platform moderation. Built as a Firebase-backed single-page app — React frontend, Firebase Authentication, and Cloud Firestore, with security enforced server-side through Firestore Security Rules rather than trusted to the client.

## Main features

**Candidates**
- Browse and search job listings, view AI-assisted match scores
- Apply to jobs, save jobs for later
- Track application status, view scheduled interviews (read-only)
- Manage a profile (skills, experience, resume link) and receive in-app notifications

**Employers**
- Post and manage job listings (publish, close, reopen)
- Review applicants, move applications through a status pipeline
- Schedule, edit, cancel, and complete candidate interviews
- Maintain a company profile

**Admin**
- Platform-wide dashboard (users, jobs, applications at a glance)
- Suspend/unsuspend candidates and employers, close/reopen any job
- Review candidate/employer-submitted reports
- Immutable moderation audit log
- Dedicated, non-public login at `/admin/login` (see [Admin account bootstrap](#admin-account-bootstrap))

## Technology stack

- **React 19** + **Vite 8** — SPA, dev server, production build
- **Tailwind CSS 4** — styling
- **react-router-dom 7** — client-side routing
- **Firebase Authentication** — email/password auth for all three roles
- **Cloud Firestore** — application data, gated by Firestore Security Rules
- **Cloud Functions** (written, currently **not deployed** — see [Known limitations](#known-limitations))
- **ESLint** — linting
- **Vitest**, **@firebase/rules-unit-testing**, **@playwright/test** — unit, Firestore security-rules, and end-to-end testing (see [Testing](#testing))

## Project structure

```
src/
  pages/            # route-level components, grouped by area
    auth/            # login, register, forgot-password, admin login
    candidate/       # candidate-facing pages
    employer/        # employer-facing pages
    admin/           # admin console pages
    prototype/       # mentor-approved UI/UX prototype — do not modify
  layouts/           # per-role shell layouts (nav, sidebar, header)
  components/        # shared UI, and role-scoped feature components
  hooks/             # data-fetching and auth hooks
  services/          # Firestore read/write functions (no UI logic)
  lib/               # form validation, formatting, small pure helpers
  context/           # AuthContext (Firebase Auth + user profile state)
functions/           # Cloud Functions source (AI match scoring) — not deployed
firestore.rules      # Firestore Security Rules — the real authorization layer
firebase.json        # Firebase project config (Firestore + Hosting)
```

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with **Authentication** (Email/Password provider) and **Cloud Firestore** enabled
- The [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`) for rules/hosting deployment

## Local development setup

```bash
npm install
cp .env.example .env      # then fill in your Firebase project's config values
npm run dev
```

The dev server runs against your **real** Firebase project by default (see [Environment variables](#required-environment-variables) for the emulator opt-in).

## Required environment variables

Set these in a local `.env` (never committed — see `.gitignore`). Values come from your Firebase project's Web App config (Firebase Console → Project Settings → General → Your apps):

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID (`arconnect-7337f` in production) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket (not currently used by any feature) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_USE_FIREBASE_EMULATOR` | Optional. Set to `true` in a local `.env.local` (never `.env`) to point the app at the local Firebase Emulator Suite instead of the real project. Leave unset for normal development. |

None of these values are secrets in the traditional sense (Firebase Web config is safe to ship to the browser — real authorization happens in Firestore Security Rules, not by hiding this config), but they're still kept out of version control by convention. **Never commit a filled-in `.env` file.**

## Firebase setup overview

The project (`arconnect-7337f`) needs, at minimum:
1. **Authentication** → Email/Password sign-in method enabled.
2. **Cloud Firestore** → created in Native mode, with `firestore.rules` deployed (see below).

Cloud Functions and Firebase Storage are **not required** for the app to run — neither is currently used by any shipped feature.

## Authentication setup

Firebase Authentication handles credential storage and sessions for all three roles (candidate, employer, admin) — there is only ever one auth system. A signed-up user's **role** lives in their `users/{uid}` Firestore document, not in Firebase Auth itself, and is what every route guard and every Firestore rule actually checks.

- Candidates and employers self-register at `/auth/register` (role chosen at signup, immutable afterward by rule).
- There is **no public admin signup** anywhere in the app, by design.

## Firestore setup

Deploy the security rules before pointing any real traffic at the project:

```bash
firebase deploy --only firestore:rules --project arconnect-7337f
```

`firestore.rules` is the authoritative access-control layer — every collection is default-denied until explicitly allowed, and role-based access (candidate/employer/admin) is verified server-side on every read and write. The UI's route guards are a convenience layer on top of this, not the actual security boundary.

## Admin account bootstrap

There is intentionally **no self-service way to become an admin** — this is a deliberate security boundary, not an oversight, and it's enforced by Firestore rules (a client can never write `role: "admin"` to their own user document). To create the first admin (or any admin) account:

1. Have the person create a normal account through `/auth/register` (candidate or employer — it doesn't matter which; alternatively, create the user directly in the Firebase Console → Authentication → Add user).
2. Copy that user's **Firebase Auth UID** (Firebase Console → Authentication → Users).
3. In Firebase Console → Firestore Database, open (or create) the document at `users/{UID}`.
4. Set the `role` field on that document to `"admin"`.
5. That's it — no other field changes are needed.

Admins sign in at **`/admin/login`** — a dedicated, unlinked route (it does not appear in any public navigation, candidate UI, or employer UI). Signing in there with a non-admin account is rejected with a clear message and the session is immediately signed back out; it never grants access to anything beyond the login page itself.

## How to run the frontend

```bash
npm run dev
```

## How to build

```bash
npm run build
```

Output goes to `dist/`.

## How to lint

```bash
npm run lint
```

## Testing

Three layers, all committed to the repo. **None of them ever touch the real `arconnect-7337f` project** — every layer either runs pure functions in memory, or is forced onto a local Firebase emulator, never production.

**Prerequisites** (beyond the app's own): a JVM (Java 11+) — the Firestore/Auth emulator needs it — and Chromium for Playwright, installed once via `npx playwright install chromium`.

| Command | Layer | What it covers |
|---|---|---|
| `npm run test:unit` | Vitest, plain Node | Every pure validation/formatting function under `src/lib/` — no emulator needed. |
| `npm run test:rules` | Vitest + `@firebase/rules-unit-testing`, via `firebase emulators:exec` | `firestore.rules` directly: role escalation, ownership, the full application status-transition matrix, withdrawal lifecycle, interview lifecycle/lockdown, notification recipient verification, suspension enforcement. The emulator is started fresh and torn down automatically for this one command — nothing lingers. |
| `npm run test:e2e` | `@playwright/test`, via `firebase emulators:exec` | Curated critical journeys through the real UI: the login-redirect regression, candidate apply/withdraw, employer post/review/status, interview lifecycle + withdrawn lockdown, admin login (both rejection and — using an emulator-only seeded admin account — the real success path). Builds a dedicated `--mode test` bundle first (forced into emulator mode via the committed `.env.test`, regardless of your local `.env`/`.env.local`), then runs against a local preview server. |
| `npm test` | all three, in order | What CI runs. |

Run any of these locally exactly as CI does — no extra setup beyond the prerequisites above and `npm ci`.

## Firebase Hosting deployment procedure

The build output (`dist/`) is what Hosting serves; `firebase.json` is already configured for it with the SPA rewrite every client-side route needs to survive a direct browser refresh.

```bash
npm run build
firebase deploy --only hosting --project arconnect-7337f
```

This deploys **only** the static frontend. It does not touch Firestore rules, Cloud Functions, or any Firestore data — those are separate, deliberately separate deploy targets (`--only firestore:rules`, `--only functions`).

## Cloud Functions / AI matching status

The real AI match-scoring Cloud Function (Claude-backed, with rate limiting and unit tests under `functions/src/matching/`) is **fully implemented but intentionally not deployed**, because doing so requires upgrading the Firebase project to the Blaze (pay-as-you-go) plan. Until that's a deliberate decision, job match scores are computed by a deterministic, non-LLM scoring function on the client/rules side — a stand-in, not a placeholder bug. Run `cd functions && npm test` to run its (currently unused-in-production) test suite.

## Security notes

- Authorization is enforced by **Firestore Security Rules**, not by the UI. Route guards (`ProtectedRoute`) are a UX convenience — the actual boundary is server-side.
- There is no public path to an admin account, ever — see [Admin account bootstrap](#admin-account-bootstrap).
- The Cloud Functions "AI matching" secret (`ANTHROPIC_API_KEY`) is declared as a Secret Manager reference in `functions/index.js` but is inert until Functions are actually deployed with Blaze enabled — see `functions/SECRET_SETUP.md`.
- No email verification is currently required at signup for candidates/employers.

## Known limitations

- **Chat is not implemented.** The candidate UI marks it "Coming Soon" rather than implying it's available, pending a decision on whether to build it.
- No resume/avatar file upload (Firebase Storage is not wired up); resumes are a link field.
- AI matching is a deterministic stub, not the real Claude-backed scorer, until Blaze is enabled (see above).
- CI (`.github/workflows/ci.yml`) is committed and ready but has not actually run anywhere yet — this repository has no Git remote configured, and GitHub Actions requires one.
- No email verification is required at signup for candidates/employers (also noted under [Security notes](#security-notes)).
- `applications.update`'s employer branch has no FROM-state lock — an employer can move an application between any of the six employer-owned statuses in either direction (including e.g. `hired` back to `applied`). Confirmed intentional, existing product behavior (the employer status dropdown has always allowed this across all three pages that use it), not a gap — documented in `firestore.rules` directly above that rule.
