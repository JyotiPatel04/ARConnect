// Same react-dom/server pattern as ErrorBoundary.test.js -- no new
// dependency, no environment change. useDocumentTitle's document.title
// write is inside a useEffect, which SSR never runs, so this is safe.
import { describe, test, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AdminVerificationsPage from './AdminVerificationsPage.jsx'

describe('AdminVerificationsPage (Phase 17: fake data removed)', () => {
  test('states the workflow is not yet available, with no fabricated data or dead actions', () => {
    const html = renderToStaticMarkup(createElement(AdminVerificationsPage))
    expect(html).toContain('not yet available')
    // The old page fabricated a "312 items pending review" count, three
    // fake company/job records, and an Approve button with no handler --
    // none of that should exist anymore.
    expect(html).not.toContain('pending review')
    expect(html).not.toContain('QuickServe')
    expect(html).not.toContain('TechNova')
    expect(html).not.toContain('Approve')
  })
})
