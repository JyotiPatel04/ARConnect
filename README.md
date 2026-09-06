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
functions/           # Cloud Functions source (AI match scoring, email notifications) — not deployed
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
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket (used for candidate resume uploads — see [Resume upload / Firebase Storage status](#resume-upload--firebase-storage-status)) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_USE_FIREBASE_EMULATOR` | Optional. Set to `true` in a local `.env.local` (never `.env`) to point the app at the local Firebase Emulator Suite instead of the real project. Leave unset for normal development. |

None of these values are secrets in the traditional sense (Firebase Web config is safe to ship to the browser — real authorization happens in Firestore Security Rules, not by hiding this config), but they're still kept out of version control by convention. **Never commit a filled-in `.env` file.**

## Firebase setup overview

The project (`arconnect-7337f`) needs, at minimum:
1. **Authentication** → Email/Password sign-in method enabled.
2. **Cloud Firestore** → created in Native mode, with `firestore.rules` deployed (see below).

Cloud Functions are **not required** for the app to run — nothing shipped uses them yet. Firebase Storage is used by one feature (candidate resume upload) but is **not required either** — the app runs fully without it, falling back to a plain resume-link URL field. See [Resume upload / Firebase Storage status](#resume-upload--firebase-storage-status) before relying on file upload in production.

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
| `npm run test:rules` | Vitest + `@firebase/rules-unit-testing`, via `firebase emulators:exec` | `firestore.rules` directly: role escalation, ownership, the full application status-transition matrix, withdrawal lifecycle, interview lifecycle/lockdown, notification recipient verification, suspension enforcement. Also `storage.rules`: resume upload/read/delete ownership, content-type and size limits. The emulator is started fresh and torn down automatically for this one command — nothing lingers. |
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

## Resume upload / Firebase Storage status

Candidates can upload a resume file (PDF/DOC/DOCX, 5MB max) from their Profile page, in addition to the existing resume-link URL field — both are supported at once; the app never forces a choice between them. This is the first feature in the app to use Firebase Storage.

**In production today, uploads will fail** with a clear error until Storage is actually enabled for this project, because:
1. Cloud Storage for Firebase now requires the project to be on the **Blaze (pay-as-you-go)** plan — the same requirement already documented above for Cloud Functions. This has not been enabled for `arconnect-7337f`, deliberately, per this project's standing "never enable Blaze without an explicit decision" rule.
2. Once on Blaze, Storage itself still needs to be initialized once for the project (Firebase Console → Build → Storage → Get started), which provisions the default bucket referenced by `VITE_FIREBASE_STORAGE_BUCKET`.
3. `storage.rules` (committed, tested against the local Storage emulator, never yet deployed) needs `firebase deploy --only storage` run once after that.

None of the three steps above happen automatically — they're a deliberate decision for whoever owns this project's billing, exactly like the Blaze decision already made (and still not taken) for Cloud Functions/AI matching.

**Nothing else breaks in the meantime.** `getStorage()` only constructs a client SDK handle at app startup — it makes no network call, so the rest of the app is completely unaffected by Storage being unavailable. The resume-link URL field keeps working exactly as before regardless of whether Storage is ever enabled.

## Email notifications status

In addition to the existing in-app notification bell (unchanged), the app can send real transactional emails for the events that matter most: a new application (to the employer), an application status change including hired/not-selected (to the candidate), and interview scheduled/updated/cancelled (to the candidate). This is implemented as a Cloud Function (`sendNotificationEmail` in `functions/index.js`, Firestore-triggered on `notifications/{id}` creation) that sends via [Resend](https://resend.com)'s HTTP API — **fully implemented and unit-tested, but intentionally not deployed**, for the same reason as AI matching: Cloud Functions require the Blaze plan.

**Nothing changes in the meantime.** In-app notifications are created exactly as before, by the same client code, for the same events — this feature only adds an *additional*, independent side effect (an email) to notification types that already exist. Until `sendNotificationEmail` is deployed, no code path anywhere calls it, so today's behavior (in-app only) is completely unaffected.

**Before this goes live in production**, three things need to happen, none of them automatic:
1. Enable Blaze for `arconnect-7337f` (same standing decision already documented above for Cloud Functions/AI matching and Storage).
2. Create a Resend account, verify a sending domain, and set the `RESEND_API_KEY` secret — see `functions/SECRET_SETUP.md`.
3. Deploy: `firebase deploy --only functions:sendNotificationEmail`.

Until all three happen, `sendNotificationEmail` is simply never running (Functions aren't deployed at all yet), so this is a strict superset of the existing "Cloud Functions not deployed" state — no new production risk is introduced by having this code merged.

Run `cd functions && npm test` to run its test suite (`functions/src/email/`), same as the existing AI matching tests.

## Security notes

- Authorization is enforced by **Firestore Security Rules**, not by the UI. Route guards (`ProtectedRoute`) are a UX convenience — the actual boundary is server-side.
- There is no public path to an admin account, ever — see [Admin account bootstrap](#admin-account-bootstrap).
- The Cloud Functions "AI matching" secret (`ANTHROPIC_API_KEY`) is declared as a Secret Manager reference in `functions/index.js` but is inert until Functions are actually deployed with Blaze enabled — see `functions/SECRET_SETUP.md`.
- Same for the email-notifications secret (`RESEND_API_KEY`) — declared, never fetched or exposed client-side, inert until `sendNotificationEmail` is deployed with it bound. No provider key of any kind ever reaches the React app; email sending only ever happens inside the Cloud Function, using the Admin SDK's already-trusted server-side read of `users/{uid}` for the recipient's address — a client can never trigger an arbitrary email, only the existing, already-rules-validated notification-creation paths can.
- No email verification is currently required at signup for candidates/employers.

## Known limitations

- **Chat is not implemented.** The candidate UI marks it "Coming Soon" rather than implying it's available, pending a decision on whether to build it.
- Candidate resume file upload is implemented and tested against the local Storage emulator, but **not yet usable in production** — it requires the Blaze plan and Storage to actually be enabled for the project; see [Resume upload / Firebase Storage status](#resume-upload--firebase-storage-status). The resume-link URL field keeps working regardless. No avatar/logo file upload exists yet — those remain link fields.
- AI matching is a deterministic stub, not the real Claude-backed scorer, until Blaze is enabled (see above).
- Email notifications are implemented but not live in production until Blaze is enabled, a Resend account/domain is set up, and `sendNotificationEmail` is deployed — see [Email notifications status](#email-notifications-status). No email preference/opt-out system exists yet (there was nothing to build on — `users`/`candidateProfiles`/`companyProfiles` have no notification-preference fields today); every email this feature sends mirrors an in-app notification the recipient would see anyway. A per-user email opt-out is a reasonable future enhancement, not implemented here to avoid inventing a preference-management feature beyond what was asked for.
- Interview-related emails only ever go to the candidate, never the employer, because that's also true of the existing in-app interview notifications — no employer-facing interview notification exists to mirror. Extending in-app notifications to employers for interview events (if ever wanted) would need to happen before an employer-facing email could exist for them.
- CI (`.github/workflows/ci.yml`) is committed and ready but has not actually run anywhere yet — this repository has no Git remote configured, and GitHub Actions requires one.
- No email verification is required at signup for candidates/employers (also noted under [Security notes](#security-notes)).
- `applications.update`'s employer branch has no FROM-state lock — an employer can move an application between any of the six employer-owned statuses in either direction (including e.g. `hired` back to `applied`). Confirmed intentional, existing product behavior (the employer status dropdown has always allowed this across all three pages that use it), not a gap — documented in `firestore.rules` directly above that rule.
