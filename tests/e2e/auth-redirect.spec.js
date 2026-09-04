import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, login, logout } from './helpers.js'

// Permanent regression coverage for the production bug fixed in
// src/lib/authErrors.js / src/pages/auth/LoginPage.jsx: a successful login
// must never be redirected into a route the account's real role can't
// access, even when ProtectedRoute's stashed `from` path belongs to a
// DIFFERENT role (e.g. the visitor clicked the wrong portal's link, or is
// switching between their own candidate and employer accounts).
test.describe('auth redirect', () => {
  test('candidate login goes to the candidate dashboard', async ({ page }) => {
    const email = await registerCandidate(page)
    await logout(page)
    await login(page, email)
    await expect(page).toHaveURL(/\/candidate\/home$/)
  })

  test('employer login goes to the employer dashboard', async ({ page }) => {
    const email = await registerEmployer(page)
    await logout(page)
    await login(page, email)
    await expect(page).toHaveURL(/\/employer$/)
  })

  test('employer bounced from a candidate-only route still lands on the employer dashboard, not /unauthorized', async ({ page }) => {
    const email = await registerEmployer(page)
    await logout(page)
    await page.goto('/candidate/onboarding', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('E2eTest123!')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL(/\/employer/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/\/unauthorized/)
  })

  test('a legitimate same-role deep link is still honored after login', async ({ page }) => {
    const email = await registerCandidate(page)
    await logout(page)
    await page.goto('/candidate/saved-jobs', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 })
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('E2eTest123!')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL(/\/candidate\/saved-jobs$/, { timeout: 15000 })
  })

  test('a genuinely unauthorized role is still blocked (candidate cannot reach /admin)', async ({ page }) => {
    await registerCandidate(page)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/unauthorized$/)
  })

  test('unauthenticated visitor is blocked from every protected area', async ({ page }) => {
    await page.goto('/employer', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
