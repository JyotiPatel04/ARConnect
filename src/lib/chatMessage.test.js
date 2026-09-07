import { describe, test, expect } from 'vitest'
import { prepareMessageText, MESSAGE_MAX_LENGTH } from './chatMessage'

describe('prepareMessageText', () => {
  test('trims surrounding whitespace', () => {
    expect(prepareMessageText('  hello there  ')).toBe('hello there')
  })

  test('empty string, whitespace-only, null, and undefined all yield null (nothing to send)', () => {
    expect(prepareMessageText('')).toBe(null)
    expect(prepareMessageText('    ')).toBe(null)
    expect(prepareMessageText(null)).toBe(null)
    expect(prepareMessageText(undefined)).toBe(null)
  })

  test('a message at exactly the length cap is accepted', () => {
    const text = 'a'.repeat(MESSAGE_MAX_LENGTH)
    expect(prepareMessageText(text)).toBe(text)
  })

  test('a message over the length cap is rejected', () => {
    const text = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
    expect(prepareMessageText(text)).toBe(null)
  })

  test('internal whitespace is preserved, only the ends are trimmed', () => {
    expect(prepareMessageText('  line one\nline two  ')).toBe('line one\nline two')
  })
})
