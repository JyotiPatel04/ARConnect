import { describe, test, expect } from 'vitest'
import { selectUpcomingInterviews } from './upcomingInterviews'

const NOW = 1_700_000_000_000

function iv(id, status, millisFromNow) {
  return {
    id,
    status,
    scheduledAt: { toMillis: () => NOW + millisFromNow },
  }
}

describe('selectUpcomingInterviews', () => {
  test('empty list -> empty', () => {
    expect(selectUpcomingInterviews([], NOW)).toEqual([])
  })

  test('only scheduled interviews in the future are included', () => {
    const interviews = [
      iv('future-scheduled', 'scheduled', 60_000),
      iv('past-scheduled', 'scheduled', -60_000),
      iv('future-completed', 'completed', 60_000),
      iv('future-cancelled', 'cancelled', 60_000),
    ]
    const result = selectUpcomingInterviews(interviews, NOW)
    expect(result.map((i) => i.id)).toEqual(['future-scheduled'])
  })

  test('a scheduled interview exactly at "now" is not upcoming (strictly future)', () => {
    const interviews = [iv('at-now', 'scheduled', 0)]
    expect(selectUpcomingInterviews(interviews, NOW)).toEqual([])
  })

  test('sorted soonest-first', () => {
    const interviews = [
      iv('later', 'scheduled', 3 * 86_400_000),
      iv('soonest', 'scheduled', 3_600_000),
      iv('middle', 'scheduled', 86_400_000),
    ]
    const result = selectUpcomingInterviews(interviews, NOW)
    expect(result.map((i) => i.id)).toEqual(['soonest', 'middle', 'later'])
  })

  test('respects the limit', () => {
    const interviews = [
      iv('a', 'scheduled', 1_000),
      iv('b', 'scheduled', 2_000),
      iv('c', 'scheduled', 3_000),
      iv('d', 'scheduled', 4_000),
    ]
    expect(selectUpcomingInterviews(interviews, NOW, 2).map((i) => i.id)).toEqual(['a', 'b'])
  })

  test('an interview with no scheduledAt is never upcoming, never throws', () => {
    const interviews = [{ id: 'no-date', status: 'scheduled' }]
    expect(selectUpcomingInterviews(interviews, NOW)).toEqual([])
  })
})
