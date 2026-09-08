import { test, expect } from '@playwright/test'
import { registerCandidate, registerEmployer, uniqueEmail } from './helpers.js'

// Curated end-to-end coverage for the Advanced Job Search & Filters
// enhancement (skills, salary range, relevance sort, URL persistence).
// The per-filter arithmetic (skills ALL-selected semantics, salary-range
// overlap, relevance weighting/tie-break/fallback) is covered far more
// cheaply and exhaustively by src/lib/jobFilters.test.js -- this spec's
// job is to prove the real UI actually wires those pieces together
// against live data, plus the URL-as-state behavior that can only be
// proven through a real browser (reload, back/forward).
//
// The shared postJob() helper in helpers.js hardcodes salary to a fixed
// 15000-25000 for every job (not parameterized) -- since this spec needs
// jobs with genuinely different salary ranges to test range-overlap
// filtering meaningfully, and helpers.js is outside this task's approved
// file scope, postJobWithSalary() below is a small LOCAL re-implementation
// confined to this one file, not a change to the shared helper.
async function postJobWithSalary(page, { title, companyName, location, jobType, skills, salaryMin, salaryMax }) {
  await page.goto('/employer/jobs/new', { waitUntil: 'domcontentloaded' })

  const refreshButton = page.getByRole('button', { name: /verified.*refresh/i })
  const jobTitleField = page.getByLabel('Job Title')
  await refreshButton.or(jobTitleField).waitFor({ state: 'visible', timeout: 15000 })
  if (await refreshButton.isVisible()) {
    await refreshButton.click()
    await jobTitleField.waitFor({ state: 'visible', timeout: 10000 })
  }

  await page.getByLabel('Job Title').fill(title)
  await page.getByLabel('Company Name').fill(companyName)
  if (location) await page.getByLabel('Location').selectOption(location)
  if (jobType) await page.getByLabel('Job Type').selectOption(jobType)
  await page.getByLabel('Min Salary (₹/month)').fill(String(salaryMin))
  await page.getByLabel('Max Salary (₹/month)').fill(String(salaryMax))
  await page.getByLabel('Skills (comma separated)').fill(skills)
  await page.getByLabel('Description').fill('An E2E test job posting.')
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
  if (!jobId) throw new Error('postJobWithSalary: job did not publish within the timeout')
  return jobId
}

test('job search: keyword, skills, salary range, relevance, clear all, and URL persistence', async ({ page, browser }) => {
  test.setTimeout(60000)

  // A unique term embedded into exactly one of title/skills/companyName per
  // job is what makes both the keyword search and the relevance-weighting
  // assertions immune to cross-test contamination in the shared emulator
  // (every other spec's postJob() calls use unrelated titles/skills).
  const term = `e2eterm${Date.now()}`

  const empContext = await browser.newContext()
  const empPage = await empContext.newPage()
  await registerEmployer(empPage, { email: uniqueEmail('search-emp') })

  // Title match (highest relevance weight) -- also the low end of the
  // salary range used below.
  const titleMatchTitle = `${term} Frontend Developer`
  await postJobWithSalary(empPage, {
    title: titleMatchTitle,
    companyName: 'Alpha Co',
    location: 'Noida',
    jobType: 'Full-time',
    skills: `${term}Skill, CSS`,
    salaryMin: 20000,
    salaryMax: 30000,
  })

  // Skill match only (middle relevance weight) -- shares the same skill as
  // the title-match job, but a far higher salary range, so it can also
  // prove salary-range exclusion when combined with a skill filter.
  const skillMatchTitle = 'Backend Engineer'
  await postJobWithSalary(empPage, {
    title: skillMatchTitle,
    companyName: 'Beta Co',
    location: 'Lucknow',
    jobType: 'Contract',
    skills: `${term}Skill, Node.js`,
    salaryMin: 60000,
    salaryMax: 80000,
  })

  // Company-name match only (lowest relevance weight), and carries neither
  // the shared skill nor an overlapping salary range.
  const companyMatchTitle = 'Support Specialist'
  await postJobWithSalary(empPage, {
    title: companyMatchTitle,
    companyName: `${term} Corp`,
    location: 'Delhi',
    jobType: 'Part-time',
    skills: 'Excel',
    salaryMin: 15000,
    salaryMax: 18000,
  })
  await empContext.close()

  await registerCandidate(page, { email: uniqueEmail('search-cand') })
  await page.goto('/candidate/jobs', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Search Jobs' })).toBeVisible({ timeout: 10000 })

  // A: keyword search finds all three (each matches through a different
  // field) and narrows the result count relative to the full job list.
  await page.getByLabel('Search jobs').fill(term)
  await expect(page.getByText(titleMatchTitle)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(skillMatchTitle)).toBeVisible()
  await expect(page.getByText(companyMatchTitle)).toBeVisible()

  // Open the filter drawer for the rest of the test.
  await page.getByRole('button', { name: 'Toggle filters' }).click()

  // G: relevance sort orders title-match > skill-match > company-match.
  await page.getByRole('button', { name: 'Relevance', exact: true }).click()
  const jobTitles = page.locator('h4')
  await expect(jobTitles.first()).toHaveText(titleMatchTitle, { timeout: 10000 })

  // D: skills multi-select narrows to the two jobs carrying that skill,
  // excluding the company-match job (which doesn't have it).
  await page.getByRole('button', { name: `${term}Skill`, exact: true }).click()
  await expect(page.getByText(titleMatchTitle)).toBeVisible()
  await expect(page.getByText(skillMatchTitle)).toBeVisible()
  await expect(page.getByText(companyMatchTitle)).toHaveCount(0)

  // E + F: adding a salary range on top of the skill filter narrows further
  // to just the one job whose range overlaps -- proving combined filters
  // work together, not just individually.
  await page.getByLabel('Minimum salary').fill('15000')
  await page.getByLabel('Maximum salary').fill('35000')
  await expect(page.getByText(titleMatchTitle)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(skillMatchTitle)).toHaveCount(0)

  // I: URL persistence -- every active filter is reflected in the URL...
  await expect(page).toHaveURL(new RegExp(`search=${term}`))
  await expect(page).toHaveURL(/sortBy=relevance/)
  await expect(page).toHaveURL(/salaryMin=15000/)
  await expect(page).toHaveURL(/salaryMax=35000/)

  // M: opening a job from this filtered list and using the in-page Back
  // arrow returns to this exact filtered Jobs URL, not a bare /candidate/jobs.
  const filteredJobsUrl = page.url()
  await page.getByText(titleMatchTitle).click()
  await expect(page).toHaveURL(/\/candidate\/jobs\//)
  await page.getByRole('link', { name: 'Back to jobs' }).click()
  await expect(page).toHaveURL(filteredJobsUrl)

  // J: ...and reloading the page restores the exact same filtered state
  // from the URL alone, with no separate persistence mechanism.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('Search jobs')).toHaveValue(term)
  await expect(page.getByText(titleMatchTitle)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(skillMatchTitle)).toHaveCount(0)

  // L: Saved Jobs still works on a filtered result set.
  await page.getByRole('button', { name: 'Save job' }).click()
  await expect(page.getByRole('button', { name: 'Unsave job' })).toBeVisible({ timeout: 8000 })

  // K: empty result state for a search term that matches nothing.
  await page.getByLabel('Search jobs').fill(`${term}-does-not-exist`)
  await expect(page.getByText('No jobs match your search')).toBeVisible({ timeout: 10000 })

  // H: Clear All resets search, every filter, and sort back to defaults,
  // and removes the corresponding URL parameters. The filter panel's open/
  // closed state is local component state (not URL-persisted), so the
  // earlier page.reload() closed it -- reopen it before the Clear All
  // button (rendered only inside the open panel) can be clicked.
  await page.getByRole('button', { name: 'Toggle filters' }).click()
  await page.getByRole('button', { name: /clear all filters/i }).click()
  await expect(page.getByLabel('Search jobs')).toHaveValue('')
  await expect(page).not.toHaveURL(/search=|salaryMin=|salaryMax=|sortBy=/)
  await expect(page.getByText(titleMatchTitle)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(skillMatchTitle)).toBeVisible()
  await expect(page.getByText(companyMatchTitle)).toBeVisible()
})
