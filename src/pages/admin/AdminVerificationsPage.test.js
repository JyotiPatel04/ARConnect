// SSR-safe, same pattern as SuspendedBanner.test.js: AuthContext is driven
// directly via its Provider rather than mocking Firebase. useAdminVerifications'
// actual data fetch lives inside a useEffect, which renderToStaticMarkup
// never runs, so this only proves the page's static shell (no crash, no
// leftover fake-data placeholder copy, correct initial loading state) --
// the real approve/reject flow against live data is covered by
// tests/e2e/employer-verification.spec.js instead.
import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AuthContext } from '../../context/auth-context.js'
import AdminVerificationsPage from './AdminVerificationsPage.jsx'

function renderPage() {
  return renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      { value: { user: { uid: 'admin1' }, role: 'admin', profile: { role: 'admin' } } },
      createElement(AdminVerificationsPage)
    )
  )
}

describe('AdminVerificationsPage (real employer verification workflow)', () => {
  test('no longer shows the old "Coming Soon" placeholder or its fabricated data', () => {
    const html = renderPage()
    expect(html).not.toContain('Coming Soon')
    expect(html).not.toContain('not yet available')
    expect(html).not.toContain('QuickServe')
    expect(html).not.toContain('TechNova')
  })

  test('renders its initial loading state without crashing', () => {
    const html = renderPage()
    expect(html).toContain('Loading pending verifications')
  })
})
