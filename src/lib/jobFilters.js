// Relative weights for relevance sort -- title matches count for more than
// a skill match, which counts for more than a company-name match. Purely a
// fixed, deterministic point score (never an LLM/external call).
const RELEVANCE_WEIGHTS = { title: 3, skills: 2, company: 1 }

function recentMillis(job) {
  return job.createdAt?.toMillis?.() ?? 0
}

function relevanceScore(job, term) {
  let score = 0
  if (job.title?.toLowerCase().includes(term)) score += RELEVANCE_WEIGHTS.title
  if (job.skills?.some((skill) => skill.toLowerCase().includes(term))) score += RELEVANCE_WEIGHTS.skills
  if (job.companyName?.toLowerCase().includes(term)) score += RELEVANCE_WEIGHTS.company
  return score
}

// Range-overlap check, not an exact match -- a job matches if its salary
// range and the candidate's selected range share any overlap at all. Each
// side treats a missing bound as open-ended (no floor / no ceiling) rather
// than as zero, and a job carrying only one of its own two salary fields
// is treated as a single-point range at that value (both existing data
// shapes this app's own job form can produce). A job with NEITHER salary
// field is excluded rather than guessed at -- the candidate explicitly
// asked for a salary range, so silently including an unknown is worse than
// leaving it out. An inverted candidate range (min > max) is silently
// swapped rather than left to produce nonsensical results.
function jobSalaryOverlaps(job, rawMin, rawMax) {
  if (job.salaryMin == null && job.salaryMax == null) return false

  const jobMin = job.salaryMin ?? job.salaryMax
  const jobMax = job.salaryMax ?? job.salaryMin

  const [userMin, userMax] =
    rawMin != null && rawMax != null && rawMin > rawMax ? [rawMax, rawMin] : [rawMin, rawMax]
  const effectiveUserMin = userMin ?? -Infinity
  const effectiveUserMax = userMax ?? Infinity

  return jobMin <= effectiveUserMax && effectiveUserMin <= jobMax
}

export function filterAndSortJobs(jobs, options = {}) {
  const {
    search = '',
    location = '',
    jobType = '',
    workMode = '',
    experienceLevel = '',
    skills = [],
    salaryMin = null,
    salaryMax = null,
    sortBy = 'recent',
  } = options

  let result = jobs

  const term = search.trim().toLowerCase()
  if (term) {
    result = result.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.companyName?.toLowerCase().includes(term) ||
        job.skills?.some((skill) => skill.toLowerCase().includes(term))
    )
  }

  if (location) result = result.filter((job) => job.location === location)
  if (jobType) result = result.filter((job) => job.jobType === jobType)
  if (workMode) result = result.filter((job) => job.workMode === workMode)
  if (experienceLevel) result = result.filter((job) => job.experienceLevel === experienceLevel)

  // ALL-selected semantics: a job must carry every selected skill, not just
  // one. Case-insensitive on both sides; a job with no skills array (or an
  // empty one) simply never matches once any skill is selected.
  const normalizedSkills = skills.map((s) => s.toLowerCase().trim()).filter(Boolean)
  if (normalizedSkills.length > 0) {
    result = result.filter((job) => {
      const jobSkillsLower = new Set((job.skills || []).map((s) => s.toLowerCase().trim()))
      return normalizedSkills.every((skill) => jobSkillsLower.has(skill))
    })
  }

  if (salaryMin != null || salaryMax != null) {
    result = result.filter((job) => jobSalaryOverlaps(job, salaryMin, salaryMax))
  }

  result = [...result]
  if (sortBy === 'salary') {
    result.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0))
  } else if (sortBy === 'relevance' && term) {
    // Deterministic tie-break: newest first, never an arbitrary order.
    result.sort((a, b) => relevanceScore(b, term) - relevanceScore(a, term) || recentMillis(b) - recentMillis(a))
  } else {
    // Also the fallback for sortBy === 'relevance' with no search term --
    // there's nothing to rank relevance against, so this degrades to the
    // same deterministic "recent" ordering rather than an arbitrary one.
    result.sort((a, b) => recentMillis(b) - recentMillis(a))
  }

  return result
}
