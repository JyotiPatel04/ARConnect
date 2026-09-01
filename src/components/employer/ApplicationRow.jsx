import { Sparkles } from 'lucide-react'
import { APPLICATION_STATUSES } from '../../services/employerApplicationService'
import useJobMatch from '../../hooks/useJobMatch'
import { formatRelativeTime } from '../../lib/format'

const STATUS_LABELS = {
  applied: 'Applied',
  reviewing: 'In Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not Selected',
  hired: 'Hired',
}

export default function ApplicationRow({ application, onStatusChange, updating, showJobTitle = true }) {
  const { match, loading: matchLoading } = useJobMatch(application.jobId, application.candidateId)

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-navy-900">{application.candidateName}</p>
          {!matchLoading && match?.score != null && (
            <span
              title={match.explanation}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10.5px] font-bold text-primary-600"
            >
              <Sparkles size={10} /> {match.score}% match
            </span>
          )}
        </div>
        <p className="text-xs text-navy-500">{application.candidateEmail}</p>
        <p className="mt-0.5 text-[11px] text-navy-400">
          {showJobTitle && `${application.jobTitle} · `}
          Applied {formatRelativeTime(application.appliedAt?.toDate?.())}
        </p>
      </div>
      <select
        value={application.status}
        onChange={(e) => onStatusChange(application.id, e.target.value)}
        disabled={updating}
        aria-label={`Status for ${application.candidateName}`}
        className="w-full shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-navy-700 disabled:opacity-60 sm:w-auto"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  )
}
