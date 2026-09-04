import { describe, test, expect } from 'vitest'
import { latestInterviewsByApplicationId } from './interviewGrouping.js'

function ts(millis) {
  return { toMillis: () => millis }
}

describe('latestInterviewsByApplicationId', () => {
  test('empty list produces an empty map', () => {
    const map = latestInterviewsByApplicationId([])
    expect(map.size).toBe(0)
  })

  test('one interview per application maps 1:1', () => {
    const map = latestInterviewsByApplicationId([
      { id: 'iv1', applicationId: 'app1', createdAt: ts(100) },
      { id: 'iv2', applicationId: 'app2', createdAt: ts(200) },
    ])
    expect(map.get('app1').id).toBe('iv1')
    expect(map.get('app2').id).toBe('iv2')
  })

  test('picks the most recently created interview when an application has more than one', () => {
    const map = latestInterviewsByApplicationId([
      { id: 'old', applicationId: 'app1', createdAt: ts(100) },
      { id: 'new', applicationId: 'app1', createdAt: ts(500) },
      { id: 'middle', applicationId: 'app1', createdAt: ts(300) },
    ])
    expect(map.get('app1').id).toBe('new')
  })

  test('is order-independent -- the latest wins regardless of input order', () => {
    const map = latestInterviewsByApplicationId([
      { id: 'new', applicationId: 'app1', createdAt: ts(500) },
      { id: 'old', applicationId: 'app1', createdAt: ts(100) },
    ])
    expect(map.get('app1').id).toBe('new')
  })

  test('applications with no interview simply have no entry in the map', () => {
    const map = latestInterviewsByApplicationId([{ id: 'iv1', applicationId: 'app1', createdAt: ts(100) }])
    expect(map.has('app2')).toBe(false)
    expect(map.get('app2')).toBeUndefined()
  })

  test('treats a missing createdAt as the oldest possible (epoch 0), matching the old client-side sort fallback', () => {
    const map = latestInterviewsByApplicationId([
      { id: 'no-timestamp', applicationId: 'app1' },
      { id: 'has-timestamp', applicationId: 'app1', createdAt: ts(1) },
    ])
    expect(map.get('app1').id).toBe('has-timestamp')
  })
})
