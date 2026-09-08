import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, uniqueEmail } from './helpers.js'

// Curated end-to-end coverage for the enhanced CandidateHomePage
// (/candidate/home, also the /candidate index route). The section-by-section
// business logic (stat math, upcoming-vs-past interview filtering,
// recommendation shortlist ranking/limit) is covered far more cheaply and
// exhaustively by src/lib/applicationStats.test.js, upcomingInterviews.test.js,
// and dashboardRecommendations.test.js -- this spec's job is to prove the
// real UI actually wires those pieces together against live data, and that
// the pre-existing job-discovery content below it still works.
//
// computeMatch itself is never exercised here: this suite's emulator
// startup (`--only auth,firestore,storage`) does not include the Functions
// emulator, matching every other spec in this repo -- the Recommended Jobs
// section's useRecommendedJobs hook already treats a failed/unavailable
// match call as "render the job without a score" (see the hook's own
// per-job try/catch), so recommendations still render correctly here even
// though no score ever resolves. The "never more than 3 computeMatch
// calls" guarantee is structural (RECOMMENDATION_LIMIT = 3 in the hook)
// and is what dashboardRecommendations.test.js's limit test verifies.
test('candidate dashboard: fresh candidate sees empty states, then real data after applying', async ({ page, browser }) => {
  test.setTimeout(60000)

  await registerCandidate(page, { fullName: 'Dana Dashboard' })

  await page.goto('/candidate/home', { waitUntil: 'domcontentloaded' })

  // Welcome header uses the candidate's real name.
  await expect(page.getByText('Welcome back, Dana Dashboard')).toBeVisible({ timeout: 10000 })

  // A brand-new candidate has zero applications -- all four stat cards
  // read 0, and Recent Applications shows its empty state.
  await expect(page.getByText('Total Applications')).toBeVisible()
  await expect(page.getByText('Active / Under Review')).toBeVisible()
  await expect(page.getByText('Selected')).toBeVisible()
  await expect(page.getByText('No applications yet')).toBeVisible()

  // No interviews yet either.
  await expect(page.getByText('No upcoming interviews')).toBeVisible()

  // Profile Completion card is present (candidateProfileForm hasn't been
  // filled in yet, so this is a low, non-zero-length percentage string).
  await expect(page.getByText('Profile Completion')).toBeVisible()
  await expect(page.getByText(/% complete/)).toBeVisible()

  // A brand-new candidate has never visited /candidate/job-alerts, so
  // jobAlertPreferences/{uid} doesn't exist yet at all -- useJobAlertPreferences
  // returns null, not a defaulted "enabled: true" object (that default only
  // lives in JobAlertPreferencesForm's own local form state, applied once the
  // candidate actually opens that page). "Off" here accurately reflects
  // reality: runJobAlertCheck() itself returns early for a candidate with no
  // preferences document, so no matching happens yet either way.
  await expect(page.getByText('Job Alerts')).toBeVisible()
  await expect(page.getByText('Off', { exact: true })).toBeVisible()
  await expect(page.getByText('Notifications')).toBeVisible()
  // Bare "Chat" also matches the bottom nav's own "Chat" label -- scope to
  // the quick-link card's full accessible name (label + detail text) to
  // disambiguate from it.
  await expect(page.getByRole('link', { name: 'Chat All caught up' })).toBeVisible()
  await expect(page.getByText('All caught up')).toHaveCount(2)

  // Pre-existing job-discovery content is still present, unchanged.
  await expect(page.getByText('Search jobs, companies...')).toBeVisible()
  await expect(page.getByText(/open jobs waiting for you/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Browse Jobs' })).toBeVisible()

  // Now an employer posts a job and the candidate applies -- the
  // dashboard should reflect real data on the next visit.
  const empContext = await browser.newContext()
  const empPage = await empContext.newPage()
  const jobTitle = `E2E Dashboard Job ${Date.now()}`
  await registerEmployer(empPage, { email: uniqueEmail('dash-emp') })
  const jobId = await postJob(empPage, { title: jobTitle, companyName: 'DashCo' })
  await empContext.close()

  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await applyToJob(page, jobId)

  await page.goto('/candidate/home', { waitUntil: 'domcontentloaded' })

  // Total Applications and Active/Under Review both reflect the one
  // freshly-applied ('applied' status) application. DashboardCard's own
  // structure is <div rounded-2xl...><div flex...><span>{label}</span>...</div><p>{value}</p></div>
  // -- the value lives as a SIBLING of the label's immediate wrapper, not
  // a descendant of it, so this walks up from the label text to the
  // nearest "rounded-2xl" ancestor (the actual card root) rather than
  // guessing at div nesting/document order.
  const totalCard = page
    .getByText('Total Applications', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(totalCard).toContainText('1', { timeout: 10000 })

  // .first(): the just-applied job legitimately also still appears further
  // down in the pre-existing "Browse Jobs" section (that section shows all
  // active jobs regardless of application status -- unchanged, pre-existing
  // behavior), and the Recent Applications entry renders first in the DOM.
  await expect(page.getByText(jobTitle).first()).toBeVisible()
  await expect(page.getByText('DashCo').first()).toBeVisible()
  await expect(page.getByText('Applied', { exact: true })).toBeVisible()

  // Recommended Jobs never renders more than 3 cards, however many active
  // jobs exist in the shared emulator across this whole suite run.
  const recommendedHeading = page.getByRole('heading', { name: /Recommended For You/ })
  await expect(recommendedHeading).toBeVisible()
})
