// Phase 17 P2: extracted so the "latest interview per application" join
// logic is unit-testable without a Firestore emulator. Used by
// useEmployerApplications to fix ApplicationRow's N+1 read pattern -- an
// employer's applications page used to issue one interview query PER
// visible row (50 applications = 50 separate reads); this groups a single
// listInterviewsByEmployer() result once instead.
export function latestInterviewsByApplicationId(interviews) {
  const map = new Map()
  for (const interview of interviews) {
    const existing = map.get(interview.applicationId)
    const candidateMillis = interview.createdAt?.toMillis?.() ?? 0
    const existingMillis = existing?.createdAt?.toMillis?.() ?? 0
    if (!existing || candidateMillis > existingMillis) {
      map.set(interview.applicationId, interview)
    }
  }
  return map
}
