export default function DashboardCard({ label, value, icon: Icon, trend, tone = 'default' }) {
  const toneStyles = {
    default: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-navy-500">{label}</span>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900">{value}</p>
      {trend && <p className="mt-1 text-[11px] font-semibold text-success-600">{trend}</p>}
    </div>
  )
}
