import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, applyToJob, postJob, login, logout } from './helpers.js'

// Curated end-to-end round trip for Feature 1 (Chat): candidate applies,
// messages the employer from their Applications list, the employer opens
// the same conversation from their Applications list and replies, and the
// candidate sees the reply after logging back in. Cross-role authorization
// (who can access what) is already covered exhaustively and far more
// cheaply by tests/rules/chat.test.js — this spec's job is to prove the
// real UI wiring (routes, nav, realtime subscriptions) actually works end
// to end, which the rules layer alone can't show.
test('candidate and employer can message each other about a real application', async ({ page }) => {
  // This spec does noticeably more sequential work than its neighbors --
  // two full registrations, a job post, an application, two message
  // round-trips each preceded by a full logout/login cycle, plus a reload
  // persistence check -- so the suite's default 30s per-test budget
  // (playwright.config.js) is comfortably enough in isolation but can run
  // out under full-suite concurrent load before reaching the later steps,
  // regardless of how generous any individual assertion's own timeout is.
  test.setTimeout(60000)

  const empEmail = await registerEmployer(page)
  const jobId = await postJob(page, { title: 'E2E Chat Role', companyName: 'ChatCo' })
  await logout(page)

  const candEmail = await registerCandidate(page)
  await applyToJob(page, jobId)

  // Candidate starts the conversation from their Applications list.
  await page.goto('/candidate/applications', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Message' }).click()
  await page.waitForURL(/\/candidate\/chat\/.+/, { timeout: 10000 })

  await page.getByLabel('Message', { exact: true }).fill('Hi, I am very interested in this role.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Hi, I am very interested in this role.')).toBeVisible({ timeout: 10000 })

  await logout(page)

  // Employer opens the same conversation from their Applications list and
  // sees the candidate's message, then replies.
  await login(page, empEmail)
  await expect(page).toHaveURL(/\/employer$/)
  await page.goto('/employer/applications', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Message' }).click()
  await page.waitForURL(/\/employer\/chat\/.+/, { timeout: 10000 })
  await expect(page.getByText('Hi, I am very interested in this role.')).toBeVisible({ timeout: 10000 })

  await page.getByLabel('Message', { exact: true }).fill('Thanks for applying, let us schedule a call.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Thanks for applying, let us schedule a call.')).toBeVisible({ timeout: 10000 })

  await logout(page)

  // Candidate sees the employer's reply, the unread indicator on the Chat
  // nav item, and the conversation persists across a full reload.
  await login(page, candEmail)
  await expect(page).toHaveURL(/\/candidate\/home$/)
  // Generous timeout: a fresh login (Auth token mint) immediately followed
  // by a Firestore realtime listener attaching and populating has more
  // moving parts than most assertions in this suite.
  await expect(page.locator('a[href="/candidate/chat"] [aria-label="Unread messages"]')).toBeVisible({ timeout: 20000 })

  await page.goto('/candidate/chat', { waitUntil: 'domcontentloaded' })
  await page.getByText('ChatCo').click()
  await expect(page.getByText('Thanks for applying, let us schedule a call.')).toBeVisible({ timeout: 10000 })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Hi, I am very interested in this role.')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Thanks for applying, let us schedule a call.')).toBeVisible({ timeout: 10000 })

  // Opening the conversation cleared the unread indicator.
  await page.goto('/candidate/home', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('a[href="/candidate/chat"] [aria-label="Unread messages"]')).toHaveCount(0)
})
