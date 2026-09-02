import { useEffect, useState } from 'react'
import { getCompanySummary } from '../services/companyProfileService'

// Candidate-facing, read-only lookup of a company's PUBLIC summary by
// employerId — used on the job detail page. A missing summary (employer
// hasn't completed their company profile yet) is a normal state, not an
// error: `summary` stays null and the caller shows a graceful fallback.
export default function useCompanySummary(employerId) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!employerId) {
        setSummary(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getCompanySummary(employerId)
        if (!cancelled) setSummary(data)
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
  }, [employerId])

  return { summary, loading, error }
}
