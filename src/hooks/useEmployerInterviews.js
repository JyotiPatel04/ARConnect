import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { cancelInterview, completeInterview, listInterviewsByEmployer, updateInterview } from '../services/interviewService'
import { listApplicationsByEmployer } from '../services/employerApplicationService'

// Same client-side join as useCandidateInterviews — interviews don't
// store candidateName/jobTitle (Part 2), so they're joined here against
// the employer's own already-denormalized applications.
export default function useEmployerInterviews() {
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
          listInterviewsByEmployer(user.uid),
          listApplicationsByEmployer(user.uid),
        ])
        const applicationById = new Map(applications.map((a) => [a.id, a]))
        const enriched = interviewData.map((iv) => {
          const application = applicationById.get(iv.applicationId)
          return {
            ...iv,
            candidateName: application?.candidateName,
            jobTitle: application?.jobTitle,
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

  const edit = useCallback(
    async (interview, fields) => {
      await updateInterview(interview, fields)
      refetch()
    },
    [refetch]
  )

  const cancel = useCallback(
    async (interview) => {
      await cancelInterview(interview)
      refetch()
    },
    [refetch]
  )

  const complete = useCallback(
    async (interview) => {
      await completeInterview(interview)
      refetch()
    },
    [refetch]
  )

  return { interviews, loading, error, refetch, edit, cancel, complete }
}
