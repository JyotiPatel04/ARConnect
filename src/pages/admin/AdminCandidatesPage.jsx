import { useMemo, useState } from 'react'
import { AlertCircle, GraduationCap, Search } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminUsers from '../../hooks/useAdminUsers'
import { getInitials } from '../../lib/format'

function formatDate(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Deliberately shows only name/email/join date — nothing from
// candidateProfiles (skills, salary expectations, bio, ...). This page
// doesn't read that collection at all, and firestore.rules doesn't grant
// admin any access to it either — there's simply nothing to over-expose.
export default function AdminCandidatesPage() {
  useDocumentTitle('Candidates')
  const { users, loading, error } = useAdminUsers()
  const [search, setSearch] = useState('')

  const candidates = useMemo(() => users.filter((u) => u.role === 'candidate'), [users])
  const filtered = useMemo(() => {
    if (!search) return candidates
    const term = search.toLowerCase()
    return candidates.filter((c) => `${c.full_name || ''} ${c.email || ''}`.toLowerCase().includes(term))
  }, [candidates, search])

  return (
    <div>
      <PageHeader title="Candidates" subtitle={loading ? 'Loading...' : `${filtered.length} of ${candidates.length} candidates`} />

      {!loading && !error && candidates.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name or email..."
            className="w-full max-w-sm rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading candidates...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load candidates" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && candidates.length === 0 && (
        <EmptyState icon={GraduationCap} title="No candidates yet" subtitle="Registered candidates will show up here." />
      )}

      {!loading && !error && candidates.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No candidates match your search" subtitle="Try a different name or email." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-600">
                {getInitials(c.full_name) || '—'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-navy-900">{c.full_name || 'Unnamed'}</p>
                <p className="truncate text-xs text-navy-500">{c.email}</p>
                <p className="mt-0.5 text-[10.5px] text-navy-400">Joined {formatDate(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
