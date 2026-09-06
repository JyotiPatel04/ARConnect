import { describe, test, expect } from 'vitest'
import { validateResumeFile, RESUME_MAX_SIZE_BYTES } from './resumeValidation.js'

function makeFile({ name = 'resume.pdf', type = 'application/pdf', size = 1024 } = {}) {
  return { name, type, size }
}

describe('validateResumeFile', () => {
  test('accepts a valid PDF', () => {
    expect(validateResumeFile(makeFile())).toBe('')
  })

  test('accepts a valid DOC', () => {
    expect(validateResumeFile(makeFile({ name: 'resume.doc', type: 'application/msword' }))).toBe('')
  })

  test('accepts a valid DOCX', () => {
    expect(
      validateResumeFile(
        makeFile({
          name: 'resume.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
      )
    ).toBe('')
  })

  test('rejects when no file is given', () => {
    expect(validateResumeFile(null)).not.toBe('')
  })

  test('rejects a disallowed extension even with an otherwise-plausible name', () => {
    expect(validateResumeFile(makeFile({ name: 'resume.exe', type: 'application/pdf' }))).not.toBe('')
  })

  test('rejects a disallowed MIME type even with a ".pdf" name', () => {
    expect(validateResumeFile(makeFile({ name: 'resume.pdf', type: 'image/png' }))).not.toBe('')
  })

  test('accepts a valid extension when the browser reports no MIME type at all', () => {
    expect(validateResumeFile(makeFile({ type: '' }))).toBe('')
  })

  test('rejects a file over the size limit', () => {
    expect(validateResumeFile(makeFile({ size: RESUME_MAX_SIZE_BYTES + 1 }))).not.toBe('')
  })

  test('accepts a file exactly at the size limit', () => {
    expect(validateResumeFile(makeFile({ size: RESUME_MAX_SIZE_BYTES }))).toBe('')
  })

  test('is case-insensitive about the extension', () => {
    expect(validateResumeFile(makeFile({ name: 'Resume.PDF' }))).toBe('')
  })
})
