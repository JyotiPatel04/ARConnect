import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from './useAuth'
import { applyToJob as applyToJobService, listMyApplications } from '../services/applicationService'

export default function useMyApplications() {
  const { user, profile } = useAuth()
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
        const data = await listMyApplications(user.uid)
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

  const applicationByJobId = useMemo(() => {
    const map = new Map()
    applications.forEach((application) => map.set(application.jobId, application))
    return map
  }, [applications])

  const applyToJob = useCallback(
    async (job) => {
      if (!user) throw new Error('You must be signed in to apply.')
      const application = await applyToJobService({
        job,
        candidateId: user.uid,
        candidateName: profile?.full_name || user.email,
        candidateEmail: profile?.email || user.email,
      })
      setApplications((prev) => [application, ...prev.filter((a) => a.jobId !== job.id)])
      return application
    },
    [user, profile]
  )

  return {
    applications,
    loading,
    error,
    refetch,
    applyToJob,
    hasApplied: (jobId) => applicationByJobId.has(jobId),
    getApplication: (jobId) => applicationByJobId.get(jobId),
  }
}
