import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { candidates } from '../../data/sampleData'

export default function AdminUsersPage() {
  useDocumentTitle('Users')

  return (
    <div>
      <PageHeader title="Users" subtitle="125,420 registered candidates" />
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-2.5 font-bold">Name</th>
              <th className="px-4 py-2.5 font-bold">Role</th>
              <th className="px-4 py-2.5 font-bold">Location</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.name} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-bold text-navy-900">{c.name}</td>
                <td className="px-4 py-2.5 text-navy-600">{c.role}</td>
                <td className="px-4 py-2.5 text-navy-600">{c.location}</td>
                <td className="px-4 py-2.5 text-success-600 font-semibold">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
