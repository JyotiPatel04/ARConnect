import { describe, test, expect } from 'vitest'
import { getInitials, formatSalary, toJobCardProps, formatRelativeTime } from './format'

describe('getInitials', () => {
  test('takes the first letter of the first two words', () => {
    expect(getInitials('Jane Doe')).toBe('JD')
  })

  test('handles a single-word name', () => {
    expect(getInitials('Cher')).toBe('C')
  })

  test('ignores extra whitespace and caps at two words', () => {
    expect(getInitials('  Mary   Jane Watson  ')).toBe('MJ')
  })

  test('returns empty string for falsy input', () => {
    expect(getInitials('')).toBe('')
    expect(getInitials(null)).toBe('')
    expect(getInitials(undefined)).toBe('')
  })
})

describe('formatSalary', () => {
  test('formats a full range with Indian digit grouping', () => {
    expect(formatSalary(18000, 25000)).toBe('₹18,000 – ₹25,000/month')
  })

  test('formats a single-sided value when only min is given', () => {
    expect(formatSalary(20000, null)).toBe('₹20,000/month')
  })

  test('formats a single-sided value when only max is given', () => {
    expect(formatSalary(null, 30000)).toBe('₹30,000/month')
  })

  test('falls back to "not disclosed" when neither is given', () => {
    expect(formatSalary(null, null)).toBe('Salary not disclosed')
    expect(formatSalary(0, 0)).toBe('Salary not disclosed')
  })
})

describe('toJobCardProps', () => {
  test('adapts a Firestore job document into JobCard\'s prop shape', () => {
    const job = {
      title: 'Sales Executive',
      companyName: 'ABC Pvt Ltd',
      salaryMin: 18000,
      salaryMax: 25000,
      location: 'Varanasi',
      jobType: 'Full-time',
      employerVerified: true,
      createdAt: { toDate: () => new Date(Date.now() - 5 * 60000) },
    }
    const props = toJobCardProps(job)
    expect(props).toMatchObject({
      title: 'Sales Executive',
      company: 'ABC Pvt Ltd',
      salary: '₹18,000 – ₹25,000/month',
      location: 'Varanasi',
      type: 'Full-time',
      verified: true,
    })
    expect(props.posted).toBe('5 mins ago')
  })

  test('coerces a missing/falsy employerVerified to boolean false', () => {
    const job = { title: 'X', companyName: 'Y', location: 'Z', jobType: 'Full-time' }
    expect(toJobCardProps(job).verified).toBe(false)
  })
})

describe('formatRelativeTime', () => {
  test('returns empty string for a falsy date', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
  })

  test('returns "Just now" for under a minute', () => {
    expect(formatRelativeTime(new Date(Date.now() - 30 * 1000))).toBe('Just now')
  })

  test('pluralizes minutes correctly', () => {
    expect(formatRelativeTime(new Date(Date.now() - 1 * 60000))).toBe('1 min ago')
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60000))).toBe('5 mins ago')
  })

  test('switches to hours once past 60 minutes', () => {
    expect(formatRelativeTime(new Date(Date.now() - 2 * 3600000))).toBe('2 hours ago')
  })

  test('switches to days once past 24 hours', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * 86400000))).toBe('3 days ago')
  })

  test('switches to months once past 30 days', () => {
    expect(formatRelativeTime(new Date(Date.now() - 60 * 86400000))).toBe('2 months ago')
  })
})
