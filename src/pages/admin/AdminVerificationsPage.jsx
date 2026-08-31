import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const pending = [
  { name: 'QuickServe', type: 'Employer' },
  { name: 'TechNova Solutions', type: 'Employer' },
  { name: 'Driver — QuickServe', type: 'Job Post' },
]

export default function AdminVerificationsPage() {
  useDocumentTitle('Verifications')

  return (
    <div>
      <PageHeader title="Verifications" subtitle="312 items pending review" />
      <div className="space-y-2.5">
        {pending.map((v) => (
          <div
            key={v.name}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft"
          >
            <div>
              <p className="text-[13px] font-bold text-navy-900">{v.name}</p>
              <p className="text-xs text-navy-400">{v.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="pending" />
              <Button size="sm" variant="success">Approve</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
