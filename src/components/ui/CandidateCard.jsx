import { MapPin } from 'lucide-react'
import MatchBadge from './MatchBadge'
import StatusBadge from './StatusBadge'

export default function CandidateCard({ candidate, status, match }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
          {candidate.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </div>
        <div>
          <p className="text-sm font-bold text-navy-900">{candidate.name}</p>
          <p className="flex items-center gap-1 text-[12px] text-navy-500">
            <MapPin size={11} /> {candidate.location} · {candidate.exp}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {match && <MatchBadge value={match} />}
        {status && <StatusBadge status={status} />}
      </div>
    </div>
  )
}
