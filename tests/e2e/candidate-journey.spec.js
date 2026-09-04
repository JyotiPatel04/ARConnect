import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, uniqueEmail } from './helpers.js'

// The critical candidate path: discover a job, save it, apply, then
// withdraw -- covering the Phase 12/13 withdrawal feature end to end
// through the real UI, not just at the rules layer.
test('candidate: browse, save/unsave, apply, then withdraw', async ({ page, browser }) => {
  const empContext = await browser.newContext()
  const empPage = await empContext.newPage()
  const jobTitle = `E2E Candidate Journey Job ${Date.now()}`
  await registerEmployer(empPage, { email: uniqueEmail('cj-emp') })
  const jobId = await postJob(empPage, { title: jobTitle })
  await empContext.close()

  await registerCandidate(page)

  await page.goto('/candidate/jobs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 10000 })

  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /save job/i }).click()
  await expect(page.getByRole('button', { name: /unsave job/i })).toBeVisible({ timeout: 8000 })

  await page.goto('/candidate/saved-jobs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 8000 })

  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await applyToJob(page, jobId)

  await page.goto('/candidate/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 8000 })

  await page.getByRole('button', { name: 'Withdraw Application' }).click()
  await expect(page.getByText('Withdraw this application?')).toBeVisible()
  await page.getByRole('button', { name: 'Withdraw Application' }).last().click()
  await expect(page.getByText('Application withdrawn.')).toBeVisible({ timeout: 10000 })

  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Withdrawn', exact: true })).toBeVisible({ timeout: 8000 })
  await expect(page.getByRole('button', { name: 'Apply Now' })).toHaveCount(0)
})
