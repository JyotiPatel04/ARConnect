import { ClipboardList, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useMyApplications from '../../hooks/useMyApplications'
import { formatRelativeTime } from '../../lib/format'

export default function CandidateApplicationsPage() {
  useDocumentTitle('My Applications')
  const { applications, loading, error } = useMyApplications()

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle={loading ? 'Loading...' : `${applications.length} jobs applied`}
      />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading applications...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load your applications"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          subtitle="Jobs you apply to will show up here with their status."
        />
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-2.5">
          {applications.map((a) => (
            <Link
              key={a.id}
              to={`/candidate/jobs/${a.jobId}`}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft"
            >
              <div>
                <p className="text-[13px] font-bold text-navy-900">{a.jobTitle}</p>
                <p className="text-xs text-navy-500">{a.companyName}</p>
                <p className="mt-0.5 text-[10.5px] text-navy-400">
                  Applied {formatRelativeTime(a.appliedAt?.toDate?.())}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
