import { useMemo, useState } from 'react'
import { AlertCircle, Building2, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ModerationReasonInput from '../../components/admin/ModerationReasonInput'
import { isValidModerationReason } from '../../lib/moderationValidation'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminUsers from '../../hooks/useAdminUsers'
import useAdminJobs from '../../hooks/useAdminJobs'

function formatDate(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminEmployersPage() {
  useDocumentTitle('Employers')
  const { users, loading: usersLoading, error: usersError, suspendUser, unsuspendUser } = useAdminUsers()
  const { jobs, loading: jobsLoading, error: jobsError } = useAdminJobs()
  const [search, setSearch] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const loading = usersLoading || jobsLoading
  const error = usersError || jobsError

  function openAction(user, nextStatus) {
    setPendingAction({ user, nextStatus })
    setReason('')
    setActionError('')
  }

  async function handleConfirm() {
    if (!pendingAction || !isValidModerationReason(reason)) return
    setBusy(true)
    setActionError('')
    try {
      if (pendingAction.nextStatus === 'suspended') {
        await suspendUser(pendingAction.user.id, reason)
      } else {
        await unsuspendUser(pendingAction.user.id, reason)
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const employers = useMemo(() => {
    const list = users.filter((u) => u.role === 'employer')
    return list.map((e) => {
      const employerJobs = jobs.filter((j) => j.employerId === e.id)
      const activeJobs = employerJobs.filter((j) => j.status === 'active').length
      const applications = employerJobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0)
      return { ...e, jobCount: employerJobs.length, activeJobs, applications }
    })
  }, [users, jobs])

  const filtered = useMemo(() => {
    if (!search) return employers
    const term = search.toLowerCase()
    return employers.filter((e) => `${e.full_name || ''} ${e.email || ''}`.toLowerCase().includes(term))
  }, [employers, search])

  return (
    <div>
      <PageHeader title="Employers" subtitle={loading ? 'Loading...' : `${filtered.length} of ${employers.length} employers`} />

      {!loading && !error && employers.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employers by name or email..."
            className="w-full max-w-sm rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading employers...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load employers" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && employers.length === 0 && (
        <EmptyState icon={Building2} title="No employers yet" subtitle="Registered employers will show up here." />
      )}

      {!loading && !error && employers.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No employers match your search" subtitle="Try a different name or email." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const suspended = e.moderationStatus === 'suspended'
            return (
              <div key={e.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-600">
                    {(e.full_name || e.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-navy-900">{e.full_name || 'Unnamed'}</p>
                    <p className="truncate text-xs text-navy-500">{e.email}</p>
                  </div>
                  <span className={`shrink-0 text-[10.5px] font-semibold ${suspended ? 'text-red-600' : 'text-success-600'}`}>
                    {suspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <div>
                    <p className="text-sm font-extrabold text-navy-900">{e.jobCount}</p>
                    <p className="text-[10px] text-navy-400">Jobs</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-navy-900">{e.activeJobs}</p>
                    <p className="text-[10px] text-navy-400">Active</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-navy-900">{e.applications}</p>
                    <p className="text-[10px] text-navy-400">Applicants</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-[10.5px] text-navy-400">Joined {formatDate(e.created_at)}</p>
                  {suspended ? (
                    <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => openAction(e, 'active')}>
                      Unsuspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="danger" icon={ShieldAlert} onClick={() => openAction(e, 'suspended')}>
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.nextStatus === 'suspended' ? 'Suspend this employer?' : 'Unsuspend this employer?'}
        message={
          pendingAction?.nextStatus === 'suspended'
            ? `"${pendingAction?.user.full_name || pendingAction?.user.email}" will be blocked from posting/editing jobs, closing/reopening jobs, updating application statuses, and editing their company profile until unsuspended. This is fully reversible. Existing jobs and applications remain intact.`
            : `"${pendingAction?.user.full_name || pendingAction?.user.email}" will regain normal access immediately.`
        }
        confirmLabel={pendingAction?.nextStatus === 'suspended' ? 'Suspend' : 'Unsuspend'}
        variant={pendingAction?.nextStatus === 'suspended' ? 'danger' : 'primary'}
        confirming={busy}
        confirmDisabled={!isValidModerationReason(reason)}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      >
        {actionError && <p className="mb-2 text-xs font-semibold text-red-600">{actionError}</p>}
        <ModerationReasonInput value={reason} onChange={setReason} />
      </ConfirmDialog>
    </div>
  )
}
