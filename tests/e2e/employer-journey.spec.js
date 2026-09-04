import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, uniqueEmail } from './helpers.js'

// The critical employer path: post a job, review an application, and move
// it through the status pipeline -- including a backward transition, which
// is intentional product behavior (Phase 14), not a bug to guard against.
test('employer: post job, review application, change status (forward and backward)', async ({ page, browser }) => {
  const candContext = await browser.newContext()
  const candPage = await candContext.newPage()

  const jobTitle = `E2E Employer Journey Job ${Date.now()}`
  await registerEmployer(page)
  const jobId = await postJob(page, { title: jobTitle })

  const candName = 'E2E Employer Journey Candidate'
  await registerCandidate(candPage, { email: uniqueEmail('ej-cand'), fullName: candName })
  await applyToJob(candPage, jobId)
  await candContext.close()

  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candName, { exact: true })).toBeVisible({ timeout: 10000 })

  const statusSelect = page.getByLabel(`Status for ${candName}`)
  await statusSelect.selectOption('shortlisted')
  await expect(statusSelect).toHaveValue('shortlisted')

  // Backward transition -- deliberately still allowed (Phase 14 finding:
  // the employer status dropdown is intentionally free-form in both
  // directions, not a strict one-way pipeline).
  await statusSelect.selectOption('applied')
  await expect(statusSelect).toHaveValue('applied')
})
