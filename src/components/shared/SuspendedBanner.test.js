// SSR-safe (no effects, no browser-only APIs) -- react-dom/server is
// enough here, same pattern as AdminVerificationsPage.test.js. AuthContext
// is driven directly via its Provider rather than mocking Firebase.
import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AuthContext } from '../../context/auth-context.js'
import SuspendedBanner from './SuspendedBanner.jsx'

function renderWithProfile(profile) {
  return renderToStaticMarkup(
    createElement(AuthContext.Provider, { value: { profile } }, createElement(SuspendedBanner))
  )
}

describe('SuspendedBanner', () => {
  test('renders nothing for an active account', () => {
    expect(renderWithProfile({ moderationStatus: 'active' })).toBe('')
  })

  test('renders nothing when moderationStatus is absent (pre-Phase-9 accounts default to active)', () => {
    expect(renderWithProfile({})).toBe('')
  })

  test('renders nothing when there is no profile yet (still loading)', () => {
    expect(renderWithProfile(null)).toBe('')
  })

  test('renders a clear explanatory message for a suspended account', () => {
    const html = renderWithProfile({ moderationStatus: 'suspended' })
    expect(html).toContain('suspended')
    expect(html).toContain('admin reactivates it')
  })
})
