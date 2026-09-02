import { useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, Clock, ExternalLink, MapPin, Phone, Video } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useCandidateInterviews from '../../hooks/useCandidateInterviews'
import { INTERVIEW_TYPE_LABELS } from '../../lib/interviewForm'

const TYPE_ICONS = { online: Video, phone: Phone, in_person: MapPin }

function InterviewCard({ interview }) {
  const Icon = TYPE_ICONS[interview.interviewType] || CalendarDays
  const date = interview.scheduledAt?.toDate?.()
  const statusStyles = {
    scheduled: 'bg-primary-50 text-primary-600',
    completed: 'bg-success-50 text-success-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }
  const statusLabels = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">{interview.jobTitle || 'Interview'}</h2>
          {interview.companyName && <p className="text-xs text-navy-500">{interview.companyName}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${statusStyles[interview.status]}`}>
          {statusLabels[interview.status]}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[13px] text-navy-700">
        {date && (
          <>
            <p className="flex items-center gap-2">
              <CalendarDays size={14} className="text-primary-600" />
              {date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-primary-600" />
              {date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {interview.durationMinutes} min
            </p>
          </>
        )}
        <p className="flex items-center gap-2">
          <Icon size={14} className="text-primary-600" /> {INTERVIEW_TYPE_LABELS[interview.interviewType]}
        </p>
        {interview.interviewType === 'online' && interview.meetingLink && (
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 font-semibold text-primary-600 hover:underline"
          >
            <ExternalLink size={14} /> Join meeting
          </a>
        )}
        {interview.interviewType === 'in_person' && interview.location && (
          <p className="flex items-center gap-2">
            <MapPin size={14} className="text-primary-600" /> {interview.location}
          </p>
        )}
        {interview.notes && <p className="mt-1 text-xs text-navy-500">{interview.notes}</p>}
      </div>
    </div>
  )
}

export default function CandidateInterviewsPage() {
  useDocumentTitle('Interviews')
  const { interviews, loading, error } = useCandidateInterviews()
  // Lazy initializer runs once at mount, not on every render — the
  // accepted pattern for reading a one-time "now" value without making
  // the render itself impure (calling Date.now() directly in a useMemo
  // callback trips react-hooks' purity check).
  const [now] = useState(() => Date.now())

  const { upcoming, past } = useMemo(() => {
    const upcoming = []
    const past = []
    for (const iv of interviews) {
      const at = iv.scheduledAt?.toMillis?.() ?? 0
      if (iv.status === 'scheduled' && at >= now) upcoming.push(iv)
      else past.push(iv)
    }
    upcoming.sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))
    past.sort((a, b) => (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0))
    return { upcoming, past }
  }, [interviews, now])

  return (
    <div>
      <PageHeader title="Interviews" subtitle="Your interview schedule" />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading interviews...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load interviews" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && interviews.length === 0 && (
        <EmptyState icon={CalendarDays} title="No interviews yet" subtitle="Interviews employers schedule with you will show up here." />
      )}

      {!loading && !error && interviews.length > 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-2 text-[13px] font-bold text-navy-900">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-xs text-navy-400">No upcoming interviews.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((iv) => (
                  <InterviewCard key={iv.id} interview={iv} />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="mb-2 text-[13px] font-bold text-navy-900">Past &amp; Cancelled</h2>
              <div className="space-y-3">
                {past.map((iv) => (
                  <InterviewCard key={iv.id} interview={iv} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
