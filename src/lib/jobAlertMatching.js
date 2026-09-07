// Pure, deterministic job-alert matching -- no Firestore reads, no network,
// no AI. Every unset/empty preference field means "no constraint on this
// dimension," so a nearly-empty preferences document matches broadly by
// design (the candidate's own choice, not a bug). Mirrors the exact
// comparison style already used by src/lib/jobFilters.js (candidate job
// search), just evaluated in the opposite direction: "does this one job
// satisfy these preferences" rather than "filter this list of jobs."
export function doesJobMatchPreferences(job, prefs) {
  if (!job || !prefs) return false
  if (prefs.enabled === false) return false

  if (prefs.jobTypes?.length && !prefs.jobTypes.includes(job.jobType)) return false
  if (prefs.workModes?.length && !prefs.workModes.includes(job.workMode)) return false
  if (prefs.locations?.length && !prefs.locations.includes(job.location)) return false
  if (prefs.experienceLevel && prefs.experienceLevel !== job.experienceLevel) return false

  if (prefs.skills?.length) {
    const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase())
    const hasOverlap = prefs.skills.some((s) => jobSkillsLower.includes(s.toLowerCase()))
    if (!hasOverlap) return false
  }

  return true
}
