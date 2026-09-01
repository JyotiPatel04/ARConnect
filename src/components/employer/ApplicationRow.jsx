import { APPLICATION_STATUSES } from '../../services/employerApplicationService'
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
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-navy-900">{application.candidateName}</p>
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
