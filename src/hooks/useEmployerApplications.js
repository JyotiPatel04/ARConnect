import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listApplicationsByEmployer, updateApplicationStatus } from '../services/employerApplicationService'
import { listInterviewsByEmployer } from '../services/interviewService'
import { latestInterviewsByApplicationId } from '../lib/interviewGrouping'

// Phase 17 P2: interviews are fetched here, ONCE per employer, alongside
// applications -- fixes ApplicationRow's N+1 read pattern (it used to run
// its own getLatestInterviewForApplication() query per rendered row; an
// applications page with 50 rows meant 50 separate Firestore reads just to
// know which ones have an interview). All 3 pages that render
// ApplicationRow already source their application list from this hook, so
// this is the one place to fetch it and hand every row its interview via
// props instead.
export default function useEmployerApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [interviewsByApplicationId, setInterviewsByApplicationId] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setApplications([])
        setInterviewsByApplicationId(new Map())
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [data, interviews] = await Promise.all([
          listApplicationsByEmployer(user.uid),
          listInterviewsByEmployer(user.uid),
        ])
        if (!cancelled) {
          setApplications(data)
          setInterviewsByApplicationId(latestInterviewsByApplicationId(interviews))
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

  return { applications, interviewsByApplicationId, loading, error, refetch, updateStatus, forJob }
}
