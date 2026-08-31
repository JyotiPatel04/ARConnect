import { User, Briefcase, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import { matchBreakdown } from '../../data/sampleData'

function FlowCard({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex min-w-[150px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-5 text-center shadow-soft">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <p className="text-xs font-bold text-navy-900">{title}</p>
      <p className="text-[10.5px] text-navy-500">{subtitle}</p>
    </div>
  )
}

export default function AiMatching() {
  return (
    <Frame tag="05 · AI Matching" id="ai-matching">
      <SectionHeader
        index="05"
        title="AI Matching Engine"
        subtitle="ARConnect's AI scores every candidate against every job in real time across five weighted signals."
      />

      <div className="flex flex-nowrap items-center justify-start gap-4 overflow-x-auto pb-8 lg:justify-center">
        <FlowCard icon={User} title="Candidate" subtitle="Rahul Kumar · Sales" />
        <ArrowRight className="shrink-0 text-slate-300" size={20} />
        <FlowCard icon={Briefcase} title="Job" subtitle="Sales Executive · ABC Pvt Ltd" />
        <ArrowRight className="shrink-0 text-slate-300" size={20} />
        <FlowCard icon={Sparkles} title="AI Matching" subtitle="5-signal weighted model" />
        <ArrowRight className="shrink-0 text-slate-300" size={20} />
        <div className="flex min-w-[150px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-success-500 bg-success-50 px-5 py-5 text-center shadow-soft">
          <CheckCircle2 size={20} className="text-success-600" />
          <p className="text-xs font-bold text-success-700">Result</p>
          <p className="text-[10.5px] text-success-700">94% Match</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:items-center">
        <div className="mx-auto flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[conic-gradient(var(--color-primary-600)_0%_94%,#e2e8f0_94%_100%)]">
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-soft">
              <span className="text-4xl font-extrabold text-navy-900">94%</span>
              <span className="text-[11px] font-bold tracking-wide text-primary-600">AI MATCH</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-navy-500">
            Rahul Kumar × Sales Executive at ABC Pvt Ltd
          </p>
        </div>

        <div className="space-y-4">
          {matchBreakdown.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-700">{m.label}</span>
                <span className="font-extrabold text-navy-900">{m.value}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}
