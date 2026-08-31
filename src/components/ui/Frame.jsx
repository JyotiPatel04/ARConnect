export default function Frame({ tag, id, children }) {
  return (
    <section id={id} className="relative scroll-mt-24">
      <span className="absolute -top-3.5 left-6 z-10 rounded-md bg-navy-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        {tag}
      </span>
      <div className="rounded-[28px] border-2 border-dashed border-slate-300 bg-white/70 p-5 sm:p-8 lg:p-10">
        {children}
      </div>
    </section>
  )
}
