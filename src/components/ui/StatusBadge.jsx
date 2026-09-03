const styles = {
  applied: 'bg-slate-100 text-slate-600',
  review: 'bg-amber-50 text-amber-700',
  reviewing: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-primary-50 text-primary-600',
  interview: 'bg-violet-50 text-violet-600',
  hired: 'bg-success-50 text-success-700',
  rejected: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
  withdrawn: 'bg-slate-100 text-navy-400',
}

const labels = {
  applied: 'Applied',
  review: 'In Review',
  reviewing: 'In Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Not Selected',
  pending: 'Pending',
  withdrawn: 'Withdrawn',
}

export default function StatusBadge({ status = 'applied', label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {label || labels[status]}
    </span>
  )
}
