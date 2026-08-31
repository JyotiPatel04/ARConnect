import { Briefcase } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f5f9] px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900">
          <Briefcase size={18} className="text-white" />
        </div>
        <span className="text-lg font-extrabold text-navy-900">
          AR<span className="text-primary-600">Connect</span>
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-soft-lg sm:p-8">
        <Outlet />
      </div>

      <Link to="/" className="mt-6 text-xs font-semibold text-navy-400 hover:text-primary-600">
        ← Back to home
      </Link>
    </div>
  )
}
