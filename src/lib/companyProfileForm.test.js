import { describe, test, expect } from 'vitest'
import { validateCompanyProfileForm } from './companyProfileForm'

function values(overrides) {
  return {
    companyName: 'ABC Pvt Ltd',
    industry: 'Retail',
    location: 'Varanasi',
    about: '',
    website: '',
    companyLogoUrl: '',
    foundedYear: '',
    contactEmail: '',
    contactPhone: '',
    ...overrides,
  }
}

describe('validateCompanyProfileForm', () => {
  test('accepts minimal valid values', () => {
    expect(validateCompanyProfileForm(values())).toBe('')
  })

  test('requires company name, industry, and location', () => {
    expect(validateCompanyProfileForm(values({ companyName: '' }))).toBe('Company name is required.')
    expect(validateCompanyProfileForm(values({ industry: '' }))).toBe('Industry is required.')
    expect(validateCompanyProfileForm(values({ location: '' }))).toBe('Location is required.')
  })

  test('rejects a too-short "about" when provided', () => {
    expect(validateCompanyProfileForm(values({ about: 'short' }))).toMatch(/at least 20 characters/)
  })

  test('rejects an "about" over 1000 characters', () => {
    expect(validateCompanyProfileForm(values({ about: 'x'.repeat(1001) }))).toBe('About Company must be 1000 characters or fewer.')
  })

  test('rejects a non-https website', () => {
    expect(validateCompanyProfileForm(values({ website: 'http://example.com' }))).toMatch(/https/)
  })

  test('accepts a valid https website', () => {
    expect(validateCompanyProfileForm(values({ website: 'https://example.com' }))).toBe('')
  })

  test('rejects an out-of-range founded year', () => {
    expect(validateCompanyProfileForm(values({ foundedYear: '1700' }))).toMatch(/founded year/i)
    expect(validateCompanyProfileForm(values({ foundedYear: String(new Date().getFullYear() + 1) }))).toMatch(/founded year/i)
  })

  test('rejects an invalid contact email', () => {
    expect(validateCompanyProfileForm(values({ contactEmail: 'not-an-email' }))).toBe('Enter a valid contact email.')
  })

  test('rejects an invalid contact phone', () => {
    expect(validateCompanyProfileForm(values({ contactPhone: 'abc' }))).toBe('Enter a valid contact phone number.')
  })
})
