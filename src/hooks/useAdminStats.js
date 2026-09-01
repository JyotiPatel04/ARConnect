import { useEffect, useState, useCallback } from 'react'
import useAuth from './useAuth'
import { getPlatformStats } from '../services/adminService'

export default function useAdminStats() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setStats(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getPlatformStats()
        if (!cancelled) setStats(data)
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

  return { stats, loading, error, refetch }
}
