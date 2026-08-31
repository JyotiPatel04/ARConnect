import { CalendarDays, Clock } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const interviews = [
  { candidate: 'Rahul Kumar', role: 'Sales Executive', date: '29 Aug 2026', time: '11:30 AM' },
  { candidate: 'Amit Sharma', role: 'Sales Executive', date: '30 Aug 2026', time: '3:00 PM' },
]

export default function EmployerInterviewsPage() {
  useDocumentTitle('Interviews')

  return (
    <div>
      <PageHeader title="Interviews" subtitle="Scheduled interviews across your jobs" />
      <div className="space-y-2.5">
        {interviews.map((iv) => (
          <div
            key={iv.candidate}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft"
          >
            <div>
              <p className="text-[13px] font-bold text-navy-900">{iv.candidate}</p>
              <p className="text-xs text-navy-500">{iv.role}</p>
            </div>
            <div className="text-right text-xs text-navy-500">
              <p className="flex items-center justify-end gap-1 font-semibold text-navy-700">
                <CalendarDays size={12} /> {iv.date}
              </p>
              <p className="mt-0.5 flex items-center justify-end gap-1">
                <Clock size={12} /> {iv.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
