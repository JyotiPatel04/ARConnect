import { BadgeCheck } from 'lucide-react'

export default function VerifiedBadge({ label = 'Verified Employer', size = 'sm' }) {
  const isSm = size === 'sm'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-success-50 font-semibold text-success-700 ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <BadgeCheck size={isSm ? 12 : 14} strokeWidth={2.5} />
      {label}
    </span>
  )
}
