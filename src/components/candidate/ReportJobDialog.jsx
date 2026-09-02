import { useState } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog'

const REPORT_REASONS = [
  'Misleading job posting',
  'Asking for money or fees',
  'Discriminatory content',
  'Spam or fake listing',
  'Other',
]

export default function ReportJobDialog({ open, onSubmit, onCancel, submitting, error }) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [description, setDescription] = useState('')

  function handleClose() {
    setReason(REPORT_REASONS[0])
    setDescription('')
    onCancel()
  }

  async function handleSubmit() {
    await onSubmit({ reason, description })
    setReason(REPORT_REASONS[0])
    setDescription('')
  }

  return (
    <ConfirmDialog
      open={open}
      title="Report this job"
      message="Let ARConnect's admin team know what's wrong with this listing."
      confirmLabel="Submit Report"
      variant="danger"
      confirming={submitting}
      onConfirm={handleSubmit}
      onCancel={handleClose}
    >
      {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="report-reason">
            Reason
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="report-description">
            Additional details (optional)
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything else admin should know..."
            rows={3}
            maxLength={1000}
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </ConfirmDialog>
  )
}
