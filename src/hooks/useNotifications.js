import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from './useAuth'
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService'

// Called once per layout (CandidateLayout/EmployerLayout) and shared with
// the routed notifications page via <Outlet context={...}/> — one fetch,
// one source of truth, so the header badge and the notifications page can
// never disagree about what's read.
export default function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setNotifications([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listMyNotifications(user.uid)
        if (!cancelled) setNotifications(data)
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

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAsRead = useCallback(async (notificationId) => {
    await markNotificationRead(notificationId)
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    await markAllNotificationsRead(unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [notifications])

  return { notifications, unreadCount, loading, error, refetch, markAsRead, markAllAsRead }
}
