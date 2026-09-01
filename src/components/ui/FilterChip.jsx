export default function FilterChip({ label, active = false, icon: Icon, onClick }) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active
          ? 'border-primary-600 bg-primary-600 text-white'
          : 'border-slate-200 bg-white text-navy-700'
      }`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
    </Tag>
  )
}
