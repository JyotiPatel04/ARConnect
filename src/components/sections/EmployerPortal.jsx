import {
  Briefcase,
  Users,
  Star,
  CalendarCheck,
  Award,
  Plus,
  Search,
  Bell,
  LayoutGrid,
  ClipboardList,
  Settings,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import DesktopFrame from '../frames/DesktopFrame'
import DashboardCard from '../ui/DashboardCard'
import CandidateCard from '../ui/CandidateCard'
import VerifiedBadge from '../ui/VerifiedBadge'
import StatusBadge from '../ui/StatusBadge'
import Button from '../ui/Button'
import { employerStats, candidates } from '../../data/sampleData'

const statIcons = [Briefcase, Users, Star, CalendarCheck, Award]

function Sidebar({ active }) {
  const items = [
    { icon: LayoutGrid, label: 'Dashboard' },
    { icon: Briefcase, label: 'Jobs' },
    { icon: ClipboardList, label: 'Applications' },
    { icon: Users, label: 'Candidates' },
    { icon: Settings, label: 'Settings' },
  ]
  return (
    <div className="flex w-40 shrink-0 flex-col gap-1 border-r border-slate-100 bg-slate-50 p-3">
      <div className="mb-3 flex items-center gap-1.5 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-900">
          <Briefcase size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-extrabold text-navy-900">ARConnect</span>
      </div>
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] font-semibold ${
            label === active ? 'bg-primary-600 text-white' : 'text-navy-500'
          }`}
        >
          <Icon size={13} />
          {label}
        </div>
      ))}
    </div>
  )
}

function TopBar({ title }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
      <h3 className="text-sm font-extrabold text-navy-900">{title}</h3>
      <div className="flex items-center gap-3">
        <Search size={15} className="text-navy-400" />
        <Bell size={15} className="text-navy-400" />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
          AB
        </div>
      </div>
    </div>
  )
}

function DashboardScreen() {
  return (
    <div className="flex">
      <Sidebar active="Dashboard" />
      <div className="flex-1 overflow-y-auto">
        <TopBar title="Employer Dashboard" />
        <div className="p-5">
          <p className="text-[12px] text-navy-500">
            Welcome back, <span className="font-bold text-navy-800">ABC Pvt Ltd</span>
          </p>
          <div className="mt-3 grid grid-cols-5 gap-3">
            {employerStats.map((s, i) => (
              <DashboardCard key={s.label} label={s.label} value={s.value} icon={statIcons[i]} />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-5 gap-4">
            <div className="col-span-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <h4 className="text-[12.5px] font-bold text-navy-900">Applications This Week</h4>
                <span className="text-[10.5px] text-navy-400">Last 7 days</span>
              </div>
              <div className="mt-3 flex h-28 items-end gap-2.5">
                {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-primary-100" style={{ height: `${h}%` }}>
                    <div className="h-2 rounded-t-md bg-primary-600" />
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <h4 className="text-[12.5px] font-bold text-navy-900">Top Candidates</h4>
              <div className="mt-2.5 space-y-2">
                {candidates.slice(0, 2).map((c) => (
                  <CandidateCard key={c.name} candidate={c} match={92} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PostJobScreen() {
  return (
    <div className="flex">
      <Sidebar active="Jobs" />
      <div className="flex-1 overflow-y-auto">
        <TopBar title="Post a New Job" />
        <div className="mx-auto max-w-md p-5">
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-navy-700">Job Title</label>
              <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-navy-800">
                Sales Executive
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-navy-700">Location</label>
                <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-navy-800">
                  Varanasi <ChevronDown size={13} className="text-navy-400" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700">Job Type</label>
                <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-navy-800">
                  Full-time <ChevronDown size={13} className="text-navy-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-navy-700">Min Salary</label>
                <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-navy-800">
                  ₹18,000
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700">Max Salary</label>
                <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] text-navy-800">
                  ₹25,000
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-navy-700">Description</label>
              <div className="mt-1 h-20 rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-navy-500">
                Visit local shops, generate leads and close daily sales targets...
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-[11.5px] font-semibold text-success-700">
              <VerifiedBadge label="Employer Verified" />
              This job will be published instantly.
            </div>
            <Button className="w-full" icon={Plus}>
              Publish Job
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplicationsScreen() {
  const rows = [
    { name: 'Rahul Kumar', role: 'Sales Executive', match: 94, status: 'interview' },
    { name: 'Amit Sharma', role: 'Sales Executive', match: 88, status: 'shortlisted' },
    { name: 'Priya Singh', role: 'Sales Executive', match: 81, status: 'review' },
    { name: 'Vikram Yadav', role: 'Sales Executive', match: 74, status: 'applied' },
    { name: 'Sunita Devi', role: 'Sales Executive', match: 69, status: 'rejected' },
  ]
  return (
    <div className="flex">
      <Sidebar active="Applications" />
      <div className="flex-1 overflow-y-auto">
        <TopBar title="Applications — Sales Executive" />
        <div className="p-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-soft">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Candidate</th>
                  <th className="px-4 py-2.5 font-bold">AI Match</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">
                          {r.name.split(' ').map((w) => w[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-navy-900">{r.name}</p>
                          <p className="text-[10.5px] text-navy-400">{r.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-primary-600">{r.match}%</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-bold text-primary-600">
                      View Profile
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateProfileScreen() {
  return (
    <div className="flex">
      <Sidebar active="Candidates" />
      <div className="flex-1 overflow-y-auto">
        <TopBar title="Candidate Profile" />
        <div className="p-5">
          <div className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-base font-bold text-white">
                RK
              </div>
              <div>
                <p className="text-sm font-extrabold text-navy-900">Rahul Kumar</p>
                <p className="flex items-center gap-1 text-[11.5px] text-navy-500">
                  <MapPin size={11} /> Varanasi, Uttar Pradesh
                </p>
                <div className="mt-1 flex gap-1.5">
                  <VerifiedBadge label="Phone Verified" />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-primary-50 px-3 py-2 text-center">
              <p className="text-lg font-extrabold text-primary-600">94%</p>
              <p className="text-[9.5px] font-bold text-primary-600">AI MATCH</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <h4 className="text-[12px] font-bold text-navy-900">Skills</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['Sales', 'Communication', 'MS Excel', 'Tally', 'Field Work'].map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-navy-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <h4 className="text-[12px] font-bold text-navy-900">Experience</h4>
              <p className="mt-2 text-[12px] font-bold text-navy-800">Sales Associate</p>
              <p className="text-[11px] text-navy-500">Local Retail Store · 2022–2024</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2.5">
            <Button size="sm">Shortlist Candidate</Button>
            <Button size="sm" variant="secondary">
              Schedule Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const screens = [
  { label: '1. Employer Dashboard', Component: DashboardScreen },
  { label: '2. Post a Job', Component: PostJobScreen },
  { label: '3. Applications / Candidates', Component: ApplicationsScreen },
  { label: '4. Candidate Profile', Component: CandidateProfileScreen },
]

export default function EmployerPortal() {
  return (
    <Frame tag="04 · Employer Portal" id="employer-portal">
      <SectionHeader
        index="04"
        title="Employer Portal"
        subtitle="Desktop dashboard for employers to post jobs, review AI-matched applicants, and manage hiring — all in one place."
      />
      <div className="flex flex-col gap-10">
        {screens.map(({ label, Component }) => (
          <DesktopFrame key={label} label={label}>
            <Component />
          </DesktopFrame>
        ))}
      </div>
    </Frame>
  )
}
