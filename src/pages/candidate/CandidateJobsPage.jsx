import { useMemo, useState } from 'react'
import { Bookmark, SearchX, AlertCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import EmptyState from '../../components/ui/EmptyState'
import JobFilters from '../../components/candidate/JobFilters'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJobs from '../../hooks/useJobs'
import useSavedJobs from '../../hooks/useSavedJobs'
import useJobAlertMatcher from '../../hooks/useJobAlertMatcher'
import { filterAndSortJobs } from '../../lib/jobFilters'
import { toJobCardProps } from '../../lib/format'

const EMPTY_FILTERS = { location: '', jobType: '', workMode: '', experienceLevel: '', minSalary: null }

export default function CandidateJobsPage() {
  useDocumentTitle('Search Jobs')
  const { jobs, loading, error } = useJobs()
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()
  // Fire-and-forget: checks this candidate's job alerts once per visit to
  // this page. Deliberately the ONLY place this hook is mounted anywhere
  // in the app (see useJobAlertMatcher's own guard against re-running,
  // which protects against a re-render here, not against a second
  // mount elsewhere) — mounting it in more than one page would risk two
  // independent checks racing each other.
  useJobAlertMatcher()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    jobType: searchParams.get('jobType') || '',
  })

  const activeCount = Object.values(filters).filter((v) => v !== '' && v != null).length
  const [saveError, setSaveError] = useState('')

  const results = useMemo(
    () => filterAndSortJobs(jobs, { search, ...filters }),
    [jobs, search, filters]
  )

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function handleToggleSave(job) {
    setSaveError('')
    try {
      if (isSaved(job.id)) {
        await unsaveJob(job.id)
      } else {
        await saveJob(job)
      }
    } catch (err) {
      setSaveError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Search Jobs"
        subtitle={loading ? 'Loading...' : `${results.length} of ${jobs.length} jobs`}
        action={
          <Link
            to="/candidate/saved-jobs"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700"
          >
            <Bookmark size={13} /> Saved Jobs
          </Link>
        }
      />

      <JobFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
        activeCount={activeCount}
      />

      <div className="mt-4 space-y-3">
        {saveError && (
          <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            <AlertCircle size={13} /> {saveError}
          </p>
        )}

        {loading && <p className="py-8 text-center text-sm text-navy-400">Loading jobs...</p>}

        {!loading && error && (
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="Couldn't load jobs right now"
            subtitle="Please check your connection and try again."
          />
        )}

        {!loading && !error && results.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No jobs match your search"
            subtitle="Try adjusting your filters or search term."
          />
        )}

        {!loading &&
          !error &&
          results.map((job) => (
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
