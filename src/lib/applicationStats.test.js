import { describe, test, expect } from 'vitest'
import { computeApplicationStats } from './applicationStats'

function app(status) {
  return { status }
}

describe('computeApplicationStats', () => {
  test('empty list -> all zero', () => {
    expect(computeApplicationStats([])).toEqual({ total: 0, active: 0, interviews: 0, selected: 0 })
  })

  test('total counts every application, including withdrawn', () => {
    const apps = [app('applied'), app('withdrawn'), app('rejected'), app('hired')]
    expect(computeApplicationStats(apps).total).toBe(4)
  })

  test('active counts only applied + reviewing + shortlisted', () => {
    const apps = [app('applied'), app('reviewing'), app('shortlisted'), app('interview'), app('hired'), app('rejected'), app('withdrawn')]
    expect(computeApplicationStats(apps).active).toBe(3)
  })

  test('interviews counts only application.status === "interview"', () => {
    const apps = [app('interview'), app('interview'), app('applied'), app('hired')]
    expect(computeApplicationStats(apps).interviews).toBe(2)
  })

  test('selected counts only application.status === "hired"', () => {
    const apps = [app('hired'), app('hired'), app('hired'), app('rejected'), app('applied')]
    expect(computeApplicationStats(apps).selected).toBe(3)
  })

  test('rejected and withdrawn do not count toward active, interviews, or selected', () => {
    const apps = [app('rejected'), app('withdrawn')]
    const stats = computeApplicationStats(apps)
    expect(stats.active).toBe(0)
    expect(stats.interviews).toBe(0)
    expect(stats.selected).toBe(0)
    expect(stats.total).toBe(2)
  })

  test('a realistic mixed set adds up correctly and total = active + interviews + selected + rejected + withdrawn', () => {
    const apps = [
      app('applied'),
      app('reviewing'),
      app('shortlisted'),
      app('interview'),
      app('interview'),
      app('hired'),
      app('rejected'),
      app('withdrawn'),
    ]
    const stats = computeApplicationStats(apps)
    expect(stats).toEqual({ total: 8, active: 3, interviews: 2, selected: 1 })
  })
})
