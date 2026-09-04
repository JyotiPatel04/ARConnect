import { describe, test, expect } from 'vitest'
import { isValidModerationReason, MODERATION_REASON_MIN_LENGTH, MODERATION_REASON_MAX_LENGTH } from './moderationValidation'

describe('isValidModerationReason', () => {
  test('rejects a reason shorter than the minimum', () => {
    expect(isValidModerationReason('a'.repeat(MODERATION_REASON_MIN_LENGTH - 1))).toBe(false)
  })

  test('accepts a reason exactly at the minimum length', () => {
    expect(isValidModerationReason('a'.repeat(MODERATION_REASON_MIN_LENGTH))).toBe(true)
  })

  test('accepts a reason exactly at the maximum length', () => {
    expect(isValidModerationReason('a'.repeat(MODERATION_REASON_MAX_LENGTH))).toBe(true)
  })

  test('rejects a reason longer than the maximum', () => {
    expect(isValidModerationReason('a'.repeat(MODERATION_REASON_MAX_LENGTH + 1))).toBe(false)
  })

  test('trims whitespace before measuring length', () => {
    expect(isValidModerationReason('  ' + 'a'.repeat(MODERATION_REASON_MIN_LENGTH) + '  ')).toBe(true)
    expect(isValidModerationReason('  ab  ')).toBe(false)
  })
})
