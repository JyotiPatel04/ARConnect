import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listApplicationsByEmployer, updateApplicationStatus } from '../services/employerApplicationService'

export default function useEmployerApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setApplications([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listApplicationsByEmployer(user.uid)
        if (!cancelled) setApplications(data)
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
  }, [user, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  // Looks the application up from already-loaded state rather than
  // re-fetching it — this is also what lets a same-status save become a
  // true no-op (no write, no notification) instead of relying on the
  // native <select>'s onChange to never fire for an unchanged value.
  const updateStatus = useCallback(
    async (applicationId, status) => {
      const current = applications.find((a) => a.id === applicationId)
      if (!current || current.status === status || current.status === 'withdrawn') return
      await updateApplicationStatus(current, status)
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)))
    },
    [applications]
  )

  const forJob = useCallback((jobId) => applications.filter((a) => a.jobId === jobId), [applications])

  return { applications, loading, error, refetch, updateStatus, forJob }
}
