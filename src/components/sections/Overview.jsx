import { ShieldCheck, Sparkles, Users, Briefcase } from 'lucide-react'
import Frame from '../ui/Frame'
import Button from '../ui/Button'

export default function Overview() {
  return (
    <Frame tag="01 · Product Overview" id="overview">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-600">
          <Sparkles size={13} /> AI-Powered Verified Job Platform
        </span>

        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900">
            <Briefcase size={22} className="text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
            AR<span className="text-primary-600">Connect</span>
          </h1>
        </div>

        <p className="text-xl font-semibold text-navy-800 sm:text-2xl">
          Find verified jobs. Connect directly. Get hired.
        </p>

        <p className="max-w-xl text-sm text-navy-500 sm:text-[15px]">
          An AI-powered job marketplace that connects blue &amp; grey-collar
          candidates with verified employers — with smart matching, direct
          chat, and safe hiring built in from day one.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button icon={Users}>For Candidates</Button>
          <Button icon={Briefcase} variant="secondary">
            For Employers
          </Button>
        </div>

        <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ShieldCheck, label: 'Verified Employers Only' },
            { icon: Sparkles, label: 'AI Job Matching' },
            { icon: Users, label: 'Direct Chat with Recruiters' },
            { icon: Briefcase, label: 'End-to-End Application Tracking' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <span className="text-xs font-semibold text-navy-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}
