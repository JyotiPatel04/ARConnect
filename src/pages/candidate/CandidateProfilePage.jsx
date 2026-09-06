import { Phone, Mail, LogOut, AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import ProfileForm from '../../components/candidate/ProfileForm'
import ResumeUploadCard from '../../components/candidate/ResumeUploadCard'
import ProfileCompletionMeter from '../../components/shared/ProfileCompletionMeter'
import EmptyState from '../../components/ui/EmptyState'
import useAuth from '../../hooks/useAuth'
import useCandidateProfile from '../../hooks/useCandidateProfile'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getInitials } from '../../lib/format'
import { calculateProfileCompletion } from '../../lib/profileCompletion'

export default function CandidateProfilePage() {
  useDocumentTitle('Profile')
  const { profile, user, signOut, updateProfile } = useAuth()
  const {
    profile: candidateProfile,
    loading: candidateProfileLoading,
    error: candidateProfileError,
    saving,
    saveProfile,
    applyLocalUpdate,
  } = useCandidateProfile()

  // ProtectedRoute reacts to sign-out itself and redirects to /auth/login —
  // an explicit navigate('/') here used to race that and lose every time.
  async function handleSignOut() {
    await signOut()
  }

  // Two independent Firestore writes (users/{uid} for name/phone,
  // candidateProfiles/{uid} for everything else) rather than one atomic
  // batch — simpler, and consistent with how every other write in this
  // app is scoped to a single document/service. If the first succeeds and
  // the second fails, ProfileForm's error banner surfaces it and the user
  // just saves again.
  async function handleSave(values) {
    const { fullName, phone, ...profileFields } = values
    await updateProfile({ fullName, phone })
    await saveProfile(profileFields)
  }

  const completion = calculateProfileCompletion(candidateProfile)

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
          {getInitials(profile?.full_name) || 'U'}
        </div>
        <h1 className="mt-2 text-base font-extrabold text-navy-900">{profile?.full_name || 'Your Profile'}</h1>
        <p className="flex items-center gap-1 text-xs text-navy-500">
          <Mail size={12} /> {profile?.email || user?.email}
        </p>
        {profile?.phone && (
          <p className="flex items-center gap-1 text-xs text-navy-500">
            <Phone size={12} /> {profile.phone}
          </p>
        )}
      </div>

      {!candidateProfileLoading && !candidateProfileError && (
        <div className="mt-5">
          <ProfileCompletionMeter completion={completion} />
        </div>
      )}

      {!candidateProfileLoading && !candidateProfileError && (
        <ResumeUploadCard candidateProfile={candidateProfile} onChange={applyLocalUpdate} />
      )}

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        {candidateProfileLoading ? (
          <p className="py-4 text-center text-sm text-navy-400">Loading profile...</p>
        ) : candidateProfileError ? (
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="Couldn't load your profile"
            subtitle="Please check your connection and try again."
          />
        ) : (
          <ProfileForm
            userProfile={profile}
            candidateProfile={candidateProfile}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>

      <div className="mt-6 pb-2">
        <Button variant="secondary" size="sm" icon={LogOut} onClick={handleSignOut}>
          Log Out
        </Button>
      </div>
    </div>
  )
}
