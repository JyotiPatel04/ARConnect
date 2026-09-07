import { describe, test, expect } from 'vitest'
import { doesJobMatchPreferences } from './jobAlertMatching'

const job = {
  jobType: 'Full-time',
  workMode: 'Remote',
  location: 'Noida',
  experienceLevel: 'Fresher',
  skills: ['React', 'JavaScript'],
}

const emptyPrefs = {
  enabled: true,
  jobTypes: [],
  workModes: [],
  locations: [],
  skills: [],
  experienceLevel: null,
}

describe('doesJobMatchPreferences -- basic gating', () => {
  test('no job or no preferences -> false', () => {
    expect(doesJobMatchPreferences(null, emptyPrefs)).toBe(false)
    expect(doesJobMatchPreferences(job, null)).toBe(false)
  })

  test('disabled alerts never match, regardless of how well the job fits', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, enabled: false, jobTypes: ['Full-time'] })).toBe(false)
  })

  test('completely empty preferences (all fields unset) match any job, as long as enabled', () => {
    expect(doesJobMatchPreferences(job, emptyPrefs)).toBe(true)
  })
})

describe('doesJobMatchPreferences -- individual filters', () => {
  test('jobTypes: match when included', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, jobTypes: ['Full-time', 'Contract'] })).toBe(true)
  })

  test('jobTypes: no match when excluded', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, jobTypes: ['Part-time'] })).toBe(false)
  })

  test('workModes: match when included', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, workModes: ['Remote', 'Hybrid'] })).toBe(true)
  })

  test('workModes: no match when excluded', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, workModes: ['Onsite'] })).toBe(false)
  })

  test('locations: match when included', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, locations: ['Noida', 'Delhi'] })).toBe(true)
  })

  test('locations: no match when excluded', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, locations: ['Lucknow'] })).toBe(false)
  })

  test('experienceLevel: match when equal', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, experienceLevel: 'Fresher' })).toBe(true)
  })

  test('experienceLevel: no match when different', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, experienceLevel: '5+ years' })).toBe(false)
  })

  test('experienceLevel: null/unset means no constraint', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, experienceLevel: null })).toBe(true)
  })
})

describe('doesJobMatchPreferences -- skills', () => {
  test('matches on any single overlapping skill', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, skills: ['React'] })).toBe(true)
  })

  test('matches case-insensitively', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, skills: ['react'] })).toBe(true)
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, skills: ['REACT'] })).toBe(true)
    expect(doesJobMatchPreferences({ ...job, skills: ['ReAcT'] }, { ...emptyPrefs, skills: ['react'] })).toBe(true)
  })

  test('no overlap at all -> no match', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, skills: ['Python', 'Django'] })).toBe(false)
  })

  test('partial overlap (at least one shared skill) still matches', () => {
    expect(doesJobMatchPreferences(job, { ...emptyPrefs, skills: ['Python', 'React'] })).toBe(true)
  })

  test('job with no skills and a skills preference set -> no match', () => {
    expect(doesJobMatchPreferences({ ...job, skills: [] }, { ...emptyPrefs, skills: ['React'] })).toBe(false)
  })

  test('job with missing skills field entirely does not throw', () => {
    const jobWithoutSkills = { jobType: job.jobType, workMode: job.workMode, location: job.location, experienceLevel: job.experienceLevel }
    expect(() => doesJobMatchPreferences(jobWithoutSkills, { ...emptyPrefs, skills: ['React'] })).not.toThrow()
    expect(doesJobMatchPreferences(jobWithoutSkills, { ...emptyPrefs, skills: ['React'] })).toBe(false)
  })
})

describe('doesJobMatchPreferences -- multiple filters combined', () => {
  test('all filters set and all satisfied -> match', () => {
    const prefs = {
      enabled: true,
      jobTypes: ['Full-time'],
      workModes: ['Remote'],
      locations: ['Noida'],
      skills: ['React'],
      experienceLevel: 'Fresher',
    }
    expect(doesJobMatchPreferences(job, prefs)).toBe(true)
  })

  test('all filters set but ONE fails -> no match (every dimension must pass)', () => {
    const prefs = {
      enabled: true,
      jobTypes: ['Full-time'],
      workModes: ['Remote'],
      locations: ['Delhi'], // fails
      skills: ['React'],
      experienceLevel: 'Fresher',
    }
    expect(doesJobMatchPreferences(job, prefs)).toBe(false)
  })
})

describe('doesJobMatchPreferences -- missing/null preference fields', () => {
  test('preferences object with entirely missing array fields (undefined, not []) does not throw and imposes no constraint', () => {
    const sparsePrefs = { enabled: true }
    expect(() => doesJobMatchPreferences(job, sparsePrefs)).not.toThrow()
    expect(doesJobMatchPreferences(job, sparsePrefs)).toBe(true)
  })

  test('is a pure function: identical inputs always produce identical output', () => {
    const prefs = { ...emptyPrefs, skills: ['React'] }
    const first = doesJobMatchPreferences(job, prefs)
    const second = doesJobMatchPreferences(job, prefs)
    expect(first).toBe(second)
  })
})
