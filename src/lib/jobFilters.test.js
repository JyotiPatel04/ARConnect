import { describe, test, expect } from 'vitest'
import { filterAndSortJobs } from './jobFilters'

function job(overrides) {
  return {
    title: 'Sales Executive',
    companyName: 'ABC Pvt Ltd',
    skills: ['Sales'],
    location: 'Varanasi',
    jobType: 'Full-time',
    workMode: 'Onsite',
    experienceLevel: '0-2 years',
    salaryMin: 15000,
    salaryMax: 20000,
    createdAt: { toMillis: () => Date.now() },
    ...overrides,
  }
}

describe('filterAndSortJobs', () => {
  test('returns all jobs unchanged when no options are given', () => {
    const jobs = [job({ title: 'A' }), job({ title: 'B' })]
    expect(filterAndSortJobs(jobs)).toHaveLength(2)
  })

  test('search matches title, company, or skills, case-insensitively', () => {
    const jobs = [job({ title: 'Delivery Rider' }), job({ title: 'Sales Executive', companyName: 'QuickServe' })]
    expect(filterAndSortJobs(jobs, { search: 'quickserve' })).toHaveLength(1)
    expect(filterAndSortJobs(jobs, { search: 'DELIVERY' })).toHaveLength(1)
  })

  test('filters by exact-match location/jobType/workMode/experienceLevel', () => {
    const jobs = [job({ location: 'Varanasi' }), job({ location: 'Lucknow' })]
    expect(filterAndSortJobs(jobs, { location: 'Lucknow' })).toHaveLength(1)
  })

  test('sortBy "salary" orders by salaryMax descending', () => {
    const jobs = [job({ title: 'Low', salaryMax: 15000 }), job({ title: 'High', salaryMax: 30000 })]
    const result = filterAndSortJobs(jobs, { sortBy: 'salary' })
    expect(result.map((j) => j.title)).toEqual(['High', 'Low'])
  })

  test('default sort ("recent") orders by createdAt descending', () => {
    const now = Date.now()
    const jobs = [
      job({ title: 'Older', createdAt: { toMillis: () => now - 10000 } }),
      job({ title: 'Newer', createdAt: { toMillis: () => now } }),
    ]
    const result = filterAndSortJobs(jobs)
    expect(result.map((j) => j.title)).toEqual(['Newer', 'Older'])
  })

  test('does not mutate the input array', () => {
    const jobs = [job({ title: 'A' }), job({ title: 'B' })]
    const original = [...jobs]
    filterAndSortJobs(jobs, { sortBy: 'salary' })
    expect(jobs).toEqual(original)
  })

  describe('skills filter', () => {
    test('matches a job carrying the single selected skill', () => {
      const jobs = [job({ title: 'A', skills: ['React'] }), job({ title: 'B', skills: ['Java'] })]
      const result = filterAndSortJobs(jobs, { skills: ['React'] })
      expect(result.map((j) => j.title)).toEqual(['A'])
    })

    test('ALL-selected semantics: a job must carry every selected skill, not just one', () => {
      const jobs = [
        job({ title: 'BothSkills', skills: ['React', 'Node.js'] }),
        job({ title: 'OnlyReact', skills: ['React'] }),
      ]
      const result = filterAndSortJobs(jobs, { skills: ['React', 'Node.js'] })
      expect(result.map((j) => j.title)).toEqual(['BothSkills'])
    })

    test('skill matching is case-insensitive on both the selection and the job data', () => {
      const jobs = [job({ title: 'A', skills: ['REACT', 'node.js'] })]
      expect(filterAndSortJobs(jobs, { skills: ['react', 'Node.JS'] })).toHaveLength(1)
    })

    test('duplicate selected skills do not change the result', () => {
      const jobs = [job({ title: 'A', skills: ['React'] })]
      expect(filterAndSortJobs(jobs, { skills: ['React', 'React', 'react'] })).toHaveLength(1)
    })

    test('a job with a missing skills array never matches once a skill is selected', () => {
      const jobs = [job({ title: 'NoSkills', skills: undefined })]
      expect(filterAndSortJobs(jobs, { skills: ['React'] })).toHaveLength(0)
    })

    test('a job with an empty skills array never matches once a skill is selected', () => {
      const jobs = [job({ title: 'EmptySkills', skills: [] })]
      expect(filterAndSortJobs(jobs, { skills: ['React'] })).toHaveLength(0)
    })

    test('no skills selected -- skills filter is a no-op', () => {
      const jobs = [job({ title: 'A', skills: [] }), job({ title: 'B', skills: ['React'] })]
      expect(filterAndSortJobs(jobs, { skills: [] })).toHaveLength(2)
    })
  })

  describe('salary range filter', () => {
    test('salaryMin only: matches jobs whose range reaches at least that floor', () => {
      const jobs = [job({ title: 'Low', salaryMin: 10000, salaryMax: 15000 }), job({ title: 'High', salaryMin: 25000, salaryMax: 30000 })]
      const result = filterAndSortJobs(jobs, { salaryMin: 20000 })
      expect(result.map((j) => j.title)).toEqual(['High'])
    })

    test('salaryMax only: matches jobs whose range reaches at most that ceiling', () => {
      const jobs = [job({ title: 'Low', salaryMin: 10000, salaryMax: 15000 }), job({ title: 'High', salaryMin: 25000, salaryMax: 30000 })]
      const result = filterAndSortJobs(jobs, { salaryMax: 20000 })
      expect(result.map((j) => j.title)).toEqual(['Low'])
    })

    test('salaryMin + salaryMax: matches only jobs overlapping the requested range', () => {
      const jobs = [
        job({ title: 'TooLow', salaryMin: 5000, salaryMax: 9000 }),
        job({ title: 'Overlaps', salaryMin: 15000, salaryMax: 25000 }),
        job({ title: 'TooHigh', salaryMin: 40000, salaryMax: 50000 }),
      ]
      const result = filterAndSortJobs(jobs, { salaryMin: 10000, salaryMax: 30000 })
      expect(result.map((j) => j.title)).toEqual(['Overlaps'])
    })

    test('partial overlap at the edges still counts as a match', () => {
      const jobs = [
        job({ title: 'OverlapsLowEdge', salaryMin: 5000, salaryMax: 12000 }),
        job({ title: 'OverlapsHighEdge', salaryMin: 28000, salaryMax: 40000 }),
      ]
      const result = filterAndSortJobs(jobs, { salaryMin: 10000, salaryMax: 30000 })
      expect(result.map((j) => j.title).sort()).toEqual(['OverlapsHighEdge', 'OverlapsLowEdge'])
    })

    test('an inverted range (min > max) is swapped rather than producing nonsensical results', () => {
      const jobs = [job({ title: 'Match', salaryMin: 15000, salaryMax: 25000 })]
      const inverted = filterAndSortJobs(jobs, { salaryMin: 30000, salaryMax: 10000 })
      const corrected = filterAndSortJobs(jobs, { salaryMin: 10000, salaryMax: 30000 })
      expect(inverted).toEqual(corrected)
    })

    test('a job missing both salary fields is excluded once a range is requested', () => {
      const jobs = [job({ title: 'NoSalary', salaryMin: null, salaryMax: null })]
      expect(filterAndSortJobs(jobs, { salaryMin: 10000, salaryMax: 30000 })).toHaveLength(0)
    })

    test('a job with only one salary field is treated as a single-point value', () => {
      const jobs = [job({ title: 'OnlyMin', salaryMin: 20000, salaryMax: null })]
      expect(filterAndSortJobs(jobs, { salaryMin: 15000, salaryMax: 25000 })).toHaveLength(1)
      expect(filterAndSortJobs(jobs, { salaryMin: 25000, salaryMax: 30000 })).toHaveLength(0)
    })

    test('a job with a zero salary value is not treated as missing', () => {
      const jobs = [job({ title: 'ZeroMin', salaryMin: 0, salaryMax: 5000 })]
      expect(filterAndSortJobs(jobs, { salaryMin: 0, salaryMax: 10000 })).toHaveLength(1)
    })

    test('no salary bounds given -- salary filter is a no-op', () => {
      const jobs = [job({ salaryMin: null, salaryMax: null }), job({ salaryMin: 10000, salaryMax: 20000 })]
      expect(filterAndSortJobs(jobs, {})).toHaveLength(2)
    })
  })

  describe('relevance sort', () => {
    test('title matches outrank skills matches, which outrank company-name matches', () => {
      // Each job matches the "react" search term through exactly one of the
      // three scored fields, so the initial keyword filter (which every one
      // of these must also pass to appear in the result at all) admits all
      // three -- only their relative order is under test here.
      const jobs = [
        job({ title: 'React Backend Developer', companyName: 'Other Co', skills: ['Java'] }),
        job({ title: 'Sales Executive', companyName: 'React Solutions', skills: ['Sales'] }),
        job({ title: 'Support Agent', companyName: 'Other Co', skills: ['React', 'Communication'] }),
      ]
      const result = filterAndSortJobs(jobs, { search: 'react', sortBy: 'relevance' })
      expect(result.map((j) => j.title)).toEqual(['React Backend Developer', 'Support Agent', 'Sales Executive'])
    })

    test('deterministic tie-break: equal relevance scores fall back to newest first', () => {
      const now = Date.now()
      const jobs = [
        job({ title: 'React Role A', createdAt: { toMillis: () => now - 10000 } }),
        job({ title: 'React Role B', createdAt: { toMillis: () => now } }),
      ]
      const result = filterAndSortJobs(jobs, { search: 'react', sortBy: 'relevance' })
      expect(result.map((j) => j.title)).toEqual(['React Role B', 'React Role A'])
    })

    test('a job matching in multiple fields scores higher than one matching in only one', () => {
      // Both jobs carry the 'React' skill (so both pass the initial keyword
      // filter); only the first also matches in its title, which is what
      // this test is actually distinguishing.
      const jobs = [
        job({ title: 'React Developer', companyName: 'Other Co', skills: ['React'] }),
        job({ title: 'Backend Engineer', companyName: 'Other Co', skills: ['React'] }),
      ]
      const result = filterAndSortJobs(jobs, { search: 'react', sortBy: 'relevance' })
      expect(result.map((j) => j.title)).toEqual(['React Developer', 'Backend Engineer'])
    })

    test('relevance with no keyword falls back to recent ordering, not an arbitrary one', () => {
      const now = Date.now()
      const jobs = [
        job({ title: 'Older', createdAt: { toMillis: () => now - 10000 } }),
        job({ title: 'Newer', createdAt: { toMillis: () => now } }),
      ]
      const result = filterAndSortJobs(jobs, { sortBy: 'relevance' })
      expect(result.map((j) => j.title)).toEqual(['Newer', 'Older'])
    })

    test('relevance with a keyword that matches nothing returns an empty list, not an error', () => {
      const jobs = [job({ title: 'Sales Executive' })]
      expect(filterAndSortJobs(jobs, { search: 'zzz-no-match', sortBy: 'relevance' })).toHaveLength(0)
    })
  })

  describe('combined filters and clear/reset behavior', () => {
    test('search, a single-select filter, skills, and salary range all narrow the result together', () => {
      const jobs = [
        job({ title: 'React Developer', companyName: 'TechCo', location: 'Noida', skills: ['React'], salaryMin: 20000, salaryMax: 30000 }),
        job({ title: 'React Developer', companyName: 'TechCo', location: 'Lucknow', skills: ['React'], salaryMin: 20000, salaryMax: 30000 }),
        job({ title: 'React Developer', companyName: 'TechCo', location: 'Noida', skills: ['Angular'], salaryMin: 20000, salaryMax: 30000 }),
        job({ title: 'React Developer', companyName: 'TechCo', location: 'Noida', skills: ['React'], salaryMin: 60000, salaryMax: 70000 }),
      ]
      const result = filterAndSortJobs(jobs, {
        search: 'react',
        location: 'Noida',
        skills: ['React'],
        salaryMin: 15000,
        salaryMax: 35000,
      })
      expect(result).toHaveLength(1)
    })

    test('passing an empty options object behaves identically to no options at all (the "clear all" state)', () => {
      const jobs = [job({ title: 'A' }), job({ title: 'B' })]
      expect(filterAndSortJobs(jobs, {})).toEqual(filterAndSortJobs(jobs))
    })
  })

  test('is a pure function even with every new option set at once, including nested skills arrays', () => {
    const jobs = [job({ title: 'A', skills: ['React'] }), job({ title: 'B', skills: ['Java'] })]
    const original = [...jobs]
    filterAndSortJobs(jobs, { search: 'a', skills: ['React'], salaryMin: 1000, salaryMax: 50000, sortBy: 'relevance' })
    expect(jobs).toEqual(original)
  })
})
