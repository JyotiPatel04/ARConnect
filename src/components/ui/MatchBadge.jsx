import { Sparkles } from 'lucide-react'

export default function MatchBadge({ value, size = 'sm' }) {
  const isSm = size === 'sm'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary-50 font-bold text-primary-600 ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <Sparkles size={isSm ? 12 : 14} strokeWidth={2.5} />
      {value}% Match
    </span>
  )
}
