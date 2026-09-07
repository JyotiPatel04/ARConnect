import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import JobAlertPreferencesForm from '../../components/candidate/JobAlertPreferencesForm'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJobAlertPreferences from '../../hooks/useJobAlertPreferences'

export default function JobAlertsPage() {
  useDocumentTitle('Job Alerts')
  const { preferences, loading, error, saving, save } = useJobAlertPreferences()

  return (
    <div>
      <Link to="/candidate/profile" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy-600">
        <ArrowLeft size={16} /> Back to Profile
      </Link>
      <PageHeader title="Job Alerts" subtitle="Get notified in-app when a new job matches your preferences." />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading preferences...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load your job alert preferences"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && <JobAlertPreferencesForm preferences={preferences} onSave={save} saving={saving} />}
    </div>
  )
}
