import { Briefcase, Users, Star, CalendarCheck, Award } from 'lucide-react'
import DashboardCard from '../../components/ui/DashboardCard'
import CandidateCard from '../../components/ui/CandidateCard'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { employerStats, candidates } from '../../data/sampleData'

const statIcons = [Briefcase, Users, Star, CalendarCheck, Award]

export default function EmployerDashboardPage() {
  useDocumentTitle('Dashboard')

  return (
    <div>
      <PageHeader title="Employer Dashboard" subtitle="Welcome back, ABC Pvt Ltd" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {employerStats.map((s, i) => (
          <DashboardCard key={s.label} label={s.label} value={s.value} icon={statIcons[i]} />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <h2 className="text-[13px] font-bold text-navy-900">Top Candidates</h2>
        <div className="mt-3 space-y-2">
          {candidates.slice(0, 3).map((c) => (
            <CandidateCard key={c.name} candidate={c} match={92} />
          ))}
        </div>
      </div>
    </div>
  )
}
