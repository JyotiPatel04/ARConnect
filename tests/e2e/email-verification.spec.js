import { test, expect } from '@playwright/test'
import { verifyEmailViaEmulator, uniqueEmail, PASSWORD } from './helpers.js'

// Phase 17 P1: an employer must verify their email before posting a job.
// registerEmployer() verifies via the emulator automatically for every
// OTHER spec's convenience -- this one deliberately does its own
// registration so it can observe the gate in its genuinely-unverified
// state first, then prove it unlocks once verified.
test('employer: cannot post a job until email is verified, then can after verifying', async ({ page }) => {
  const email = uniqueEmail('unverified-emp')
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: "I'm an Employer" }).click()
  await page.getByLabel('Full Name').fill('Unverified Employer')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/employer/, { timeout: 15000 })

  await page.goto('/employer/jobs/new', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/verify your email/i)).toBeVisible({ timeout: 8000 })
  await expect(page.getByLabel('Job Title')).toHaveCount(0)

  await verifyEmailViaEmulator(email)
  await page.getByRole('button', { name: /verified.*refresh/i }).click()

  await expect(page.getByLabel('Job Title')).toBeVisible({ timeout: 10000 })
})
