import { BadgeCheck, ShieldCheck, Flag, X } from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'

function TrustCard({ icon: Icon, title, subtitle, tone }) {
  const tones = {
    success: 'bg-success-50 text-success-600',
    primary: 'bg-primary-50 text-primary-600',
    danger: 'bg-red-50 text-red-600',
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-soft">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} strokeWidth={2.25} />
      </span>
      <p className="text-sm font-bold text-navy-900">{title}</p>
      <p className="text-[11.5px] text-navy-500">{subtitle}</p>
    </div>
  )
}

export default function TrustSafety() {
  return (
    <Frame tag="07 · Trust & Safety" id="trust-safety">
      <SectionHeader
        index="07"
        title="Trust & Safety"
        subtitle="Every employer and job posting is verified before candidates ever see it — with easy in-app reporting for anything suspicious."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TrustCard icon={BadgeCheck} title="Verified Employer" subtitle="ID + business docs checked" tone="success" />
        <TrustCard icon={BadgeCheck} title="Verified Job" subtitle="Manually reviewed listing" tone="success" />
        <TrustCard icon={ShieldCheck} title="Safe Hiring" subtitle="No upfront fees, ever" tone="primary" />
        <TrustCard icon={Flag} title="Report Fake Job" subtitle="Flag suspicious listings" tone="danger" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-soft-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-bold text-navy-900">Report this Job</h4>
            <X size={16} className="text-navy-400" />
          </div>
          <div className="space-y-2 p-4">
            <p className="text-[11.5px] font-semibold text-navy-500">
              Sales Executive · ABC Pvt Ltd
            </p>
            {[
              'Asking for money / fees',
              'Fake or misleading job details',
              'Employer not responding',
              'Other',
            ].map((r, i) => (
              <label
                key={r}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-[12.5px] font-medium text-navy-700"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    i === 0 ? 'border-primary-600' : 'border-slate-300'
                  }`}
                >
                  {i === 0 && <span className="h-2 w-2 rounded-full bg-primary-600" />}
                </span>
                {r}
              </label>
            ))}
            <Button className="mt-2 w-full" variant="danger" icon={Flag}>
              Submit Report
            </Button>
          </div>
        </div>
      </div>
    </Frame>
  )
}
