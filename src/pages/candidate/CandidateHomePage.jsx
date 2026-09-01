import { Search, Sparkles, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import EmptyState from '../../components/ui/EmptyState'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJobs from '../../hooks/useJobs'
import useSavedJobs from '../../hooks/useSavedJobs'
import { toJobCardProps } from '../../lib/format'
import { JOB_TYPES } from '../../lib/jobOptions'

export default function CandidateHomePage() {
  useDocumentTitle('Home')
  const { profile } = useAuth()
  const { jobs, loading, error } = useJobs()
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()

  const recent = jobs.slice(0, 4)

  async function handleToggleSave(job) {
    if (isSaved(job.id)) {
      await unsaveJob(job.id)
    } else {
      await saveJob(job)
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-navy-500">Good morning,</p>
      <h1 className="text-lg font-extrabold text-navy-900">{profile?.full_name || 'there'} 👋</h1>

      <Link
        to="/candidate/jobs"
        className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-soft"
      >
        <Search size={16} className="text-navy-400" />
        <span className="text-sm text-navy-400">Search jobs, companies...</span>
      </Link>

      <div className="mt-3 rounded-2xl bg-primary-600 p-4 text-white shadow-soft">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles size={14} /> {jobs.length} open jobs waiting for you
        </p>
        <p className="mt-0.5 text-xs text-primary-100">
          Complete your profile to help employers find you
        </p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {JOB_TYPES.map((t) => (
          <Link
            key={t}
            to={`/candidate/jobs?jobType=${encodeURIComponent(t)}`}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-navy-700"
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy-900">Recent jobs</h2>
        <Link to="/candidate/jobs" className="text-xs font-semibold text-primary-600">
          See all
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {loading && <p className="py-8 text-center text-sm text-navy-400">Loading jobs...</p>}

        {!loading && error && (
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="Couldn't load jobs right now"
            subtitle="Please check your connection and try again."
          />
        )}

        {!loading && !error && recent.length === 0 && (
          <EmptyState icon={Search} title="No jobs posted yet" subtitle="Check back soon for new openings." />
        )}

        {!loading &&
          !error &&
          recent.map((job) => (
            <Link key={job.id} to={`/candidate/jobs/${job.id}`}>
              <JobCard
                job={toJobCardProps(job)}
                compact
                isSaved={isSaved(job.id)}
                onToggleSave={() => handleToggleSave(job)}
              />
            </Link>
          ))}
      </div>
    </div>
  )
}
