import { useMemo, useState } from 'react'
import { AlertCircle, Search, Users } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminUsers from '../../hooks/useAdminUsers'

const ROLE_FILTERS = ['all', 'candidate', 'employer', 'admin']

function formatDate(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function matchesSearch(user, term) {
  if (!term) return true
  const haystack = `${user.full_name || ''} ${user.email || ''}`.toLowerCase()
  return haystack.includes(term.toLowerCase())
}

export default function AdminUsersPage() {
  useDocumentTitle('Users')
  const { users, loading, error } = useAdminUsers()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = useMemo(
    () =>
      users.filter(
        (u) => (roleFilter === 'all' || u.role === roleFilter) && matchesSearch(u, search)
      ),
    [users, search, roleFilter]
  )

  return (
    <div>
      <PageHeader title="Users" subtitle={loading ? 'Loading...' : `${filtered.length} of ${users.length} users`} />

      {!loading && !error && users.length > 0 && (
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1.5">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold capitalize ${
                  roleFilter === r ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 border border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading users...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load users" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && users.length === 0 && (
        <EmptyState icon={Users} title="No users yet" subtitle="Registered candidates and employers will show up here." />
      )}

      {!loading && !error && users.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No users match your search" subtitle="Try a different name, email, or role filter." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-2.5 font-bold">Name</th>
                <th className="px-4 py-2.5 font-bold">Email</th>
                <th className="px-4 py-2.5 font-bold">Role</th>
                <th className="px-4 py-2.5 font-bold">Joined</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-bold text-navy-900">{u.full_name || '—'}</td>
                  <td className="px-4 py-2.5 text-navy-600">{u.email}</td>
                  <td className="px-4 py-2.5 capitalize text-navy-600">{u.role}</td>
                  <td className="px-4 py-2.5 text-navy-600">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-2.5 font-semibold text-success-600">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
