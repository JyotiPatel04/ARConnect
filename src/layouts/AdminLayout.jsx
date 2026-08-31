import { useState } from 'react'
import {
  Briefcase,
  LayoutGrid,
  Users,
  Building2,
  ShieldCheck,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getInitials } from '../lib/format'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/employers', label: 'Employers', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

function SidebarContent({ onNavigate }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Link to="/admin" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
          <Briefcase size={16} className="text-white" />
        </div>
        <span className="text-sm font-extrabold text-navy-900">Admin Console</span>
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
                isActive ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-slate-100'
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
          {profile?.full_name || 'ARConnect'} · Super Admin
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

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile } = useAuth()

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
          <span className="hidden text-sm font-bold text-navy-900 lg:block">Platform Overview</span>
          <div className="flex items-center gap-3">
            <Bell size={17} className="text-navy-400" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
              {getInitials(profile?.full_name) || 'SA'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
