import { useState } from 'react'
import { CalendarClock, CheckCircle2, Pencil, Sparkles, XCircle } from 'lucide-react'
import { APPLICATION_STATUSES } from '../../services/employerApplicationService'
import { STATUS_LABELS as INTERVIEW_STATUS_LABELS } from '../../services/interviewService'
import { INTERVIEW_TYPE_LABELS } from '../../lib/interviewForm'
import useJobMatch from '../../hooks/useJobMatch'
import useApplicationInterviewActions from '../../hooks/useApplicationInterviewActions'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import ScheduleInterviewDialog from './ScheduleInterviewDialog'
import { formatRelativeTime } from '../../lib/format'

const STATUS_LABELS = {
  applied: 'Applied',
  reviewing: 'In Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not Selected',
  hired: 'Hired',
}

// `interview` (this application's latest interview, or null) and
// `onInterviewChange` (refetch the batched list after a mutation) come
// from the parent page, which fetches every row's interview in ONE query
// via useEmployerApplications -- see that hook and useApplicationInterviewActions
// for why (Phase 17 P2: fixes the N+1 read pattern this row used to cause).
export default function ApplicationRow({
  application,
  interview,
  onInterviewChange,
  onStatusChange,
  updating,
  showJobTitle = true,
}) {
  const { match, loading: matchLoading } = useJobMatch(application.jobId, application.candidateId)
  const { saving, schedule, edit, cancel, complete } = useApplicationInterviewActions(
    application,
    interview,
    onInterviewChange
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [interviewError, setInterviewError] = useState('')

  const isActive = interview?.status === 'scheduled'

  async function handleSubmit(fields) {
    setInterviewError('')
    try {
      if (isActive) {
        await edit(fields)
      } else {
        await schedule(fields)
      }
      setDialogOpen(false)
    } catch (err) {
      setInterviewError(err.message || 'Something went wrong. Please try again.')
      throw err
    }
  }

  async function handleCancelConfirm() {
    try {
      await cancel()
      setConfirmCancel(false)
    } catch (err) {
      setInterviewError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-navy-900">{application.candidateName}</p>
          {!matchLoading && match?.score != null && (
            <span
              title={match.explanation}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10.5px] font-bold text-primary-600"
            >
              <Sparkles size={10} /> {match.score}% match
            </span>
          )}
        </div>
        <p className="text-xs text-navy-500">{application.candidateEmail}</p>
        <p className="mt-0.5 text-[11px] text-navy-400">
          {showJobTitle && `${application.jobTitle} · `}
          Applied {formatRelativeTime(application.appliedAt?.toDate?.())}
        </p>

        {interviewError && <p className="mt-1.5 text-[11px] font-semibold text-red-600">{interviewError}</p>}

        {interview && (
          <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-navy-600">
            <p className="font-semibold text-navy-800">
              Interview {INTERVIEW_STATUS_LABELS[interview.status]} · {INTERVIEW_TYPE_LABELS[interview.interviewType]}
            </p>
            <p>{interview.scheduledAt?.toDate?.().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            {isActive && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {/* Phase 13 UX fix: Edit and Mark Completed are hidden once
                    the parent application is withdrawn — the Firestore
                    rules already deny both writes server-side (the
                    authoritative gate); this just keeps the UI from
                    offering actions that can no longer succeed. Cancel
                    stays available, matching what the rules still allow. */}
                {application.status !== 'withdrawn' && (
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setDialogOpen(true)} disabled={saving}>
                    Edit
                  </Button>
                )}
                {application.status !== 'withdrawn' && (
                  <Button size="sm" variant="success" icon={CheckCircle2} onClick={complete} disabled={saving}>
                    Mark Completed
                  </Button>
                )}
                <Button size="sm" variant="danger" icon={XCircle} onClick={() => setConfirmCancel(true)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Phase 12 fix: a withdrawn application has nothing left to
            interview for — scheduling a NEW interview is hidden, same
            pattern as the status dropdown below. An interview scheduled
            before the withdrawal is untouched and still manageable above. */}
        {!isActive && application.status !== 'withdrawn' && (
          <Button size="sm" variant="secondary" icon={CalendarClock} className="mt-2" onClick={() => setDialogOpen(true)}>
            Schedule Interview
          </Button>
        )}
      </div>

      {application.status === 'withdrawn' ? (
        // Phase 12: withdrawn is candidate-initiated and final — there's
        // nothing left for the employer to decide, so the editable status
        // dropdown is replaced with a plain, non-interactive label rather
        // than offering choices the security rules would reject anyway.
        <span className="w-full shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-center text-[11.5px] font-semibold text-navy-400 sm:w-auto">
          Withdrawn
        </span>
      ) : (
        <select
          value={application.status}
          onChange={(e) => onStatusChange(application.id, e.target.value)}
          disabled={updating}
          aria-label={`Status for ${application.candidateName}`}
          className="w-full shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-navy-700 disabled:opacity-60 sm:w-auto"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      <ScheduleInterviewDialog
        open={dialogOpen}
        interview={isActive ? interview : null}
        onSubmit={handleSubmit}
        onCancel={() => setDialogOpen(false)}
        submitting={saving}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this interview?"
        message="The candidate will be notified. This cannot be undone, but you can schedule a new interview afterward."
        confirmLabel="Cancel Interview"
        variant="danger"
        confirming={saving}
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}
