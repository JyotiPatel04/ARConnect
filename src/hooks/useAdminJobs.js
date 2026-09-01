import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listAllJobs } from '../services/adminService'

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

  return { jobs, loading, error, refetch }
}
