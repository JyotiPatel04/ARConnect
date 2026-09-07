import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, login, logout } from './helpers.js'

// Curated end-to-end round trip for Job Alerts: candidate configures
// preferences, an employer posts a matching job AND a deliberately
// non-matching job, the candidate revisits the Jobs page (which mounts
// useJobAlertMatcher), and only the matching job produces a notification
// -- which then stays a single notification even after a second visit
// (duplicate prevention). Cross-user authorization is already covered
// exhaustively and far more cheaply by tests/rules/jobAlerts.test.js --
// this spec's job is to prove the real UI wiring (preferences form, the
// matcher hook, the notification it produces) actually works end to end.
test('candidate receives an in-app alert only for a job matching their preferences, never duplicated', async ({ page }) => {
  test.setTimeout(60000)

  // A unique, per-run skill string is the ONLY match criterion this test
  // sets -- deliberately, not location/jobType/workMode. Every other spec
  // in this suite posts jobs via the SAME postJob() helper using its
  // default location/jobType/workMode (Varanasi/Full-time/Onsite) and its
  // default skill ("Testing"), all sharing ONE Firestore emulator across
  // the whole npm run test:e2e run -- constraining on any of those shared
  // defaults would make this test accidentally match jobs posted by
  // unrelated specs running in the same suite. A fresh, unique skill
  // string can never collide with anything any other spec ever posts.
  const uniqueSkill = `JobAlertE2E${Date.now()}`

  const candEmail = await registerCandidate(page)

  await page.goto('/candidate/job-alerts', { waitUntil: 'domcontentloaded' })
  // Alerts default to enabled -- confirm that explicitly before relying on it.
  await expect(page.getByRole('switch', { name: 'Enable job alerts' })).toHaveAttribute('aria-checked', 'true')
  await page.getByLabel('Skills (comma separated)').fill(uniqueSkill)
  await page.getByRole('button', { name: 'Save Preferences' }).click()
  await expect(page.getByText('Preferences saved.')).toBeVisible({ timeout: 10000 })

  await logout(page)

  // Employer posts a job carrying the unique skill (matches), and a
  // second job that does not (uses postJob's default "Testing" skill).
  await registerEmployer(page)
  await postJob(page, { title: 'E2E Alert Match Role', companyName: 'AlertCo', skills: uniqueSkill })
  await postJob(page, { title: 'E2E Alert Non-Match Role', companyName: 'OtherCo' })
  await logout(page)

  // Candidate revisits the Jobs page -- this mounts useJobAlertMatcher,
  // which runs the check once for this visit. useJobAlertMatcher is
  // fire-and-forget (no UI loading state by design), and its own async
  // work (read preferences, query jobs, batch-write the match + notification)
  // takes a few sequential Firestore round trips -- navigating away
  // immediately via page.goto() performs a real browser navigation that
  // can tear down the page (and the in-flight check with it) before any
  // of that completes, so this waits for the page to render AND gives the
  // background check a moment to actually finish first.
  await login(page, candEmail)
  await page.goto('/candidate/jobs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Search Jobs' })).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(3000)

  await page.goto('/candidate/notifications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('New job matching your preferences')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('E2E Alert Match Role', { exact: false })).toBeVisible()
  await expect(page.getByText('E2E Alert Non-Match Role', { exact: false })).toHaveCount(0)

  // Mark the alert notification as read via the existing generic mechanism.
  await page.getByText('New job matching your preferences').click()
  await expect(page.getByText('Mark all read')).toHaveCount(0)

  // Revisiting the Jobs page again must not produce a second notification
  // for the same job -- the create-only match marker structurally
  // prevents it.
  await page.goto('/candidate/jobs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Search Jobs' })).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(3000) // let the second background check actually finish before navigating away

  await page.goto('/candidate/notifications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('New job matching your preferences')).toHaveCount(1)
})
