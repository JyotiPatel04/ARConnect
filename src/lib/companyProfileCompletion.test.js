import { describe, test, expect } from 'vitest'
import { calculateCompanyProfileCompletion } from './companyProfileCompletion'

describe('calculateCompanyProfileCompletion', () => {
  test('treats null/undefined as an entirely empty profile (0%)', () => {
    expect(calculateCompanyProfileCompletion(null).percent).toBe(0)
    expect(calculateCompanyProfileCompletion(undefined).percent).toBe(0)
    expect(calculateCompanyProfileCompletion(null).isComplete).toBe(false)
  })

  test('reaches 100% and isComplete=true when every field is present', () => {
    const full = {
      companyName: 'ABC',
      industry: 'Retail',
      location: 'Varanasi',
      about: 'A real description',
      companySize: '11-50',
      website: 'https://abc.com',
      companyLogoUrl: 'https://abc.com/logo.png',
      contactEmail: 'hr@abc.com',
      contactPhone: '9876543210',
      foundedYear: 2015,
    }
    const result = calculateCompanyProfileCompletion(full)
    expect(result.percent).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.missing).toEqual([])
  })

  test('core identity fields (name/industry/location/about) are weighted higher than nice-to-haves', () => {
    const coreOnly = calculateCompanyProfileCompletion({
      companyName: 'ABC', industry: 'Retail', location: 'Varanasi', about: 'A real description',
    })
    const niceToHaveOnly = calculateCompanyProfileCompletion({ foundedYear: 2015 })
    expect(coreOnly.percent).toBeGreaterThan(niceToHaveOnly.percent)
  })

  test('lists each missing field with its label', () => {
    const result = calculateCompanyProfileCompletion({ companyName: 'ABC' })
    const missingKeys = result.missing.map((m) => m.key)
    expect(missingKeys).toContain('industry')
    expect(missingKeys).not.toContain('companyName')
  })
})
