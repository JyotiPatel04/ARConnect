import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from './useAuth'
import { listSavedJobs, saveJob as saveJobService, unsaveJob as unsaveJobService } from '../services/savedJobService'

export default function useSavedJobs() {
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setSavedJobs([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listSavedJobs(user.uid)
        if (!cancelled) setSavedJobs(data)
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

  const savedJobIds = useMemo(() => new Set(savedJobs.map((s) => s.jobId)), [savedJobs])

  const saveJob = useCallback(
    async (job) => {
      if (!user) throw new Error('You must be signed in to save jobs.')
      await saveJobService({ candidateId: user.uid, job })
      setSavedJobs((prev) => [
        {
          id: `${user.uid}_${job.id}`,
          candidateId: user.uid,
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.companyName,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          location: job.location,
          employerVerified: job.employerVerified,
        },
        ...prev,
      ])
    },
    [user]
  )

  const unsaveJob = useCallback(
    async (jobId) => {
      if (!user) return
      await unsaveJobService({ candidateId: user.uid, jobId })
      setSavedJobs((prev) => prev.filter((s) => s.jobId !== jobId))
    },
    [user]
  )

  return {
    savedJobs,
    loading,
    error,
    refetch,
    isSaved: (jobId) => savedJobIds.has(jobId),
    saveJob,
    unsaveJob,
  }
}
