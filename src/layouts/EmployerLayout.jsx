import { useState } from 'react'
import {
  Briefcase,
  LayoutGrid,
  ClipboardList,
  Users,
  CalendarCheck,
  Building2,
  UserCircle,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useNotifications from '../hooks/useNotifications'
import NotificationBell from '../components/shared/NotificationBell'
import SuspendedBanner from '../components/shared/SuspendedBanner'
import { getInitials } from '../lib/format'

const navItems = [
  { to: '/employer', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/employer/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/employer/applications', label: 'Applications', icon: ClipboardList },
  { to: '/employer/candidates', label: 'Candidates', icon: Users },
  { to: '/employer/interviews', label: 'Interviews', icon: CalendarCheck },
  { to: '/employer/company', label: 'Company', icon: Building2 },
  { to: '/employer/profile', label: 'Profile', icon: UserCircle },
]

function SidebarContent({ onNavigate }) {
  const { profile, signOut } = useAuth()

  // ProtectedRoute reacts to sign-out itself and redirects to /auth/login —
  // an explicit navigate('/') here used to race that and lose every time.
  async function handleSignOut() {
    await signOut()
  }

  return (
    <>
      <Link to="/employer" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
          <Briefcase size={16} className="text-white" />
        </div>
        <span className="text-sm font-extrabold text-navy-900">
          AR<span className="text-primary-600">Connect</span>
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold ${
                isActive ? 'bg-primary-600 text-white' : 'text-navy-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon size={16} strokeWidth={2.25} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="truncate px-2 text-[10.5px] font-semibold text-navy-400">
          {profile?.full_name || 'Employer'} · Employer
        </p>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-navy-600 hover:bg-slate-100"
        >
          <LogOut size={16} strokeWidth={2.25} />
          Log Out
        </button>
      </div>
    </>
  )
}

export default function EmployerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile } = useAuth()
  const notifications = useNotifications()

  return (
    <div className="min-h-screen bg-[#f4f5f9] lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white p-4 shadow-soft-lg">
            <button
              className="absolute right-3 top-3 text-navy-400"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="text-navy-500 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="hidden text-sm font-bold text-navy-900 lg:block">Employer Portal</span>
          <div className="flex items-center gap-3">
            <NotificationBell to="/employer/notifications" unreadCount={notifications.unreadCount} />
            <Link
              to="/employer/profile"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white"
            >
              {getInitials(profile?.full_name) || <UserCircle size={14} />}
            </Link>
          </div>
        </header>
        <SuspendedBanner />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet context={notifications} />
        </main>
      </div>
    </div>
  )
}
