// @vitest-environment jsdom
//
// Every other test in this project runs in Vitest's plain 'node'
// environment (see vitest.config.js) -- this is the one file that needs a
// real DOM, since react-dom/server's renderToStaticMarkup does NOT run
// error-boundary recovery the way client-side reconciliation does
// (confirmed: it just lets the thrown error propagate). The per-file
// `@vitest-environment jsdom` docblock above opts ONLY this file into
// jsdom, leaving every other test file on 'node' as before. jsdom is the
// one new devDependency this required; no testing-library was added --
// createRoot + flushSync + raw DOM assertions are enough.
import { describe, test, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import ErrorBoundary from './ErrorBoundary.jsx'

function Bomb() {
  throw new Error('boom')
}

let container

afterEach(() => {
  if (container) {
    document.body.removeChild(container)
    container = null
  }
})

function renderInto(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  flushSync(() => root.render(element))
  return container
}

describe('ErrorBoundary', () => {
  test('renders children normally when nothing throws', () => {
    const el = renderInto(createElement(ErrorBoundary, null, createElement('p', null, 'all good')))
    expect(el.textContent).toContain('all good')
  })

  test('renders the friendly fallback UI when a child throws during render', () => {
    const el = renderInto(createElement(ErrorBoundary, null, createElement(Bomb)))
    expect(el.textContent).toContain('Something went wrong')
    expect(el.textContent).toContain('Try again')
    expect(el.textContent).toContain('Reload page')
    // No raw error message/stack trace leaked into the fallback UI.
    expect(el.textContent).not.toContain('boom')
  })
})
