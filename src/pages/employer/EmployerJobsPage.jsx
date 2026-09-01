import { useState } from 'react'
import { Plus, Briefcase, AlertCircle, Pencil, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerJobs from '../../hooks/useEmployerJobs'
import { formatSalary } from '../../lib/format'

export default function EmployerJobsPage() {
  useDocumentTitle('My Jobs')
  const { jobs, loading, error, closeJob, reopenJob, deleteJob } = useEmployerJobs()
  const [pendingAction, setPendingAction] = useState(null) // { job, type: 'close' | 'delete' }
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function handleConfirm() {
    if (!pendingAction) return
    setBusy(true)
    setActionError('')
    try {
      if (pendingAction.type === 'close') {
        await closeJob(pendingAction.job.id)
      } else if (pendingAction.type === 'delete') {
        await deleteJob(pendingAction.job.id)
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Jobs"
        subtitle={loading ? 'Loading...' : `${jobs.length} job posts`}
        action={
          <Link to="/employer/jobs/new">
            <Button size="sm" icon={Plus}>
              Post a Job
            </Button>
          </Link>
        }
      />

      {actionError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          <AlertCircle size={13} /> {actionError}
        </p>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading your jobs...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load your jobs" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon={Briefcase} title="No jobs posted yet" subtitle="Post your first job to start receiving applications." />
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">{job.title}</h3>
                  <p className="text-xs text-navy-500">{job.companyName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                    job.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {job.status === 'active' ? 'Active' : 'Closed'}
                </span>
              </div>

              <p className="mt-2 text-[13px] font-bold text-navy-900">{formatSalary(job.salaryMin, job.salaryMax)}</p>
              <p className="mt-1 text-xs text-navy-500">
                {job.location} · {job.applicationCount || 0} application{job.applicationCount === 1 ? '' : 's'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Link to={`/employer/jobs/${job.id}`}>
                  <Button size="sm" variant="secondary" icon={Pencil}>
                    Edit
                  </Button>
                </Link>
                {job.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={XCircle}
                    onClick={() => setPendingAction({ job, type: 'close' })}
                  >
                    Close
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => reopenJob(job.id)}>
                    Reopen
                  </Button>
                )}
                {(job.applicationCount || 0) === 0 ? (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setPendingAction({ job, type: 'delete' })}
                  >
                    Delete
                  </Button>
                ) : (
                  <span className="flex items-center text-[10.5px] text-navy-400">
                    Has applications — delete disabled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'delete' ? 'Delete this job?' : 'Close this job?'}
        message={
          pendingAction?.type === 'delete'
            ? `"${pendingAction.job.title}" will be permanently deleted. This cannot be undone.`
            : `"${pendingAction?.job.title}" will no longer appear in candidate job discovery. You can reopen it anytime.`
        }
        confirmLabel={pendingAction?.type === 'delete' ? 'Delete' : 'Close Job'}
        variant={pendingAction?.type === 'delete' ? 'danger' : 'primary'}
        confirming={busy}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}
