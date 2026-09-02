import { useState } from 'react'
import { AlertCircle, CheckCircle2, Flag, XCircle } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ModerationReasonInput from '../../components/admin/ModerationReasonInput'
import { isValidModerationReason } from '../../lib/moderationValidation'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminReports from '../../hooks/useAdminReports'
import { formatRelativeTime } from '../../lib/format'

const STATUS_FILTERS = ['open', 'reviewed', 'dismissed', 'all']

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-700',
  reviewed: 'bg-success-50 text-success-700',
  dismissed: 'bg-slate-100 text-slate-500',
}

export default function AdminReportsPage() {
  useDocumentTitle('Reports')
  const [statusFilter, setStatusFilter] = useState('open')
  const { reports, loading, error, markReviewed, dismissReport } = useAdminReports(statusFilter)
  const [pendingAction, setPendingAction] = useState(null) // { report, nextStatus }
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  function openAction(report, nextStatus) {
    setPendingAction({ report, nextStatus })
    setReason('')
    setActionError('')
  }

  async function handleConfirm() {
    if (!pendingAction || !isValidModerationReason(reason)) return
    setBusy(true)
    setActionError('')
    try {
      if (pendingAction.nextStatus === 'reviewed') {
        await markReviewed(pendingAction.report.id, reason)
      } else {
        await dismissReport(pendingAction.report.id, reason)
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
      <PageHeader title="Reports" subtitle={loading ? 'Loading...' : `${reports.length} ${statusFilter === 'all' ? '' : statusFilter} report${reports.length === 1 ? '' : 's'}`} />

      <div className="mb-4 flex gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-2 text-[12px] font-semibold capitalize ${
              statusFilter === s ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 border border-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading reports...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load reports" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && reports.length === 0 && (
        <EmptyState icon={Flag} title="No reports here" subtitle="Reports submitted by candidates and employers will show up here." />
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-2.5">
          {reports.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Flag size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-navy-900">
                    {r.targetType === 'job' ? 'Job' : 'User'} report · <span className="font-mono text-[11px] text-navy-400">{r.targetId}</span>
                  </p>
                  <p className="text-xs text-navy-500">{r.reason}</p>
                  {r.description && <p className="mt-0.5 text-xs text-navy-400">{r.description}</p>}
                  <p className="mt-0.5 text-[10.5px] text-navy-400">Reported {formatRelativeTime(r.createdAt?.toDate?.())}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold capitalize ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
                {r.status === 'open' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => openAction(r, 'reviewed')}>
                      Reviewed
                    </Button>
                    <Button size="sm" variant="danger" icon={XCircle} onClick={() => openAction(r, 'dismissed')}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.nextStatus === 'reviewed' ? 'Mark this report reviewed?' : 'Dismiss this report?'}
        message="This records your decision in the moderation audit log."
        confirmLabel={pendingAction?.nextStatus === 'reviewed' ? 'Mark Reviewed' : 'Dismiss'}
        variant={pendingAction?.nextStatus === 'reviewed' ? 'primary' : 'danger'}
        confirming={busy}
        confirmDisabled={!isValidModerationReason(reason)}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      >
        {actionError && <p className="mb-2 text-xs font-semibold text-red-600">{actionError}</p>}
        <ModerationReasonInput value={reason} onChange={setReason} label="Resolution note" />
      </ConfirmDialog>
    </div>
  )
}
