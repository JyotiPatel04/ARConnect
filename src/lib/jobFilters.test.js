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

  test('minSalary filters on the higher of salaryMax/salaryMin', () => {
    const jobs = [job({ salaryMin: 10000, salaryMax: 15000 }), job({ salaryMin: 25000, salaryMax: 30000 })]
    const result = filterAndSortJobs(jobs, { minSalary: 20000 })
    expect(result).toHaveLength(1)
    expect(result[0].salaryMin).toBe(25000)
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
})
