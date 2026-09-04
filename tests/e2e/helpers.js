// Shared helpers for the curated E2E suite. Kept deliberately small and
// boring: every spec composes these instead of hand-rolling its own
// register/login/post-job flow, so the suite stays maintainable rather
// than growing into several huge, near-duplicate scripts.

export const PASSWORD = 'E2eTest123!'

export function uniqueEmail(tag) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`
}

export async function registerCandidate(page, { email, fullName = 'E2E Candidate' } = {}) {
  const finalEmail = email || uniqueEmail('cand')
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Full Name').fill(fullName)
  await page.getByLabel('Email').fill(finalEmail)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/candidate/, { timeout: 15000 })
  return finalEmail
}

export async function registerEmployer(page, { email, fullName = 'E2E Employer' } = {}) {
  const finalEmail = email || uniqueEmail('emp')
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: "I'm an Employer" }).click()
  await page.getByLabel('Full Name').fill(fullName)
  await page.getByLabel('Email').fill(finalEmail)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL(/\/employer/, { timeout: 15000 })
  return finalEmail
}

export async function login(page, email, password = PASSWORD) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
}

export async function logout(page) {
  await page.getByRole('button', { name: /log ?out/i }).click()
  await page.waitForURL(/\/auth\/login|\/$/, { timeout: 10000 })
}

export async function postJob(page, { title, companyName = 'E2E Co', description = 'An E2E test job posting.' }) {
  await page.goto('/employer/jobs/new', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Job Title').fill(title)
  await page.getByLabel('Company Name').fill(companyName)
  await page.getByLabel('Min Salary (₹/month)').fill('15000')
  await page.getByLabel('Max Salary (₹/month)').fill('25000')
  await page.getByLabel('Skills (comma separated)').fill('Testing')
  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Publish Job' }).click()

  let jobId = ''
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    const path = new URL(page.url()).pathname
    if (/^\/employer\/jobs\/[^/]+$/.test(path) && !path.endsWith('/new')) {
      jobId = path.split('/').pop()
      break
    }
    await page.waitForTimeout(400)
  }
  if (!jobId) throw new Error('postJob: job did not publish within the timeout')
  return jobId
}

export async function applyToJob(page, jobId) {
  await page.goto(`/candidate/jobs/${jobId}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Apply Now' }).click()
  await page.getByRole('button', { name: 'Applied', exact: true }).waitFor({ timeout: 10000 })
}

export function futureLocalDateTime(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function scheduleInterview(page, { daysAhead = 2, durationMinutes = '30', type = 'online' } = {}) {
  await page.getByRole('button', { name: 'Schedule Interview' }).click()
  await page.getByLabel('Date & Time').fill(futureLocalDateTime(daysAhead))
  await page.getByLabel('Duration (minutes)').fill(durationMinutes)
  await page.locator('#interview-type').selectOption(type)
  if (type === 'online') {
    await page.getByLabel('Meeting Link').fill('https://meet.example.com/e2e')
  }
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  await page.getByText(/Interview Scheduled/i).waitFor({ timeout: 10000 })
}
