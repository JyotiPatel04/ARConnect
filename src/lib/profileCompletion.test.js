import { describe, test, expect } from 'vitest'
import { calculateProfileCompletion } from './profileCompletion'

describe('calculateProfileCompletion', () => {
  test('treats null/undefined as an entirely empty profile (0%)', () => {
    const result = calculateProfileCompletion(null)
    expect(result.percent).toBe(0)
    expect(result.completedCount).toBe(0)
    expect(result.isComplete).toBe(false)
  })

  test('every item is worth an equal share (re-normalizes, no hand-tuned weights)', () => {
    const result = calculateProfileCompletion(null)
    expect(result.totalCount).toBeGreaterThan(0)
    // Completing exactly one equally-weighted item should move the
    // percentage by roughly 100/totalCount, not an arbitrary amount.
    const oneItem = calculateProfileCompletion({ skills: ['Sales'] })
    expect(oneItem.percent).toBe(Math.round(100 / result.totalCount))
  })

  test('reaches 100% and isComplete=true when every item is present', () => {
    const full = {
      skills: ['Sales'],
      experienceYears: 2,
      experienceSummary: 'Worked in retail',
      educationLevel: '12th Pass',
      location: 'Varanasi',
      bio: 'A short bio',
      preferredJobTypes: ['Full-time'],
      preferredWorkModes: ['Onsite'],
      expectedSalaryMin: 15000,
      expectedSalaryMax: 20000,
      resumeLink: 'https://drive.google.com/x',
    }
    const result = calculateProfileCompletion(full)
    expect(result.percent).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.missing).toEqual([])
  })

  test('an empty array does not count as "present" for skills/preferences', () => {
    const result = calculateProfileCompletion({ skills: [], preferredJobTypes: [] })
    const missingKeys = result.missing.map((m) => m.key)
    expect(missingKeys).toContain('skills')
    expect(missingKeys).toContain('preferredJobTypes')
  })

  test('only counts expectedSalary as complete when BOTH min and max are set', () => {
    const onlyMin = calculateProfileCompletion({ expectedSalaryMin: 15000 })
    expect(onlyMin.missing.map((m) => m.key)).toContain('expectedSalary')
  })

  test('an uploaded resume file satisfies the resume item just like a resume link does', () => {
    const withFileOnly = calculateProfileCompletion({ resumeFileUrl: 'https://storage.example/resume.pdf' })
    expect(withFileOnly.missing.map((m) => m.key)).not.toContain('resumeLink')
  })

  test('neither a resume link nor an uploaded file means the resume item is missing', () => {
    const withNeither = calculateProfileCompletion({})
    expect(withNeither.missing.map((m) => m.key)).toContain('resumeLink')
  })
})
