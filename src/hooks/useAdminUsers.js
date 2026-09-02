import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listAllUsers } from '../services/adminService'
import { setUserModerationStatus } from '../services/moderationService'

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

  // Optimistically updates local state after a successful write rather
  // than refetching the whole collection — same pattern as
  // useEmployerJobs' closeJob/reopenJob.
  const setModerationStatus = useCallback(
    async (targetUserId, status, reason) => {
      if (!user) throw new Error('You must be signed in.')
      await setUserModerationStatus(user.uid, targetUserId, status, reason)
      setUsers((prev) => prev.map((u) => (u.id === targetUserId ? { ...u, moderationStatus: status } : u)))
    },
    [user]
  )

  const suspendUser = useCallback((targetUserId, reason) => setModerationStatus(targetUserId, 'suspended', reason), [setModerationStatus])
  const unsuspendUser = useCallback((targetUserId, reason) => setModerationStatus(targetUserId, 'active', reason), [setModerationStatus])

  return { users, loading, error, refetch, suspendUser, unsuspendUser }
}
