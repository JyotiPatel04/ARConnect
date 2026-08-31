import { Briefcase, Home, Search, ClipboardList, MessageCircle, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/candidate/home', label: 'Home', icon: Home },
  { to: '/candidate/jobs', label: 'Search', icon: Search },
  { to: '/candidate/applications', label: 'Applications', icon: ClipboardList },
  { to: '/candidate/chat', label: 'Chat', icon: MessageCircle },
  { to: '/candidate/profile', label: 'Profile', icon: User },
]

function Header() {
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
        <Link
          to="/candidate/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white"
        >
          RK
        </Link>
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
  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
