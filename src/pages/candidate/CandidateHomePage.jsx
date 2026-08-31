import { Search, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

export default function CandidateHomePage() {
  useDocumentTitle('Home')

  return (
    <div>
      <p className="text-xs font-medium text-navy-500">Good morning,</p>
      <h1 className="text-lg font-extrabold text-navy-900">Rahul Kumar 👋</h1>

      <Link
        to="/candidate/jobs"
        className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-soft"
      >
        <Search size={16} className="text-navy-400" />
        <span className="text-sm text-navy-400">Search jobs, companies...</span>
      </Link>

      <div className="mt-3 rounded-2xl bg-primary-600 p-4 text-white shadow-soft">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Star size={14} fill="white" /> 94% match jobs waiting for you
        </p>
        <p className="mt-0.5 text-xs text-primary-100">
          Complete your profile to unlock more matches
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy-900">Recommended for you</h2>
        <Link to="/candidate/jobs" className="text-xs font-semibold text-primary-600">
          See all
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {jobs.slice(0, 4).map((job, i) => (
          <Link key={job.title} to={`/candidate/jobs/${i}`}>
            <JobCard job={job} compact />
          </Link>
        ))}
      </div>
    </div>
  )
}
