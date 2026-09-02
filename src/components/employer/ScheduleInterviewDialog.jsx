import { useState } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog'
import FormField from '../auth/FormField'
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  interviewToFormValues,
  parseInterviewFormValues,
  validateInterviewForm,
} from '../../lib/interviewForm'

export default function ScheduleInterviewDialog({ open, interview, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => interviewToFormValues(interview))
  // Tracks the open/closed transition rather than `interview` identity —
  // two consecutive "Schedule" invocations both pass interview=null, so
  // identity alone can't tell them apart and would leave stale form data
  // from the first attempt showing on the second (e.g. the "schedule ->
  // cancel -> schedule another" flow). Re-initializing on every
  // closed-to-open transition instead always starts fresh.
  const [wasOpen, setWasOpen] = useState(open)
  const [error, setError] = useState('')

  if (open && !wasOpen) {
    setWasOpen(true)
    setForm(interviewToFormValues(interview))
    setError('')
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setError('')
    onCancel()
  }

  async function handleSubmit() {
    const validationError = validateInterviewForm(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    try {
      await onSubmit(parseInterviewFormValues(form))
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={interview ? 'Edit Interview' : 'Schedule Interview'}
      confirmLabel={interview ? 'Save Changes' : 'Schedule'}
      variant="primary"
      confirming={submitting}
      onConfirm={handleSubmit}
      onCancel={handleClose}
    >
      {error && (
        <p className="mb-2 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-3">
        <FormField
          label="Date & Time"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => update('scheduledAt', e.target.value)}
          required
        />
        <FormField
          label="Duration (minutes)"
          type="number"
          min={1}
          max={480}
          value={form.durationMinutes}
          onChange={(e) => update('durationMinutes', e.target.value)}
        />
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="interview-type">
            Interview Type
          </label>
          <select
            id="interview-type"
            value={form.interviewType}
            onChange={(e) => update('interviewType', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERVIEW_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {form.interviewType === 'online' && (
          <FormField
            label="Meeting Link"
            type="url"
            value={form.meetingLink}
            onChange={(e) => update('meetingLink', e.target.value)}
            placeholder="https://meet.google.com/..."
          />
        )}
        {form.interviewType === 'in_person' && (
          <FormField
            label="Location"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Office address"
          />
        )}
        <FormField
          as="textarea"
          label="Notes (optional)"
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Anything the candidate should know..."
          maxLength={1000}
        />
      </div>
    </ConfirmDialog>
  )
}
