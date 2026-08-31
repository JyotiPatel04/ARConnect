export default function SectionHeader({ index, title, subtitle, tag }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-xs font-bold text-white">
            {index}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-navy-500 sm:text-[15px]">
            {subtitle}
          </p>
        )}
      </div>
      {tag && (
        <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
          {tag}
        </span>
      )}
    </div>
  )
}
