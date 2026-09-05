import { Search, Sparkles, AlertCircle, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import EmptyState from '../../components/ui/EmptyState'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJobs from '../../hooks/useJobs'
import useSavedJobs from '../../hooks/useSavedJobs'
import useCandidateProfile from '../../hooks/useCandidateProfile'
import { toJobCardProps } from '../../lib/format'
import { JOB_TYPES } from '../../lib/jobOptions'
import { calculateProfileCompletion } from '../../lib/profileCompletion'

export default function CandidateHomePage() {
  useDocumentTitle('Home')
  const { profile } = useAuth()
  const { jobs, loading, error } = useJobs()
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()
  const { profile: candidateProfile, loading: candidateProfileLoading } = useCandidateProfile()
  const completion = calculateProfileCompletion(candidateProfile)

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
      </div>

      {!candidateProfileLoading && (
        <Link
          to="/candidate/profile"
          className="mt-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-soft hover:border-primary-200"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <User size={16} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[13px] font-bold text-navy-900">My Profile</p>
              <p className="text-xs text-navy-500">
                {completion.percent}% complete
                {completion.percent < 100 ? ' — help employers find you' : ''}
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-navy-400" />
        </Link>
      )}

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
