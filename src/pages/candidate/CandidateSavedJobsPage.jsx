import { Bookmark, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useSavedJobs from '../../hooks/useSavedJobs'
import { formatSalary } from '../../lib/format'

export default function CandidateSavedJobsPage() {
  useDocumentTitle('Saved Jobs')
  const { savedJobs, loading, error, unsaveJob } = useSavedJobs()

  return (
    <div>
      <PageHeader title="Saved Jobs" subtitle={loading ? 'Loading...' : `${savedJobs.length} jobs saved`} />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading saved jobs...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load saved jobs"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && savedJobs.length === 0 && (
        <EmptyState icon={Bookmark} title="No saved jobs yet." subtitle="Tap the bookmark icon on any job to save it here." />
      )}

      {!loading && !error && savedJobs.length > 0 && (
        <div className="space-y-3">
          {savedJobs.map((saved) => (
            <Link key={saved.id} to={`/candidate/jobs/${saved.jobId}`}>
              <JobCard
                job={{
                  title: saved.jobTitle,
                  company: saved.companyName,
                  salary: formatSalary(saved.salaryMin, saved.salaryMax),
                  location: saved.location,
                  type: '',
                  posted: '',
                  verified: Boolean(saved.employerVerified),
                }}
                compact
                isSaved
                onToggleSave={() => unsaveJob(saved.jobId)}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
