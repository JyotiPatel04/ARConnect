import { useEffect, useMemo, useState } from 'react'
import { getMatch } from '../services/matchService'
import { selectJobRecommendationShortlist } from '../lib/dashboardRecommendations'

const RECOMMENDATION_LIMIT = 3

// Reuses the existing active-jobs list, candidate profile, and applied-job
// set the dashboard already loads -- no new Firestore query. Narrows down
// to a shortlist of at most RECOMMENDATION_LIMIT jobs (see
// dashboardRecommendations.js) and only THEN calls the existing, real
// computeMatch (via matchService.getMatch, the same call useJobMatch makes
// on the Job Detail page) for exactly those jobs -- never once per active
// job. computeMatch's own server-side cache means revisiting the dashboard
// with an unchanged profile/job costs nothing extra either.
//
// `notReady` is a single combined flag the caller derives from every input
// this hook actually depends on (jobs loading, profile loading, AND
// applications loading -- appliedJobIds is only trustworthy once
// applications has actually finished fetching; computing the shortlist one
// render before that landed a job the candidate just applied to back into
// its own recommendations).
//
// A per-job match failure (e.g. rate limit, transient error) is caught
// individually so it degrades that one card to "no score yet" rather than
// failing the whole section -- the job itself still renders via JobCard.
export default function useRecommendedJobs(jobs, candidateProfile, appliedJobIds, notReady) {
  const [matchesByJobId, setMatchesByJobId] = useState({})
  const [matchesLoading, setMatchesLoading] = useState(true)

  const shortlist = useMemo(() => {
    if (notReady) return []
    return selectJobRecommendationShortlist(jobs, candidateProfile, appliedJobIds, RECOMMENDATION_LIMIT)
  }, [jobs, candidateProfile, appliedJobIds, notReady])

  useEffect(() => {
    // No setState here for the "nothing to score" case -- the returned
    // `loading` below is derived straight from `shortlist.length` at
    // render time instead, same pattern as this app's other hooks that
    // guard an effect on a "nothing to do yet" condition.
    if (notReady || shortlist.length === 0) return undefined

    let cancelled = false

    async function run() {
      setMatchesLoading(true)
      const results = await Promise.all(
        shortlist.map(async (job) => {
          try {
            const match = await getMatch({ jobId: job.id })
            return [job.id, { match, error: null }]
          } catch (err) {
            return [job.id, { match: null, error: err }]
          }
        })
      )
      if (!cancelled) {
        setMatchesByJobId(Object.fromEntries(results))
        setMatchesLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [shortlist, notReady])

  const recommendations = shortlist.map((job) => ({
    job,
    match: matchesByJobId[job.id]?.match ?? null,
    matchError: matchesByJobId[job.id]?.error ?? null,
  }))

  return {
    recommendations,
    loading: notReady || (shortlist.length > 0 && matchesLoading),
  }
}
