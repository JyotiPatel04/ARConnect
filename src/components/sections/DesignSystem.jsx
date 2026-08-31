import { Search } from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import Button from '../ui/Button'
import JobCard from '../ui/JobCard'
import VerifiedBadge from '../ui/VerifiedBadge'
import MatchBadge from '../ui/MatchBadge'
import StatusBadge from '../ui/StatusBadge'
import { jobs } from '../../data/sampleData'

const colors = [
  { name: 'Primary Indigo', value: '#4338CA', className: 'bg-primary-600' },
  { name: 'Primary Light', value: '#EEF2FF', className: 'bg-primary-50 border border-slate-200' },
  { name: 'Success Green', value: '#059669', className: 'bg-success-600' },
  { name: 'Navy Text', value: '#0F172A', className: 'bg-navy-900' },
  { name: 'Slate Gray', value: '#64748B', className: 'bg-navy-500' },
  { name: 'Background', value: '#F4F5F9', className: 'bg-[#F4F5F9] border border-slate-200' },
]

function Swatch({ name, value, className }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-14 w-full rounded-xl ${className}`} />
      <div>
        <p className="text-[11.5px] font-bold text-navy-800">{name}</p>
        <p className="text-[10.5px] text-navy-400">{value}</p>
      </div>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
      <h4 className="mb-4 text-[11px] font-bold uppercase tracking-wide text-navy-400">
        {title}
      </h4>
      {children}
    </div>
  )
}

export default function DesignSystem() {
  return (
    <Frame tag="09 · Design System" id="design-system">
      <SectionHeader
        index="09"
        title="Design System"
        subtitle="Core tokens and components powering every screen in this prototype."
      />

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Block title="Color Palette">
          <div className="grid grid-cols-3 gap-3">
            {colors.map((c) => (
              <Swatch key={c.name} {...c} />
            ))}
          </div>
        </Block>

        <Block title="Typography">
          <div className="space-y-2.5">
            <p className="text-2xl font-extrabold text-navy-900">Heading / 24–32px</p>
            <p className="text-base font-bold text-navy-800">Subheading / 16px Bold</p>
            <p className="text-sm text-navy-600">Body text / 14px Regular</p>
            <p className="text-xs font-semibold text-navy-400">Caption / 12px Semibold</p>
          </div>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="success">Success</Button>
            <Button size="sm" variant="danger">Danger</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
        </Block>

        <Block title="Search Bar">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-soft">
            <Search size={16} className="text-navy-400" />
            <span className="text-[13px] text-navy-400">Search jobs, companies, skills...</span>
          </div>
        </Block>

        <Block title="Badges">
          <div className="flex flex-wrap items-center gap-2.5">
            <VerifiedBadge />
            <MatchBadge value={94} />
            <StatusBadge status="applied" />
            <StatusBadge status="interview" />
            <StatusBadge status="hired" />
            <StatusBadge status="rejected" />
          </div>
        </Block>

        <Block title="Job Card">
          <JobCard job={jobs[0]} />
        </Block>
      </div>
    </Frame>
  )
}
