import { useCallback, useEffect, useState } from 'react'
import { getJobById } from '../services/jobService'

export default function useJob(jobId) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!jobId) {
        setJob(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getJobById(jobId)
        if (!cancelled) setJob(data)
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
  }, [jobId, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return { job, loading, error, refetch }
}
