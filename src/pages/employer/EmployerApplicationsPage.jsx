import { useState } from 'react'
import { ClipboardList, AlertCircle } from 'lucide-react'
import ApplicationRow from '../../components/employer/ApplicationRow'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerApplications from '../../hooks/useEmployerApplications'

export default function EmployerApplicationsPage() {
  useDocumentTitle('Applications')
  const { applications, loading, error, updateStatus } = useEmployerApplications()
  const [updatingId, setUpdatingId] = useState(null)

  async function handleStatusChange(applicationId, status) {
    setUpdatingId(applicationId)
    try {
      await updateStatus(applicationId, status)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Applications" subtitle={loading ? 'Loading...' : `${applications.length} applications across your jobs`} />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading applications...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load applications" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState icon={ClipboardList} title="No applications yet" subtitle="They'll show up here as candidates apply to your jobs." />
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-2.5">
          {applications.map((a) => (
            <ApplicationRow
              key={a.id}
              application={a}
              onStatusChange={handleStatusChange}
              updating={updatingId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
