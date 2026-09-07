// Deterministic, pure rule-based match scoring — the numeric score NEVER
// comes from an LLM. Same candidateProfile + job input always produces the
// same output: no randomness, no I/O, no external calls, fixed rounding
// applied exactly once per sub-score and once for the final weighted sum.

export const WEIGHTS = {
  skills: 35,
  experience: 20,
  location: 15,
  salary: 15,
  jobType: 10,
  workMode: 5,
}

// v1 deliberately excludes education — jobs/{jobId} carries no education
// requirement field, and adding one is an explicit decision for a later
// phase, not a silent schema change made here.
const EXPERIENCE_BANDS = {
  Fresher: [0, 0],
  '0-2 years': [0, 2],
  '2-5 years': [2, 5],
  '5+ years': [5, Infinity],
}

function normalize(value) {
  return typeof value === 'string' ? value.toLowerCase().trim() : value
}

// null = "not enough data to score this factor" — excluded from the
// weighted average below, never silently treated as a 0.
export function scoreSkills(candidateSkills, jobSkills) {
  const required = (jobSkills || []).map(normalize)
  if (required.length === 0) return null
  const candidateSet = new Set((candidateSkills || []).map(normalize))
  const matched = required.filter((skill) => candidateSet.has(skill)).length
  return Math.round((100 * matched) / required.length)
}

export function scoreExperience(candidateYears, experienceLevel) {
  const band = EXPERIENCE_BANDS[experienceLevel]
  if (!band || candidateYears == null) return null
  const [min] = band
  if (candidateYears >= min || min === 0) return 100
  return Math.round((100 * candidateYears) / min)
}

export function scoreLocation(candidateLocation, jobLocation, jobWorkMode) {
  if (jobWorkMode === 'Remote') return 100
  if (!candidateLocation || !jobLocation) return null
  return candidateLocation === jobLocation ? 100 : 0
}

export function scoreSalary(candidateMin, candidateMax, jobMin, jobMax) {
  if (candidateMin == null || candidateMax == null || jobMin == null || jobMax == null) {
    return null
  }
  const overlapLow = Math.max(candidateMin, jobMin)
  const overlapHigh = Math.min(candidateMax, jobMax)

  if (overlapHigh >= overlapLow) {
    const candidateRangeWidth = candidateMax - candidateMin
    if (candidateRangeWidth === 0) return 100
    return Math.min(100, Math.round((100 * (overlapHigh - overlapLow)) / candidateRangeWidth))
  }

  // No overlap — decay gracefully by how far apart the ranges are, rather
  // than a hard cliff to 0.
  const gap = overlapLow - overlapHigh
  if (jobMax === 0) return 0
  return Math.max(0, Math.round(100 - (100 * gap) / jobMax))
}

export function scoreJobType(preferredJobTypes, jobType) {
  if (!preferredJobTypes || preferredJobTypes.length === 0) return null
  return preferredJobTypes.includes(jobType) ? 100 : 0
}

export function scoreWorkMode(preferredWorkModes, jobWorkMode) {
  if (!preferredWorkModes || preferredWorkModes.length === 0) return null
  return preferredWorkModes.includes(jobWorkMode) ? 100 : 0
}

/**
 * @returns {{ score: number|null, breakdown: Record<string, {score:number|null, weight:number, available:boolean}> }}
 *   score is null only when every single factor was unavailable (profile
 *   too incomplete to score at all) — the caller should treat that as
 *   "cannot compute a match yet", never as a 0.
 */
export function computeScore(candidateProfile, job) {
  const factorValues = {
    skills: scoreSkills(candidateProfile?.skills, job?.skills),
    experience: scoreExperience(candidateProfile?.experienceYears, job?.experienceLevel),
    location: scoreLocation(candidateProfile?.location, job?.location, job?.workMode),
    salary: scoreSalary(
      candidateProfile?.expectedSalaryMin,
      candidateProfile?.expectedSalaryMax,
      job?.salaryMin,
      job?.salaryMax
    ),
    jobType: scoreJobType(candidateProfile?.preferredJobTypes, job?.jobType),
    workMode: scoreWorkMode(candidateProfile?.preferredWorkModes, job?.workMode),
  }

  const breakdown = {}
  let weightedSum = 0
  let totalWeight = 0

  for (const [key, value] of Object.entries(factorValues)) {
    const weight = WEIGHTS[key]
    const available = value !== null
    breakdown[key] = { score: available ? value : null, weight, available }
    if (available) {
      weightedSum += weight * value
      totalWeight += weight
    }
  }

  const score = totalWeight === 0 ? null : Math.round(weightedSum / totalWeight)

  return { score, breakdown }
}
