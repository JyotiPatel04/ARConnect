// Pure filter over an already-loaded interviews array (see
// useCandidateInterviews) -- no Firestore reads of its own. "Upcoming"
// means status === 'scheduled' AND scheduledAt is in the future; a
// completed or cancelled interview, or a scheduled one whose time has
// already passed, is excluded either way. `now` is passed in (rather than
// read internally via Date.now()) so this stays a pure function of its
// inputs and is trivially testable without faking the clock.
export function selectUpcomingInterviews(interviews, now, limit = 3) {
  return interviews
    .filter((iv) => iv.status === 'scheduled' && (iv.scheduledAt?.toMillis?.() ?? 0) > now)
    .sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))
    .slice(0, limit)
}
