import { describe, test, expect } from 'vitest'
import { selectJobRecommendationShortlist } from './dashboardRecommendations'

function job(id, overrides = {}) {
  return { id, skills: [], jobType: 'Full-time', workMode: 'Onsite', location: 'Noida', ...overrides }
}

describe('selectJobRecommendationShortlist', () => {
  test('empty jobs -> empty shortlist', () => {
    expect(selectJobRecommendationShortlist([], {}, new Set())).toEqual([])
  })

  test('already-applied jobs are excluded', () => {
    const jobs = [job('a'), job('b'), job('c')]
    const result = selectJobRecommendationShortlist(jobs, {}, new Set(['a', 'b']))
    expect(result.map((j) => j.id)).toEqual(['c'])
  })

  test('never returns more than the limit', () => {
    const jobs = [job('a'), job('b'), job('c'), job('d'), job('e')]
    const result = selectJobRecommendationShortlist(jobs, {}, new Set(), 3)
    expect(result).toHaveLength(3)
  })

  test('no candidate signal (empty/null profile) falls back to original job order, not an error', () => {
    const jobs = [job('a'), job('b'), job('c')]
    const result = selectJobRecommendationShortlist(jobs, null, new Set(), 3)
    expect(result.map((j) => j.id)).toEqual(['a', 'b', 'c'])
  })

  test('prioritizes jobs with more overlapping skills', () => {
    const jobs = [
      job('no-overlap', { skills: ['C++'] }),
      job('one-overlap', { skills: ['React'] }),
      job('two-overlap', { skills: ['React', 'JavaScript'] }),
    ]
    const profile = { skills: ['React', 'JavaScript', 'CSS'] }
    const result = selectJobRecommendationShortlist(jobs, profile, new Set(), 3)
    expect(result.map((j) => j.id)).toEqual(['two-overlap', 'one-overlap', 'no-overlap'])
  })

  test('preferred job type, work mode, and matching location each contribute to ranking', () => {
    const jobs = [
      job('none-match'),
      job('type-match', { jobType: 'Contract' }),
      job('all-match', { jobType: 'Contract', workMode: 'Remote', location: 'Delhi' }),
    ]
    const profile = { preferredJobTypes: ['Contract'], preferredWorkModes: ['Remote'], location: 'Delhi' }
    const result = selectJobRecommendationShortlist(jobs, profile, new Set(), 3)
    expect(result.map((j) => j.id)).toEqual(['all-match', 'type-match', 'none-match'])
  })

  test('is a pure function -- does not mutate its inputs', () => {
    const jobs = [job('a'), job('b')]
    const jobsCopy = JSON.parse(JSON.stringify(jobs))
    selectJobRecommendationShortlist(jobs, { skills: ['x'] }, new Set())
    expect(jobs).toEqual(jobsCopy)
  })
})
