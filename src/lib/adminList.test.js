import { describe, test, expect } from 'vitest'
import { ADMIN_LIST_LIMIT, isListTruncated } from './adminList.js'

describe('isListTruncated', () => {
  test('false when the result count is well under the limit', () => {
    expect(isListTruncated(3)).toBe(false)
  })

  test('false when the result count is one under the limit', () => {
    expect(isListTruncated(ADMIN_LIST_LIMIT - 1)).toBe(false)
  })

  test('true when the result count exactly equals the limit', () => {
    expect(isListTruncated(ADMIN_LIST_LIMIT)).toBe(true)
  })

  test('true when the result count somehow exceeds the limit', () => {
    expect(isListTruncated(ADMIN_LIST_LIMIT + 1)).toBe(true)
  })

  test('respects a custom limit override', () => {
    expect(isListTruncated(10, 10)).toBe(true)
    expect(isListTruncated(9, 10)).toBe(false)
  })

  test('zero results is never truncated', () => {
    expect(isListTruncated(0)).toBe(false)
  })
})
