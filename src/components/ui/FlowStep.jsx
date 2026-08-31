import { ArrowRight } from 'lucide-react'

export default function FlowStep({ icon: Icon, label, isLast = false, highlight = false }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className={`flex min-w-[128px] flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-center shadow-soft sm:min-w-[144px] ${
          highlight
            ? 'border-success-500 bg-success-50'
            : 'border-slate-100 bg-white'
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            highlight ? 'bg-success-500 text-white' : 'bg-primary-50 text-primary-600'
          }`}
        >
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <span className="text-xs font-bold text-navy-900">{label}</span>
      </div>
      {!isLast && (
        <ArrowRight className="shrink-0 text-slate-300" size={20} strokeWidth={2.5} />
      )}
    </div>
  )
}
