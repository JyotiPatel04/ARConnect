import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { registerCandidate, registerEmployer, postJob, login, logout, uniqueEmail } from './helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rules = readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8')

// Same seed-an-admin-directly technique as admin-security.spec.js -- there
// is deliberately no client-facing path to role: 'admin', so this is the
// only way to exercise the real admin approval flow end to end.
let adminEmail
const adminPassword = 'AdminE2e123!'

test.beforeAll(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'arconnect-7337f',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  })
  const app = initializeApp({ apiKey: 'fake-api-key', projectId: 'arconnect-7337f' }, 'employer-verification-seed')
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

  adminEmail = uniqueEmail('verify-admin')
  const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', cred.user.uid), {
      role: 'admin', full_name: 'E2E Verify Admin', email: adminEmail, created_at: serverTimestamp(),
    })
  })
  await deleteApp(app)
  await testEnv.cleanup()
})

async function loginAsAdmin(page) {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(adminEmail)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Admin Login' }).click()
  await page.waitForURL(/\/admin$/, { timeout: 15000 })
}

test('employer verification: pending -> admin approves -> verified badge on a newly posted job', async ({ page }) => {
  test.setTimeout(60000)

  const companyName = `E2E Verify Co ${Date.now()}`
  const employerEmail = await registerEmployer(page, { email: uniqueEmail('verify-emp') })

  // Employer fills out their company profile -- this is what puts them
  // into the pending-verification queue in the first place.
  await page.goto('/employer/company', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Company Name').fill(companyName)
  await page.locator('#company-industry').selectOption({ index: 1 })
  await page.locator('#company-location').selectOption({ index: 1 })
  await page.getByLabel('About Company').fill('An E2E test company building great things for candidates.')
  await page.getByLabel('Website').fill('https://example.com')
  await page.getByRole('button', { name: 'Save Company Profile' }).click()
  await expect(page.getByText('Company profile saved.')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Verification Pending')).toBeVisible()

  await logout(page)

  // Admin reviews and approves.
  await loginAsAdmin(page)
  await page.goto('/admin/verifications', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  const approveDialog = page.getByRole('dialog')
  await approveDialog.getByLabel('Approval note').fill('Looks legitimate, approving.')
  await approveDialog.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText(companyName)).toHaveCount(0, { timeout: 10000 })

  await logout(page)

  // Employer sees their own profile is now Verified, and a NEW job they
  // post from this point on carries the badge.
  await login(page, employerEmail)
  await expect(page).toHaveURL(/\/employer$/)
  await page.goto('/employer/company', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Verified Employer')).toBeVisible({ timeout: 10000 })

  const jobTitle = `E2E Verify Job ${Date.now()}`
  await postJob(page, { title: jobTitle, companyName })
  await logout(page)

  // Candidate sees the Verified Employer badge on this newly posted job.
  await registerCandidate(page, { email: uniqueEmail('verify-cand') })
  await page.goto('/candidate/jobs', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Search jobs').fill(jobTitle)
  await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Verified Employer')).toBeVisible()
})
