import { test, expect } from '@playwright/test'
import { registerCandidate } from './helpers.js'

// Curated happy-path + persistence check for resume upload (Phase 20).
// Validation edge cases (wrong type, oversized file) are already covered
// deterministically and cheaply by src/lib/resumeValidation.test.js;
// unauthorized cross-candidate access is covered by tests/rules/storage.test.js.
// This spec's job is to prove the real UI wiring works end to end, which
// neither of those layers can.
test('candidate: upload, replace, and remove a resume; an unrelated profile save does not wipe it', async ({ page }) => {
  await registerCandidate(page)
  await page.goto('/candidate/profile', { waitUntil: 'domcontentloaded' })

  const fileInput = page.getByLabel('Upload resume file')

  // 1. Upload
  await fileInput.setInputFiles({
    name: 'resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 minimal test resume'),
  })
  await expect(page.getByText('Resume uploaded.')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('resume.pdf', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View', exact: true })).toBeVisible()

  // 2. Replace
  await fileInput.setInputFiles({
    name: 'resume-v2.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('a fake but validly-typed docx payload'),
  })
  await expect(page.getByText('Resume replaced.')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('resume-v2.docx', { exact: true })).toBeVisible()
  await expect(page.getByText('resume.pdf', { exact: true })).toHaveCount(0)

  // 3. An unrelated profile save (editing the bio, via the separate big
  // form) must not wipe the resume that form knows nothing about.
  await page.getByLabel('Short Bio').fill('Updated bio to check resume persistence.')
  await page.getByRole('button', { name: 'Save Profile' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible({ timeout: 20000 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByText('resume-v2.docx', { exact: true })).toBeVisible({ timeout: 10000 })

  // 4. Remove
  await page.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Resume removed.')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No resume uploaded yet.')).toBeVisible()
})
