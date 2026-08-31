import { Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

const saved = jobs.slice(0, 2)

export default function CandidateSavedJobsPage() {
  useDocumentTitle('Saved Jobs')

  return (
    <div>
      <PageHeader title="Saved Jobs" subtitle={`${saved.length} jobs saved`} />
      {saved.length > 0 ? (
        <div className="space-y-3">
          {saved.map((job) => {
            const i = jobs.indexOf(job)
            return (
              <Link key={job.title} to={`/candidate/jobs/${i}`}>
                <JobCard job={job} compact />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <Bookmark size={22} className="text-navy-300" />
          <p className="text-sm text-navy-500">No saved jobs yet.</p>
        </div>
      )}
    </div>
  )
}
