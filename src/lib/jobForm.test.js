import { describe, test, expect } from 'vitest'
import { EMPTY_JOB_FORM_VALUES, jobToFormValues, parseJobFormValues, validateJobFormValues } from './jobForm'

describe('jobToFormValues', () => {
  test('returns EMPTY_JOB_FORM_VALUES for a null/undefined job', () => {
    expect(jobToFormValues(null)).toBe(EMPTY_JOB_FORM_VALUES)
    expect(jobToFormValues(undefined)).toBe(EMPTY_JOB_FORM_VALUES)
  })

  test('joins array fields back into their text representations', () => {
    const job = {
      title: 'Sales Executive',
      companyName: 'ABC',
      skills: ['Sales', 'Excel'],
      responsibilities: ['Visit shops', 'Meet targets'],
      requirements: ['12th Pass'],
      salaryMin: 18000,
      salaryMax: 25000,
    }
    const values = jobToFormValues(job)
    expect(values.skills).toBe('Sales, Excel')
    expect(values.responsibilities).toBe('Visit shops\nMeet targets')
    expect(values.requirements).toBe('12th Pass')
    expect(values.salaryMin).toBe(18000)
  })

  test('falls back to empty string for missing salary rather than 0', () => {
    const values = jobToFormValues({ title: 'X' })
    expect(values.salaryMin).toBe('')
    expect(values.salaryMax).toBe('')
  })
})

describe('parseJobFormValues', () => {
  test('splits comma/newline text fields into trimmed, non-empty arrays', () => {
    const parsed = parseJobFormValues({
      title: '  Sales Executive  ',
      companyName: ' ABC ',
      companyLogoUrl: '  ',
      location: 'Varanasi',
      workMode: 'Onsite',
      jobType: 'Full-time',
      experienceLevel: '0-2 years',
      salaryMin: '18000',
      salaryMax: '25000',
      skills: 'Sales, , Excel,  ',
      description: ' Describe the role ',
      responsibilities: 'Visit shops\n\nMeet targets\n',
      requirements: '12th Pass',
    })
    expect(parsed.title).toBe('Sales Executive')
    expect(parsed.companyLogoUrl).toBeNull()
    expect(parsed.skills).toEqual(['Sales', 'Excel'])
    expect(parsed.responsibilities).toEqual(['Visit shops', 'Meet targets'])
    expect(parsed.salaryMin).toBe(18000)
    expect(parsed.salaryMax).toBe(25000)
  })
})

describe('validateJobFormValues', () => {
  const valid = {
    title: 'Sales Executive',
    companyName: 'ABC',
    description: 'A real job description',
    salaryMin: '18000',
    salaryMax: '25000',
    skills: 'Sales, Excel',
  }

  test('accepts fully valid values', () => {
    expect(validateJobFormValues(valid)).toBe('')
  })

  test('requires a title', () => {
    expect(validateJobFormValues({ ...valid, title: '  ' })).toBe('Job title is required.')
  })

  test('requires a company name', () => {
    expect(validateJobFormValues({ ...valid, companyName: '' })).toBe('Company name is required.')
  })

  test('requires a description', () => {
    expect(validateJobFormValues({ ...valid, description: '' })).toBe('Job description is required.')
  })

  test('requires both salary bounds', () => {
    expect(validateJobFormValues({ ...valid, salaryMax: '' })).toBe('Enter both a minimum and maximum salary.')
  })

  test('rejects a minimum salary greater than the maximum', () => {
    expect(validateJobFormValues({ ...valid, salaryMin: '30000', salaryMax: '20000' })).toBe(
      'Minimum salary cannot be greater than maximum salary.'
    )
  })

  test('requires at least one skill', () => {
    expect(validateJobFormValues({ ...valid, skills: ' , , ' })).toBe('Add at least one skill.')
  })
})
