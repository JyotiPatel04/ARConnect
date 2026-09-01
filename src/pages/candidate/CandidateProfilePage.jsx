import { Phone, Mail, Pencil, FileText, LogOut } from 'lucide-react'
import Button from '../../components/ui/Button'
import ProfileForm from '../../components/candidate/ProfileForm'
import useAuth from '../../hooks/useAuth'
import useCandidateProfile from '../../hooks/useCandidateProfile'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getInitials } from '../../lib/format'

export default function CandidateProfilePage() {
  useDocumentTitle('Profile')
  const { profile, user, signOut } = useAuth()
  const {
    profile: matchProfile,
    loading: matchProfileLoading,
    saving: matchProfileSaving,
    saveProfile,
  } = useCandidateProfile()

  // No explicit navigate() here — signing out clears the session, and
  // ProtectedRoute reacts to that itself and redirects to /auth/login.
  // An explicit navigate('/') here used to race that reactive redirect
  // and lose every time, which is why this doesn't try to pick the
  // destination itself.
  async function handleSignOut() {
    await signOut()
  }

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
        <button className="mt-2 flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-navy-700">
          <Pencil size={12} /> Edit Profile
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-navy-900">Resume</p>
          <FileText size={16} className="text-primary-600" />
        </div>
        <p className="mt-1 text-xs text-navy-500">No resume uploaded yet</p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        {matchProfileLoading ? (
          <p className="text-sm text-navy-400">Loading profile...</p>
        ) : (
          <ProfileForm profile={matchProfile} onSave={saveProfile} saving={matchProfileSaving} />
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
