import { Flag } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const reports = [
  { job: 'Driver', company: 'QuickServe', reason: 'Asking for money / fees', date: '28 Aug 2026' },
]

export default function AdminReportsPage() {
  useDocumentTitle('Reports')

  return (
    <div>
      <PageHeader title="Reports" subtitle="Job postings flagged by candidates" />
      {reports.length > 0 ? (
        <div className="space-y-2.5">
          {reports.map((r) => (
            <div key={r.job} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Flag size={14} />
              </span>
              <div>
                <p className="text-[13px] font-bold text-navy-900">{r.job} · {r.company}</p>
                <p className="text-xs text-navy-500">{r.reason}</p>
                <p className="mt-0.5 text-[10.5px] text-navy-400">Reported {r.date}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-navy-500">No reports at this time.</p>
      )}
    </div>
  )
}
