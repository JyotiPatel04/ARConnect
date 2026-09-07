import { useEffect, useRef } from 'react'
import useAuth from './useAuth'
import { runJobAlertCheck } from '../services/jobAlertService'

// Fire-and-forget: runs the alert check once per mount for the current
// candidate. `hasRunRef` (a ref, not state) guards against running twice —
// both React StrictMode's dev-only double-invoke (refs survive that,
// unlike state reset by a fresh mount) and any accidental re-render of
// the host page re-entering this effect. Never throws into the caller —
// job-alert matching is a background nicety and must never block or
// error out job browsing; runJobAlertCheck itself already degrades
// gracefully (no-ops) when the candidate has no preferences or alerts
// are disabled, so there's nothing further to special-case here.
export default function useJobAlertMatcher() {
  const { user, role } = useAuth()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (role !== 'candidate' || !user) return
    if (hasRunRef.current) return
    hasRunRef.current = true

    runJobAlertCheck(user.uid).catch((err) => {
      console.error('[jobAlerts] alert check failed', err)
    })
  }, [user, role])
}
