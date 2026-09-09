import { AlertCircle, BadgeCheck, Clock, ShieldX } from 'lucide-react'
import CompanyProfileForm from '../../components/employer/CompanyProfileForm'
import ProfileCompletionMeter from '../../components/shared/ProfileCompletionMeter'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useCompanyProfile from '../../hooks/useCompanyProfile'
import { calculateCompanyProfileCompletion } from '../../lib/companyProfileCompletion'

// A profile written before verification existed has no verificationStatus
// field at all -- treated as 'pending' here too, matching the same
// .get(key, 'pending') default firestore.rules and companyProfileService
// already use, so this indicator is never wrong just because a profile
// predates the feature.
const STATUS_META = {
  pending: { label: 'Verification Pending', icon: Clock, className: 'bg-amber-50 text-amber-600' },
  verified: { label: 'Verified Employer', icon: BadgeCheck, className: 'bg-success-50 text-success-700' },
  rejected: { label: 'Verification Rejected', icon: ShieldX, className: 'bg-red-50 text-red-600' },
}

export default function EmployerCompanyPage() {
  useDocumentTitle('Company Profile')
  const { profile, loading, error, saving, saveProfile } = useCompanyProfile()
  const completion = calculateCompanyProfileCompletion(profile)
  const status = STATUS_META[profile?.verificationStatus || 'pending']

  return (
    <div className="max-w-2xl">
      <PageHeader title="Company Profile" subtitle="Manage how candidates see your company" />

      {!loading && !error && profile && (
        <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
            <status.icon size={13} /> {status.label}
          </span>
          {profile.verificationStatus === 'rejected' && profile.verificationNote && (
            <p className="mt-2 text-xs text-navy-500">Admin note: {profile.verificationNote}</p>
          )}
        </div>
      )}

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
