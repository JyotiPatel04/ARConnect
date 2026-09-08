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

// Reads every filter/search/sort value straight from the URL's own query
// string -- the URL IS the state here, not a separate useState synced to
// it, so there's exactly one source of truth. A reload, a shared link, and
// the browser's own back/forward all restore identical results for free,
// and the existing `?jobType=` deep link from CandidateHomePage keeps
// working unchanged (now re-read on every render instead of once on
// mount, which only makes it more consistent, never less).
function readStateFromParams(searchParams) {
  const salaryMinRaw = searchParams.get('salaryMin')
  const salaryMaxRaw = searchParams.get('salaryMax')
  const skillsRaw = searchParams.get('skills')
  return {
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    jobType: searchParams.get('jobType') || '',
    workMode: searchParams.get('workMode') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    skills: skillsRaw ? skillsRaw.split(',').filter(Boolean) : [],
    salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
    salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
    sortBy: searchParams.get('sortBy') || 'recent',
  }
}

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [saveError, setSaveError] = useState('')

  const { search, sortBy, ...filters } = readStateFromParams(searchParams)

  const activeCount =
    (filters.location ? 1 : 0) +
    (filters.jobType ? 1 : 0) +
    (filters.workMode ? 1 : 0) +
    (filters.experienceLevel ? 1 : 0) +
    (filters.skills.length > 0 ? 1 : 0) +
    (filters.salaryMin != null ? 1 : 0) +
    (filters.salaryMax != null ? 1 : 0)

  const results = filterAndSortJobs(jobs, { search, ...filters, sortBy })

  // Only jobs actually carry this data (not the current filters), so this
  // is the one thing here worth memoizing on `jobs` alone -- it shouldn't
  // recompute on every keystroke/filter change the way `results` above
  // legitimately does.
  const availableSkills = useMemo(() => {
    const seen = new Map()
    for (const job of jobs) {
      for (const skill of job.skills || []) {
        const key = skill.toLowerCase().trim()
        if (key && !seen.has(key)) seen.set(key, skill.trim())
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
  }, [jobs])

  // Single write path for every filter/search/sort change. The updater
  // function form always sees the latest params (never a stale snapshot),
  // and an empty/cleared value deletes its key entirely rather than
  // writing an empty string, keeping the URL itself clean. `replace: true`
  // so typing in the search box or clicking through filters doesn't spam
  // browser history with one entry per keystroke/click -- the back button
  // still works naturally, it just steps back to wherever the candidate
  // was before this page, matching how most real search UIs behave.
  function updateParam(key, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const isEmpty = value == null || value === '' || (Array.isArray(value) && value.length === 0)
        if (isEmpty) {
          next.delete(key)
        } else if (Array.isArray(value)) {
          next.set(key, value.join(','))
        } else {
          next.set(key, String(value))
        }
        return next
      },
      { replace: true }
    )
  }

  function handleClearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true })
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
        onSearchChange={(value) => updateParam('search', value)}
        filters={filters}
        onFilterChange={updateParam}
        sortBy={sortBy}
        onSortChange={(value) => updateParam('sortBy', value)}
        availableSkills={availableSkills}
        onClearFilters={handleClearFilters}
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
            // Carries the current filter/search query string forward onto
            // the Job Detail URL -- the browser's own back button then
            // naturally restores this exact URL (filters and all) without
            // any extra state to manage. A direct /candidate/jobs/:id link
            // (no query string) is unaffected either way.
            <Link key={job.id} to={{ pathname: `/candidate/jobs/${job.id}`, search: searchParams.toString() }}>
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
