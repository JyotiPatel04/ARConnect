import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const applications = [
  { title: 'Sales Executive', company: 'ABC Pvt Ltd', location: 'Varanasi', status: 'interview' },
  { title: 'Delivery Executive', company: 'QuickServe', location: 'Lucknow', status: 'shortlisted' },
  { title: 'Customer Support', company: 'TechNova Solutions', location: 'Noida', status: 'review' },
  { title: 'Back Office', company: 'ABC Pvt Ltd', location: 'Delhi', status: 'rejected' },
]

export default function CandidateApplicationsPage() {
  useDocumentTitle('My Applications')

  return (
    <div>
      <PageHeader title="My Applications" subtitle={`${applications.length} jobs applied`} />
      <div className="space-y-2.5">
        {applications.map((a) => (
          <div
            key={a.title}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft"
          >
            <div>
              <p className="text-[13px] font-bold text-navy-900">{a.title}</p>
              <p className="text-xs text-navy-500">{a.company} · {a.location}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
