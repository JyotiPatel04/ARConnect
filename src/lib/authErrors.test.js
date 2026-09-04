import { describe, test, expect } from 'vitest'
import { mapAuthError, roleRedirects, isPathAllowedForRole } from './authErrors'

describe('mapAuthError', () => {
  test('maps a known Firebase Auth error code to a friendly message', () => {
    expect(mapAuthError({ code: 'auth/wrong-password' })).toBe('Incorrect email or password.')
  })

  test('maps auth/invalid-credential the same as wrong-password (Firebase merges these)', () => {
    expect(mapAuthError({ code: 'auth/invalid-credential' })).toBe('Incorrect email or password.')
  })

  test('falls back to error.message for an unknown code', () => {
    expect(mapAuthError({ code: 'auth/some-new-code', message: 'raw SDK message' })).toBe('raw SDK message')
  })

  test('falls back to a generic message when there is no code or message', () => {
    expect(mapAuthError({})).toBe('Something went wrong. Please try again.')
  })

  test('handles null/undefined without throwing', () => {
    expect(mapAuthError(null)).toBe('Something went wrong. Please try again.')
    expect(mapAuthError(undefined)).toBe('Something went wrong. Please try again.')
  })
})

describe('roleRedirects', () => {
  test('has exactly one destination per role, matching ProtectedRoute\'s three roles', () => {
    expect(roleRedirects).toEqual({
      candidate: '/candidate/home',
      employer: '/employer',
      admin: '/admin',
    })
  })
})

// Regression coverage for the production login-redirect bug: an
// authenticated user's post-login `from` target must never be honored
// unless it actually belongs to their own role.
describe('isPathAllowedForRole', () => {
  test('allows a path under the matching role\'s own base', () => {
    expect(isPathAllowedForRole('/candidate/saved-jobs', 'candidate')).toBe(true)
    expect(isPathAllowedForRole('/employer/jobs/new', 'employer')).toBe(true)
    expect(isPathAllowedForRole('/admin/users', 'admin')).toBe(true)
  })

  test('rejects a path belonging to a different role (the exact production bug)', () => {
    expect(isPathAllowedForRole('/candidate/onboarding', 'employer')).toBe(false)
    expect(isPathAllowedForRole('/employer/jobs', 'candidate')).toBe(false)
    expect(isPathAllowedForRole('/admin', 'candidate')).toBe(false)
  })

  test('rejects a missing path or missing/unknown role', () => {
    expect(isPathAllowedForRole(undefined, 'candidate')).toBe(false)
    expect(isPathAllowedForRole('/candidate/home', undefined)).toBe(false)
    expect(isPathAllowedForRole('/candidate/home', 'not-a-real-role')).toBe(false)
  })
})
