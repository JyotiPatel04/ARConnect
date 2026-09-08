// Picks which jobs are worth spending a computeMatch call on -- this is
// NOT a match score and NOT a second scoring algorithm. computeMatch's own
// deterministic scorer (functions-match/src/matching/scoreCandidate.js)
// remains the one and only source of any score ever shown to a candidate.
// This is a cheap, purely client-side PRIORITIZATION heuristic (a simple
// overlap count against fields already loaded on the page -- no Firestore
// reads, no network) used only to shrink "up to 100 active jobs" down to
// the small shortlist the dashboard actually calls computeMatch for.
//
// Already-applied jobs are excluded first (recommending a job the
// candidate applied to already isn't useful). When nothing overlaps (a
// thin profile, or a candidate with broad/no preferences), every remaining
// job ties at zero and the original (already-loaded) order is preserved --
// this IS the "show recent/relevant active jobs" fallback: still a
// perfectly reasonable shortlist, just not preference-ranked.
export function selectJobRecommendationShortlist(jobs, candidateProfile, appliedJobIds, limit = 3) {
  const notApplied = jobs.filter((job) => !appliedJobIds.has(job.id))

  const candidateSkills = new Set((candidateProfile?.skills || []).map((s) => s.toLowerCase()))
  const preferredJobTypes = candidateProfile?.preferredJobTypes || []
  const preferredWorkModes = candidateProfile?.preferredWorkModes || []
  const candidateLocation = candidateProfile?.location || null

  function overlapScore(job) {
    let overlap = 0
    const jobSkills = (job.skills || []).map((s) => s.toLowerCase())
    overlap += jobSkills.filter((s) => candidateSkills.has(s)).length
    if (preferredJobTypes.includes(job.jobType)) overlap += 1
    if (preferredWorkModes.includes(job.workMode)) overlap += 1
    if (candidateLocation && candidateLocation === job.location) overlap += 1
    return overlap
  }

  return notApplied
    .map((job, index) => ({ job, overlap: overlapScore(job), index }))
    .sort((a, b) => b.overlap - a.overlap || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.job)
}
