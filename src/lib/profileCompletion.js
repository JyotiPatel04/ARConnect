// Deterministic candidate profile completion checklist. Every item below
// is worth an equal share of the total (100 / PROFILE_COMPLETION_ITEMS.length)
// — add or remove an item here and the percentage re-normalizes on its
// own, so weights never need hand-updating.
//
// Scoped ONLY to candidateProfiles/{uid} fields — never users/{uid}
// fields like full_name/phone. That's what lets the stored
// `profileComplete` boolean (computed by this same function inside
// candidateProfileService.upsertMyProfile) and the on-screen completion
// meter (computed by this same function in the UI) share one source of
// truth and never drift apart.
const PROFILE_COMPLETION_ITEMS = [
  { key: 'skills', label: 'Skills', check: (p) => Array.isArray(p.skills) && p.skills.length > 0 },
  { key: 'experienceYears', label: 'Years of experience', check: (p) => p.experienceYears != null },
  { key: 'experienceSummary', label: 'Experience summary', check: (p) => Boolean(p.experienceSummary?.trim()) },
  { key: 'educationLevel', label: 'Education level', check: (p) => Boolean(p.educationLevel?.trim()) },
  { key: 'location', label: 'Location', check: (p) => Boolean(p.location?.trim()) },
  { key: 'bio', label: 'Short bio', check: (p) => Boolean(p.bio?.trim()) },
  {
    key: 'preferredJobTypes',
    label: 'Preferred job types',
    check: (p) => Array.isArray(p.preferredJobTypes) && p.preferredJobTypes.length > 0,
  },
  {
    key: 'preferredWorkModes',
    label: 'Preferred work modes',
    check: (p) => Array.isArray(p.preferredWorkModes) && p.preferredWorkModes.length > 0,
  },
  {
    key: 'expectedSalary',
    label: 'Expected salary range',
    check: (p) => p.expectedSalaryMin != null && p.expectedSalaryMax != null,
  },
  { key: 'resumeLink', label: 'Resume link', check: (p) => Boolean(p.resumeLink?.trim()) },
]

/**
 * @param {object|null|undefined} candidateProfile - a candidateProfiles/{uid} document (or null/undefined for "no profile yet")
 * @returns {{ percent: number, completedCount: number, totalCount: number, missing: {key:string,label:string}[], isComplete: boolean }}
 */
export function calculateProfileCompletion(candidateProfile) {
  const profile = candidateProfile || {}
  const missing = []
  let completedCount = 0

  for (const item of PROFILE_COMPLETION_ITEMS) {
    if (item.check(profile)) {
      completedCount += 1
    } else {
      missing.push({ key: item.key, label: item.label })
    }
  }

  return {
    percent: Math.round((100 * completedCount) / PROFILE_COMPLETION_ITEMS.length),
    completedCount,
    totalCount: PROFILE_COMPLETION_ITEMS.length,
    missing,
    isComplete: missing.length === 0,
  }
}
