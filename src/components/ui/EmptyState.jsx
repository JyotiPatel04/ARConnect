export default function EmptyState({ icon: Icon, title, subtitle, tone = 'default' }) {
  const toneStyles = tone === 'error' ? 'border-red-100 text-red-500' : 'border-slate-200 text-navy-300'
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center ${toneStyles}`}>
      {Icon && <Icon size={22} />}
      <p className={`text-sm ${tone === 'error' ? 'text-red-600' : 'text-navy-500'}`}>{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-navy-400">{subtitle}</p>}
    </div>
  )
}
