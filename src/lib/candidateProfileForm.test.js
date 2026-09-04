import { describe, test, expect } from 'vitest'
import { validateCandidateProfileForm } from './candidateProfileForm'

function values(overrides) {
  return {
    fullName: 'Jane Doe',
    phone: '',
    experienceYears: '',
    expectedSalaryMin: '',
    expectedSalaryMax: '',
    bio: '',
    experienceSummary: '',
    resumeLink: '',
    ...overrides,
  }
}

describe('validateCandidateProfileForm', () => {
  test('accepts minimal valid values', () => {
    expect(validateCandidateProfileForm(values())).toBe('')
  })

  test('requires a full name', () => {
    expect(validateCandidateProfileForm(values({ fullName: '  ' }))).toBe('Full name is required.')
  })

  test('rejects an invalid phone number', () => {
    expect(validateCandidateProfileForm(values({ phone: 'not-a-phone' }))).toBe('Enter a valid phone number.')
  })

  test('accepts a valid phone number', () => {
    expect(validateCandidateProfileForm(values({ phone: '+91 98765 43210' }))).toBe('')
  })

  test('rejects experience years outside 0-60', () => {
    expect(validateCandidateProfileForm(values({ experienceYears: '-1' }))).toMatch(/experience/i)
    expect(validateCandidateProfileForm(values({ experienceYears: '61' }))).toMatch(/experience/i)
  })

  test('rejects expected salary min greater than max', () => {
    expect(
      validateCandidateProfileForm(values({ expectedSalaryMin: '30000', expectedSalaryMax: '20000' }))
    ).toBe('Minimum expected salary cannot be higher than maximum.')
  })

  test('rejects a bio over 500 characters', () => {
    expect(validateCandidateProfileForm(values({ bio: 'x'.repeat(501) }))).toBe('Bio must be 500 characters or fewer.')
  })

  test('rejects a resume link without http(s)://', () => {
    expect(validateCandidateProfileForm(values({ resumeLink: 'drive.google.com/x' }))).toMatch(/resume link/i)
  })

  test('accepts a valid https resume link', () => {
    expect(validateCandidateProfileForm(values({ resumeLink: 'https://drive.google.com/x' }))).toBe('')
  })
})
