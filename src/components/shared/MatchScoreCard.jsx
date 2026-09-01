import { Sparkles, AlertCircle } from 'lucide-react'

const FACTOR_LABELS = {
  skills: 'Skills',
  experience: 'Experience',
  location: 'Location',
  salary: 'Salary',
  jobType: 'Job Type',
  workMode: 'Work Mode',
}

export default function MatchScoreCard({ match, loading, error, compact = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <p className="text-sm text-navy-400">Computing match...</p>
      </div>
    )
  }

  if (error) {
    const profileIncomplete = error.code === 'functions/failed-precondition'
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <p className="flex items-center gap-2 text-[13px] text-navy-500">
          <AlertCircle size={15} className="shrink-0 text-amber-500" />
          {profileIncomplete
            ? 'Complete your match profile to see a score for this job.'
            : "Couldn't compute a match score right now."}
        </p>
      </div>
    )
  }

  if (!match || match.score == null) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <p className="text-[13px] text-navy-500">Not enough profile data yet to compute a match score.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-extrabold text-primary-600">
          {match.score}%
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] font-bold text-primary-600">
            <Sparkles size={12} /> AI MATCH
          </p>
          <p className="text-[12px] leading-snug text-navy-500">{match.explanation}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(match.breakdown)
            .filter(([, factor]) => factor.available)
            .map(([key, factor]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-[11px] text-navy-600">
                  <span>{FACTOR_LABELS[key]}</span>
                  <span className="font-bold">{factor.score}%</span>
                </div>
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary-600" style={{ width: `${factor.score}%` }} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
