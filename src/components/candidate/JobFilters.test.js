// @vitest-environment jsdom
import { describe, test, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import JobFilters from './JobFilters.jsx'

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

const noop = () => {}

describe('JobFilters search input (Phase 17 P2 a11y fix)', () => {
  test('the search input has an accessible name, not just a placeholder', () => {
    const el = renderInto(
      createElement(JobFilters, {
        search: '',
        onSearchChange: noop,
        filters: {},
        onFilterChange: noop,
        onClearFilters: noop,
        activeCount: 0,
      })
    )
    const input = el.querySelector('input')
    expect(input.getAttribute('aria-label')).toBe('Search jobs')
  })

  test('the search wrapper shows a visible focus indicator (no bare focus:outline-none with nothing replacing it)', () => {
    const el = renderInto(
      createElement(JobFilters, {
        search: '',
        onSearchChange: noop,
        filters: {},
        onFilterChange: noop,
        onClearFilters: noop,
        activeCount: 0,
      })
    )
    const wrapper = el.querySelector('input').closest('div')
    expect(wrapper.className).toContain('focus-within:ring')
  })
})
