import { useMemo, useState } from 'react'
import { AlertCircle, Briefcase, Search } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminJobs from '../../hooks/useAdminJobs'

const STATUS_FILTERS = ['all', 'active', 'closed']

export default function AdminJobsPage() {
  useDocumentTitle('Jobs')
  const { jobs, loading, error } = useAdminJobs()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return jobs.filter((j) => {
      if (statusFilter !== 'all' && j.status !== statusFilter) return false
      if (!term) return true
      return `${j.title || ''} ${j.companyName || ''}`.toLowerCase().includes(term)
    })
  }, [jobs, search, statusFilter])

  return (
    <div>
      <PageHeader title="Jobs" subtitle={loading ? 'Loading...' : `${filtered.length} of ${jobs.length} job posts`} />

      {!loading && !error && jobs.length > 0 && (
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or company..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold capitalize ${
                  statusFilter === s ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading jobs...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load jobs" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon={Briefcase} title="No jobs yet" subtitle="Job posts from employers will show up here." />
      )}

      {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No jobs match your filters" subtitle="Try a different search term or status." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-2.5 font-bold">Job Title</th>
                <th className="px-4 py-2.5 font-bold">Employer</th>
                <th className="px-4 py-2.5 font-bold">Location</th>
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Applications</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-bold text-navy-900">{job.title}</td>
                  <td className="px-4 py-2.5 text-navy-600">{job.companyName}</td>
                  <td className="px-4 py-2.5 text-navy-600">{job.location}</td>
                  <td className="px-4 py-2.5 text-navy-600">{job.jobType}</td>
                  <td className="px-4 py-2.5 text-navy-600">{job.applicationCount || 0}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        job.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {job.status === 'active' ? 'Active' : 'Closed'}
                    </span>
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
