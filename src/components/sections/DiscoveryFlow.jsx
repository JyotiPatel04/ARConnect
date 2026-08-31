import {
  Search,
  SlidersHorizontal,
  FileText,
  Send,
  ClipboardList,
  Users,
  Award,
} from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import FlowStep from '../ui/FlowStep'

const steps = [
  { icon: Search, label: 'Search Jobs' },
  { icon: SlidersHorizontal, label: 'Filter' },
  { icon: FileText, label: 'Job Detail' },
  { icon: Send, label: 'Apply' },
  { icon: ClipboardList, label: 'Application Tracking' },
  { icon: Users, label: 'Interview' },
  { icon: Award, label: 'Hired', highlight: true },
]

export default function DiscoveryFlow() {
  return (
    <Frame tag="03 · Job Discovery Flow" id="discovery-flow">
      <SectionHeader
        index="03"
        title="Job Discovery Flow"
        subtitle="The end-to-end candidate journey — from first search to getting hired."
      />
      <div className="flex flex-nowrap items-center overflow-x-auto rounded-2xl bg-slate-50 p-6">
        {steps.map((s, i) => (
          <FlowStep
            key={s.label}
            icon={s.icon}
            label={s.label}
            highlight={s.highlight}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
    </Frame>
  )
}
