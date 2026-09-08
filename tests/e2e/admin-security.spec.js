import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { registerCandidate, uniqueEmail, PASSWORD } from './helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rules = readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8')

// There is deliberately no client-side path to role: admin, so the only way
// to exercise the real admin-login SUCCESS path (not just rejection) is to
// seed one directly against the emulator, bypassing rules the same way a
// human operator would via the Firebase Console in production. This never
// touches production -- the emulator ports are hardcoded to 127.0.0.1.
let adminEmail
let adminPassword = 'AdminE2e123!'

test.beforeAll(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'arconnect-7337f',
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  })
  const app = initializeApp({ apiKey: 'fake-api-key', projectId: 'arconnect-7337f' }, 'admin-security-seed')
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

  adminEmail = uniqueEmail('admin')
  const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', cred.user.uid), {
      role: 'admin', full_name: 'E2E Admin', email: adminEmail, created_at: serverTimestamp(),
    })
  })
  await deleteApp(app)
  await testEnv.cleanup()
})

test.describe('admin security', () => {
  test('/admin/login has no candidate/employer toggle and no signup link', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('ARConnect Admin Portal')).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Candidate', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Employer', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /sign up/i })).toHaveCount(0)
  })

  test('a non-admin account is rejected at /admin/login and signed out', async ({ page }) => {
    const email = await registerCandidate(page)
    await page.getByRole('button', { name: /log ?out/i }).click()
    await page.waitForURL(/\/auth\/login|\/$/, { timeout: 10000 })

    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Admin Login' }).click()
    await expect(page.getByText('This login is for administrators only.')).toBeVisible({ timeout: 10000 })

    // The rejected session must not remain signed in.
    await page.goto('/candidate/home', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('a real admin account logs in successfully and reaches the admin dashboard', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' })

    // See auth-redirect.spec.js -- tracks every URL visited during login so
    // a transient (but real, self-uncorrecting) bounce through /unauthorized
    // can't slip past an assertion that only checks the final URL.
    const visitedPaths = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visitedPaths.push(new URL(frame.url()).pathname)
    })

    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)
    await page.getByRole('button', { name: 'Admin Login' }).click()
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 })
    await expect(page.getByText('Admin Console')).toBeVisible({ timeout: 8000 })
    expect(visitedPaths).not.toContain('/unauthorized')
  })
})
