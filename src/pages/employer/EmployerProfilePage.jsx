import { Mail, Phone, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getInitials } from '../../lib/format'

export default function EmployerProfilePage() {
  useDocumentTitle('Profile')
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="max-w-md">
      <PageHeader title="My Profile" />
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-soft">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
          {getInitials(profile?.full_name) || 'U'}
        </div>
        <p className="text-base font-extrabold text-navy-900">{profile?.full_name || 'Your Profile'}</p>
        <p className="text-xs text-navy-500">Employer</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
          <Mail size={12} /> {profile?.email || user?.email}
        </p>
        {profile?.phone && (
          <p className="flex items-center gap-1 text-xs text-navy-500">
            <Phone size={12} /> {profile.phone}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="secondary">Edit Profile</Button>
          <Button size="sm" variant="ghost" icon={LogOut} onClick={handleSignOut}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}
