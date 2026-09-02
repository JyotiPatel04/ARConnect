import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listReports } from '../services/reportService'
import { reviewReport as reviewReportService } from '../services/moderationService'

export default function useAdminReports(statusFilter) {
  const { user, role } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user || role !== 'admin') {
        setReports([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listReports(statusFilter)
        if (!cancelled) setReports(data)
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
  }, [user, role, statusFilter, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  const reviewReport = useCallback(
    async (reportId, status, reason) => {
      if (!user) throw new Error('You must be signed in.')
      await reviewReportService(user.uid, reportId, status, reason)
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status, reviewedBy: user.uid } : r)))
    },
    [user]
  )

  const markReviewed = useCallback((reportId, reason) => reviewReport(reportId, 'reviewed', reason), [reviewReport])
  const dismissReport = useCallback((reportId, reason) => reviewReport(reportId, 'dismissed', reason), [reviewReport])

  return { reports, loading, error, refetch, markReviewed, dismissReport }
}
