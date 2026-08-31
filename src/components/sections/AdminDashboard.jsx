import {
  Users,
  Briefcase,
  FileClock,
  TrendingUp,
  ShieldAlert,
  LayoutGrid,
  ShieldCheck,
  BarChart3,
  Settings,
  Search,
  Bell,
} from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import DesktopFrame from '../frames/DesktopFrame'
import DashboardCard from '../ui/DashboardCard'
import StatusBadge from '../ui/StatusBadge'
import { adminStats } from '../../data/sampleData'

const statIcons = [Users, Briefcase, TrendingUp, ShieldAlert, FileClock]
const statTones = ['default', 'default', 'success', 'warning', 'default']

const navItems = [
  { icon: LayoutGrid, label: 'Overview' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Users, label: 'Users' },
  { icon: ShieldCheck, label: 'Verification' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
]

const bars = [55, 70, 48, 82, 65, 90, 76, 60, 85, 72, 95, 68]

export default function AdminDashboard() {
  return (
    <Frame tag="06 · Admin Dashboard" id="admin-dashboard">
      <SectionHeader
        index="06"
        title="Admin Dashboard"
        subtitle="Platform-wide control center for monitoring growth, moderating jobs, and managing employer verification."
      />
      <DesktopFrame url="admin.arconnect.in">
        <div className="flex">
          <div className="flex w-44 shrink-0 flex-col gap-1 border-r border-slate-100 bg-slate-50 p-3">
            <div className="mb-3 flex items-center gap-1.5 px-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-900">
                <Briefcase size={12} className="text-white" />
              </div>
              <span className="text-[12px] font-extrabold text-navy-900">Admin Console</span>
            </div>
            {navItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] font-semibold ${
                  label === 'Overview' ? 'bg-navy-900 text-white' : 'text-navy-500'
                }`}
              >
                <Icon size={13} />
                {label}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-extrabold text-navy-900">Platform Overview</h3>
              <div className="flex items-center gap-3">
                <Search size={15} className="text-navy-400" />
                <Bell size={15} className="text-navy-400" />
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
                  SA
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-5 gap-3">
                {adminStats.map((s, i) => (
                  <DashboardCard
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    icon={statIcons[i]}
                    tone={statTones[i]}
                  />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-5 gap-4">
                <div className="col-span-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12.5px] font-bold text-navy-900">
                      Applications &amp; Signups (12 weeks)
                    </h4>
                    <span className="text-[10.5px] text-navy-400">Weekly trend</span>
                  </div>
                  <div className="mt-4 flex h-32 items-end gap-2">
                    {bars.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-primary-100">
                        <div
                          className="w-full rounded-t-md bg-primary-600"
                          style={{ height: `${h}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
                  <h4 className="text-[12.5px] font-bold text-navy-900">Pending Verification</h4>
                  <div className="mt-2.5 space-y-2">
                    {[
                      { name: 'QuickServe', type: 'Employer' },
                      { name: 'TechNova Solutions', type: 'Employer' },
                      { name: 'Driver — QuickServe', type: 'Job Post' },
                    ].map((v) => (
                      <div
                        key={v.name}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                      >
                        <div>
                          <p className="text-[11.5px] font-bold text-navy-900">{v.name}</p>
                          <p className="text-[10px] text-navy-400">{v.type}</p>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 shadow-soft">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-navy-400">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Job Title</th>
                      <th className="px-4 py-2.5 font-bold">Company</th>
                      <th className="px-4 py-2.5 font-bold">Location</th>
                      <th className="px-4 py-2.5 font-bold">Applications</th>
                      <th className="px-4 py-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: 'Sales Executive', company: 'ABC Pvt Ltd', location: 'Varanasi', apps: 146, status: 'hired' },
                      { title: 'Delivery Executive', company: 'QuickServe', location: 'Lucknow', apps: 98, status: 'interview' },
                      { title: 'Customer Support', company: 'TechNova Solutions', location: 'Noida', apps: 112, status: 'shortlisted' },
                      { title: 'Driver', company: 'QuickServe', location: 'Varanasi', apps: 54, status: 'pending' },
                    ].map((r) => (
                      <tr key={r.title} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 font-bold text-navy-900">{r.title}</td>
                        <td className="px-4 py-2.5 text-navy-600">{r.company}</td>
                        <td className="px-4 py-2.5 text-navy-600">{r.location}</td>
                        <td className="px-4 py-2.5 text-navy-600">{r.apps}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DesktopFrame>
    </Frame>
  )
}
