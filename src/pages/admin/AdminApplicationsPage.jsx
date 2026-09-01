import { useMemo, useState } from 'react'
import { AlertCircle, ClipboardList, Search } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminApplications from '../../hooks/useAdminApplications'
import { formatRelativeTime } from '../../lib/format'

export default function AdminApplicationsPage() {
  useDocumentTitle('Applications')
  const { applications, loading, error } = useAdminApplications()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return applications
    const term = search.toLowerCase()
    return applications.filter((a) =>
      `${a.candidateName || ''} ${a.jobTitle || ''} ${a.companyName || ''}`.toLowerCase().includes(term)
    )
  }, [applications, search])

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={loading ? 'Loading...' : `${filtered.length} of ${applications.length} applications`}
      />

      {!loading && !error && applications.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate, job, or employer..."
            className="w-full max-w-sm rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading applications...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load applications" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState icon={ClipboardList} title="No applications yet" subtitle="Applications candidates submit will show up here." />
      )}

      {!loading && !error && applications.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No applications match your search" subtitle="Try a different candidate, job, or employer name." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-2.5 font-bold">Candidate</th>
                <th className="px-4 py-2.5 font-bold">Job</th>
                <th className="px-4 py-2.5 font-bold">Employer</th>
                <th className="px-4 py-2.5 font-bold">Applied</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-navy-900">{a.candidateName}</p>
                    <p className="text-[11px] text-navy-400">{a.candidateEmail}</p>
                  </td>
                  <td className="px-4 py-2.5 text-navy-600">{a.jobTitle}</td>
                  <td className="px-4 py-2.5 text-navy-600">{a.companyName}</td>
                  <td className="px-4 py-2.5 text-navy-600">{formatRelativeTime(a.appliedAt?.toDate?.())}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
