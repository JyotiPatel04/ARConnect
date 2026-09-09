import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listPendingEmployerVerifications } from '../services/adminService'
import { setEmployerVerificationStatus } from '../services/moderationService'

export default function useAdminVerifications() {
  const { user, role } = useAuth()
  const [pending, setPending] = useState([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setPending([])
        setTruncated(false)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { items, truncated: wasTruncated } = await listPendingEmployerVerifications()
        if (!cancelled) {
          setPending(items)
          setTruncated(wasTruncated)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user, role, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  // Optimistically removes the reviewed employer from the pending list —
  // same pattern as useAdminUsers/useAdminJobs — since either outcome
  // (approved or rejected) means it's no longer pending.
  const review = useCallback(
    async (employerId, status, reason) => {
      if (!user) throw new Error('You must be signed in.')
      await setEmployerVerificationStatus(user.uid, employerId, status, reason)
      setPending((prev) => prev.filter((p) => p.id !== employerId))
    },
    [user]
  )

  const approve = useCallback((employerId, reason) => review(employerId, 'verified', reason), [review])
  const reject = useCallback((employerId, reason) => review(employerId, 'rejected', reason), [review])

  return { pending, truncated, loading, error, refetch, approve, reject }
}
