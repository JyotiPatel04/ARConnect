import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, scheduleInterview, uniqueEmail } from './helpers.js'

// Curated end-to-end coverage for the enhanced EmployerDashboardPage
// (/employer, the existing dashboard route -- no new route was created).
// The section-by-section arithmetic (stat counts, upcoming-vs-past
// interview filtering) is the exact same reasoning already covered by
// src/lib/upcomingInterviews.test.js (reused here unchanged, not
// duplicated) -- this spec's job is to prove the real UI wires the
// existing employer hooks/services together correctly against live data.
//
// Every count here is naturally employer-scoped (jobs/applications/
// interviews all filter by employerId == this test's own employer uid),
// so unlike Job Alerts there's no cross-test contamination risk from other
// specs' data in the same shared emulator -- no unique-skill-style
// discriminator is needed.
test('employer dashboard: fresh employer sees empty states, then real data as jobs/applications/interviews accumulate', async ({
  page,
  browser,
}) => {
  test.setTimeout(60000)

  await registerEmployer(page, { email: uniqueEmail('emp-dash') })
  await page.goto('/employer', { waitUntil: 'domcontentloaded' })

  // Fresh employer: all four primary stats read 0, secondary sections show
  // their empty states, and the page doesn't crash on any of the new
  // cross-hook derivations.
  await expect(page.getByText('Active Jobs', { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Total Applications', { exact: true })).toBeVisible()
  await expect(page.getByText('Shortlisted', { exact: true })).toBeVisible()
  // .first(): the Upcoming Interviews section heading is always rendered
  // (only its contents -- EmptyState vs. list -- are conditional), so its
  // exact-text heading and the stat card's label coexist from the start.
  await expect(page.getByText('Upcoming Interviews', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('No applications yet')).toBeVisible()
  await expect(page.getByText('No upcoming interviews')).toBeVisible()
  // Active Jobs mini-list and Candidate Pipeline are conditionally
  // rendered only once there's data -- confirm neither section renders
  // prematurely for a brand-new employer.
  await expect(page.getByRole('heading', { name: 'Active Jobs', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Candidate Pipeline' })).toHaveCount(0)

  // Quick actions are present and link to the correct EXISTING routes
  // (no new routes were created for this dashboard).
  const postNewJob = page.getByRole('link', { name: 'Post New Job' })
  const manageJobs = page.getByRole('link', { name: 'Manage Jobs' })
  const viewApplications = page.getByRole('link', { name: 'View Applications' })
  await expect(postNewJob).toHaveAttribute('href', '/employer/jobs/new')
  await expect(manageJobs).toHaveAttribute('href', '/employer/jobs')
  await expect(viewApplications).toHaveAttribute('href', '/employer/applications')

  // Notifications/Chat quick links are present too.
  await expect(page.getByText('All caught up')).toHaveCount(2)

  // Post a job using the existing flow.
  const jobTitle = `E2E Employer Dashboard Job ${Date.now()}`
  const jobId = await postJob(page, { title: jobTitle, companyName: 'DashEmpCo' })

  await page.goto('/employer', { waitUntil: 'domcontentloaded' })
  // .first(): once the Active Jobs mini-list section renders (below), its
  // own "Active Jobs" <h2> heading shares the exact same text as the stat
  // card's label -- the stat grid always renders first in the DOM, so
  // .first() reliably resolves to the stat card, not the section heading.
  const activeJobsCard = page
    .getByText('Active Jobs', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(activeJobsCard).toContainText('1', { timeout: 10000 })
  // Active Jobs mini-list now renders with the posted job.
  await expect(page.getByRole('heading', { name: 'Active Jobs', exact: true })).toBeVisible()
  await expect(page.getByText(jobTitle).first()).toBeVisible()
  // Total Jobs reuses the same already-loaded jobs array (jobs.length) --
  // one active job means Total Jobs reads 1 too.
  const totalJobsCard = page
    .getByText('Total Jobs', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(totalJobsCard).toContainText('1', { timeout: 10000 })

  // A candidate applies -- Total Applications should reflect it.
  const candContext = await browser.newContext()
  const candPage = await candContext.newPage()
  const candName = 'E2E Dashboard Candidate'
  await registerCandidate(candPage, { email: uniqueEmail('emp-dash-cand'), fullName: candName })
  await applyToJob(candPage, jobId)
  await candContext.close()

  await page.goto('/employer', { waitUntil: 'domcontentloaded' })
  const totalAppsCard = page
    .getByText('Total Applications', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(totalAppsCard).toContainText('1', { timeout: 10000 })
  await expect(page.getByText(candName).first()).toBeVisible()
  // Candidate Pipeline now renders, showing the one 'applied' application.
  await expect(page.getByRole('heading', { name: 'Candidate Pipeline' })).toBeVisible()

  // Move the application to 'shortlisted' via the existing Applications
  // page flow (same status dropdown employer-journey.spec.js already
  // exercises) -- the dashboard's Shortlisted stat should pick it up.
  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candName, { exact: true })).toBeVisible({ timeout: 10000 })
  const statusSelect = page.getByLabel(`Status for ${candName}`)
  await statusSelect.selectOption('shortlisted')
  await expect(statusSelect).toHaveValue('shortlisted')

  await page.goto('/employer', { waitUntil: 'domcontentloaded' })
  // .first(): the Candidate Pipeline section (already rendering by now)
  // also shows a StatusBadge literally labeled "Shortlisted" -- same
  // reasoning as Active Jobs above, the stat grid renders first in the DOM.
  const shortlistedCard = page
    .getByText('Shortlisted', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(shortlistedCard).toContainText('1', { timeout: 10000 })

  // Schedule a future interview via the existing Applications page flow
  // (ApplicationRow's own "Schedule Interview" action) -- the dashboard's
  // Upcoming Interviews stat and list should reflect it.
  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candName, { exact: true })).toBeVisible({ timeout: 10000 })
  await scheduleInterview(page, { daysAhead: 3 })

  await page.goto('/employer', { waitUntil: 'domcontentloaded' })
  // .first(): the Upcoming Interviews section further down the page also
  // has an "Upcoming Interviews" <h2> heading with the exact same text.
  const upcomingCard = page
    .getByText('Upcoming Interviews', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(upcomingCard).toContainText('1', { timeout: 10000 })
  await expect(page.getByText(candName).first()).toBeVisible()
  await expect(page.getByText(jobTitle).first()).toBeVisible()

  // Move the application to 'hired' -- the dashboard's Hired stat card
  // (pipelineCounts.hired, already computed for the Candidate Pipeline
  // section) should pick it up.
  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candName, { exact: true })).toBeVisible({ timeout: 10000 })
  const hireSelect = page.getByLabel(`Status for ${candName}`)
  await hireSelect.selectOption('hired')
  await expect(hireSelect).toHaveValue('hired')

  await page.goto('/employer', { waitUntil: 'domcontentloaded' })
  const hiredCard = page
    .getByText('Hired', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(hiredCard).toContainText('1', { timeout: 10000 })
})
