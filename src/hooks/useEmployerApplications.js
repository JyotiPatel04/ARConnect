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

  const updateStatus = useCallback(async (applicationId, status) => {
    await updateApplicationStatus(applicationId, status)
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)))
  }, [])

  const forJob = useCallback((jobId) => applications.filter((a) => a.jobId === jobId), [applications])

  return { applications, loading, error, refetch, updateStatus, forJob }
}
