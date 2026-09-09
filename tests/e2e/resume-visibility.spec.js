import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, uniqueEmail } from './helpers.js'

// Curated end-to-end coverage for P1-1 (Employer Resume Visibility): the
// candidate's resume reference is copied onto their application at apply
// time (see applicationService.applyToJob), so an employer reviewing that
// application can see it -- and only that employer, since it rides on the
// application document they already legitimately read. The rules-level
// ownership/immutability guarantees are covered far more cheaply and
// exhaustively by tests/rules/applications.test.js -- this spec's job is
// to prove the real UI actually wires that together against live data.
test('employer sees a candidate\'s resume on their application, and no broken link when there is none', async ({ page, browser }) => {
  test.setTimeout(60000)

  const jobTitle = `E2E Resume Job ${Date.now()}`
  await registerEmployer(page)
  const jobId = await postJob(page, { title: jobTitle })

  // Candidate WITH a resume.
  const candWithResumeContext = await browser.newContext()
  const candWithResumePage = await candWithResumeContext.newPage()
  const candWithResumeName = 'E2E Resume Candidate'
  await registerCandidate(candWithResumePage, { email: uniqueEmail('resume-cand'), fullName: candWithResumeName })

  await candWithResumePage.goto('/candidate/profile', { waitUntil: 'domcontentloaded' })
  await candWithResumePage.getByLabel('Upload resume file').setInputFiles({
    name: 'resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 minimal test resume'),
  })
  await expect(candWithResumePage.getByText('Resume uploaded.')).toBeVisible({ timeout: 10000 })

  await applyToJob(candWithResumePage, jobId)
  await candWithResumeContext.close()

  // Candidate WITHOUT a resume -- applies straight away, never visits
  // /candidate/profile at all.
  const candNoResumeContext = await browser.newContext()
  const candNoResumePage = await candNoResumeContext.newPage()
  const candNoResumeName = 'E2E No-Resume Candidate'
  await registerCandidate(candNoResumePage, { email: uniqueEmail('noresume-cand'), fullName: candNoResumeName })
  await applyToJob(candNoResumePage, jobId)
  await candNoResumeContext.close()

  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candWithResumeName, { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(candNoResumeName, { exact: true })).toBeVisible()

  // Same "walk up from the text node to its own ApplicationRow card"
  // pattern already used by tests/e2e/employer-dashboard.spec.js, so each
  // assertion is scoped to the right candidate's row, not the page at large.
  const resumeRow = page
    .getByText(candWithResumeName, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  const viewResumeLink = resumeRow.getByRole('link', { name: /view resume/i })
  await expect(viewResumeLink).toBeVisible({ timeout: 10000 })
  const href = await viewResumeLink.getAttribute('href')
  expect(href).toContain('resumes%2F')
  expect(href).toContain('resume.pdf')

  // The row for the candidate with NO resume shows no resume link at all
  // -- not a broken one, not an error, just absent.
  const noResumeRow = page
    .getByText(candNoResumeName, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]')
  await expect(noResumeRow.getByRole('link', { name: /view resume/i })).toHaveCount(0)
})
