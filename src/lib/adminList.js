// Phase 17 P2: admin's users/jobs/applications tables used to fetch the
// ENTIRE collection on every page visit, unbounded -- fine at today's
// scale, but the one query pattern in this app that grows with total
// platform size rather than any single user's own activity. This caps the
// worst case without changing anything about how the app behaves while
// collections stay under the cap (the overwhelmingly common case today).
export const ADMIN_LIST_LIMIT = 500

// A result count that exactly reaches the limit means there MAY be more
// documents beyond it that weren't fetched. This can't be told apart from
// "the collection happens to have exactly this many documents, no more"
// without an extra query, so it's a conservative, honest signal (show the
// notice) rather than a guaranteed count of what's missing.
export function isListTruncated(resultCount, limit = ADMIN_LIST_LIMIT) {
  return resultCount >= limit
}
