import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listAllApplications } from '../services/adminService'

export default function useAdminApplications() {
  const { user, role } = useAuth()
  const [applications, setApplications] = useState([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setApplications([])
        setTruncated(false)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { items, truncated: wasTruncated } = await listAllApplications()
        if (!cancelled) {
          setApplications(items)
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

  return { applications, truncated, loading, error, refetch }
}
