import { useState } from 'react'
import { AlertCircle, CalendarDays, CheckCircle2, Pencil, XCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ScheduleInterviewDialog from '../../components/employer/ScheduleInterviewDialog'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerInterviews from '../../hooks/useEmployerInterviews'
import { INTERVIEW_TYPE_LABELS } from '../../lib/interviewForm'

const STATUS_STYLES = {
  scheduled: 'bg-primary-50 text-primary-600',
  completed: 'bg-success-50 text-success-700',
  cancelled: 'bg-slate-100 text-slate-500',
}
const STATUS_LABELS = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' }

export default function EmployerInterviewsPage() {
  useDocumentTitle('Interviews')
  const { interviews, loading, error, edit, cancel, complete } = useEmployerInterviews()
  const [editing, setEditing] = useState(null)
  const [pendingCancel, setPendingCancel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function handleEditSubmit(fields) {
    setActionError('')
    try {
      await edit(editing, fields)
      setEditing(null)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
      throw err
    }
  }

  async function handleCancelConfirm() {
    setBusy(true)
    setActionError('')
    try {
      await cancel(pendingCancel)
      setPendingCancel(null)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleComplete(interview) {
    setActionError('')
    try {
      await complete(interview)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <PageHeader title="Interviews" subtitle={loading ? 'Loading...' : `${interviews.length} interview${interviews.length === 1 ? '' : 's'} scheduled across your jobs`} />

      {actionError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          <AlertCircle size={13} /> {actionError}
        </p>
      )}

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading interviews...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load interviews" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && interviews.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No interviews scheduled yet"
          subtitle="Schedule one from an application on your Applications page."
        />
      )}

      {!loading && !error && interviews.length > 0 && (
        <div className="space-y-2.5">
          {interviews.map((iv) => {
            const date = iv.scheduledAt?.toDate?.()
            const isActive = iv.status === 'scheduled'
            return (
              <div key={iv.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-navy-900">{iv.candidateName || 'Candidate'}</p>
                  <p className="text-xs text-navy-500">{iv.jobTitle || 'Job'}</p>
                  <p className="mt-0.5 text-[11px] text-navy-400">
                    {date?.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {iv.durationMinutes} min ·{' '}
                    {INTERVIEW_TYPE_LABELS[iv.interviewType]}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${STATUS_STYLES[iv.status]}`}>
                    {STATUS_LABELS[iv.status]}
                  </span>
                  {isActive && (
                    <>
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(iv)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => handleComplete(iv)}>
                        Complete
                      </Button>
                      <Button size="sm" variant="danger" icon={XCircle} onClick={() => setPendingCancel(iv)}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ScheduleInterviewDialog
        open={Boolean(editing)}
        interview={editing}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditing(null)}
        submitting={false}
      />
      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this interview?"
        message="The candidate will be notified. This cannot be undone, but you can schedule a new interview afterward."
        confirmLabel="Cancel Interview"
        variant="danger"
        confirming={busy}
        onConfirm={handleCancelConfirm}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  )
}
