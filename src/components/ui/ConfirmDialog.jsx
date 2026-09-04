import { useEffect, useId, useRef } from 'react'
import Button from './Button'

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  onConfirm,
  onCancel,
  confirming = false,
  confirmDisabled = false,
  children,
}) {
  const titleId = useId()
  const panelRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  // Phase 17 P2: this component had no dialog semantics at all -- a plain
  // overlay div, no role="dialog"/aria-modal, no focus management. It's
  // used for every destructive admin/employer action (suspend, delete,
  // cancel), so one fix here covers all of them. Focus moves into the
  // dialog on open, is trapped inside it (Tab/Shift+Tab wrap), Escape
  // closes it (same as Cancel), and focus returns to whatever triggered it
  // on close -- the standard WAI-ARIA dialog pattern, no library needed.
  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement
    panelRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (!confirming) onCancel?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, confirming, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft-lg outline-none"
      >
        <h3 id={titleId} className="text-base font-bold text-navy-900">
          {title}
        </h3>
        {message && <p className="mt-2 text-sm text-navy-500">{message}</p>}
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} disabled={confirming || confirmDisabled}>
            {confirming ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
