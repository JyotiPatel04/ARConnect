// Deterministic company profile completion checklist. Unlike the
// candidate checklist (equal-weight — see lib/profileCompletion.js),
// fields here carry different weights reflecting how much each one
// actually matters to a candidate deciding whether to apply: core
// identity (name/industry/location/about) counts far more than nice-to-
// haves (founded year). Weights are fixed constants, sum to 100, and are
// the ONLY place this judgment call is made — change a weight here and
// both the UI meter and the stored `profileComplete` flag move together.
const WEIGHTS = {
  companyName: 15,
  industry: 15,
  location: 15,
  about: 15,
  companySize: 8,
  website: 8,
  companyLogoUrl: 8,
  contactEmail: 6,
  contactPhone: 6,
  foundedYear: 4,
}

const CHECKS = {
  companyName: (p) => Boolean(p.companyName?.trim()),
  industry: (p) => Boolean(p.industry?.trim()),
  location: (p) => Boolean(p.location?.trim()),
  about: (p) => Boolean(p.about?.trim()),
  companySize: (p) => Boolean(p.companySize?.trim()),
  website: (p) => Boolean(p.website?.trim()),
  companyLogoUrl: (p) => Boolean(p.companyLogoUrl?.trim()),
  contactEmail: (p) => Boolean(p.contactEmail?.trim()),
  contactPhone: (p) => Boolean(p.contactPhone?.trim()),
  foundedYear: (p) => p.foundedYear != null,
}

const LABELS = {
  companyName: 'Company name',
  industry: 'Industry',
  location: 'Location',
  about: 'About company',
  companySize: 'Company size',
  website: 'Website',
  companyLogoUrl: 'Company logo',
  contactEmail: 'Contact email',
  contactPhone: 'Contact phone',
  foundedYear: 'Founded year',
}

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0)

/**
 * @param {object|null|undefined} companyProfile - a companyProfiles/{uid} document (or null/undefined for "no profile yet")
 * @returns {{ percent: number, missing: {key:string,label:string,weight:number}[], isComplete: boolean }}
 */
export function calculateCompanyProfileCompletion(companyProfile) {
  const profile = companyProfile || {}
  const missing = []
  let earnedWeight = 0

  for (const key of Object.keys(WEIGHTS)) {
    if (CHECKS[key](profile)) {
      earnedWeight += WEIGHTS[key]
    } else {
      missing.push({ key, label: LABELS[key], weight: WEIGHTS[key] })
    }
  }

  return {
    percent: Math.round((100 * earnedWeight) / TOTAL_WEIGHT),
    missing,
    isComplete: missing.length === 0,
  }
}
