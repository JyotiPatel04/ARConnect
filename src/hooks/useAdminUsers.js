import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listAllUsers } from '../services/adminService'

export default function useAdminUsers() {
  const { user, role } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setUsers([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listAllUsers()
        if (!cancelled) setUsers(data)
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

  return { users, loading, error, refetch }
}
