import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { listInterviewsByCandidate } from '../services/interviewService'
import { listMyApplications } from '../services/applicationService'

// Interviews deliberately don't store jobTitle/companyName (Part 2: "do
// not add unnecessary fields" — that data already lives on the
// application). Joined here client-side against the candidate's own
// already-denormalized applications, one query instead of one job lookup
// per interview.
export default function useCandidateInterviews() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setInterviews([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const [interviewData, applications] = await Promise.all([
          listInterviewsByCandidate(user.uid),
          listMyApplications(user.uid),
        ])
        const applicationById = new Map(applications.map((a) => [a.id, a]))
        const enriched = interviewData.map((iv) => {
          const application = applicationById.get(iv.applicationId)
          return {
            ...iv,
            jobTitle: application?.jobTitle,
            companyName: application?.companyName,
          }
        })
        if (!cancelled) setInterviews(enriched)
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

  return { interviews, loading, error, refetch }
}
