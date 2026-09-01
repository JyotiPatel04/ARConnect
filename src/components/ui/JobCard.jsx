import { MapPin, Briefcase, Bookmark } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import MatchBadge from './MatchBadge'

export default function JobCard({ job, compact = false, isSaved, onToggleSave }) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white shadow-soft ${
        compact ? 'p-3.5' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-600">
            {job.company.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight text-navy-900">
              {job.title}
            </h4>
            <p className="text-[12px] text-navy-500">{job.company}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {job.match != null && <MatchBadge value={job.match} />}
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleSave()
              }}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                isSaved ? 'text-primary-600' : 'text-navy-300 hover:text-navy-500'
              }`}
            >
              <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[15px] font-bold text-navy-900">{job.salary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-navy-500">
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase size={12} /> {job.type}
        </span>
        <span>{job.posted}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {job.verified ? (
          <VerifiedBadge />
        ) : (
          <span className="text-[11px] font-semibold text-navy-400">
            Verification pending
          </span>
        )}
        {!compact && (
          <button className="text-xs font-bold text-primary-600 hover:text-primary-700">
            View →
          </button>
        )}
      </div>
    </div>
  )
}
