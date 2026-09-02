import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateCompanyProfileCompletion } from '../lib/companyProfileCompletion'

export async function getMyCompanyProfile(uid) {
  const snap = await getDoc(doc(db, 'companyProfiles', uid))
  return snap.exists() ? snap.data() : null
}

// Public, candidate-facing lookup — reads companySummaries, never
// companyProfiles, so this call can never return contactEmail/contactPhone
// even if this function were misused. Returns null (not an error) when no
// company profile has been created yet, since that's an entirely normal
// state for a job's employer to be in.
export async function getCompanySummary(employerId) {
  if (!employerId) return null
  const snap = await getDoc(doc(db, 'companySummaries', employerId))
  return snap.exists() ? snap.data() : null
}

// Writes companyProfiles/{uid} (private, full data) and companySummaries/{uid}
// (public-safe subset — never contactEmail/contactPhone) together in one
// atomic batch, so the two documents can never end up out of sync with
// each other. There's no Cloud Function deriving the summary from the
// private doc (none are deployed in this phase) — this is the client-side
// equivalent: one function, one source form, both writes always together.
export async function upsertMyCompanyProfile(uid, data) {
  const profileRef = doc(db, 'companyProfiles', uid)
  const summaryRef = doc(db, 'companySummaries', uid)
  const existing = await getDoc(profileRef)
  const now = new Date()

  const profile = {
    employerId: uid,
    companyName: data.companyName || '',
    companyLogoUrl: data.companyLogoUrl || '',
    industry: data.industry || '',
    companySize: data.companySize || '',
    location: data.location || '',
    website: data.website || '',
    about: data.about || '',
    contactEmail: data.contactEmail || '',
    contactPhone: data.contactPhone || '',
    foundedYear: data.foundedYear ?? null,
  }
  // Single source of truth: the same function drives the on-screen
  // completion meter and the stored flag, so they can never disagree.
  profile.profileComplete = calculateCompanyProfileCompletion(profile).isComplete

  // The public summary is a strict subset — deliberately built field by
  // field rather than via destructuring, so it's obvious at a glance that
  // contactEmail/contactPhone never appear here (the security rule also
  // enforces this structurally, independent of this client code).
  const summary = {
    employerId: uid,
    companyName: profile.companyName,
    companyLogoUrl: profile.companyLogoUrl,
    industry: profile.industry,
    companySize: profile.companySize,
    location: profile.location,
    website: profile.website,
    about: profile.about,
    foundedYear: profile.foundedYear,
  }

  const batch = writeBatch(db)
  batch.set(profileRef, {
    ...profile,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(summaryRef, { ...summary, updatedAt: serverTimestamp() })
  await batch.commit()

  return { ...profile, createdAt: existing.exists() ? existing.data().createdAt : now, updatedAt: now }
}
