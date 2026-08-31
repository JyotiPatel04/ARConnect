export default function DesktopFrame({ label, url = 'app.arconnect.in', children, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft-lg">
        <div className="min-w-[760px]">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="flex-1 rounded-md bg-white px-3 py-1 text-center text-[11px] font-medium text-navy-400 border border-slate-100">
              {url}
            </div>
          </div>
          <div className="no-scrollbar overflow-y-auto bg-white">{children}</div>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-center text-xs font-bold text-navy-700">{label}</p>
      )}
    </div>
  )
}
