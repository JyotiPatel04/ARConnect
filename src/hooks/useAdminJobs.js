import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listAllJobs } from '../services/adminService'
import { setJobModerationStatus } from '../services/moderationService'

export default function useAdminJobs() {
  const { user, role } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setJobs([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listAllJobs()
        if (!cancelled) setJobs(data)
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

  const setModerationStatus = useCallback(
    async (jobId, status, reason) => {
      if (!user) throw new Error('You must be signed in.')
      await setJobModerationStatus(user.uid, jobId, status, reason)
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
    },
    [user]
  )

  const closeJobAsAdmin = useCallback((jobId, reason) => setModerationStatus(jobId, 'closed', reason), [setModerationStatus])
  const reopenJobAsAdmin = useCallback((jobId, reason) => setModerationStatus(jobId, 'active', reason), [setModerationStatus])

  return { jobs, loading, error, refetch, closeJobAsAdmin, reopenJobAsAdmin }
}
