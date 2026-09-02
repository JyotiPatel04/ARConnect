export default function ProfileCompletionMeter({ completion, title = 'Profile Completion' }) {
  const { percent, missing } = completion
  const tone = percent === 100 ? 'bg-success-500' : percent >= 50 ? 'bg-primary-500' : 'bg-amber-500'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-navy-900">{title}</p>
        <span className="text-[13px] font-extrabold text-navy-900">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      {missing.length > 0 ? (
        <p className="mt-2 text-[11px] text-navy-500">
          Add {missing.map((m) => m.label).join(', ')} to complete your profile.
        </p>
      ) : (
        <p className="mt-2 text-[11px] font-semibold text-success-600">Your profile is complete.</p>
      )}
    </div>
  )
}
