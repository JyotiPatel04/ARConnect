import { useMemo } from 'react'
import { Users, AlertCircle } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerApplications from '../../hooks/useEmployerApplications'
import { formatRelativeTime } from '../../lib/format'

// Builds one row per distinct candidate from real applications data — never
// fabricated. Only the fields an employer legitimately needs to evaluate an
// applicant are shown (name, email, what they applied to, current status) —
// nothing from the candidate's private profile beyond what's already
// denormalized onto their applications.
function groupByCandidate(applications) {
  const byCandidate = new Map()
  for (const a of applications) {
    const existing = byCandidate.get(a.candidateId)
    if (!existing) {
      byCandidate.set(a.candidateId, {
        candidateId: a.candidateId,
        candidateName: a.candidateName,
        candidateEmail: a.candidateEmail,
        jobTitles: [a.jobTitle],
        count: 1,
        latestStatus: a.status,
        latestAppliedAt: a.appliedAt,
      })
    } else {
      existing.count += 1
      if (!existing.jobTitles.includes(a.jobTitle)) existing.jobTitles.push(a.jobTitle)
      const existingMs = existing.latestAppliedAt?.toMillis?.() ?? 0
      const currentMs = a.appliedAt?.toMillis?.() ?? 0
      if (currentMs > existingMs) {
        existing.latestStatus = a.status
        existing.latestAppliedAt = a.appliedAt
      }
    }
  }
  return Array.from(byCandidate.values()).sort(
    (a, b) => (b.latestAppliedAt?.toMillis?.() ?? 0) - (a.latestAppliedAt?.toMillis?.() ?? 0)
  )
}

export default function EmployerCandidatesPage() {
  useDocumentTitle('Candidates')
  const { applications, loading, error } = useEmployerApplications()

  const candidates = useMemo(() => groupByCandidate(applications), [applications])

  return (
    <div>
      <PageHeader title="Candidates" subtitle={loading ? 'Loading...' : `${candidates.length} candidates applied to your jobs`} />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading candidates...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load candidates" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && candidates.length === 0 && (
        <EmptyState icon={Users} title="No candidates yet" subtitle="Candidates who apply to your jobs will show up here." />
      )}

      {!loading && !error && candidates.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {candidates.map((c) => (
            <div key={c.candidateId} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-navy-900">{c.candidateName}</p>
                  <p className="truncate text-xs text-navy-500">{c.candidateEmail}</p>
                </div>
                <StatusBadge status={c.latestStatus} />
              </div>
              <p className="mt-2 text-[11px] text-navy-500">
                Applied to: <span className="text-navy-700">{c.jobTitles.join(', ')}</span>
              </p>
              <p className="mt-1 text-[10.5px] text-navy-400">
                {c.count} application{c.count === 1 ? '' : 's'} · Last applied {formatRelativeTime(c.latestAppliedAt?.toDate?.())}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
