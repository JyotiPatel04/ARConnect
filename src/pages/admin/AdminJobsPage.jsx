import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

const statuses = ['hired', 'interview', 'shortlisted', 'pending', 'applied', 'review']

export default function AdminJobsPage() {
  useDocumentTitle('Jobs')

  return (
    <div>
      <PageHeader title="Jobs" subtitle="8,240 active job posts" />
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-2.5 font-bold">Job Title</th>
              <th className="px-4 py-2.5 font-bold">Company</th>
              <th className="px-4 py-2.5 font-bold">Location</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={job.title} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-bold text-navy-900">{job.title}</td>
                <td className="px-4 py-2.5 text-navy-600">{job.company}</td>
                <td className="px-4 py-2.5 text-navy-600">{job.location}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={statuses[i % statuses.length]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
