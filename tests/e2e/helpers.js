// Shared helpers for the curated E2E suite. Kept deliberately small and
// boring: every spec composes these instead of hand-rolling its own
// register/login/post-job flow, so the suite stays maintainable rather
// than growing into several huge, near-duplicate scripts.

export const PASSWORD = 'E2eTest123!'

const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const PROJECT_ID = 'arconnect-7337f'

export function uniqueEmail(tag) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`
}

// Firebase Auth Emulator only -- completes the email-verification flow a
// real user triggers by clicking the link in their inbox, without any real
// SMTP involved. The emulator exposes pending "out of band" action codes
// (verification, password reset, ...) over a REST endpoint precisely so
// automated tests can drive this; this endpoint doesn't exist against
// production Firebase Auth, so this helper can never reach anything but
// the local emulator (host is hardcoded to 127.0.0.1).
export async function verifyEmailViaEmulator(email) {
  const listRes = await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/oobCodes`)
  const { oobCodes } = await listRes.json()
  const pending = oobCodes.filter((c) => c.email === email && c.requestType === 'VERIFY_EMAIL')
  const match = pending[pending.length - 1]
  if (!match) throw new Error(`verifyEmailViaEmulator: no pending verification code found for ${email}`)

  const applyRes = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode: match.oobCode }),
    }
  )
  if (!applyRes.ok) throw new Error(`verifyEmailViaEmulator: failed to apply verification code for ${email}`)
}

export async function registerCandidate(page, { email, fullName = 'E2E Candidate' } = {}) {
  const finalEmail = email || uniqueEmail('cand')
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Full Name').fill(fullName)
  await page.getByLabel('Email').fill(finalEmail)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/candidate/, { timeout: 15000 })
  return finalEmail
}

// Verifies email via the emulator as part of registration -- Phase 17
// gates job posting on a verified email (both in the UI and in
// firestore.rules), so every OTHER spec that just wants a normal,
// already-verified employer can keep using this helper unchanged.
// email-verification.spec.js deliberately does its own registration
// instead, so it can observe the gate in its genuinely-unverified state.
export async function registerEmployer(page, { email, fullName = 'E2E Employer' } = {}) {
  const finalEmail = email || uniqueEmail('emp')
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: "I'm an Employer" }).click()
  await page.getByLabel('Full Name').fill(fullName)
  await page.getByLabel('Email').fill(finalEmail)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/employer/, { timeout: 15000 })
  await verifyEmailViaEmulator(finalEmail)
  return finalEmail
}

export async function login(page, email, password = PASSWORD) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
}

export async function logout(page) {
  // Scoped to <header>/<aside> -- the persistent layout chrome that renders
  // its own Log Out control on every authenticated page (CandidateLayout's
  // header icon button, EmployerLayout/AdminLayout's sidebar button).
  // CandidateProfilePage and EmployerProfilePage each also render their own
  // page-level "Log Out" button inside <main>, which an unscoped
  // getByRole('button', { name: /log ?out/i }) matches too -- excluding
  // <main> keeps this helper working from any page, including those.
  await page.locator('header, aside').getByRole('button', { name: /log ?out/i }).click()
  await page.waitForURL(/\/auth\/login|\/$/, { timeout: 10000 })
}

// location/jobType/workMode/experienceLevel/skills are all optional and
// left unset by default (the form's own defaults apply, unchanged from
// before these params existed) -- added for job-alerts.spec.js, which
// needs to control these fields to construct a deliberately non-matching
// job; every pre-existing caller is unaffected since it never passes them.
export async function postJob(
  page,
  { title, companyName = 'E2E Co', description = 'An E2E test job posting.', location, jobType, workMode, experienceLevel, skills }
) {
  await page.goto('/employer/jobs/new', { waitUntil: 'domcontentloaded' })

  // registerEmployer() already verified the account server-side via the
  // emulator, but the browser's own session doesn't know that yet -- its
  // current ID token was minted before verification happened. The app
  // shows a gate until the token is refreshed; clicking through it here is
  // exactly what a real user would do after verifying in another tab.
  // Whichever actually renders (gate or form) can take a moment after a
  // fresh navigation, since auth state + the Firestore profile fetch both
  // resolve first -- wait generously for either rather than racing two
  // short, independently-timed waits.
  const refreshButton = page.getByRole('button', { name: /verified.*refresh/i })
  const jobTitleField = page.getByLabel('Job Title')
  await refreshButton.or(jobTitleField).waitFor({ state: 'visible', timeout: 15000 })
  if (await refreshButton.isVisible()) {
    await refreshButton.click()
    await jobTitleField.waitFor({ state: 'visible', timeout: 10000 })
  }

  await page.getByLabel('Job Title').fill(title)
  await page.getByLabel('Company Name').fill(companyName)
  if (location) await page.getByLabel('Location').selectOption(location)
  if (jobType) await page.getByLabel('Job Type').selectOption(jobType)
  if (workMode) await page.getByLabel('Work Mode').selectOption(workMode)
  if (experienceLevel) await page.getByLabel('Experience Level').selectOption(experienceLevel)
  await page.getByLabel('Min Salary (₹/month)').fill('15000')
  await page.getByLabel('Max Salary (₹/month)').fill('25000')
  await page.getByLabel('Skills (comma separated)').fill(skills || 'Testing')
  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Publish Job' }).click()

  let jobId = ''
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    const path = new URL(page.url()).pathname
    if (/^\/employer\/jobs\/[^/]+$/.test(path) && !path.endsWith('/new')) {
      jobId = path.split('/').pop()
      break
    }
    await page.waitForTimeout(400)
  }
  if (!jobId) throw new Error('postJob: job did not publish within the timeout')
  return jobId
}

export async function applyToJob(page, jobId) {
  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Apply Now' }).click()
  await page.getByRole('button', { name: 'Applied', exact: true }).waitFor({ timeout: 10000 })
}

export function futureLocalDateTime(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function scheduleInterview(page, { daysAhead = 2, durationMinutes = '30', type = 'online' } = {}) {
  await page.getByRole('button', { name: 'Schedule Interview' }).click()
  await page.getByLabel('Date & Time').fill(futureLocalDateTime(daysAhead))
  await page.getByLabel('Duration (minutes)').fill(durationMinutes)
  await page.locator('#interview-type').selectOption(type)
  if (type === 'online') {
    await page.getByLabel('Meeting Link').fill('https://meet.example.com/e2e')
  }
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  await page.getByText(/Interview Scheduled/i).waitFor({ timeout: 10000 })
}
