import { describe, test, expect } from 'vitest'
import { hasUnreadMessage, countUnreadConversations } from './chatUnread'

const ts = (ms) => ({ toMillis: () => ms })

const base = {
  candidateId: 'cand1',
  employerId: 'emp1',
  lastMessageAt: ts(1000),
  lastMessageSenderId: 'emp1',
  candidateLastReadAt: null,
  employerLastReadAt: null,
}

describe('hasUnreadMessage', () => {
  test('no conversation or no lastMessageAt yet -> not unread', () => {
    expect(hasUnreadMessage(null, 'cand1')).toBe(false)
    expect(hasUnreadMessage({ ...base, lastMessageAt: null }, 'cand1')).toBe(false)
  })

  test('the sender of the last message never sees it as unread for themselves', () => {
    expect(hasUnreadMessage(base, 'emp1')).toBe(false)
  })

  test('the OTHER participant with no read pointer yet sees it as unread', () => {
    expect(hasUnreadMessage(base, 'cand1')).toBe(true)
  })

  test('the other participant who already read up to or past the last message sees no unread', () => {
    const read = { ...base, candidateLastReadAt: ts(1000) }
    expect(hasUnreadMessage(read, 'cand1')).toBe(false)
    const readLater = { ...base, candidateLastReadAt: ts(2000) }
    expect(hasUnreadMessage(readLater, 'cand1')).toBe(false)
  })

  test('a read pointer older than the last message still counts as unread', () => {
    const staleRead = { ...base, candidateLastReadAt: ts(500) }
    expect(hasUnreadMessage(staleRead, 'cand1')).toBe(true)
  })

  test('checks the correct side\'s read pointer for the employer', () => {
    const candidateSent = { ...base, lastMessageSenderId: 'cand1', employerLastReadAt: null }
    expect(hasUnreadMessage(candidateSent, 'emp1')).toBe(true)
    const employerRead = { ...candidateSent, employerLastReadAt: ts(1000) }
    expect(hasUnreadMessage(employerRead, 'emp1')).toBe(false)
  })
})

describe('countUnreadConversations', () => {
  test('counts only conversations unread for the given user', () => {
    const conversations = [
      base, // unread for cand1
      { ...base, lastMessageSenderId: 'cand1' }, // unread for emp1, not cand1 (cand1 sent it)
      { ...base, candidateLastReadAt: ts(1000) }, // read by cand1
    ]
    expect(countUnreadConversations(conversations, 'cand1')).toBe(1)
  })

  test('empty list is zero', () => {
    expect(countUnreadConversations([], 'cand1')).toBe(0)
  })
})
