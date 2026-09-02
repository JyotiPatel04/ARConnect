import { Briefcase, Home, Search, ClipboardList, CalendarDays, MessageCircle, User, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useNotifications from '../hooks/useNotifications'
import NotificationBell from '../components/shared/NotificationBell'
import { getInitials } from '../lib/format'

const navItems = [
  { to: '/candidate/home', label: 'Home', icon: Home },
  { to: '/candidate/jobs', label: 'Search', icon: Search },
  { to: '/candidate/applications', label: 'Applications', icon: ClipboardList },
  { to: '/candidate/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/candidate/chat', label: 'Chat', icon: MessageCircle },
  { to: '/candidate/profile', label: 'Profile', icon: User },
]

function Header({ unreadCount }) {
  const { profile, signOut } = useAuth()

  // ProtectedRoute reacts to sign-out itself and redirects to /auth/login —
  // an explicit navigate('/') here used to race that and lose every time.
  async function handleSignOut() {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/candidate/home" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-navy-900">
            AR<span className="text-primary-600">Connect</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell to="/candidate/notifications" unreadCount={unreadCount} />
          <Link
            to="/candidate/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white"
          >
            {getInitials(profile?.full_name) || <User size={14} />}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-slate-100 hover:text-navy-700"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5"
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={2.25} className={isActive ? 'text-primary-600' : 'text-navy-400'} />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-600' : 'text-navy-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function CandidateLayout() {
  const notifications = useNotifications()

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <Header unreadCount={notifications.unreadCount} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        <Outlet context={notifications} />
      </main>
      <BottomNav />
    </div>
  )
}
