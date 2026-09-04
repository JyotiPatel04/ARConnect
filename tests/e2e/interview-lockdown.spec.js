import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, postJob, applyToJob, scheduleInterview, uniqueEmail } from './helpers.js'

// Interview lifecycle (schedule/edit/complete/cancel) plus the Phase 13
// withdrawn-application lockdown: once a candidate withdraws, Edit and
// Mark Completed disappear from the UI (the rules deny them regardless;
// this proves the UI stays in sync with that), while Cancel remains.
test('interview: full lifecycle, then withdrawn-application lockdown', async ({ page, browser }) => {
  const candContext = await browser.newContext()
  const candPage = await candContext.newPage()

  const jobTitle = `E2E Interview Job ${Date.now()}`
  const candName = 'E2E Interview Candidate'
  await registerEmployer(page)
  const jobId = await postJob(page, { title: jobTitle })
  await registerCandidate(candPage, { email: uniqueEmail('iv-cand'), fullName: candName })
  await applyToJob(candPage, jobId)

  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(candName, { exact: true })).toBeVisible({ timeout: 10000 })
  await scheduleInterview(page)

  // Edit while still scheduled.
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.locator('#interview-type').selectOption('phone')
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await expect(page.getByText('Phone', { exact: false })).toBeVisible({ timeout: 10000 })

  // Candidate withdraws.
  await candPage.goto('/candidate/applications', { waitUntil: 'domcontentloaded' })
  await candPage.getByRole('button', { name: 'Withdraw Application' }).click()
  await candPage.getByRole('button', { name: 'Withdraw Application' }).last().click()
  await expect(candPage.getByText('Application withdrawn.')).toBeVisible({ timeout: 10000 })
  await candContext.close()

  // Employer view: Edit/Mark Completed gone, only Cancel remains.
  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Withdrawn', { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mark Completed' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(1)

  // Cancel is still allowed after withdrawal.
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel Interview' }).click()
  // ApplicationRow renders status+type as one combined text node
  // ("Interview Cancelled · Phone"), not a standalone "Cancelled" node.
  await expect(page.getByText('Interview Cancelled', { exact: false })).toBeVisible({ timeout: 10000 })
})
