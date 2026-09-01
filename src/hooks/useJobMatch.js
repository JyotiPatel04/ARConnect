import { useCallback, useEffect, useState } from 'react'
import { getMatch } from '../services/matchService'

/**
 * Fetches (or triggers a fresh compute of) the match between the current
 * user and a job. Pass candidateId when an employer is viewing a specific
 * applicant's match; omit it for a candidate viewing their own.
 */
export default function useJobMatch(jobId, candidateId) {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!jobId) {
        setMatch(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getMatch({ jobId, candidateId })
        if (!cancelled) setMatch(data)
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
  }, [jobId, candidateId, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return { match, loading, error, refetch }
}
