import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const rows = [
  { name: 'Rahul Kumar', role: 'Sales Executive', match: 94, status: 'interview' },
  { name: 'Amit Sharma', role: 'Sales Executive', match: 88, status: 'shortlisted' },
  { name: 'Priya Singh', role: 'Sales Executive', match: 81, status: 'review' },
  { name: 'Vikram Yadav', role: 'Sales Executive', match: 74, status: 'applied' },
  { name: 'Sunita Devi', role: 'Sales Executive', match: 69, status: 'rejected' },
]

export default function EmployerApplicationsPage() {
  useDocumentTitle('Applications')

  return (
    <div>
      <PageHeader title="Applications" subtitle="Sales Executive · ABC Pvt Ltd" />
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-2.5 font-bold">Candidate</th>
              <th className="px-4 py-2.5 font-bold">AI Match</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-slate-100">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">
                      {r.name.split(' ').map((w) => w[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-navy-900">{r.name}</p>
                      <p className="text-[10.5px] text-navy-400">{r.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-bold text-primary-600">{r.match}%</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2.5 text-[12px] font-bold text-primary-600">View Profile</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
