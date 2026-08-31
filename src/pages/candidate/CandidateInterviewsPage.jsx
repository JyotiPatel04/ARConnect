import { CalendarDays, Clock, MapPin } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const interviews = [
  { title: 'Sales Executive', company: 'ABC Pvt Ltd', date: '29 Aug 2026', time: '11:30 AM', location: 'Varanasi Office' },
]

export default function CandidateInterviewsPage() {
  useDocumentTitle('Interviews')

  return (
    <div>
      <PageHeader title="Interviews" subtitle="Your upcoming interview schedule" />
      <div className="space-y-3">
        {interviews.map((iv) => (
          <div key={iv.title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-600">
              Interview Scheduled
            </span>
            <h2 className="mt-2.5 text-base font-extrabold text-navy-900">{iv.title}</h2>
            <p className="text-xs text-navy-500">{iv.company}</p>
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[13px] text-navy-700">
              <p className="flex items-center gap-2">
                <CalendarDays size={14} className="text-primary-600" /> {iv.date}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={14} className="text-primary-600" /> {iv.time}
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-primary-600" /> {iv.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
