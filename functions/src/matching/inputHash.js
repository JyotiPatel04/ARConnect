import { createHash } from 'node:crypto'

// Only the fields the scoring formula actually reads go into the hash —
// editing a job's description or a candidate's bio must NOT invalidate a
// cached match, since neither field can possibly change the score.
const PROFILE_FIELDS = [
  'skills',
  'experienceYears',
  'location',
  'preferredJobTypes',
  'preferredWorkModes',
  'expectedSalaryMin',
  'expectedSalaryMax',
]
const JOB_FIELDS = ['skills', 'experienceLevel', 'location', 'workMode', 'jobType', 'salaryMin', 'salaryMax']

function pick(source, fields) {
  const result = {}
  for (const field of fields) {
    result[field] = source?.[field] ?? null
  }
  return result
}

export function computeInputHash(candidateProfile, job) {
  const payload = JSON.stringify({
    profile: pick(candidateProfile, PROFILE_FIELDS),
    job: pick(job, JOB_FIELDS),
  })
  return createHash('sha256').update(payload).digest('hex')
}
