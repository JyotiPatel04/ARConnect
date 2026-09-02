import { AlertCircle } from 'lucide-react'
import CompanyProfileForm from '../../components/employer/CompanyProfileForm'
import ProfileCompletionMeter from '../../components/shared/ProfileCompletionMeter'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useCompanyProfile from '../../hooks/useCompanyProfile'
import { calculateCompanyProfileCompletion } from '../../lib/companyProfileCompletion'

export default function EmployerCompanyPage() {
  useDocumentTitle('Company Profile')
  const { profile, loading, error, saving, saveProfile } = useCompanyProfile()
  const completion = calculateCompanyProfileCompletion(profile)

  return (
    <div className="max-w-2xl">
      <PageHeader title="Company Profile" subtitle="Manage how candidates see your company" />

      {!loading && !error && (
        <div className="mb-5">
          <ProfileCompletionMeter completion={completion} title="Company Profile Completion" />
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft sm:p-5">
        {loading ? (
          <p className="py-4 text-center text-sm text-navy-400">Loading company profile...</p>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="Couldn't load your company profile"
            subtitle="Please check your connection and try again."
          />
        ) : (
          <CompanyProfileForm companyProfile={profile} onSave={saveProfile} saving={saving} />
        )}
      </div>
    </div>
  )
}
