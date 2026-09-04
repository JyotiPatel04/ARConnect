import { describe, test, expect } from 'vitest'
import {
  INTERVIEW_TYPES,
  EMPTY_INTERVIEW_FORM,
  interviewToFormValues,
  validateInterviewForm,
  parseInterviewFormValues,
} from './interviewForm'

describe('interviewToFormValues', () => {
  test('returns EMPTY_INTERVIEW_FORM for a null/undefined interview', () => {
    expect(interviewToFormValues(null)).toBe(EMPTY_INTERVIEW_FORM)
  })

  test('round-trips scheduledAt to the same instant regardless of local timezone', () => {
    // toDate()/toDate-style Firestore Timestamp stand-in.
    const instant = new Date('2026-09-15T14:30:00.000Z')
    const values = interviewToFormValues({ scheduledAt: { toDate: () => instant } })
    // datetime-local strings have no timezone -- parsing it back with `new
    // Date(...)` interprets it in the SAME local timezone it was built
    // from, so the round trip must land on the original instant again no
    // matter what timezone the test happens to run in (local machine or CI).
    expect(new Date(values.scheduledAt).getTime()).toBe(instant.getTime())
  })

  test('defaults durationMinutes/type and fills meetingLink/location/notes from the interview', () => {
    const values = interviewToFormValues({
      scheduledAt: { toDate: () => new Date() },
      durationMinutes: 45,
      interviewType: 'phone',
      notes: 'Bring ID',
    })
    expect(values.durationMinutes).toBe('45')
    expect(values.interviewType).toBe('phone')
    expect(values.notes).toBe('Bring ID')
    expect(values.meetingLink).toBe('')
  })
})

describe('validateInterviewForm', () => {
  const valid = {
    scheduledAt: '2026-09-15T14:30',
    durationMinutes: '30',
    interviewType: 'online',
    meetingLink: 'https://meet.example.com/x',
    location: '',
    notes: '',
  }

  test('accepts fully valid online-interview values', () => {
    expect(validateInterviewForm(valid)).toBe('')
  })

  test('requires a date and time', () => {
    expect(validateInterviewForm({ ...valid, scheduledAt: '' })).toBe('Date and time are required.')
  })

  test('rejects an unparsable date', () => {
    expect(validateInterviewForm({ ...valid, scheduledAt: 'not-a-date' })).toBe('Enter a valid date and time.')
  })

  test('rejects a non-integer or out-of-range duration', () => {
    expect(validateInterviewForm({ ...valid, durationMinutes: '0' })).toMatch(/duration/i)
    expect(validateInterviewForm({ ...valid, durationMinutes: '481' })).toMatch(/duration/i)
    expect(validateInterviewForm({ ...valid, durationMinutes: '30.5' })).toMatch(/duration/i)
  })

  test('rejects an invalid interview type', () => {
    expect(validateInterviewForm({ ...valid, interviewType: 'carrier-pigeon' })).toBe('Select a valid interview type.')
  })

  test('every declared INTERVIEW_TYPES value passes the type check', () => {
    for (const type of INTERVIEW_TYPES) {
      const values = { ...valid, interviewType: type, meetingLink: 'https://x.com', location: 'Office, Main Road' }
      expect(validateInterviewForm(values)).not.toBe('Select a valid interview type.')
    }
  })

  test('online interviews require an https meeting link', () => {
    expect(validateInterviewForm({ ...valid, meetingLink: '' })).toBe('Meeting link is required for online interviews.')
    expect(validateInterviewForm({ ...valid, meetingLink: 'http://insecure.com' })).toMatch(/https/)
  })

  test('in-person interviews require a 3-200 character location', () => {
    const inPerson = { ...valid, interviewType: 'in_person', meetingLink: '', location: 'NY' }
    expect(validateInterviewForm(inPerson)).toMatch(/location/i)
    expect(validateInterviewForm({ ...inPerson, location: 'Office, Main Road' })).toBe('')
  })

  test('phone interviews need neither meetingLink nor location', () => {
    expect(validateInterviewForm({ ...valid, interviewType: 'phone', meetingLink: '', location: '' })).toBe('')
  })

  test('rejects notes over 1000 characters', () => {
    expect(validateInterviewForm({ ...valid, notes: 'x'.repeat(1001) })).toBe('Notes must be 1000 characters or fewer.')
  })
})

describe('parseInterviewFormValues', () => {
  test('clears meetingLink for non-online types and location for non-in_person types', () => {
    const phone = parseInterviewFormValues({
      scheduledAt: '2026-09-15T14:30',
      durationMinutes: '20',
      interviewType: 'phone',
      meetingLink: 'https://should-be-dropped.com',
      location: 'should also be dropped',
      notes: '',
    })
    expect(phone.meetingLink).toBe('')
    expect(phone.location).toBe('')
  })

  test('trims notes and keeps meetingLink for online', () => {
    const online = parseInterviewFormValues({
      scheduledAt: '2026-09-15T14:30',
      durationMinutes: '30',
      interviewType: 'online',
      meetingLink: ' https://meet.example.com/x ',
      location: '',
      notes: '  bring a laptop  ',
    })
    expect(online.meetingLink).toBe('https://meet.example.com/x')
    expect(online.notes).toBe('bring a laptop')
  })

  test('converts durationMinutes to a number', () => {
    const parsed = parseInterviewFormValues({
      scheduledAt: '2026-09-15T14:30', durationMinutes: '45', interviewType: 'phone', meetingLink: '', location: '', notes: '',
    })
    expect(parsed.durationMinutes).toBe(45)
    expect(typeof parsed.durationMinutes).toBe('number')
  })
})
