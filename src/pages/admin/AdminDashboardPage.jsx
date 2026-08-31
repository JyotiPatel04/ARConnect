import { Users, Briefcase, TrendingUp, ShieldAlert, FileClock } from 'lucide-react'
import DashboardCard from '../../components/ui/DashboardCard'
import StatusBadge from '../../components/ui/StatusBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { adminStats } from '../../data/sampleData'

const statIcons = [Users, Briefcase, TrendingUp, ShieldAlert, FileClock]
const statTones = ['default', 'default', 'success', 'warning', 'default']

export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard')

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="Monitor growth, moderate jobs, and manage verification" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {adminStats.map((s, i) => (
          <DashboardCard key={s.label} label={s.label} value={s.value} icon={statIcons[i]} tone={statTones[i]} />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <h2 className="text-[13px] font-bold text-navy-900">Pending Verification</h2>
        <div className="mt-2.5 space-y-2">
          {[
            { name: 'QuickServe', type: 'Employer' },
            { name: 'TechNova Solutions', type: 'Employer' },
            { name: 'Driver — QuickServe', type: 'Job Post' },
          ].map((v) => (
            <div key={v.name} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
              <div>
                <p className="text-[12px] font-bold text-navy-900">{v.name}</p>
                <p className="text-[10.5px] text-navy-400">{v.type}</p>
              </div>
              <StatusBadge status="pending" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
