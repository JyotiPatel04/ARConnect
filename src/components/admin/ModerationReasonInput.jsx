import { MODERATION_REASON_MAX_LENGTH, MODERATION_REASON_MIN_LENGTH } from '../../lib/moderationValidation'

// Shared reason textarea for every moderation confirm dialog (suspend/
// unsuspend, close/reopen job, review/dismiss report) — kept as one
// component so the length rule (3–500 chars, matching firestore.rules)
// only has to be right in one place.
export default function ModerationReasonInput({ value, onChange, label = 'Reason', placeholder }) {
  const id = `moderation-reason-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-navy-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Briefly explain why (3–500 characters)...'}
        rows={3}
        maxLength={MODERATION_REASON_MAX_LENGTH}
        className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <p className="mt-1 text-[10.5px] text-navy-400">
        {value.trim().length}/{MODERATION_REASON_MAX_LENGTH} characters (minimum {MODERATION_REASON_MIN_LENGTH})
      </p>
    </div>
  )
}
