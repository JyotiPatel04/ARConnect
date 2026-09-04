// @vitest-environment jsdom
//
// Same reasoning as ErrorBoundary.test.js -- focus/keyboard behavior needs
// a real DOM, so this is the one other file opted into jsdom via the
// per-file docblock above; every other test file stays on 'node'.
import { describe, test, expect, afterEach, vi } from 'vitest'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import ConfirmDialog from './ConfirmDialog.jsx'

let container
let root

afterEach(() => {
  if (container) {
    document.body.removeChild(container)
    container = null
    root = null
  }
})

function renderInto(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  flushSync(() => root.render(element))
  return container
}

function rerender(element) {
  flushSync(() => root.render(element))
  return container
}

function dispatchKey(key, opts = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

describe('ConfirmDialog', () => {
  test('renders nothing when closed', () => {
    const el = renderInto(createElement(ConfirmDialog, { open: false, title: 'Delete?' }))
    expect(el.querySelector('[role="dialog"]')).toBeNull()
  })

  test('has proper dialog semantics and labels the panel via the title', () => {
    const el = renderInto(createElement(ConfirmDialog, { open: true, title: 'Delete this job?' }))
    const dialog = el.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(document.getElementById(labelledBy).textContent).toBe('Delete this job?')
  })

  test('moves focus into the dialog on open', () => {
    const el = renderInto(createElement(ConfirmDialog, { open: true, title: 'Delete?' }))
    expect(document.activeElement).toBe(el.querySelector('[role="dialog"]'))
  })

  test('Escape calls onCancel when not confirming', () => {
    const onCancel = vi.fn()
    renderInto(createElement(ConfirmDialog, { open: true, title: 'Delete?', onCancel }))
    dispatchKey('Escape')
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('Escape does NOT call onCancel while confirming is in progress', () => {
    const onCancel = vi.fn()
    renderInto(createElement(ConfirmDialog, { open: true, title: 'Delete?', onCancel, confirming: true }))
    dispatchKey('Escape')
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('returns focus to the previously-focused element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const el = renderInto(createElement(ConfirmDialog, { open: true, title: 'Delete?' }))
    expect(document.activeElement).toBe(el.querySelector('[role="dialog"]'))

    // Closing (open: false) unmounts the dialog and should hand focus back.
    rerender(createElement(ConfirmDialog, { open: false, title: 'Delete?' }))
    expect(document.activeElement).toBe(trigger)

    document.body.removeChild(trigger)
  })
})
