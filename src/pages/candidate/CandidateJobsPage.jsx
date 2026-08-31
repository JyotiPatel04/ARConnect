import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import FilterChip from '../../components/ui/FilterChip'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

export default function CandidateJobsPage() {
  useDocumentTitle('Search Jobs')

  return (
    <div>
      <PageHeader title="Search Jobs" subtitle={`${jobs.length} jobs found near you`} />

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-soft">
          <Search size={16} className="text-navy-400" />
          <span className="text-sm text-navy-400">Sales executive</span>
        </div>
        <button className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <FilterChip label="Varanasi" active icon={MapPin} />
        <FilterChip label="Full-time" />
        <FilterChip label="₹15k–25k" />
        <FilterChip label="Verified only" />
      </div>

      <div className="mt-4 space-y-3">
        {jobs.map((job, i) => (
          <Link key={job.title} to={`/candidate/jobs/${i}`}>
            <JobCard job={job} compact />
          </Link>
        ))}
      </div>
    </div>
  )
}
