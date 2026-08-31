export default function MobileFrame({ label, children }) {
  return (
    <div className="flex w-[240px] shrink-0 flex-col items-center">
      <div className="relative h-[500px] w-[240px] rounded-[32px] border-[6px] border-navy-900 bg-navy-900 shadow-soft-lg">
        <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-navy-900" />
        <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-white">
          <div className="flex h-6 items-center justify-between bg-white px-4 pt-1.5 text-[10px] font-semibold text-navy-900">
            <span>9:41</span>
            <span>●●●●</span>
          </div>
          <div className="no-scrollbar h-[calc(100%-24px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-center text-xs font-bold text-navy-700">{label}</p>
      )}
    </div>
  )
}
